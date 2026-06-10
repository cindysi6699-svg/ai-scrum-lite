import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarDays,
  CircleDot,
  GitBranch,
  GitPullRequest,
  Kanban,
  Plus,
  Send,
  ShieldCheck,
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
import { requireUser } from "@/server/auth/session";
import {
  assignTaskAction,
  createAgentAction,
  createStoryTaskAction,
  reviewTaskAction,
  submitPullRequestAction,
  updateTaskStatusAction,
} from "@/server/actions/tasks";
import { getProjectForUser } from "@/server/queries/projects";

const boardColumns = [
  { status: "todo", title: "To Do", tone: "bg-slate-100 text-slate-700" },
  {
    status: "in_progress",
    title: "Agent Executing",
    tone: "bg-blue-50 text-blue-700",
  },
  { status: "blocked", title: "Blocked", tone: "bg-rose-50 text-rose-700" },
  { status: "review", title: "Human Review", tone: "bg-amber-50 text-amber-800" },
  { status: "accepted", title: "Accepted", tone: "bg-emerald-50 text-emerald-700" },
] as const;

const manualStatuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const;

function nativeControlClassName() {
  return "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
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

  const stats = [
    {
      label: "Sprint tasks",
      value: sprintTasks.length,
      icon: Kanban,
    },
    {
      label: "Open work",
      value: openTasks,
      icon: CircleDot,
    },
    {
      label: "Human review",
      value: reviewTasks.length,
      icon: ShieldCheck,
    },
    {
      label: "AI agents",
      value: aiAgents.length,
      icon: Bot,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-[1500px] gap-6 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r pr-4 lg:block">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            href="/dashboard"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-normal">{project.name}</h1>
            <Badge className="mt-3" variant="secondary">
              {project.status}
            </Badge>
          </div>

          <nav className="mt-8 grid gap-1 text-sm">
            <a className="rounded-lg bg-muted px-3 py-2 font-medium" href="#board">
              Sprint board
            </a>
            <a
              className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="#backlog"
            >
              Backlog
            </a>
            <a
              className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="#intake"
            >
              Intake
            </a>
            <a
              className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="#team"
            >
              Team
            </a>
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground lg:hidden"
                href="/dashboard"
              >
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0">
                <Badge variant="outline">AI/OPC Delivery</Badge>
                <Badge variant="secondary">{currentMember?.role ?? "member"}</Badge>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">
                {project.name}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                {project.goal ??
                  "No project goal recorded yet. Add one before assigning AI agents."}
              </p>
            </div>

            <Card className="w-full lg:w-80" size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Current Sprint
                </CardTitle>
                <CardDescription>
                  {latestSprint?.name ?? "No active sprint"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-5 text-muted-foreground">
                  {latestSprint?.goal ?? "Create an active Sprint to begin delivery."}
                </p>
              </CardContent>
            </Card>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card key={stat.label} size="sm">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-semibold tracking-normal">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="min-w-0" id="board">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Kanban className="size-5 text-muted-foreground" />
                  Sprint board
                </CardTitle>
                <CardDescription>
                  The Sprint Backlog is visualized here as one working board.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="grid min-w-[1180px] gap-3 xl:min-w-0 xl:grid-cols-5">
                  {boardColumns.map((column) => {
                    const columnTasks = sprintTasks.filter(
                      (task) => task.status === column.status,
                    );

                    return (
                      <div
                        className="rounded-xl border bg-muted/30 p-3"
                        key={column.status}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${column.tone.split(" ")[0]}`}
                            />
                            <h3 className="text-sm font-semibold tracking-normal">
                              {column.title}
                            </h3>
                          </div>
                          <Badge variant="outline">{columnTasks.length}</Badge>
                        </div>

                        <div className="mt-3 grid gap-3">
                          {columnTasks.length === 0 ? (
                            <div className="rounded-lg border border-dashed bg-background px-3 py-8 text-center text-xs text-muted-foreground">
                              Empty
                            </div>
                          ) : (
                            columnTasks.map((task) => (
                              <article
                                className="rounded-xl border bg-card p-3 shadow-xs"
                                key={task.id}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-medium leading-5">
                                    {task.title}
                                  </p>
                                  <Badge variant="secondary">{task.priority}</Badge>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                  {task.backlogItem?.title ?? "No linked story"}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="outline">
                                    <Bot className="size-3" />
                                    {task.assignee?.name ?? "Unassigned"}
                                  </Badge>
                                  {task.githubRefs[0]?.pullRequestUrl ? (
                                    <Badge
                                      render={
                                        <a
                                          href={task.githubRefs[0].pullRequestUrl}
                                          rel="noreferrer"
                                          target="_blank"
                                        />
                                      }
                                      variant="outline"
                                    >
                                      <GitPullRequest className="size-3" />
                                      PR
                                    </Badge>
                                  ) : null}
                                </div>

                                {task.updates[0] ? (
                                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
                                    {task.updates[0].progress}
                                  </p>
                                ) : null}

                                <Separator className="my-3" />

                                <div className="grid gap-2">
                                  <form action={assignTaskAction} className="grid gap-2">
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
                                      <option value="" disabled>
                                        Assign AI agent
                                      </option>
                                      {aiAgents.map((agent) => (
                                        <option key={agent.userId} value={agent.userId}>
                                          {agent.displayName ??
                                            agent.user.name ??
                                            "AI agent"}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      disabled={aiAgents.length === 0}
                                      size="sm"
                                      type="submit"
                                      variant="outline"
                                    >
                                      <Bot className="size-3" />
                                      Assign
                                    </Button>
                                  </form>

                                  <form
                                    action={updateTaskStatusAction}
                                    className="grid gap-2"
                                  >
                                    <input
                                      name="projectId"
                                      type="hidden"
                                      value={project.id}
                                    />
                                    <input name="taskId" type="hidden" value={task.id} />
                                    <select
                                      className={nativeControlClassName()}
                                      defaultValue={
                                        task.status === "accepted" ? "done" : task.status
                                      }
                                      name="status"
                                    >
                                      {manualStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                          {status.label}
                                        </option>
                                      ))}
                                    </select>
                                    <Input name="progress" placeholder="Progress note" />
                                    <Button size="sm" type="submit" variant="outline">
                                      <Activity className="size-3" />
                                      Update
                                    </Button>
                                  </form>

                                  <form
                                    action={submitPullRequestAction}
                                    className="grid gap-2"
                                  >
                                    <input
                                      name="projectId"
                                      type="hidden"
                                      value={project.id}
                                    />
                                    <input name="taskId" type="hidden" value={task.id} />
                                    <Input
                                      name="pullRequestUrl"
                                      placeholder="https://github.com/.../pull/1"
                                      required
                                      type="url"
                                    />
                                    <Input name="branch" placeholder="story/us-1" />
                                    <Button size="sm" type="submit">
                                      <GitBranch className="size-3" />
                                      Link PR
                                    </Button>
                                  </form>

                                  {task.status === "review" ? (
                                    <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2">
                                      <form
                                        action={reviewTaskAction}
                                        className="grid gap-2"
                                      >
                                        <input
                                          name="projectId"
                                          type="hidden"
                                          value={project.id}
                                        />
                                        <input
                                          name="taskId"
                                          type="hidden"
                                          value={task.id}
                                        />
                                        <input
                                          name="decision"
                                          type="hidden"
                                          value="approve"
                                        />
                                        <Button size="sm" type="submit">
                                          <ShieldCheck className="size-3" />
                                          Approve
                                        </Button>
                                      </form>
                                      <form
                                        action={reviewTaskAction}
                                        className="grid gap-2"
                                      >
                                        <input
                                          name="projectId"
                                          type="hidden"
                                          value={project.id}
                                        />
                                        <input
                                          name="taskId"
                                          type="hidden"
                                          value={task.id}
                                        />
                                        <input
                                          name="decision"
                                          type="hidden"
                                          value="reject"
                                        />
                                        <Input
                                          name="feedback"
                                          placeholder="Feedback for rework"
                                        />
                                        <Button
                                          size="sm"
                                          type="submit"
                                          variant="outline"
                                        >
                                          Reject
                                        </Button>
                                      </form>
                                    </div>
                                  ) : null}
                                </div>
                              </article>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid content-start gap-5">
              <Card id="intake">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="size-4 text-muted-foreground" />
                    Create Sprint story
                  </CardTitle>
                  <CardDescription>Add a story directly to the active Sprint.</CardDescription>
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
                    <Button type="submit">
                      <Send className="size-4" />
                      Add to Sprint
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card id="settings">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="size-4 text-muted-foreground" />
                    Register AI agent
                  </CardTitle>
                  <CardDescription>Agents are treated as online in Sprint 1.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createAgentAction} className="grid gap-3">
                    <input name="projectId" type="hidden" value={project.id} />
                    <Input name="name" placeholder="Dev Agent 01" required />
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
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" id="backlog">
            <Card>
              <CardHeader>
                <CardTitle>Product Backlog</CardTitle>
                <CardDescription>
                  {epics.length} epics / {stories.length} Sprint stories
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {epics.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    No epics imported yet.
                  </p>
                ) : (
                  epics.map((epic) => (
                    <div className="rounded-lg border bg-muted/30 p-3" key={epic.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{epic.title}</p>
                        <Badge variant="secondary">{epic.priority}</Badge>
                      </div>
                      {epic.description ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {epic.description}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card id="team">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  Team and agents
                </CardTitle>
                <CardDescription>
                  Human owner and AI agents available to the Sprint.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {project.members.map((member) => (
                  <div
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                    key={member.id}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {member.displayName ??
                          member.user.name ??
                          member.user.email ??
                          "Unnamed member"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.user.type === "ai"
                          ? "AI agent"
                          : (member.user.email ?? "Human member")}
                      </p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </section>
      </section>
    </main>
  );
}
