import { CheckCircle2, GitBranch, Kanban, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";

const modules = [
  "Project & role setup",
  "Product backlog",
  "Sprint board",
  "Task updates",
  "Blockers",
  "Decision log",
  "GitHub trace",
  "Sprint summary",
];

const nextSteps = [
  "Sign in with GitHub",
  "Create the first project",
  "Add Owner, Dev Agent, QA Agent roles",
  "Create Sprint 1 and seed the backlog",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">AI/OPC Delivery</p>
            <h1 className="text-2xl font-semibold tracking-normal">AI Scrum Lite</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/api/auth/signin"
          >
            <LockKeyhole className="size-4" />
            Sign in
          </Link>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="size-4" />
              Local app and database schema are ready
            </div>

            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Lightweight Scrum control center for AI project delivery.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Manage backlog, sprint progress, blockers, decisions, and GitHub traces
              in one structured workflow built for human owners and AI agents.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/api/auth/signin"
              >
                <Sparkles className="size-4" />
                Start with GitHub
              </Link>
              <a
                className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                href="https://github.com/cindysi6699-svg/ai-scrum-lite"
                rel="noreferrer"
                target="_blank"
              >
                <GitBranch className="size-4" />
                View repository
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm text-slate-500">MVP scope</p>
                <h3 className="text-lg font-semibold">Scrum delivery loop</h3>
              </div>
              <Kanban className="size-5 text-slate-500" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {modules.map((module) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"
                  key={module}
                >
                  {module}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Next workflow</p>
              <ol className="mt-3 space-y-2 text-sm text-amber-950">
                {nextSteps.map((step, index) => (
                  <li className="flex gap-2" key={step}>
                    <span className="font-semibold">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
