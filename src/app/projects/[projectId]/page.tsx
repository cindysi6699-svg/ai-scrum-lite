import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  GitBranch,
  GitPullRequest,
  Kanban,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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

const boardColumns = [
  {
    status: "todo",
    title: "Ready",
    eyebrow: "Backlog ready",
    dot: "bg-slate-400",
    rail: "border-t-slate-300",
  },
  {
    status: "in_progress",
    title: "In Progress",
    eyebrow: "Agent executing",
    dot: "bg-blue-500",
    rail: "border-t-blue-400",
  },
  {
    status: "blocked",
    title: "Blocked",
    eyebrow: "Needs help",
    dot: "bg-rose-500",
    rail: "border-t-rose-400",
  },
  {
    status: "review",
    title: "Review",
    eyebrow: "Human gate",
    dot: "bg-amber-500",
    rail: "border-t-amber-400",
  },
  {
    status: "accepted",
    title: "Accepted",
    eyebrow: "Done",
    dot: "bg-emerald-500",
    rail: "border-t-emerald-400",
  },
] as const;

const manualStatuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const;

function nativeControlClassName() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
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

  const currentMember = project.members.find((member) => member.userId === user.id);
  const latestSprint = project.sprints[0];
  const epics = project.backlog.filter((item) => item.type === "epic");
  const stories = project.backlog.filter((item) => item.type === "story");
  const sprintTasks = latestSprint?.tasks ?? [];
  const aiAgents = project.members.filter((member) => member.user.type === "ai");
  const reviewTasks = sprintTasks.filter((task) => task.status === "review");
  const acceptedTasks = sprintTasks.filter((task) => task.status === "accepted");
  const openTasks = sprintTasks.length - acceptedTasks.length;
  const progressPercent =
    sprintTasks.length === 0
      ? 0
      : Math.round((acceptedTasks.length / sprintTasks.length) * 100);

  const stats = [
    {
      label: "Sprint tasks",
      value: sprintTasks.length,
      icon: Kanban,
      tone: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      label: "Open work",
      value: openTasks,
      icon: CircleDot,
      tone: "bg-slate-100 text-slate-700 ring-slate-200",
    },
    {
      label: "Review queue",
      value: reviewTasks.length,
      icon: ShieldCheck,
      tone: "bg-amber-50 text-amber-800 ring-amber-100",
    },
    {
      label: "AI agents",
      value: aiAgents.length,
      icon: Bot,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto grid w-full max-w-[1580px] gap-5 px-4 py-4 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-5">
        <aside className="hidden overflow-hidden rounded-lg bg-[#111318] text-white shadow-sm lg:block">
          <div className="border-b border-white/10 p-5">
            <Link
              className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"
              href="/dashboard"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <div className="mt-7">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                AI Scrum Lite
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                {project.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/10 text-white">
                  {project.status}
                </Badge>
                <Badge className="border-white/10 bg-cyan-400/15 text-cyan-100">
                  {currentMember?.role ?? "member"}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="grid gap-1 p-3 text-sm">
            {[
              ["Sprint board", "#board", Kanban],
              ["Control center", "#control-center", Activity],
              ["Backlog", "#backlog", ClipboardList],
              ["Team", "#team", Users],
            ].map(([label, href, Icon]) => (
              <a
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-white/68 transition hover:bg-white/10 hover:text-white"
                href={href as string}
                key={label as string}
              >
                <Icon className="size-4" />
                {label as string}
              </a>
            ))}
          </nav>

          <div className="mx-4 mt-3 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
              Sprint health
            </p>
            <p className="mt-3 text-3xl font-semibold">{progressPercent}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/55">
              Accepted tasks divided by all Sprint tasks.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="rounded-lg border bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <Link
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:hidden"
                  href="/dashboard"
                >
                  <ArrowLeft className="size-4" />
                  Dashboard
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0">
                  <Badge variant="outline">AI/OPC Delivery</Badge>
                  <Badge className="bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    Sprint 1
                  </Badge>
                </div>
                <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-normal text-slate-950 md:text-4xl">
                  {project.name}
                </h2>
                <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-600">
                  {project.goal ??
                    "No project goal recorded yet. Add one before assigning AI agents."}
                </p>
              </div>

              <div className="w-full rounded-lg border bg-slate-50 p-4 xl:w-[360px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Current Sprint
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {latestSprint?.name ?? "No active sprint"}
                    </p>
                  </div>
                  <CalendarDays className="size-5 text-slate-400" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {latestSprint?.goal ?? "Create an active Sprint to begin delivery."}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="rounded-lg border bg-white p-4 shadow-sm"
                  key={stat.label}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold tracking-normal">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-md ring-1 ${stat.tone}`}
                    >
                      <Icon className="size-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section
              className="min-w-0 overflow-hidden rounded-lg border bg-white shadow-sm"
              id="board"
            >
              <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Kanban className="size-5 text-slate-500" />
                    <h3 className="text-lg font-semibold tracking-normal">
                      Sprint Board
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    One board for the Sprint Backlog. Cards stay readable; actions live on
                    the right.
                  </p>
                </div>
                <Badge className="w-fit bg-slate-900 text-white">
                  {acceptedTasks.length}/{sprintTasks.length} accepted
                </Badge>
              </div>

              <div className="overflow-x-auto p-4">
                <div className="grid min-w-[1120px] gap-3 xl:min-w-0 xl:grid-cols-5">
                  {boardColumns.map((column) => {
                    const columnTasks = sprintTasks.filter(
                      (task) => task.status === column.status,
                    );

                    return (
                      <section
                        className={`rounded-lg border-t-4 bg-[#f8fafc] ${column.rail}`}
                        key={column.status}
                      >
                        <div className="flex items-start justify-between gap-3 border-b px-3 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2.5 rounded-full ${column.dot}`}
                              />
                              <h4 className="text-sm font-semibold">{column.title}</h4>
                            </div>
                            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                              {column.eyebrow}
                            </p>
                          </div>
                          <Badge variant="outline">{columnTasks.length}</Badge>
                        </div>

                        <div className="grid gap-3 p-3">
                          {columnTasks.length === 0 ? (
                            <div className="rounded-md border border-dashed bg-white px-3 py-10 text-center text-xs text-slate-400">
                              No cards
                            </div>
                          ) : (
                            columnTasks.map((task) => (
                              <article
                                className="rounded-lg border bg-white p-3 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                                key={task.id}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold leading-5 text-slate-950">
                                    {task.title}
                                  </p>
                                  <Badge className="bg-slate-100 text-slate-600">
                                    P{task.priority}
                                  </Badge>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {task.backlogItem?.title ?? "No linked story"}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                    <Bot className="size-3" />
                                    {task.assignee?.name ?? "Unassigned"}
                                  </span>
                                  {task.githubRefs[0]?.pullRequestUrl ? (
                                    <a
                                      className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-violet-100"
                                      href={task.githubRefs[0].pullRequestUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <GitPullRequest className="size-3" />
                                      PR linked
                                    </a>
                                  ) : null}
                                </div>

                                {task.updates[0] ? (
                                  <div className="mt-3 rounded-md border-l-2 border-cyan-300 bg-cyan-50 px-3 py-2">
                                    <p className="line-clamp-2 text-xs leading-5 text-cyan-950">
                                      {task.updates[0].progress}
                                    </p>
                                  </div>
                                ) : null}
                              </article>
                            ))
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-4" id="control-center">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-slate-950 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4 text-cyan-300" />
                    Control Center
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Pick a task once, then update the delivery signal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                  <form action={assignTaskAction} className="grid gap-2">
                    <input name="projectId" type="hidden" value={project.id} />
                    <p className="text-sm font-semibold">Assign owner</p>
                    <select className={nativeControlClassName()} name="taskId" required>
                      <option value="">Select task</option>
                      {sprintTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <select
                      className={nativeControlClassName()}
                      name="assigneeId"
                      required
                    >
                      <option value="">Select AI agent</option>
                      {aiAgents.map((agent) => (
                        <option key={agent.userId} value={agent.userId}>
                          {agent.displayName ?? agent.user.name ?? "AI agent"}
                        </option>
                      ))}
                    </select>
                    <Button disabled={aiAgents.length === 0} type="submit">
                      <Bot className="size-4" />
                      Assign
                    </Button>
                  </form>

                  <Separator />

                  <form action={updateTaskStatusAction} className="grid gap-2">
                    <input name="projectId" type="hidden" value={project.id} />
                    <p className="text-sm font-semibold">Post task update</p>
                    <select className={nativeControlClassName()} name="taskId" required>
                      <option value="">Select task</option>
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
                    <Input name="progress" placeholder="Progress note" />
                    <Button type="submit" variant="outline">
                      <Activity className="size-4" />
                      Update status
                    </Button>
                  </form>

                  <Separator />

                  <form action={submitPullRequestAction} className="grid gap-2">
                    <input name="projectId" type="hidden" value={project.id} />
                    <p className="text-sm font-semibold">Link GitHub PR</p>
                    <select className={nativeControlClassName()} name="taskId" required>
                      <option value="">Select task</option>
                      {sprintTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="pullRequestUrl"
                      placeholder="https://github.com/.../pull/1"
                      required
                      type="url"
                    />
                    <Input name="branch" placeholder="story/us-1" />
                    <Button type="submit">
                      <GitBranch className="size-4" />
                      Link PR
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-950">
                    <ShieldCheck className="size-4" />
                    Human review gate
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    Approve or send a reviewed task back to rework.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <form action={reviewTaskAction} className="grid gap-2">
                    <input name="projectId" type="hidden" value={project.id} />
                    <input name="decision" type="hidden" value="approve" />
                    <select className={nativeControlClassName()} name="taskId" required>
                      <option value="">Select review task</option>
                      {reviewTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <Button disabled={reviewTasks.length === 0} type="submit">
                      <CheckCircle2 className="size-4" />
                      Approve
                    </Button>
                  </form>

                  <form action={reviewTaskAction} className="grid gap-2">
                    <input name="projectId" type="hidden" value={project.id} />
                    <input name="decision" type="hidden" value="reject" />
                    <select className={nativeControlClassName()} name="taskId" required>
                      <option value="">Select review task</option>
                      {reviewTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <Input name="feedback" placeholder="Feedback for rework" />
                    <Button
                      disabled={reviewTasks.length === 0}
                      type="submit"
                      variant="outline"
                    >
                      Reject
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card id="intake">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="size-4 text-slate-500" />
                    Create Sprint story
                  </CardTitle>
                  <CardDescription>
                    Add a story directly to the active Sprint.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createStoryTaskAction} className="grid gap-3">
                    <input name="projectId" type="hidden" value={project.id} />
                    <Input name="title" placeholder="US-X Short outcome" required />
                    <Textarea
                      name="userStory"
                      placeholder="As a..., I want..., so that..."
                      required
                    />
                    <Textarea
                      name="acceptanceCriteria"
                      placeholder="Given / When / Then"
                      required
                    />
                    <Button type="submit" variant="outline">
                      <Send className="size-4" />
                      Add to Sprint
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </aside>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" id="backlog">
            <section className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-5 py-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <ClipboardList className="size-5 text-slate-500" />
                  Product Backlog
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {epics.length} epics / {stories.length} Sprint stories
                </p>
              </div>
              <div className="grid gap-2 p-4">
                {epics.length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-8 text-sm text-slate-500">
                    No epics imported yet.
                  </p>
                ) : (
                  epics.map((epic) => (
                    <article className="rounded-md border bg-slate-50 p-3" key={epic.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{epic.title}</p>
                        <Badge variant="secondary">P{epic.priority}</Badge>
                      </div>
                      {epic.description ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {epic.description}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border bg-white shadow-sm" id="team">
              <div className="border-b px-5 py-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="size-5 text-slate-500" />
                  Team and agents
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Human owner and AI agents available to the Sprint.
                </p>
              </div>
              <div className="grid gap-2 p-4">
                {project.members.map((member) => (
                  <div
                    className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-3"
                    key={member.id}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {member.displayName ??
                          member.user.name ??
                          member.user.email ??
                          "Unnamed member"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.user.type === "ai"
                          ? "AI agent"
                          : (member.user.email ?? "Human member")}
                      </p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
            <form
              action={createAgentAction}
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
            >
              <input name="projectId" type="hidden" value={project.id} />
              <Input name="name" placeholder="Register AI agent, e.g. QA Agent 02" />
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
      </div>
    </main>
  );
}
