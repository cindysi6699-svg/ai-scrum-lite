import { z } from "zod";

const prioritySchema = z.enum(["P0", "P1", "P2", "P3"]);

export const importSprintSchema = z.object({
  sprint: z.object({
    name: z.string().trim().min(1, "Sprint 名称必填"),
    goal: z.string().trim().min(1, "Sprint 目标必填"),
    startDate: z.string().trim().date("startDate 不是合法日期"),
    endDate: z.string().trim().date("endDate 不是合法日期"),
  }),
  epics: z.array(
    z.object({
      code: z.string().trim().min(1, "Epic code 必填"),
      title: z.string().trim().min(1, "Epic 标题必填"),
      value: z.string().trim().min(1, "Epic value 必填"),
      priority: prioritySchema,
      targetSprint: z.string().trim().min(1, "targetSprint 必填"),
    }),
  ),
  stories: z
    .array(
      z.object({
        code: z.string().trim().min(1, "Story code 必填"),
        epic: z.string().trim().min(1, "Story epic 必填"),
        title: z.string().trim().min(1, "Story 标题必填"),
        priority: prioritySchema,
        userStory: z.string().trim().min(1, "userStory 必填"),
        acceptanceCriteria: z.string().trim().min(1, "acceptanceCriteria 必填"),
        tasks: z
          .array(z.string().trim().min(1, "task 不能为空"))
          .min(1, "tasks 至少一条"),
      }),
    )
    .min(1, "stories 至少一条"),
});

export type ImportSprintSpec = z.infer<typeof importSprintSchema>;

export type SprintSpecFieldError = {
  path: string;
  message: string;
};

function zodIssuesToFieldErrors(error: z.ZodError): SprintSpecFieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path
      .map((part) => (typeof part === "number" ? `[${part}]` : part))
      .join(".")
      .replace(".[", "["),
    message: issue.message,
  }));
}

export function parseSprintSpecJson(specJson: string):
  | { ok: true; data: ImportSprintSpec }
  | { ok: false; errors: SprintSpecFieldError[] } {
  let raw: unknown;

  try {
    raw = JSON.parse(specJson);
  } catch {
    return {
      ok: false,
      errors: [{ path: "json", message: "不是合法 JSON" }],
    };
  }

  const parsed = importSprintSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      errors: zodIssuesToFieldErrors(parsed.error),
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
