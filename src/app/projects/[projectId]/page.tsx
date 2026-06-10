import {
  Bot,
  Check,
  ChevronDown,
  Circle,
  GitPullRequest,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  assignTaskAction,
  createAgentAction,
  createStoryTaskAction,
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
  countTone: string;
  dot: string;
  panel: string;
  card: string;
};

const boardColumns: BoardColumn[] = [
  {
    key: "todo",
    title: "To Do",
    statuses: ["todo"],
    countTone: "text-slate-400",
    dot: "bg-slate-400",
    panel: "bg-white",
    card: "border-slate-200",
  },
  {
    key: "in_progress",
    title: "Agent 执行中",
    statuses: ["in_progress", "blocked"],
    countTone: "text-slate-400",
    dot: "bg-[#4f7cff]",
    panel: "bg-white",
    card: "border-blue-200",
  },
  {
    key: "review",
    title: "待验收",
    statuses: ["review"],
    countTone: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    panel: "bg-[#fffdf3] border-amber-300",
    card: "border-amber-300",
  },
  {
    key: "done",
    title: "Done",
    statuses: ["done", "accepted"],
    countTone: "text-slate-400",
    dot: "bg-emerald-500",
    panel: "bg-white",
    card: "border-slate-200",
  },
] as const;

const manualStatuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "Agent 执行中" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "待验收" },
  { value: "done", label: "Done" },
] as const;

const statusCopy: Record<string, string> = {
  todo: "未指派",
  in_progress: "运行中",
  blocked: "重做中",
  review: "待验收",
  done: "已完成",
  accepted: "已合并",
};

function nativeControlClassName() {
  return "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus-visible:border-[#4f7cff] focus-visible:ring-3 focus-visible:ring-blue-100";
}

function progressWidth(done: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.min(100, Math.round((done / total) * 100))}%`;
}

function priorityPoints(priority: string) {
  const value = Number(priority.replace("P", ""));

  return Number.isFinite(value) ? value : 1;
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
  const epics = project.backlog.filter((item) => item.type === "epic");
  const stories = project.backlog.filter((item) => item.type === "story");
  const sprintTasks = latestSprint?.tasks ?? [];
  const aiAgents = project.members.filter((member) => member.user.type === "ai");
  const reviewTasks = sprintTasks.filter((task) => task.status === "review");
  const doneTasks = sprintTasks.filter(
    (task) => task.status === "accepted" || task.status === "done",
  );
  const blockedTasks = sprintTasks.filter((task) => task.status === "blocked");
  const activeAgents = aiAgents.filter((agent) =>
    sprintTasks.some(
      (task) =>
        task.assigneeId === agent.userId &&
        ["in_progress", "blocked", "review"].includes(task.status),
    ),
  );
  const idleAgents = Math.max(0, aiAgents.length - activeAgents.length);
  const totalPoints = sprintTasks.reduce(
    (sum, task) => sum + priorityPoints(task.priority),
    0,
  );
  const donePoints = doneTasks.reduce(
    (sum, task) => sum + priorityPoints(task.priority),
    0,
  );

  return (
    <main className="min-h-screen bg-[#f6f6f7] text-[#202126]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <Link
              className="flex size-10 items-center justify-center rounded-lg bg-[#4f7cff] text-white shadow-sm"
              href="/dashboard"
            >
              <Shield className="size-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Helmsman</span>
              <span className="hidden text-sm text-slate-400 md:inline">
                / {project.name}
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-base font-medium text-slate-500 md:flex">
            <a className="border-b-3 border-[#4f7cff] px-1 py-7 text-[#202126]" href="#board">
              工作台
            </a>
            <a className="px-1 py-7 transition hover:text-[#202126]" href="#metrics">
              Sprint 仪表盘
            </a>
            <a className="flex items-center gap-2 px-1 py-7 transition hover:text-[#202126]" href="#review">
              验收闸门
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                {reviewTasks.length}
              </span>
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-500 lg:flex">
              <span>Agent 机群</span>
              <span className="flex items-center gap-1 text-[#4f7cff]">
                <Circle className="size-2 fill-current" />
                {activeAgents.length} 执行
              </span>
              <span className="flex items-center gap-1">
                <Circle className="size-2 fill-current text-slate-400" />
                {idleAgents} 空闲
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <Circle className="size-2 fill-current" />
                {blockedTasks.length} 异常
              </span>
            </div>
            <button className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-400 lg:flex">
              <Search className="size-4" />
              搜索...
            </button>
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {user.name?.slice(0, 1).toUpperCase() ?? "Y"}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1760px] px-5 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button className="rounded-md bg-[#4f7cff] px-4 py-2 text-sm font-semibold text-white">
                看板
              </button>
              <a
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                href="#backlog"
              >
                Backlog
              </a>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-normal">
                  {latestSprint?.name ?? "Sprint 1"} · Walking Skeleton
                </h1>
                <Badge className="border border-slate-200 bg-white text-slate-500">
                  6.10 → 6.17 · 还剩 4 天
                </Badge>
                <div className="h-2 w-56 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#4f7cff]"
                    style={{ width: progressWidth(donePoints, totalPoints) }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {donePoints}/{totalPoints} pts
                </span>
              </div>
              <p className="mt-2 max-w-4xl text-sm text-slate-500">
                {latestSprint?.goal ??
                  project.goal ??
                  "Manage Sprint work, AI agent execution, PR review, and human approval gates."}
              </p>
            </div>
          </div>

          <form
            action={createStoryTaskAction}
            className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:grid-cols-[220px_260px_220px_auto]"
          >
            <input name="projectId" type="hidden" value={project.id} />
            <Input name="title" placeholder="新建 Story 标题" required />
            <Input
              name="userStory"
              placeholder="As a..., I want..."
              required
            />
            <Input
              name="acceptanceCriteria"
              placeholder="验收标准"
              required
            />
            <Button className="bg-[#4f7cff] hover:bg-[#416df1]" type="submit">
              <Plus className="size-4" />
              新建 Story
            </Button>
          </form>
        </div>

        <section
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          id="metrics"
        >
          {[
            ["完成 / 总点数", `${donePoints}`, `/${totalPoints}`, "按节奏可如期完成", "text-emerald-600"],
            ["Agent 提交 PR", `${reviewTasks.length + doneTasks.length}`, "", `今日 +${reviewTasks.length}`, "text-slate-400"],
            ["验收通过率", `${sprintTasks.length ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0}%`, "", `打回 ${blockedTasks.length} · 注意返工成本`, "text-rose-500"],
            ["平均验收等待", "38", "min", "闸门趋于瓶颈", "text-orange-500"],
          ].map(([label, value, suffix, helper, tone]) => (
            <div
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={label}
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className="mt-3 flex items-end gap-1">
                <p className="text-4xl font-semibold tracking-normal">{value}</p>
                <p className="pb-1 text-xl font-semibold text-slate-400">{suffix}</p>
              </div>
              <p className={`mt-3 text-sm font-medium ${tone}`}>{helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-4" id="board">
          {boardColumns.map((column) => {
            const columnTasks = sprintTasks.filter((task) =>
              column.statuses.includes(task.status),
            );

            return (
              <section
                className={`min-h-[640px] rounded-xl border border-slate-200 shadow-sm ${column.panel}`}
                key={column.key}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${column.dot}`} />
                    <h2 className="text-lg font-semibold tracking-normal">
                      {column.title}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm font-semibold ${column.countTone}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <div className="grid gap-3 p-3">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 py-12 text-center text-sm text-slate-400">
                      暂无卡片
                    </div>
                  ) : (
                    columnTasks.map((task, index) => {
                      const isReview = task.status === "review";
                      const isBlocked = task.status === "blocked";
                      const isDone =
                        task.status === "accepted" || task.status === "done";

                      return (
                        <article
                          className={`rounded-lg border bg-white p-4 shadow-sm ${column.card} ${
                            isBlocked ? "border-rose-300" : ""
                          } ${isReview ? "bg-[#fffdf8]" : ""}`}
                          key={task.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold text-slate-400">
                              US-{index + 1}
                            </p>
                            <div className="flex items-center gap-2">
                              {task.githubRefs[0]?.pullRequestUrl ? (
                                <a
                                  className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700"
                                  href={task.githubRefs[0].pullRequestUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  PR #{task.githubRefs[0].pullRequestUrl
                                    .split("/")
                                    .pop()}
                                </a>
                              ) : null}
                              <span
                                className={`text-xs font-medium ${
                                  isReview
                                    ? "text-amber-600"
                                    : isBlocked
                                      ? "text-rose-500"
                                      : isDone
                                        ? "text-emerald-600"
                                        : "text-[#4f7cff]"
                                }`}
                              >
                                {statusCopy[task.status]}
                              </span>
                            </div>
                          </div>

                          <h3 className="mt-3 text-base font-semibold leading-6">
                            {task.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {task.backlogItem?.title ?? "未关联 Story"}
                          </p>

                          {task.updates[0] ? (
                            <p
                              className={`mt-3 rounded-md px-3 py-2 text-sm leading-6 ${
                                isBlocked
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              {task.updates[0].progress}
                            </p>
                          ) : null}

                          <div className="mt-4 border-t border-slate-200 pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                <span className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                                  <LockKeyhole className="size-4" />
                                </span>
                                {task.assignee?.name ?? "未指派"}
                              </span>
                              <span className="text-xs text-slate-400">
                                {task.priority} pts
                              </span>
                            </div>
                          </div>

                          {task.status === "todo" ? (
                            <form
                              action={assignTaskAction}
                              className="mt-3 grid grid-cols-[1fr_auto] gap-2"
                            >
                              <input
                                name="projectId"
                                type="hidden"
                                value={project.id}
                              />
                              <input name="taskId" type="hidden" value={task.id} />
                              <select
                                className={nativeControlClassName()}
                                defaultValue={task.assigneeId ?? ""}
                                name="assigneeId"
                                required
                              >
                                <option value="">指派给</option>
                                {aiAgents.map((agent) => (
                                  <option key={agent.userId} value={agent.userId}>
                                    {agent.displayName ??
                                      agent.user.name ??
                                      "AI agent"}
                                  </option>
                                ))}
                              </select>
                              <Button
                                className="bg-[#4f7cff] hover:bg-[#416df1]"
                                disabled={aiAgents.length === 0}
                                size="sm"
                                type="submit"
                              >
                                指派
                              </Button>
                            </form>
                          ) : null}

                          {task.status === "in_progress" ||
                          task.status === "blocked" ? (
                            <div className="mt-3 grid gap-2">
                              <form
                                action={updateTaskStatusAction}
                                className="grid grid-cols-[1fr_auto] gap-2"
                              >
                                <input
                                  name="projectId"
                                  type="hidden"
                                  value={project.id}
                                />
                                <input name="taskId" type="hidden" value={task.id} />
                                <input
                                  name="status"
                                  type="hidden"
                                  value="review"
                                />
                                <Input
                                  name="progress"
                                  placeholder="测试 22/22 通过"
                                  required
                                />
                                <Button size="sm" type="submit" variant="outline">
                                  提验
                                </Button>
                              </form>
                              <form
                                action={submitPullRequestAction}
                                className="grid grid-cols-[1fr_auto] gap-2"
                              >
                                <input
                                  name="projectId"
                                  type="hidden"
                                  value={project.id}
                                />
                                <input name="taskId" type="hidden" value={task.id} />
                                <Input
                                  name="pullRequestUrl"
                                  placeholder="PR URL"
                                  required
                                  type="url"
                                />
                                <Button size="sm" type="submit">
                                  <GitPullRequest className="size-4" />
                                </Button>
                              </form>
                            </div>
                          ) : null}

                          {isReview ? (
                            <div className="mt-4 grid gap-2">
                              <form
                                action={reviewTaskAction}
                                className="grid grid-cols-2 gap-2"
                              >
                                <input
                                  name="projectId"
                                  type="hidden"
                                  value={project.id}
                                />
                                <input name="taskId" type="hidden" value={task.id} />
                                <input
                                  name="decision"
                                  type="hidden"
                                  value="approve"
                                />
                                <Button className="bg-emerald-600 hover:bg-emerald-700" type="submit">
                                  <Check className="size-4" />
                                  通过验收
                                </Button>
                              </form>
                              <form
                                action={reviewTaskAction}
                                className="grid grid-cols-[1fr_auto] gap-2"
                              >
                                <input
                                  name="projectId"
                                  type="hidden"
                                  value={project.id}
                                />
                                <input name="taskId" type="hidden" value={task.id} />
                                <input
                                  name="decision"
                                  type="hidden"
                                  value="reject"
                                />
                                <Input
                                  name="feedback"
                                  placeholder="打回原因"
                                  required
                                />
                                <Button
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                  type="submit"
                                  variant="outline"
                                >
                                  <RotateCcw className="size-4" />
                                  打回
                                </Button>
                              </form>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </section>

        <section
          className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"
          id="review"
        >
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 text-amber-500" />
                <h2 className="text-lg font-semibold">需要你验收</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                  {reviewTasks.length}
                </span>
              </div>
              <a className="text-sm font-semibold text-[#4f7cff]" href="#board">
                全部查看
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {reviewTasks.length === 0 ? (
                <div className="px-5 py-10 text-sm text-slate-400">
                  当前没有等待验收的任务。
                </div>
              ) : (
                reviewTasks.slice(0, 3).map((task, index) => (
                  <div
                    className="grid gap-3 px-5 py-4 md:grid-cols-[90px_110px_1fr_120px_120px]"
                    key={task.id}
                  >
                    <span className="text-sm font-medium text-slate-400">
                      PR #{task.githubRefs[0]?.pullRequestUrl?.split("/").pop() ?? index + 1}
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-500">
                      Helmsman
                    </span>
                    <span className="font-medium">{task.title}</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ✓ ready
                    </span>
                    <span className="text-sm text-slate-500">
                      {task.assignee?.name ?? "agent"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">快捷操作</h2>
            <p className="mt-1 text-sm text-slate-500">
              用于不在卡片上直接处理的批量状态更新。
            </p>
            <form action={updateTaskStatusAction} className="mt-4 grid gap-3">
              <input name="projectId" type="hidden" value={project.id} />
              <select className={nativeControlClassName()} name="taskId" required>
                <option value="">选择任务</option>
                {sprintTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <select className={nativeControlClassName()} name="status">
                {manualStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <Textarea name="progress" placeholder="补充进度、阻塞或验收信息" />
              <Button type="submit" variant="outline">
                <Send className="size-4" />
                更新任务
              </Button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm" id="backlog">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Product Backlog</h2>
              <span className="text-sm text-slate-500">
                {epics.length} Epics · 优先级依据已验证痛点排序
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-50 text-rose-600">Must 必须</Badge>
              <Badge className="bg-amber-50 text-amber-700">Should 应该</Badge>
              <Badge className="bg-slate-100 text-slate-500">Could 可选</Badge>
            </div>
          </div>

          <div className="grid gap-3 p-4">
            {epics.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-400">
                No epics imported yet.
              </div>
            ) : (
              epics.map((epic, index) => {
                const linkedStories = stories.filter(
                  (story) => story.parentId === epic.id,
                );

                return (
                  <article className="rounded-lg border border-slate-200 bg-white" key={epic.id}>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <ChevronDown className="size-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-400">
                          E{index + 1}
                        </span>
                        <h3 className="font-semibold">{epic.title}</h3>
                        <Badge className="bg-rose-50 text-rose-600">Must</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>S{index + 1}</span>
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full w-1/2 rounded-full bg-emerald-500" />
                        </div>
                        <span>{linkedStories.length}/4 done</span>
                      </div>
                    </div>
                    {linkedStories.slice(0, 2).map((story, storyIndex) => (
                      <div
                        className="grid grid-cols-[80px_1fr_120px_60px] items-center border-t border-slate-100 px-5 py-4 text-sm"
                        key={story.id}
                      >
                        <span className="text-slate-400">US-{storyIndex + 1}</span>
                        <span className="font-medium text-slate-600">
                          {story.title}
                        </span>
                        <span className="text-[#4f7cff]">
                          {storyIndex === 0 ? "执行中" : "To Do"}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-center text-slate-500">
                          {story.priority}
                        </span>
                      </div>
                    ))}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            action={createAgentAction}
            className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
          >
            <Input name="name" placeholder="注册 Agent，例如 QA Agent 02" />
            <input name="projectId" type="hidden" value={project.id} />
            <select className={nativeControlClassName()} name="role" required>
              <option value="dev">Dev Agent</option>
              <option value="qa">QA Agent</option>
              <option value="design">Design Agent</option>
            </select>
            <Button type="submit" variant="outline">
              <Bot className="size-4" />
              Register agent
            </Button>
          </form>
        </section>
      </section>
    </main>
  );
}
