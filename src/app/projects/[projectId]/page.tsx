import {
  ArrowLeft,
  BookOpen,
  Bug,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GitPullRequest,
  Kanban,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/server/auth/session";
import { getProjectForUser } from "@/server/queries/projects";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const workspaceLinks = [
  {
    title: "Backlog",
    description: "Turn product ideas into user stories and acceptance criteria.",
    href: "#backlog",
    icon: BookOpen,
  },
  {
    title: "Sprint Board",
    description: "Track Todo, In Progress, Blocked, Review, Done, and Accepted.",
    href: "#sprint-board",
    icon: Kanban,
  },
  {
    title: "Settings",
    description: "Manage repo URL, members, roles, and AI agents.",
    href: "#settings",
    icon: Settings,
  },
];

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

  const stats = [
    {
      label: "Backlog",
      value: project._count.backlog,
      icon: ClipboardList,
    },
    {
      label: "Sprints",
      value: project._count.sprints,
      icon: CalendarDays,
    },
    {
      label: "Tasks",
      value: project._count.tasks,
      icon: CheckCircle2,
    },
    {
      label: "Open blockers",
      value: project._count.blockers,
      icon: Bug,
    },
    {
      label: "Decisions",
      value: project._count.decisions,
      icon: ClipboardList,
    },
    {
      label: "GitHub refs",
      value: project._count.githubRefs,
      icon: GitPullRequest,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-6 text-slate-950">
      <section className="mx-auto w-full max-w-6xl">
        <header className="border-b border-slate-200 pb-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            href="/dashboard"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-500">Project Workspace</p>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {project.status}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                {project.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {project.description ??
                  "This project is ready for backlog, sprint planning, role setup, and agent updates."}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:min-w-72">
              <p className="text-sm font-semibold text-slate-950">Your role</p>
              <p className="mt-2 inline-flex rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white">
                {currentMember?.role ?? "member"}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Owner can accept tasks and manage project settings. More role controls
                arrive in the next workflow.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Project goal</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {project.goal ??
                "No goal recorded yet. Add one in project settings so agents can align Sprint decisions to the same outcome."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-md bg-slate-100 px-2 py-1">
                Created {formatDate(project.createdAt)}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1">
                Updated {formatDate(project.updatedAt)}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1">
                Latest Sprint: {latestSprint?.name ?? "None"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">GitHub repo</p>
            {project.repoUrl ? (
              <a
                className="mt-3 block break-all text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                href={project.repoUrl}
                rel="noreferrer"
                target="_blank"
              >
                {project.repoUrl}
              </a>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                No repository linked yet. GitHub refs can still be added manually
                once tasks exist.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={stat.label}
              >
                <div className="flex items-center justify-between text-slate-500">
                  <Icon className="size-4" />
                </div>
                <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {workspaceLinks.map((item) => {
            const Icon = item.icon;

            return (
              <a
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                href={item.href}
                key={item.title}
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-normal">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Coming next
                </p>
              </a>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Product Backlog</p>
                <h2 className="text-lg font-semibold tracking-normal">
                  Epics and Sprint stories
                </h2>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {epics.length} epics / {stories.length} stories
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {epics.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No epics imported yet.
                </p>
              ) : (
                epics.map((epic) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                    key={epic.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{epic.title}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {epic.priority}
                      </span>
                    </div>
                    {epic.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                        {epic.description}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {latestSprint?.name ?? "No active sprint"}
                </p>
                <h2 className="text-lg font-semibold tracking-normal">Sprint tasks</h2>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {sprintTasks.length} tasks
              </span>
            </div>

            {latestSprint?.goal ? (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                {latestSprint.goal}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              {sprintTasks.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No Sprint tasks yet.
                </p>
              ) : (
                sprintTasks.map((task) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                    key={task.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {task.backlogItem?.title ?? "No linked story"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          {task.priority}
                        </span>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-slate-500" />
            <h2 className="text-lg font-semibold tracking-normal">Members</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {project.members.map((member) => (
              <div
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                key={member.id}
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">
                    {member.displayName ??
                      member.user.name ??
                      member.user.email ??
                      "Unnamed member"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {member.user.email ?? "No email available"}
                  </p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
