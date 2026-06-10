import {
  Bot,
  ChevronDown,
  Circle,
  LockKeyhole,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";

import { requireUser } from "@/server/auth/session";
import { getProjectsForUser } from "@/server/queries/projects";

function repoSlug(repoUrl: string | null) {
  if (!repoUrl) {
    return "acme/not-linked";
  }

  return repoUrl
    .replace("https://github.com/", "")
    .replace(".git", "")
    .toLowerCase();
}

function progressWidth(done: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.min(100, Math.round((done / total) * 100))}%`;
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
  const activeProjects = projects.filter((project) => project.status === "active");
  const reviewItems = projects.flatMap((project) =>
    (project.sprints[0]?.tasks ?? []).map((task) => ({
      project,
      task,
    })),
  );
  const agentCount = projects.reduce(
    (sum, project) =>
      sum + project.members.filter((member) => member.role !== "owner").length,
    0,
  );
  const blockerCount = projects.reduce(
    (sum, project) => sum + project._count.blockers,
    0,
  );
  const mergedCount = projects.reduce(
    (sum, project) =>
      sum + Math.max(0, project._count.tasks - project._count.blockers),
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
          <button className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#71717a] hover:bg-[#fafafa]">
            <span className="text-[#3f3f46]">Acme Labs</span>
            <ChevronDown className="size-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-2.5 py-1.5 text-xs text-[#71717a] md:flex">
            <Search className="size-3.5" strokeWidth={2} />
            搜索…
          </div>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-zinc-200 text-xs font-medium text-[#3f3f46]">
            {user.name?.slice(0, 1).toUpperCase() ?? "Y"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-4 py-6">
        {justCreated ? (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Project created. You are the Owner for this project.
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#18181b]">
              下午好,{user.name ?? "You"} 👋
            </h1>
            <p className="mt-0.5 text-sm text-[#71717a]">
              {activeProjects.length} 个项目正在跑 · {reviewItems.length} 项产物在等你验收
            </p>
          </div>
          <Link
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#4f7cff] px-3 py-2 text-sm font-medium text-white transition active:scale-[.98]"
            href="/projects/new"
          >
            <Plus className="size-4" strokeWidth={2} />
            新建项目
          </Link>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4">
            <p className="text-xs text-[#71717a]">活跃项目</p>
            <p className="mt-1 text-2xl font-semibold text-[#18181b]">
              {activeProjects.length}
            </p>
            <p className="mt-1 text-[11px] text-[#a1a1aa]">1 个处于规划</p>
          </div>

          <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4">
            <p className="text-xs text-[#71717a]">运行中 Agent</p>
            <p className="mt-1 text-2xl font-semibold text-[#18181b]">
              {agentCount}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#be123c]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {blockerCount || 1} 异常需处理
            </p>
          </div>

          <div className="shadow-card rounded-xl border border-amber-300 bg-amber-50/60 p-4">
            <p className="text-xs text-[#b45309]">待你验收</p>
            <p className="mt-1 text-2xl font-semibold text-[#b45309]">
              {reviewItems.length}
            </p>
            <p className="mt-1 text-[11px] text-amber-600">
              push 已锁 · 等你决定
            </p>
          </div>

          <div className="shadow-card rounded-xl border border-[#e4e4e7] bg-white p-4">
            <p className="text-xs text-[#71717a]">本周已合并</p>
            <p className="mt-1 text-2xl font-semibold text-[#18181b]">
              {mergedCount}
            </p>
            <p className="mt-1 text-[11px] text-[#047857]">通过率 73%</p>
          </div>
        </section>

        <section className="shadow-card mb-6 overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#18181b]">
              <LockKeyhole className="size-4 text-amber-500" strokeWidth={2} />
              需要你验收
              <span className="rounded-full bg-amber-100 px-1.5 text-xs text-[#b45309]">
                {reviewItems.length}
              </span>
            </h2>
            <button className="text-xs text-[#3a5bd0] hover:underline">
              全部查看
            </button>
          </div>

          <div className="divide-y divide-[#e4e4e7]">
            {reviewItems.length === 0 ? (
              <div className="px-4 py-8 text-sm text-[#a1a1aa]">
                暂无待验收项。Agent 提交 PR 后会出现在这里。
              </div>
            ) : (
              reviewItems.slice(0, 3).map(({ project, task }, index) => (
                <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#fafafa]"
                  href={`/projects/${project.id}`}
                  key={task.id}
                >
                  <span className="w-16 font-mono text-[11px] text-[#a1a1aa]">
                    PR #{task.githubRefs[0]?.pullRequestUrl?.split("/").pop() ?? index + 1}
                  </span>
                  <span className="rounded bg-[#fafafa] px-1.5 py-0.5 text-[11px] text-[#71717a]">
                    {project.name}
                  </span>
                  <span className="flex-1 truncate text-[#3f3f46]">
                    {task.title}
                  </span>
                  <span className="hidden items-center gap-1 text-[11px] text-[#047857] sm:flex">
                    ✓ ready
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#71717a]">
                    <span className="grid h-4 w-4 place-items-center rounded bg-emerald-100 text-emerald-600">
                      <Bot className="size-2.5" strokeWidth={2} />
                    </span>
                    {task.assignee?.name ?? "agent"}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                      index === 0
                        ? "bg-[#4f7cff] text-white"
                        : "border border-[#e4e4e7] text-[#3f3f46]"
                    }`}
                  >
                    去验收
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#18181b]">项目</h2>
          <div className="flex items-center gap-1 text-xs text-[#a1a1aa]">
            <button className="rounded px-2 py-1 text-[#3f3f46]">全部</button>
            <button className="rounded px-2 py-1 hover:text-[#3f3f46]">活跃</button>
            <button className="rounded px-2 py-1 hover:text-[#3f3f46]">归档</button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const activeSprint = project.sprints[0];
            const reviewCount = activeSprint?.tasks.length ?? 0;
            const done = Math.max(0, project._count.tasks - reviewCount);
            const progress = progressWidth(done, Math.max(project._count.tasks, 1));
            const isRisky = project._count.blockers > 0;
            const initial = project.name.slice(0, 1).toUpperCase();

            return (
              <Link
                className="shadow-card block rounded-xl border border-[#e4e4e7] bg-white p-4 transition hover:-translate-y-px hover:shadow-lg"
                href={`/projects/${project.id}`}
                key={project.id}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg font-semibold ${
                        index % 3 === 0
                          ? "bg-[#eef2ff] text-[#3a5bd0]"
                          : index % 3 === 1
                            ? "bg-zinc-100 text-[#3f3f46]"
                            : "bg-emerald-50 text-[#047857]"
                      }`}
                    >
                      {initial}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#18181b]">
                        {project.name}
                      </p>
                      <p className="font-mono text-[11px] text-[#a1a1aa]">
                        {repoSlug(project.repoUrl)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isRisky
                        ? "bg-amber-50 text-[#b45309]"
                        : "bg-emerald-50 text-[#047857]"
                    }`}
                  >
                    {isRisky ? "有风险" : "如期"}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717a]">
                    <span>{activeSprint?.name ?? "Sprint 1"} · D3/7</span>
                    <span>
                      {done}/{project._count.tasks || 1} pts
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${
                        isRisky ? "bg-amber-500" : "bg-[#4f7cff]"
                      }`}
                      style={{ width: progress }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#e4e4e7] pt-3 text-[11px]">
                  <div className="flex items-center gap-2 text-[#71717a]">
                    <span className="flex items-center gap-1">
                      <Circle className="size-1.5 fill-[#4f7cff] text-[#4f7cff]" />
                      {activeSprint?.tasks.length ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Circle className="size-1.5 fill-[#a1a1aa] text-[#a1a1aa]" />
                      {project.members.length}
                    </span>
                    <span className="flex items-center gap-1 text-[#be123c]">
                      <Circle className="size-1.5 fill-rose-500 text-rose-500" />
                      {project._count.blockers}
                    </span>
                    <span className="text-[#a1a1aa]">agent</span>
                  </div>
                  <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[#b45309]">
                    <LockKeyhole className="size-2.5" strokeWidth={2} />
                    {reviewCount} 待验收
                  </span>
                </div>
              </Link>
            );
          })}

          <Link
            className="flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e4e4e7] bg-[#fafafa] text-[#a1a1aa] transition hover:border-[#4f7cff] hover:text-[#3a5bd0]"
            href="/projects/new"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-current">
              <Plus className="size-4.5" strokeWidth={2} />
            </span>
            <span className="text-sm">新建项目</span>
          </Link>
        </section>
      </section>
    </main>
  );
}
