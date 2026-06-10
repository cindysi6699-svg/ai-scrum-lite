import {
  AlertTriangle,
  Check,
  ChevronDown,
  Circle,
  FolderKanban,
  LockKeyhole,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
    (sum, project) => sum + project.members.filter((member) => member.role !== "owner").length,
    0,
  );
  const blockerCount = projects.reduce(
    (sum, project) => sum + project._count.blockers,
    0,
  );
  const mergedCount = projects.reduce(
    (sum, project) => sum + Math.max(0, project._count.tasks - project._count.blockers),
    0,
  );

  return (
    <main className="min-h-screen bg-[#f6f6f7] text-[#202126]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <Link
              className="flex size-10 items-center justify-center rounded-lg bg-[#4f7cff] text-white shadow-sm"
              href="/dashboard"
            >
              <Shield className="size-5" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Helmsman</span>
              <button className="inline-flex items-center gap-1 text-sm text-slate-500">
                Acme Labs
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-10 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400 md:flex">
            <Search className="size-4" />
            搜索...
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-5 py-10">
        {justCreated ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Project created. You are the Owner for this project.
          </div>
        ) : null}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              下午好, {user.name ?? user.email ?? "You"} 👋
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {activeProjects.length} 个项目正在跑 · {reviewItems.length} 项产物在等你验收
            </p>
          </div>
          <Link
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#4f7cff] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#416df1]"
            href="/projects/new"
          >
            <Plus className="size-5" />
            新建项目
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["活跃项目", activeProjects.length, "1 个处于规划", "text-slate-400", false],
            ["运行中 Agent", agentCount, blockerCount ? `• ${blockerCount} 异常需处理` : "全部在线", "text-rose-500", false],
            ["待你验收", reviewItems.length, "push 已锁 · 等你决定", "text-orange-600", true],
            ["本周已合并", mergedCount, "通过率 73%", "text-emerald-600", false],
          ].map(([label, value, helper, tone, active]) => (
            <div
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                active ? "border-amber-300 bg-[#fffdf3]" : "border-slate-200"
              }`}
              key={label as string}
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-semibold tracking-normal">
                {value as number}
              </p>
              <p className={`mt-3 text-sm font-medium ${tone as string}`}>
                {helper as string}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <LockKeyhole className="size-5 text-amber-500" />
              <h2 className="text-lg font-semibold">需要你验收</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                {reviewItems.length}
              </span>
            </div>
            <span className="text-sm font-semibold text-[#4f7cff]">全部查看</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reviewItems.length === 0 ? (
              <div className="px-5 py-10 text-sm text-slate-400">
                暂无待验收项。Agent 提交 PR 后会出现在这里。
              </div>
            ) : (
              reviewItems.slice(0, 3).map(({ project, task }, index) => (
                <div
                  className="grid items-center gap-3 px-5 py-4 text-sm md:grid-cols-[80px_110px_1fr_100px_120px_80px]"
                  key={task.id}
                >
                  <span className="font-medium text-slate-400">
                    PR #{task.githubRefs[0]?.pullRequestUrl?.split("/").pop() ?? index + 1}
                  </span>
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-slate-500">
                    {project.name}
                  </span>
                  <span className="text-base font-medium">{task.title}</span>
                  <span className="font-semibold text-emerald-600">✓ ready</span>
                  <span className="text-slate-500">
                    {task.assignee?.name ?? "agent"}
                  </span>
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md bg-[#4f7cff] px-3 text-sm font-semibold text-white transition hover:bg-[#416df1]"
                    href={`/projects/${project.id}`}
                  >
                    去验收
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">项目</h2>
            <div className="flex gap-6 text-sm text-slate-500">
              <span className="text-slate-900">全部</span>
              <span>活跃</span>
              <span>归档</span>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FolderKanban className="size-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">No projects yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Start with one AI/OPC delivery project. The creator is automatically
                assigned as Owner.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {projects.map((project, index) => {
                const activeSprint = project.sprints[0];
                const reviewCount = activeSprint?.tasks.length ?? 0;
                const done = Math.max(0, project._count.tasks - reviewCount);
                const progress = progressWidth(done, Math.max(project._count.tasks, 1));

                return (
                  <Link
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    href={`/projects/${project.id}`}
                    key={project.id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-11 items-center justify-center rounded-lg text-lg font-semibold ${
                            index % 3 === 0
                              ? "bg-blue-50 text-[#4f7cff]"
                              : index % 3 === 1
                                ? "bg-slate-100 text-slate-600"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {project.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{project.name}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {repoSlug(project.repoUrl)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700">如期</Badge>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                      <span>{activeSprint?.name ?? "Sprint 1"} · D3/7</span>
                      <span>
                        {done}/{project._count.tasks || 1} pts
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#4f7cff]"
                        style={{ width: progress }}
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Circle className="size-2 fill-[#4f7cff] text-[#4f7cff]" />
                          {activeSprint?.tasks.length ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Circle className="size-2 fill-slate-400 text-slate-400" />
                          {project._count.blockers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Circle className="size-2 fill-rose-500 text-rose-500" />
                          {blockerCount}
                        </span>
                        <span>agent</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                          reviewCount
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        <LockKeyhole className="size-3.5" />
                        {reviewCount} 待验收
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-3">
            {blockerCount ? (
              <AlertTriangle className="mt-0.5 size-5 text-rose-500" />
            ) : (
              <Check className="mt-0.5 size-5 text-emerald-500" />
            )}
            <div>
              <p className="font-semibold">
                {blockerCount ? "有阻塞需要处理" : "当前交付状态稳定"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Dashboard 已按验收闸门优先展示，适合每天早上先扫一遍。
              </p>
            </div>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/api/auth/signout"
          >
            Sign out
          </Link>
        </section>
      </section>
    </main>
  );
}

function progressWidth(done: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.min(100, Math.round((done / total) * 100))}%`;
}
