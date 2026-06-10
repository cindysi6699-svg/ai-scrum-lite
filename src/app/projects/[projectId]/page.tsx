import {
  Bot,
  Check,
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

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await params;
  const project = await getProjectForUser(projectId, user.id);

  if (!project) {
    notFound();
  }

  const latestSprint = project.sprints[0];
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
          <a
            className="relative px-3 py-2 text-[#18181b] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#4f7cff]"
            href="#board"
          >
            工作台
          </a>
          <span className="px-3 py-2 text-[#71717a]">Sprint 仪表盘</span>
          <span className="relative flex items-center gap-1.5 px-3 py-2 text-[#71717a]">
            验收闸门
            <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-[#b45309]">
              {reviewTasks.length}
            </span>
          </span>
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

      <section className="px-4 py-4" id="board">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-[#e4e4e7] bg-white p-0.5 text-xs">
            <button className="rounded-md bg-[#4f7cff] px-2.5 py-1 font-medium text-white">
              看板
            </button>
            <span className="rounded-md px-2.5 py-1 text-[#71717a]">Backlog</span>
          </div>
          <h1 className="text-lg font-semibold text-[#18181b]">
            {latestSprint?.name ?? "Sprint 1"} · Walking Skeleton
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
                        projectId={project.id}
                        task={task}
                        userInitial={user.name?.slice(0, 1).toUpperCase() ?? "Y"}
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
    </main>
  );
}

function TaskCard({
  agents,
  projectId,
  task,
  userInitial,
  usLabel,
}: {
  agents: Array<{
    userId: string;
    displayName: string | null;
    role: string;
    user: {
      name: string | null;
      type: string;
    };
  }>;
  projectId: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    assignee: { name: string | null } | null;
    backlogItem: { title: string } | null;
    githubRefs: Array<{ pullRequestUrl: string | null; branch: string | null }>;
    updates: Array<{ progress: string }>;
  };
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
  agents: Array<{
    userId: string;
    displayName: string | null;
    role: string;
    user: {
      name: string | null;
      type: string;
    };
  }>;
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
