import { ArrowLeft, FolderPlus } from "lucide-react";
import Link from "next/link";

import { createProjectAction } from "@/server/actions/projects";
import { requireUser } from "@/server/auth/session";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-6 text-slate-950">
      <section className="mx-auto w-full max-w-3xl">
        <header className="border-b border-slate-200 pb-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            href="/dashboard"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <div className="mt-5 flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
              <FolderPlus className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Project setup</p>
              <h1 className="text-3xl font-semibold tracking-normal">Create project</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Create the project workspace that will hold Backlog, Sprint Board,
                roles, updates, blockers, decisions, and GitHub references.
              </p>
            </div>
          </div>
        </header>

        <form
          action={createProjectAction}
          className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Project name</span>
              <input
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                name="name"
                placeholder="AI Scrum Lite"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Description</span>
              <textarea
                className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                name="description"
                placeholder="A lightweight Scrum tool for AI/OPC delivery projects."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Project goal</span>
              <textarea
                className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                name="goal"
                placeholder="Run Sprint execution with traceable AI agent updates, blockers, decisions, and acceptance."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                GitHub repo URL
              </span>
              <input
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                name="repoUrl"
                placeholder="https://github.com/org/repo"
                type="url"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <Link
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              href="/dashboard"
            >
              Cancel
            </Link>
            <button
              className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Create project
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
