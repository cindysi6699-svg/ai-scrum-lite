"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { parseSprintSpecJson, type SprintSpecFieldError } from "./import-sprint-spec";
import {
  taskStatusMoveError,
  taskStatusValues,
  type TaskStatusValue,
} from "./task-status-rules";

const optionalText = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().optional(),
);

const createStorySchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(3),
  userStory: z.string().trim().min(10),
  acceptanceCriteria: z.string().trim().min(10),
  priority: z.enum(["P0", "P1", "P2", "P3"]).default("P1"),
});

const createAgentSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(2),
  role: z.enum(["dev", "qa", "design"]).default("dev"),
});

const taskIdSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
});

const assignTaskSchema = taskIdSchema.extend({
  assigneeId: z.string().min(1),
});

const updateStatusSchema = taskIdSchema.extend({
  status: z.enum(taskStatusValues),
  progress: optionalText,
});

const submitPrSchema = taskIdSchema.extend({
  pullRequestUrl: z.string().trim().url(),
  branch: optionalText,
  note: optionalText,
});

const reviewTaskSchema = taskIdSchema.extend({
  decision: z.enum(["approve", "reject"]),
  feedback: optionalText,
});

const moveTaskStatusSchema = taskIdSchema.extend({
  status: z.enum(taskStatusValues),
});

const sprintLifecycleSchema = z.object({
  projectId: z.string().min(1),
  sprintId: z.string().min(1),
  intent: z.enum(["activate", "close", "archive"]),
});

type ImportSprintResult =
  | { ok: true; newSprintId: string }
  | { ok: false; errors: SprintSpecFieldError[] };

async function requireProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!member) {
    throw new Error("You do not have access to this project.");
  }

  return member;
}

async function getTaskForProject(taskId: string, projectId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    include: {
      githubRefs: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
}

function revalidateProject(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
}

export async function importSprintAction(
  projectId: string,
  specJson: string,
): Promise<ImportSprintResult> {
  const user = await requireUser();
  await requireProjectAccess(projectId, user.id);

  const parsed = parseSprintSpecJson(specJson);

  if (!parsed.ok) {
    return {
      ok: false,
      errors: parsed.errors,
    };
  }

  const now = new Date();
  const spec = parsed.data;

  const sprint = await prisma.$transaction(async (tx) => {
    await tx.sprint.updateMany({
      where: {
        projectId,
        status: "active",
      },
      data: {
        status: "closed",
      },
    });

    const createdSprint = await tx.sprint.create({
      data: {
        projectId,
        name: spec.sprint.name,
        goal: spec.sprint.goal,
        status: "active",
        startDate: new Date(`${spec.sprint.startDate}T00:00:00.000Z`),
        endDate: new Date(`${spec.sprint.endDate}T00:00:00.000Z`),
      },
    });

    const epicByCode = new Map<string, { id: string }>();

    for (const epic of spec.epics) {
      const backlogEpic = await tx.backlogItem.create({
        data: {
          projectId,
          title: `${epic.code} ${epic.title}`,
          description: `价值: ${epic.value}\n目标 Sprint: ${epic.targetSprint}`,
          type: "epic",
          priority: epic.priority,
          status: "ready",
          createdById: user.id,
          createdAt: now,
          updatedAt: now,
        },
      });

      epicByCode.set(epic.code, backlogEpic);
    }

    for (const story of spec.stories) {
      const parent = epicByCode.get(story.epic);

      const backlogStory = await tx.backlogItem.create({
        data: {
          projectId,
          parentId: parent?.id ?? null,
          title: `${story.code} ${story.title}`,
          description: story.userStory,
          type: "story",
          priority: story.priority,
          status: "in_sprint",
          userStory: story.userStory,
          acceptanceCriteria: story.acceptanceCriteria,
          createdById: user.id,
          createdAt: now,
          updatedAt: now,
        },
      });

      for (const taskTitle of story.tasks) {
        const task = await tx.task.create({
          data: {
            projectId,
            sprintId: createdSprint.id,
            backlogItemId: backlogStory.id,
            title: taskTitle,
            description: `From ${story.code}: ${story.title}`,
            type: "task",
            priority:
              taskTitle.includes("🛡") || taskTitle.includes("[TEST]") ? "P1" : story.priority,
            status: "todo",
            userStory: story.userStory,
            acceptanceCriteria: story.acceptanceCriteria,
            createdById: user.id,
            createdAt: now,
            updatedAt: now,
          },
        });

        await tx.taskUpdate.create({
          data: {
            taskId: task.id,
            actorId: user.id,
            newStatus: "todo",
            progress: `Imported from ${story.code} into ${createdSprint.name}.`,
            createdAt: now,
          },
        });
      }
    }

    return createdSprint;
  });

  revalidateProject(projectId);

  return {
    ok: true,
    newSprintId: sprint.id,
  };
}

export async function createStoryTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = createStorySchema.parse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    userStory: formData.get("userStory"),
    acceptanceCriteria: formData.get("acceptanceCriteria"),
    priority: formData.get("priority") || "P1",
  });

  await requireProjectAccess(parsed.projectId, user.id);

  const sprint = await prisma.sprint.findFirst({
    where: {
      projectId: parsed.projectId,
      status: "active",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!sprint) {
    throw new Error("Create an active sprint before adding Sprint stories.");
  }

  await prisma.$transaction(async (tx) => {
    const story = await tx.backlogItem.create({
      data: {
        projectId: parsed.projectId,
        title: parsed.title,
        description: parsed.userStory,
        type: "story",
        priority: parsed.priority,
        status: "in_sprint",
        userStory: parsed.userStory,
        acceptanceCriteria: parsed.acceptanceCriteria,
        createdById: user.id,
      },
    });

    const task = await tx.task.create({
      data: {
        projectId: parsed.projectId,
        sprintId: sprint.id,
        backlogItemId: story.id,
        title: parsed.title,
        description: parsed.userStory,
        type: "task",
        priority: parsed.priority,
        status: "todo",
        userStory: parsed.userStory,
        acceptanceCriteria: parsed.acceptanceCriteria,
        createdById: user.id,
      },
    });

    await tx.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        newStatus: "todo",
        progress: "Story created and added to the active Sprint.",
      },
    });
  });

  revalidateProject(parsed.projectId);
}

export async function createAgentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = createAgentSchema.parse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    role: formData.get("role") || "dev",
  });

  await requireProjectAccess(parsed.projectId, user.id);

  const providerAccountId = `ai-agent:${parsed.projectId}:${parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}:${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    const agent = await tx.user.create({
      data: {
        name: parsed.name,
        type: "ai",
        provider: "ai-scrum-lite",
        providerAccountId,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: parsed.projectId,
        userId: agent.id,
        role: parsed.role,
        displayName: parsed.name,
      },
    });
  });

  revalidateProject(parsed.projectId);
}

export async function assignTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = assignTaskSchema.parse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    assigneeId: formData.get("assigneeId"),
  });

  await requireProjectAccess(parsed.projectId, user.id);
  const task = await getTaskForProject(parsed.taskId, parsed.projectId);

  const assignee = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: parsed.projectId,
        userId: parsed.assigneeId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!assignee || assignee.user.type !== "ai") {
    throw new Error("Assign this workflow to a registered AI agent.");
  }

  await prisma.$transaction([
    prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        assigneeId: parsed.assigneeId,
        status: "in_progress",
        startedAt: task.startedAt ?? new Date(),
      },
    }),
    prisma.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        previousStatus: task.status,
        newStatus: "in_progress",
        progress: `Assigned to ${assignee.displayName ?? assignee.user.name ?? "AI agent"}.`,
        rawPayload: {
          assigneeId: parsed.assigneeId,
        },
      },
    }),
  ]);

  revalidateProject(parsed.projectId);
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = updateStatusSchema.parse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    progress: formData.get("progress"),
  });

  await requireProjectAccess(parsed.projectId, user.id);
  const task = await getTaskForProject(parsed.taskId, parsed.projectId);

  const moveError = taskStatusMoveError(
    task.status as TaskStatusValue,
    parsed.status,
  );

  if (moveError) {
    throw new Error(moveError);
  }

  await prisma.$transaction([
    prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: parsed.status,
        startedAt: parsed.status === "in_progress" ? (task.startedAt ?? new Date()) : task.startedAt,
        completedAt: parsed.status === "done" ? new Date() : task.completedAt,
      },
    }),
    prisma.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        previousStatus: task.status,
        newStatus: parsed.status,
        progress: parsed.progress || `Status changed to ${parsed.status}.`,
      },
    }),
  ]);

  revalidateProject(parsed.projectId);
}

export async function moveTaskStatusAction(input: {
  projectId: string;
  taskId: string;
  status: TaskStatusValue;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireUser();
  const parsed = moveTaskStatusSchema.parse(input);

  await requireProjectAccess(parsed.projectId, user.id);
  const task = await getTaskForProject(parsed.taskId, parsed.projectId);
  const moveError = taskStatusMoveError(
    task.status as TaskStatusValue,
    parsed.status,
  );

  if (moveError) {
    return {
      ok: false,
      message: moveError,
    };
  }

  await prisma.$transaction([
    prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: parsed.status,
        startedAt:
          parsed.status === "in_progress" ? (task.startedAt ?? new Date()) : task.startedAt,
        completedAt:
          parsed.status === "done" || parsed.status === "accepted"
            ? new Date()
            : task.completedAt,
        acceptedAt: parsed.status === "accepted" ? new Date() : task.acceptedAt,
      },
    }),
    prisma.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        previousStatus: task.status,
        newStatus: parsed.status,
        progress: `Dragged from ${task.status} to ${parsed.status}.`,
      },
    }),
  ]);

  revalidateProject(parsed.projectId);

  return { ok: true };
}

export async function updateSprintLifecycleAction(formData: FormData) {
  const user = await requireUser();
  const parsed = sprintLifecycleSchema.parse({
    projectId: formData.get("projectId"),
    sprintId: formData.get("sprintId"),
    intent: formData.get("intent"),
  });

  await requireProjectAccess(parsed.projectId, user.id);

  const sprint = await prisma.sprint.findFirst({
    where: {
      id: parsed.sprintId,
      projectId: parsed.projectId,
    },
  });

  if (!sprint) {
    throw new Error("Sprint not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.intent === "activate") {
      await tx.sprint.updateMany({
        where: {
          projectId: parsed.projectId,
          status: "active",
          NOT: {
            id: parsed.sprintId,
          },
        },
        data: {
          status: "closed",
        },
      });
    }

    await tx.sprint.update({
      where: {
        id: parsed.sprintId,
      },
      data: {
        status:
          parsed.intent === "activate"
            ? "active"
            : parsed.intent === "archive"
              ? "cancelled"
              : "closed",
      },
    });
  });

  revalidateProject(parsed.projectId);
}

export async function submitPullRequestAction(formData: FormData) {
  const user = await requireUser();
  const parsed = submitPrSchema.parse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    pullRequestUrl: formData.get("pullRequestUrl"),
    branch: formData.get("branch"),
    note: formData.get("note"),
  });

  await requireProjectAccess(parsed.projectId, user.id);
  const task = await getTaskForProject(parsed.taskId, parsed.projectId);

  await prisma.$transaction([
    prisma.githubRef.create({
      data: {
        projectId: parsed.projectId,
        taskId: task.id,
        branch: parsed.branch || null,
        pullRequestUrl: parsed.pullRequestUrl,
        checksStatus: "passed",
        note: parsed.note || "PR linked manually for Sprint 1 workflow.",
        createdById: user.id,
      },
    }),
    prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: "review",
        completedAt: new Date(),
      },
    }),
    prisma.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        previousStatus: task.status,
        newStatus: "review",
        progress: "PR linked and task moved to human review.",
        artifacts: {
          pullRequestUrl: parsed.pullRequestUrl,
          branch: parsed.branch || null,
        },
        needsHumanDecision: true,
      },
    }),
  ]);

  revalidateProject(parsed.projectId);
}

export async function reviewTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reviewTaskSchema.parse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    decision: formData.get("decision"),
    feedback: formData.get("feedback"),
  });

  await requireProjectAccess(parsed.projectId, user.id);
  const task = await getTaskForProject(parsed.taskId, parsed.projectId);

  if (task.status !== "review") {
    throw new Error("Only tasks in review can pass the human acceptance gate.");
  }

  const approved = parsed.decision === "approve";

  await prisma.$transaction(async (tx) => {
    if (approved && task.githubRefs.length === 0) {
      await tx.githubRef.create({
        data: {
          projectId: parsed.projectId,
          taskId: task.id,
          branch: "manual/human-acceptance",
          checksStatus: "manual",
          note: "Manual acceptance trace for MVP tasks without a linked PR.",
          createdById: user.id,
        },
      });
    }

    await tx.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: approved ? "accepted" : "in_progress",
        acceptedAt: approved ? new Date() : null,
      },
    });

    await tx.decision.create({
      data: {
        projectId: parsed.projectId,
        taskId: task.id,
        madeById: user.id,
        type: "acceptance",
        title: approved ? "Human acceptance approved" : "Human acceptance rejected",
        decision: approved ? "Approved for merge/push." : "Rejected and returned to execution.",
        reason: parsed.feedback || null,
        impact: approved
          ? "Task is accepted and may be treated as done."
          : "Task returns to in-progress with human feedback.",
        reversible: !approved,
      },
    });

    await tx.taskUpdate.create({
      data: {
        taskId: task.id,
        actorId: user.id,
        previousStatus: task.status,
        newStatus: approved ? "accepted" : "in_progress",
        progress: approved
          ? "Human gate approved. Merge/push allowed."
          : `Human gate rejected. Feedback: ${parsed.feedback || "No feedback provided."}`,
        needsHumanDecision: false,
      },
    });
  });

  revalidateProject(parsed.projectId);
}
