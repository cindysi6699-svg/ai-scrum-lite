import { AlertCircle, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

import { requireUser } from "@/server/auth/session";
import { getProjectsForUser } from "@/server/queries/projects";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const projects = await getProjectsForUser(user.id);
  const params = await searchParams;
  const justCreated = Boolean(params?.created);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-6 text-slate-950">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">AI Scrum Lite</p>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/projects/new"
            >
              <Plus className="size-4" />
              New Project
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              href="/api/auth/signout"
            >
              Sign out
            </Link>
          </div>
        </header>

        {justCreated ? (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Project created. You are the Owner for this project.
          </div>
        ) : null}

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">GitHub sign-in verified</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">
                Welcome, {user.name ?? user.email ?? "GitHub user"}.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Create a project workspace to start managing backlog, roles, Sprint
                progress, blockers, decisions, and GitHub traces.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-950">{projects.length}</span>{" "}
              project{projects.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <section className="mt-6">
          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <FolderKanban className="size-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-normal">
                No projects yet
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Start with one AI/OPC delivery project. The creator is automatically
                assigned as Owner, and later we will add AI agents and collaborators.
              </p>
              <Link
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/projects/new"
              >
                <Plus className="size-4" />
                Create first project
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const activeSprint = project.sprints[0];

                return (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    key={project.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold tracking-normal">
                            {project.name}
                          </h3>
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {project.status}
                          </span>
                        </div>
                        {project.goal ? (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {project.goal}
                          </p>
                        ) : (
                          <p className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                            <AlertCircle className="size-4" />
                            No project goal recorded yet.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Updated {formatDate(project.updatedAt)}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Active Sprint: {activeSprint?.name ?? "None"}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Repo: {project.repoUrl ? "Linked" : "Not linked"}
                          </span>
                        </div>
                      </div>

                      <div className="grid min-w-full grid-cols-3 gap-3 text-center sm:min-w-[360px]">
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-lg font-semibold">{project._count.tasks}</p>
                          <p className="text-xs text-slate-500">Tasks</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-lg font-semibold">{project._count.backlog}</p>
                          <p className="text-xs text-slate-500">Backlog</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-lg font-semibold">{project._count.blockers}</p>
                          <p className="text-xs text-slate-500">Blockers</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="size-4" />
                        {project.members.length} member
                        {project.members.length === 1 ? "" : "s"}
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        Project workspace coming next
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
