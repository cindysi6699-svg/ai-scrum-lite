import {
  Bot,
  Check,
  ChevronRight,
  Clock3,
  GitBranch,
  GitPullRequest,
  LockKeyhole,
  Plus,
  RotateCcw,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignTaskAction,
  reviewTaskAction,
  submitPullRequestAction,
  updateTaskStatusAction,
} from "@/server/actions/tasks";
import { requireUser } from "@/server/auth/session";
import { getProjectForUser } from "@/server/queries/projects";

type BoardColumn = {
  key: string;
  title: string;
  statuses: string[];
  dotClass: string;
  panelClass: string;
  countClass: string;
};

type AgentMember = {
  userId: string;
  displayName: string | null;
  role: string;
  user: {
    name: string | null;
    type: string;
  };
};

type WorkTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  assignee: { name: string | null } | null;
  backlogItem: { id: string; title: string } | null;
  githubRefs: Array<{ pullRequestUrl: string | null; branch: string | null }>;
  updates: Array<{ progress: string }>;
};

type BacklogItem = {
  id: string;
  title: string;
  description: string | null;
  parentId: string | null;
  priority: string;
  status: string;
};

type BacklogStoryRow = {
  code: string;
  title: string;
  status: "执行中" | "待验收" | "返工中" | "To Do";
  points: number;
};

type BacklogEpicRow = {
  code: string;
  title: string;
  priority: "Must" | "Should" | "Could";
  sprintLabel: string;
  progressLabel?: string;
  progressWidth?: string;
  badges?: Array<"红线" | "第 1 痛点">;
  stories: BacklogStoryRow[];
  emptyText?: string;
  defaultOpen?: boolean;
};

type WorkspaceView = "board" | "backlog" | "dash" | "review";

const boardColumns: BoardColumn[] = [
  {
    key: "todo",
    title: "To Do",
    statuses: ["todo"],
    dotClass: "bg-[#a1a1aa]",
    panelClass: "border-[#e4e4e7] bg-[#fafafa]",
    countClass: "text-[#a1a1aa]",
  },
  {
    key: "agent",
    title: "Agent 执行中",
    statuses: ["in_progress", "blocked"],
    dotClass: "bg-[#4f7cff]",
    panelClass: "border-[#e4e4e7] bg-[#fafafa]",
    countClass: "text-[#a1a1aa]",
  },
  {
    key: "review",
    title: "待验收",
    statuses: ["review"],
    dotClass: "bg-amber-500",
    panelClass: "border-amber-300/60 bg-amber-50/40",
    countClass: "bg-amber-100 text-[#b45309]",
  },
  {
    key: "done",
    title: "Done",
    statuses: ["done", "accepted"],
    dotClass: "bg-emerald-500",
    panelClass: "border-[#e4e4e7] bg-[#fafafa]",
    countClass: "text-[#a1a1aa]",
  },
];

const agentStatuses = ["in_progress", "blocked", "review"];

function normalizeWorkspaceView(view: string | string[] | undefined): WorkspaceView {
  const value = Array.isArray(view) ? view[0] : view;

  if (value === "backlog" || value === "dash" || value === "review") {
    return value;
  }

  return "board";
}

function projectViewHref(projectId: string, view: WorkspaceView) {
  return view === "board"
    ? `/projects/${projectId}`
    : `/projects/${projectId}?view=${view}`;
}

function topNavClassName(active: boolean) {
  return active
    ? "relative px-3 py-2 text-[#18181b] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#4f7cff]"
    : "relative px-3 py-2 text-[#71717a] hover:text-[#18181b]";
}

function topNavWithBadgeClassName(active: boolean) {
  return active
    ? "relative flex items-center gap-1.5 px-3 py-2 text-[#18181b] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#4f7cff]"
    : "relative flex items-center gap-1.5 px-3 py-2 text-[#71717a] hover:text-[#18181b]";
}

function nativeControlClassName() {
  return "h-8 w-full rounded-md border border-[#e4e4e7] bg-white px-2 text-xs text-[#3f3f46] outline-none transition focus-visible:border-[#4f7cff] focus-visible:ring-2 focus-visible:ring-[#eef2ff]";
}

function priorityPoints(priority: string) {
  const value = Number(priority.replace("P", ""));

  return Number.isFinite(value) ? value : 1;
}

function progressWidth(done: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.min(100, Math.round((done / total) * 100))}%`;
}

function pullRequestNumber(url: string | null | undefined) {
  return url?.split("/").pop() ?? "";
}

function backlogCode(title: string) {
  return title.match(/^(E\d+|US-\d+)/)?.[1] ?? "";
}

function cleanBacklogTitle(title: string) {
  return title.replace(/^(E\d+|US-\d+)\s+/, "");
}

function storyStatusClassName(status: BacklogStoryRow["status"]) {
  if (status === "执行中") {
    return "flex items-center gap-1 text-[11px] text-[#3a5bd0]";
  }

  if (status === "待验收") {
    return "flex items-center gap-1 text-[11px] text-[#b45309]";
  }

  if (status === "返工中") {
    return "flex items-center gap-1 text-[11px] text-[#be123c]";
  }

  return "text-[11px] text-[#a1a1aa]";
}

function storyStatusDotClassName(status: BacklogStoryRow["status"]) {
  if (status === "执行中") {
    return "bg-[#4f7cff]";
  }

  if (status === "待验收") {
    return "bg-amber-500";
  }

  if (status === "返工中") {
    return "bg-rose-500";
  }

  return "";
}

function priorityTone(priority: BacklogEpicRow["priority"]) {
  if (priority === "Must") {
    return "bg-rose-100 text-[#be123c]";
  }

  if (priority === "Should") {
    return "bg-amber-100 text-[#b45309]";
  }

  return "bg-zinc-100 text-[#71717a]";
}

function buildBacklogRows(epics: BacklogItem[], stories: BacklogItem[]) {
  const epicByCode = new Map(epics.map((epic) => [backlogCode(epic.title), epic]));
  const storyByCode = new Map(stories.map((story) => [backlogCode(story.title), story]));
  const storyTitle = (code: string, fallback: string) => {
    const story = storyByCode.get(code);

    return story ? cleanBacklogTitle(story.title) : fallback;
  };
  const epicTitle = (code: string, fallback: string) => {
    const epic = epicByCode.get(code);

    return epic ? cleanBacklogTitle(epic.title) : fallback;
  };

  return [
    {
      code: "E1",
      title: epicTitle("E1", "核心 Scrum 看板"),
      priority: "Must",
      sprintLabel: "S1",
      progressLabel: "2/4 done",
      progressWidth: "w-1/2",
      defaultOpen: true,
      stories: [
        {
          code: "US-1",
          title: storyTitle("US-1", "看板与 Story 基础数据模型"),
          status: "执行中",
          points: 3,
        },
        {
          code: "US-6",
          title: storyTitle("US-6", "看板列拖拽流转 + 状态留痕"),
          status: "To Do",
          points: 2,
        },
      ],
    },
    {
      code: "E2",
      title: epicTitle("E2", "Agent 作为一等成员"),
      priority: "Must",
      sprintLabel: "S1 · 核心差异化",
      stories: [
        {
          code: "US-2",
          title: storyTitle("US-2", "把 Story 指派给 Agent(含离线防呆)"),
          status: "待验收",
          points: 3,
        },
      ],
    },
    {
      code: "E3",
      title: epicTitle("E3", "Agent 执行流水线"),
      priority: "Must",
      sprintLabel: "S1-S2",
      stories: [
        {
          code: "US-3",
          title: storyTitle("US-3", "领取->分支->写码->测->提 PR"),
          status: "执行中",
          points: 5,
        },
        {
          code: "US-7",
          title: storyTitle("US-7", "认领锁:防多 agent 抢同一 story"),
          status: "返工中",
          points: 3,
        },
      ],
    },
    {
      code: "E4",
      title: epicTitle("E4", "状态自动回填"),
      priority: "Must",
      sprintLabel: "S2",
      stories: [
        {
          code: "US-5",
          title: storyTitle("US-5", "agent 活动事件 -> 看板列流转"),
          status: "To Do",
          points: 3,
        },
      ],
    },
    {
      code: "E5",
      title: epicTitle("E5", "人类审批闸门"),
      priority: "Must",
      sprintLabel: "S1-S2",
      badges: ["红线"],
      stories: [
        {
          code: "US-4",
          title: storyTitle("US-4", "验收队列 + 通过/打回 + push 硬门禁"),
          status: "待验收",
          points: 5,
        },
      ],
    },
    {
      code: "E6",
      title: epicTitle("E6", "多 Agent 可观测面板"),
      priority: "Should",
      sprintLabel: "S3",
      badges: ["第 1 痛点"],
      stories: [],
      emptyText: "\"10 个 agent 谁在做什么、卡在哪\" - 待拆 story",
    },
    {
      code: "E7",
      title: epicTitle("E7", "反馈返工闭环增强"),
      priority: "Could",
      sprintLabel: "S3+",
      stories: [],
      emptyText: "打回原因结构化 · agent 带反馈精准重做 - 待拆 story",
    },
  ] satisfies BacklogEpicRow[];
}

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const user = await requireUser();
  const { projectId } = await params;
  const query = await searchParams;
  const view = normalizeWorkspaceView(query?.view);
  const project = await getProjectForUser(projectId, user.id);

  if (!project) {
    notFound();
  }

  const latestSprint = project.sprints[0];
  const epics = project.backlog.filter((item) => item.type === "epic");
  const stories = project.backlog.filter((item) => item.type === "story");
  const sprintTasks = latestSprint?.tasks ?? [];
  const aiAgents = project.members.filter((member) => member.user.type === "ai");
  const reviewTasks = sprintTasks.filter((task) => task.status === "review");
  const blockedTasks = sprintTasks.filter((task) => task.status === "blocked");
  const activeAgents = aiAgents.filter((agent) =>
    sprintTasks.some(
      (task) => task.assigneeId === agent.userId && agentStatuses.includes(task.status),
    ),
  );
  const idleAgents = Math.max(0, aiAgents.length - activeAgents.length);
  const doneTasks = sprintTasks.filter(
    (task) => task.status === "accepted" || task.status === "done",
  );
  const totalPoints = sprintTasks.reduce(
    (sum, task) => sum + priorityPoints(task.priority),
    0,
  );
  const donePoints = doneTasks.reduce(
    (sum, task) => sum + priorityPoints(task.priority),
    0,
  );
  const workspaceActive = view === "board" || view === "backlog";

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-[#3f3f46] antialiased">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#e4e4e7] bg-white/85 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link
            className="grid h-7 w-7 place-items-center rounded-md bg-[#4f7cff] text-white"
            href="/dashboard"
          >
            <Shield className="size-4" strokeWidth={2} />
          </Link>
          <span className="text-sm font-semibold text-[#18181b]">Helmsman</span>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            className={topNavClassName(workspaceActive)}
            href={projectViewHref(project.id, "board")}
          >
            工作台
          </Link>
          <Link
            className={topNavClassName(view === "dash")}
            href={projectViewHref(project.id, "dash")}
          >
            Sprint 仪表盘
          </Link>
          <Link
            className={topNavWithBadgeClassName(view === "review")}
            href={projectViewHref(project.id, "review")}
          >
            验收闸门
            <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-[#b45309]">
              {reviewTasks.length}
            </span>
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-3 py-1.5 text-xs sm:flex">
            <span className="text-[#a1a1aa]">Agent 机群</span>
            <span className="flex items-center gap-1 text-[#3f3f46]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4f7cff]" />
              {activeAgents.length} 执行
            </span>
            <span className="flex items-center gap-1 text-[#3f3f46]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a1a1aa]" />
              {idleAgents} 空闲
            </span>
            <span className="flex items-center gap-1 text-[#be123c]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {blockedTasks.length} 异常
            </span>
          </div>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-zinc-200 text-xs font-medium text-[#3f3f46]">
            {user.name?.slice(0, 1).toUpperCase() ?? "Y"}
          </div>
        </div>
      </header>

      {view === "board" ? (
        <BoardView
          aiAgents={aiAgents}
          donePoints={donePoints}
          latestSprintName={latestSprint?.name ?? "Sprint 1"}
          projectId={project.id}
          sprintTasks={sprintTasks}
          totalPoints={totalPoints}
          userInitial={user.name?.slice(0, 1).toUpperCase() ?? "Y"}
        />
      ) : null}
      {view === "backlog" ? (
        <BacklogView epics={epics} projectId={project.id} stories={stories} />
      ) : null}
      {view === "dash" ? (
        <SprintDashboard
          activeAgents={activeAgents.length}
          blockedTasks={blockedTasks.length}
          donePoints={donePoints}
          doneTasks={doneTasks.length}
          reviewTasks={reviewTasks.length}
          sprintTasks={sprintTasks.length}
          totalPoints={totalPoints}
        />
      ) : null}
      {view === "review" ? (
        <ReviewGate projectId={project.id} reviewTasks={reviewTasks} />
      ) : null}
    </main>
  );
}

function BoardView({
  aiAgents,
  donePoints,
  latestSprintName,
  projectId,
  sprintTasks,
  totalPoints,
  userInitial,
}: {
  aiAgents: AgentMember[];
  donePoints: number;
  latestSprintName: string;
  projectId: string;
  sprintTasks: WorkTask[];
  totalPoints: number;
  userInitial: string;
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-[#e4e4e7] bg-white p-0.5 text-xs">
          <span className="rounded-md bg-[#4f7cff] px-2.5 py-1 font-medium text-white">
            看板
          </span>
          <Link
            className="rounded-md px-2.5 py-1 text-[#71717a] hover:text-[#18181b]"
            href={projectViewHref(projectId, "backlog")}
          >
            Backlog
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-[#18181b]">
          {latestSprintName} · Walking Skeleton
        </h1>
        <span className="rounded-md border border-[#e4e4e7] bg-white px-2 py-0.5 text-xs text-[#71717a]">
          6.10 → 6.17 · 还剩 4 天
        </span>
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-[#4f7cff]"
              style={{ width: progressWidth(donePoints, totalPoints) }}
            />
          </div>
          <span>
            {donePoints} / {totalPoints} pts
          </span>
        </div>
        <button className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#4f7cff] px-3 py-1.5 text-xs font-medium text-white transition active:scale-[.98]">
          <Plus className="size-3.5" strokeWidth={2} />
          新建 Story
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {boardColumns.map((column) => {
          const columnTasks = sprintTasks.filter((task) =>
            column.statuses.includes(task.status),
          );

          return (
            <section
              className={`flex flex-col rounded-xl border ${column.panelClass}`}
              key={column.key}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dotClass}`} />
                  <span className="text-sm font-medium text-[#3f3f46]">
                    {column.title}
                  </span>
                </div>
                <span
                  className={`rounded-full px-1.5 text-xs ${column.countClass}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 px-2 pb-2">
                {columnTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#e4e4e7] bg-white/70 px-3 py-8 text-center text-xs text-[#a1a1aa]">
                    暂无卡片
                  </div>
                ) : (
                  columnTasks.map((task, index) => (
                    <TaskCard
                      agents={aiAgents}
                      key={task.id}
                      projectId={projectId}
                      task={task}
                      userInitial={userInitial}
                      usLabel={`US-${index + 1}`}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function BacklogView({
  epics,
  projectId,
  stories,
}: {
  epics: BacklogItem[];
  projectId: string;
  stories: BacklogItem[];
}) {
  const rows = buildBacklogRows(epics, stories);

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-[#e4e4e7] bg-white p-0.5 text-xs">
          <Link
            className="rounded-md px-2.5 py-1 text-[#71717a] hover:text-[#18181b]"
            href={projectViewHref(projectId, "board")}
          >
            看板
          </Link>
          <span className="rounded-md bg-[#4f7cff] px-2.5 py-1 font-medium text-white">
            Backlog
          </span>
        </div>
        <h2 className="text-lg font-semibold text-[#18181b]">Product Backlog</h2>
        <span className="text-xs text-[#71717a]">
          {rows.length} Epics · 优先级依据已验证痛点排序
        </span>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="rounded-md border border-[#e4e4e7] bg-white px-2 py-1 text-[#71717a]">
            排序:优先级
          </span>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#4f7cff] px-3 py-1.5 font-medium text-white active:scale-[.98]">
            <Plus className="size-3.5" strokeWidth={2} />
            新建 Epic
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-[#71717a]">
        <span className="flex items-center gap-1">
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[#be123c]">
            Must
          </span>
          必须
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[#b45309]">
            Should
          </span>
          应该
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[#71717a]">
            Could
          </span>
          可选
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className="shadow-card rounded-xl border border-dashed border-[#e4e4e7] bg-white px-4 py-10 text-center text-sm text-[#a1a1aa]">
            No epics imported yet.
          </div>
        ) : (
          rows.map((epic) => {
            return (
              <details
                className="shadow-card group rounded-xl border border-[#e4e4e7] bg-white"
                key={epic.code}
                open={epic.defaultOpen}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  <ChevronRight className="size-3.5 text-[#a1a1aa] transition group-open:rotate-90" strokeWidth={2} />
                  <span className="font-mono text-xs text-[#a1a1aa]">
                    {epic.code}
                  </span>
                  <span className="text-sm font-semibold text-[#18181b]">
                    {epic.title}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${priorityTone(epic.priority)}`}>
                    {epic.priority}
                  </span>
                  {epic.badges?.map((badge) => (
                    <span
                      className={
                        badge === "红线"
                          ? "rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] text-[#be123c]"
                          : "rounded border border-[#4f7cff]/30 bg-[#eef2ff] px-1.5 py-0.5 text-[10px] text-[#3a5bd0]"
                      }
                      key={badge}
                    >
                      {badge}
                    </span>
                  ))}
                  <span className="ml-auto flex items-center gap-3 text-xs text-[#a1a1aa]">
                    <span>{epic.sprintLabel}</span>
                    {epic.progressLabel ? (
                      <>
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
                          <span className={`block h-full bg-emerald-500 ${epic.progressWidth ?? "w-0"}`} />
                        </span>
                        <span>{epic.progressLabel}</span>
                      </>
                    ) : null}
                  </span>
                </summary>
                {epic.stories.length > 0 ? (
                  <div className="divide-y divide-[#e4e4e7] border-t border-[#e4e4e7]">
                    {epic.stories.map((story) => (
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 pl-11 text-sm"
                      key={`${epic.code}-${story.code}`}
                    >
                      <span className="font-mono text-[11px] text-[#a1a1aa]">
                        {story.code}
                      </span>
                      <span className="flex-1 text-[#3f3f46]">{story.title}</span>
                      <span className={storyStatusClassName(story.status)}>
                        {story.status !== "To Do" ? (
                          <span className={`h-1.5 w-1.5 rounded-full ${storyStatusDotClassName(story.status)}`} />
                        ) : null}
                        {story.status}
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-[#71717a]">
                        {story.points}
                      </span>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-t border-[#e4e4e7] px-4 py-2.5 pl-11 text-sm text-[#a1a1aa]">
                    {epic.emptyText}
                  </div>
                )}
              </details>
            );
          })
        )}
      </div>
    </section>
  );
}

function SprintDashboard({
  activeAgents,
  blockedTasks,
  donePoints,
  doneTasks,
  reviewTasks,
  sprintTasks,
  totalPoints,
}: {
  activeAgents: number;
  blockedTasks: number;
  donePoints: number;
  doneTasks: number;
  reviewTasks: number;
  sprintTasks: number;
  totalPoints: number;
}) {
  const passRate = sprintTasks ? Math.round((doneTasks / sprintTasks) * 100) : 0;

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[#18181b]">Sprint 1 仪表盘</h2>
        <span className="rounded-md border border-[#e4e4e7] bg-white px-2 py-0.5 text-xs text-[#71717a]">
          第 3 天 / 共 7 天
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard helper="按节奏可如期完成" helperClass="text-[#047857]" label="完成 / 总点数" suffix={` / ${totalPoints}`} value={`${donePoints}`} />
        <KpiCard helper={`今日 +${reviewTasks}`} helperClass="text-[#a1a1aa]" label="Agent 提交 PR" value={`${reviewTasks + doneTasks}`} />
        <KpiCard helper={`打回 ${blockedTasks} · 注意返工成本`} helperClass="text-[#be123c]" label="验收通过率" value={`${passRate}%`} />
        <KpiCard helper="闸门趋于瓶颈" helperClass="text-[#b45309]" label="平均验收等待" suffix="min" value="38" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#18181b]">燃尽图</h3>
            <div className="flex items-center gap-3 text-[11px] text-[#71717a]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-zinc-300" />
                理想
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-[#4f7cff]" />
                实际
              </span>
            </div>
          </div>
          <svg className="w-full" viewBox="0 0 520 200">
            <g stroke="#e4e4e7" strokeWidth="1">
              <line x1="40" x2="40" y1="20" y2="170" />
              <line x1="40" x2="510" y1="170" y2="170" />
              <line stroke="#f1f1f3" x1="40" x2="510" y1="120" y2="120" />
              <line stroke="#f1f1f3" x1="40" x2="510" y1="70" y2="70" />
            </g>
            <text fill="#a1a1aa" fontSize="9" x="14" y="24">20</text>
            <text fill="#a1a1aa" fontSize="9" x="20" y="124">10</text>
            <text fill="#a1a1aa" fontSize="9" x="26" y="173">0</text>
            <line stroke="#d4d4d8" strokeDasharray="4 4" strokeWidth="2" x1="40" x2="510" y1="20" y2="170" />
            <polyline fill="none" points="40,20 107,28 174,52 241,86" stroke="#4f7cff" strokeLinejoin="round" strokeWidth="2" />
            <circle cx="241" cy="86" fill="#4f7cff" r="3.5" />
            <g fill="#a1a1aa" fontSize="9" textAnchor="middle">
              <text x="40" y="185">D1</text>
              <text x="174" y="185">D3</text>
              <text x="375" y="185">D5</text>
              <text x="510" y="185">D7</text>
            </g>
          </svg>
        </div>

        <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#18181b]">
            Agent 机群 · 谁干了什么
          </h3>
          <ul className="space-y-2.5 text-xs">
            {[
              ["agent-01", "6 PR · 5 过", "w-[83%]", "bg-[#4f7cff]", "text-[#3f3f46]"],
              ["agent-02", "4 PR · 3 过", "w-[75%]", "bg-[#4f7cff]", "text-[#3f3f46]"],
              ["agent-03", "3 PR · 2 过", "w-[66%]", "bg-[#4f7cff]", "text-[#3f3f46]"],
              ["agent-04", "卡死 · 已回收", "w-[20%]", "bg-rose-400", "text-[#be123c]"],
              ["agent-05", activeAgents ? "空闲" : "空闲", "w-0", "bg-[#a1a1aa]", "text-[#a1a1aa]"],
            ].map(([name, meta, width, bar, tone]) => (
              <li key={name}>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 ${tone}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${bar}`} />
                    {name}
                  </span>
                  <span className={tone}>{meta}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className={`h-full ${width} ${bar}`} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shadow-card mt-3 rounded-xl border border-[#e4e4e7] bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#18181b]">最近活动</h3>
        <ol className="space-y-2 text-xs text-[#71717a]">
          <ActivityLine actor="You" color="bg-emerald-500" detail="验收通过 US-0 · push 已解锁" time="14:22" />
          <ActivityLine actor="agent-01" color="bg-amber-500" detail="提交 PR #128 · 等待验收" time="14:05" />
          <ActivityLine actor="You" color="bg-rose-500" detail="打回 US-7 · 并发竞态" time="13:48" />
          <ActivityLine actor="agent-03" color="bg-[#4f7cff]" detail="领取 US-1 · 建分支" time="13:30" />
        </ol>
      </div>
    </section>
  );
}

function KpiCard({
  helper,
  helperClass,
  label,
  suffix,
  value,
}: {
  helper: string;
  helperClass: string;
  label: string;
  suffix?: string;
  value: string;
}) {
  return (
    <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4">
      <p className="text-xs text-[#71717a]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#18181b]">
        {value}
        {suffix ? <span className="text-base text-[#a1a1aa]">{suffix}</span> : null}
      </p>
      <p className={`mt-1 text-[11px] ${helperClass}`}>{helper}</p>
    </div>
  );
}

function ActivityLine({
  actor,
  color,
  detail,
  time,
}: {
  actor: string;
  color: string;
  detail: ReactNode;
  time: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[#3f3f46]">{actor}</span>
      <span>{detail}</span>
      <span className="ml-auto font-mono text-[#a1a1aa]">{time}</span>
    </li>
  );
}

function ReviewGate({
  projectId,
  reviewTasks,
}: {
  projectId: string;
  reviewTasks: WorkTask[];
}) {
  const selectedTask = reviewTasks[0];

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[#e4e4e7] lg:min-h-[calc(100dvh-3.5rem)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-[#18181b]">验收队列</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-[#b45309]">
              {reviewTasks.length} 待处理
            </span>
          </div>
          <div className="space-y-1 px-2">
            {reviewTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#e4e4e7] p-3 text-xs text-[#a1a1aa]">
                当前没有待验收项。
              </div>
            ) : (
              reviewTasks.slice(0, 4).map((task, index) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left ${
                    index === 0
                      ? "border-amber-300 bg-amber-50"
                      : "border-[#e4e4e7] hover:border-zinc-300"
                  }`}
                  key={task.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#a1a1aa]">
                      US-{index + 1} · PR #{pullRequestNumber(task.githubRefs[0]?.pullRequestUrl) || index + 1}
                    </span>
                    <span className="font-mono text-[10px] text-[#a1a1aa]">
                      {index === 0 ? "now" : `${index * 8}m`}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#18181b]">{task.title}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#71717a]">
                    <span className="text-[#047857]">✓ ready</span>·
                    <span>{task.assignee?.name ?? "agent"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0 bg-white">
          {selectedTask ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-[#e4e4e7] px-5 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#18181b]">
                      US-4 {selectedTask.title}
                    </h2>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] text-[#b45309]">
                      待验收
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-[#a1a1aa]">
                    PR #{pullRequestNumber(selectedTask.githubRefs[0]?.pullRequestUrl) || "128"} · {selectedTask.githubRefs[0]?.branch ?? "feat/us-4-approval-gate"} · {selectedTask.assignee?.name ?? "agent-01"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-[#b45309]">
                  <LockKeyhole className="size-4" strokeWidth={2} />
                  未验收 · push 被阻止
                </div>
              </div>

              <div className="grid grid-cols-1 gap-0 xl:grid-cols-[1fr_300px]">
                <div className="min-w-0 border-b border-[#e4e4e7] xl:border-b-0 xl:border-r">
                  <div className="px-5 py-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                      验收标准(Gherkin)
                    </h3>
                    <ul className="space-y-1.5 text-sm">
                      <AcceptanceItem checked text="验收通过后,PR 才允许合并/push" />
                      <AcceptanceItem checked text="打回时 PR 被阻止 + story 退回带反馈" />
                      <AcceptanceItem text="绕过门禁直接调 merge API 必须失败 — 待你确认" />
                    </ul>
                  </div>

                  <div className="border-t border-[#e4e4e7]">
                    <div className="flex items-center justify-between px-5 py-2.5 text-xs">
                      <span className="font-mono text-[#71717a]">src/gate/approval.ts</span>
                      <span className="font-mono text-[#a1a1aa]">
                        <span className="text-[#047857]">+184</span>{" "}
                        <span className="text-[#be123c]">−20</span>
                      </span>
                    </div>
                    <pre className="overflow-x-auto px-2 pb-4 font-mono text-[12px] leading-relaxed text-[#3f3f46]">
                      <code>
                        <span className="block px-3 text-[#a1a1aa]">@@ guard merge before human approval @@</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span> export async function canMerge(storyId: string) {"{"}</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span>   const story = await getStory(storyId);</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span>   if (story.approval !== &quot;approved&quot;) {"{"}</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span>     throw new GateError(&quot;push blocked: needs human approval&quot;);</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span>   {"}"}</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span>   return true;</span>
                        <span className="block border-l-2 border-emerald-600 bg-emerald-50 px-3"><span className="text-[#047857]">+</span> {"}"}</span>
                        <span className="block px-3"> </span>
                        <span className="block border-l-2 border-rose-500 bg-rose-50 px-3"><span className="text-[#be123c]">−</span> {/* TODO: 旧逻辑直接 merge, 无门禁 */}</span>
                        <span className="block border-l-2 border-rose-500 bg-rose-50 px-3"><span className="text-[#be123c]">−</span> await git.merge(branch);</span>
                      </code>
                    </pre>
                  </div>
                </div>

                <aside className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                    Agent 执行日志
                  </h3>
                  <ol className="relative space-y-3 border-l border-[#e4e4e7] pl-4 text-[12px]">
                    <ReviewLog color="bg-[#4f7cff]" text="领取任务 · 建分支" time="14:02:11" />
                    <ReviewLog color="bg-[#4f7cff]" text="写代码 · 3 个文件" time="14:03:40" />
                    <ReviewLog color="bg-emerald-500" text="测试 22/22 通过" time="14:05:02" />
                    <ReviewLog color="bg-amber-500" text="开 PR #128 · 等待验收" time="14:05:09" />
                  </ol>
                </aside>
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-[#e4e4e7] bg-white/90 px-5 py-3 backdrop-blur">
                <p className="text-xs text-[#71717a]">
                  你的决定决定它是否 &quot;完成&quot;。打回需填反馈。
                </p>
                <div className="ml-auto flex items-center gap-2">
                  <form action={reviewTaskAction} className="flex items-center gap-2">
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="taskId" type="hidden" value={selectedTask.id} />
                    <input name="decision" type="hidden" value="reject" />
                    <Input className="h-9 w-44 text-xs" name="feedback" placeholder="打回反馈" required />
                    <Button className="border-rose-300 bg-rose-50 text-[#be123c] hover:bg-rose-100" type="submit" variant="outline">
                      <RotateCcw className="size-4" strokeWidth={2} />
                      打回 + 反馈
                    </Button>
                  </form>
                  <form action={reviewTaskAction}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="taskId" type="hidden" value={selectedTask.id} />
                    <input name="decision" type="hidden" value="approve" />
                    <Button className="bg-emerald-600 font-semibold hover:bg-emerald-500" type="submit">
                      <Check className="size-4" strokeWidth={2} />
                      通过验收 · 解锁 push
                    </Button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-sm text-[#a1a1aa]">暂无待验收内容。</div>
          )}
        </section>
      </div>
    </section>
  );
}

function AcceptanceItem({ checked = false, text }: { checked?: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {checked ? (
        <span className="mt-0.5 grid h-4 w-4 place-items-center rounded bg-emerald-100 text-emerald-600">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="mt-0.5 h-4 w-4 rounded border border-zinc-300" />
      )}
      <span className={checked ? "text-[#3f3f46]" : "text-[#71717a]"}>{text}</span>
    </li>
  );
}

function ReviewLog({
  color,
  text,
  time,
}: {
  color: string;
  text: string;
  time: string;
}) {
  return (
    <li>
      <span className={`absolute -left-[5px] mt-1 h-2 w-2 rounded-full ${color}`} />
      <p className="text-[#3f3f46]">{text}</p>
      <p className="font-mono text-[10px] text-[#a1a1aa]">{time}</p>
    </li>
  );
}

function TaskCard({
  agents,
  projectId,
  task,
  userInitial,
  usLabel,
}: {
  agents: AgentMember[];
  projectId: string;
  task: WorkTask;
  userInitial: string;
  usLabel: string;
}) {
  const isTodo = task.status === "todo";
  const isRunning = task.status === "in_progress";
  const isBlocked = task.status === "blocked";
  const isReview = task.status === "review";
  const isDone = task.status === "accepted" || task.status === "done";
  const latestPr = task.githubRefs[0];
  const latestUpdate = task.updates[0];

  return (
    <article
      className={`shadow-card rounded-lg border bg-white p-3 ${
        isRunning ? "border-[#4f7cff]/40" : "border-[#e4e4e7]"
      } ${isBlocked ? "border-rose-300" : ""} ${
        isReview ? "cursor-pointer border-amber-300 hover:border-amber-400" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#a1a1aa]">{usLabel}</span>
        {isTodo ? (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-[#71717a]">
            {priorityPoints(task.priority)} pts
          </span>
        ) : null}
        {isRunning ? (
          <span className="flex items-center gap-1 text-[10px] text-[#3a5bd0]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4f7cff]" />
            运行中
          </span>
        ) : null}
        {isBlocked ? (
          <span className="flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">
            <RotateCcw className="size-2.5" strokeWidth={2} />
            返工 ×2
          </span>
        ) : null}
        {isReview ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-[#b45309]">
            PR #{pullRequestNumber(latestPr?.pullRequestUrl) || "待填"}
          </span>
        ) : null}
        {isDone ? (
          <span className="flex items-center gap-1 text-[10px] text-[#047857]">
            <Check className="size-3" strokeWidth={2} />
            已合并
          </span>
        ) : null}
      </div>

      <p
        className={`text-sm ${
          isDone
            ? "text-[#a1a1aa] line-through decoration-zinc-300"
            : "text-[#18181b]"
        }`}
      >
        {task.title}
      </p>

      {isTodo ? (
        <TodoAssignment agents={agents} projectId={projectId} task={task} />
      ) : null}

      {isRunning ? (
        <RunningMeta latestPr={latestPr} projectId={projectId} task={task} />
      ) : null}

      {isBlocked ? (
        <BlockedMeta latestPr={latestPr} latestUpdate={latestUpdate} task={task} />
      ) : null}

      {isReview ? (
        <ReviewMeta latestPr={latestPr} latestUpdate={latestUpdate} projectId={projectId} task={task} />
      ) : null}

      {isDone ? (
        <div className="mt-2.5 flex items-center gap-2 border-t border-[#e4e4e7] pt-2 text-xs text-[#a1a1aa]">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-200 text-[10px] text-[#3f3f46]">
            {userInitial}
          </span>
          You · 人类验收 ✓
        </div>
      ) : null}
    </article>
  );
}

function TodoAssignment({
  agents,
  projectId,
  task,
}: {
  agents: AgentMember[];
  projectId: string;
  task: { id: string; assigneeId: string | null };
}) {
  const onlineAgents = agents.slice(0, 2);

  return (
    <form
      action={assignTaskAction}
      className="mt-3 rounded-lg border border-[#4f7cff]/30 bg-[#eef2ff] p-1.5"
    >
      <input name="projectId" type="hidden" value={projectId} />
      <input name="taskId" type="hidden" value={task.id} />
      <p className="px-1.5 pb-1 text-[10px] uppercase tracking-wide text-[#3a5bd0]">
        指派给
      </p>
      <select
        className={nativeControlClassName()}
        defaultValue={task.assigneeId ?? ""}
        name="assigneeId"
        required
      >
        <option value="">选择在线 Agent</option>
        {onlineAgents.map((agent) => (
          <option key={agent.userId} value={agent.userId}>
            {agent.displayName ?? agent.user.name ?? "AI agent"}
          </option>
        ))}
      </select>
      <div className="mt-1.5 grid gap-1">
        {onlineAgents.map((agent) => (
          <div
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs"
            key={agent.userId}
          >
            <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-emerald-600">
              <Bot className="size-3" strokeWidth={2} />
            </span>
            <span className="text-[#18181b]">
              {agent.displayName ?? agent.user.name ?? "AI agent"}
            </span>
            <span className="ml-auto text-[10px] text-emerald-600">在线</span>
          </div>
        ))}
        <div className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs opacity-50">
          <span className="grid h-5 w-5 place-items-center rounded bg-zinc-100 text-[#a1a1aa]">
            <Bot className="size-3" strokeWidth={2} />
          </span>
          <span className="text-[#a1a1aa]">agent-05</span>
          <span className="ml-auto text-[10px] text-[#a1a1aa]">离线·不可指派</span>
        </div>
      </div>
      <Button
        className="mt-1.5 h-7 w-full bg-[#4f7cff] text-xs hover:bg-[#3a5bd0]"
        disabled={onlineAgents.length === 0}
        size="sm"
        type="submit"
      >
        指派
      </Button>
    </form>
  );
}

function RunningMeta({
  latestPr,
  projectId,
  task,
}: {
  latestPr: { pullRequestUrl: string | null; branch: string | null } | undefined;
  projectId: string;
  task: { id: string; assignee: { name: string | null } | null };
}) {
  return (
    <>
      <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <GitBranch className="size-3" strokeWidth={2} />
          {latestPr?.branch ?? "feat/story-agent-pr"}
        </div>
        <div className="flex items-center gap-1.5 text-[#b45309]">
          <Clock3 className="size-3" strokeWidth={2} />
          测试运行中 · 14/22
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-[#e4e4e7] pt-2">
        <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-emerald-600">
          <Bot className="size-3" strokeWidth={2} />
        </span>
        <span className="text-xs text-[#71717a]">
          {task.assignee?.name ?? "agent"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-[#a1a1aa]">2m 12s</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
        <form action={updateTaskStatusAction} className="contents">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={task.id} />
          <input name="status" type="hidden" value="review" />
          <Input
            className="h-8 text-xs"
            name="progress"
            placeholder="测试 22/22 通过"
            required
          />
          <Button className="h-8 text-xs" size="sm" type="submit" variant="outline">
            提验
          </Button>
        </form>
        <form action={submitPullRequestAction} className="contents">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={task.id} />
          <Input
            className="h-8 text-xs"
            name="pullRequestUrl"
            placeholder="PR URL"
            required
            type="url"
          />
          <Button className="h-8 bg-[#4f7cff] text-xs hover:bg-[#3a5bd0]" size="sm" type="submit">
            <GitPullRequest className="size-3" strokeWidth={2} />
          </Button>
        </form>
      </div>
    </>
  );
}

function BlockedMeta({
  latestPr,
  latestUpdate,
  task,
}: {
  latestPr: { branch: string | null } | undefined;
  latestUpdate: { progress: string } | undefined;
  task: { assignee: { name: string | null } | null };
}) {
  return (
    <>
      <div className="mt-2 rounded-md border-l-2 border-rose-400 bg-rose-50 px-2 py-1.5 text-[11px] text-[#be123c]">
        <span className="font-medium">打回:</span>
        {latestUpdate?.progress ?? "并发认领仍有竞态,需加分布式锁"}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[#71717a]">
        <GitBranch className="size-3" strokeWidth={2} />
        {latestPr?.branch ?? "feat/story-claim-lock"}
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-[#e4e4e7] pt-2">
        <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-emerald-600">
          <Bot className="size-3" strokeWidth={2} />
        </span>
        <span className="text-xs text-[#71717a]">
          {task.assignee?.name ?? "agent"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-rose-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          重做中
        </span>
      </div>
    </>
  );
}

function ReviewMeta({
  latestPr,
  latestUpdate,
  projectId,
  task,
}: {
  latestPr: { pullRequestUrl: string | null } | undefined;
  latestUpdate: { progress: string } | undefined;
  projectId: string;
  task: { id: string; assignee: { name: string | null } | null };
}) {
  return (
    <>
      <div className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-[#047857]">
        <Check className="size-3" strokeWidth={2} />
        {latestUpdate?.progress ?? "测试 22/22 通过 · +184 −20"}
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-[#e4e4e7] pt-2">
        <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-emerald-600">
          <Bot className="size-3" strokeWidth={2} />
        </span>
        <span className="text-xs text-[#71717a]">
          {task.assignee?.name ?? "agent"}
        </span>
        <a
          className="ml-auto flex items-center gap-1 text-[10px] text-[#b45309]"
          href={latestPr?.pullRequestUrl ?? "#"}
          rel="noreferrer"
          target="_blank"
        >
          <LockKeyhole className="size-3" strokeWidth={2} />
          push 已锁
        </a>
      </div>
      <div className="mt-3 grid gap-1.5">
        <form action={reviewTaskAction} className="contents">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={task.id} />
          <input name="decision" type="hidden" value="approve" />
          <Button className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700" size="sm" type="submit">
            <Check className="size-3" strokeWidth={2} />
            通过验收
          </Button>
        </form>
        <form action={reviewTaskAction} className="grid grid-cols-[1fr_auto] gap-1.5">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={task.id} />
          <input name="decision" type="hidden" value="reject" />
          <Input
            className="h-8 text-xs"
            name="feedback"
            placeholder="打回原因"
            required
          />
          <Button
            className="h-8 border-rose-200 text-xs text-[#be123c] hover:bg-rose-50"
            size="sm"
            type="submit"
            variant="outline"
          >
            <RotateCcw className="size-3" strokeWidth={2} />
          </Button>
        </form>
      </div>
    </>
  );
}
