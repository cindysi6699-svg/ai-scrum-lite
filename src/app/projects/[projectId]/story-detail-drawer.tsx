"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Bot,
  Check,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

export type StoryDetailTask = {
  id: string;
  ref: string;
  title: string;
  userStory: string | null;
  acceptanceCriteria: string | null;
  priority: string;
  status: string;
  assigneeName: string | null;
  updates: Array<{
    id: string;
    actorName: string | null;
    previousStatus: string | null;
    newStatus: string | null;
    progress: string;
    createdAt: string;
  }>;
  githubRefs: Array<{
    id: string;
    branch: string | null;
    pullRequestUrl: string | null;
    checksStatus: string | null;
    note: string | null;
    createdAt: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    decision: string;
    reason: string | null;
    madeByName: string | null;
    createdAt: string;
  }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "accepted" || status === "done") {
    return "bg-emerald-100 text-[#047857]";
  }

  if (status === "review") {
    return "bg-amber-100 text-[#b45309]";
  }

  if (status === "blocked") {
    return "bg-rose-100 text-[#be123c]";
  }

  if (status === "in_progress") {
    return "bg-[#eef2ff] text-[#3a5bd0]";
  }

  return "bg-zinc-100 text-[#71717a]";
}

export function StoryDetailDrawer({
  closeHref,
  task,
}: {
  closeHref: string;
  task: StoryDetailTask | null;
}) {
  const router = useRouter();

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && task) {
          router.push(closeHref, { scroll: false });
        }
      }}
      open={Boolean(task)}
    >
      <DialogPortal>
        <DialogOverlay />
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
          <DialogPrimitive.Popup
            className="pointer-events-auto flex h-[100dvh] w-full max-w-[560px] flex-col border-l border-[#e4e4e7] bg-white shadow-2xl"
            data-slot="story-detail-drawer"
          >
            {task ? (
              <>
                <header className="shrink-0 border-b border-[#e4e4e7] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef2ff] text-[#4f7cff]">
                      <GitPullRequest className="size-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-[#a1a1aa]">
                          {task.ref}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${statusTone(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-[#71717a]">
                          {task.priority}
                        </span>
                      </div>
                      <DialogTitle className="mt-1 text-base leading-snug">
                        {task.title}
                      </DialogTitle>
                    </div>
                    <DialogClose className="grid h-8 w-8 place-items-center rounded-md text-[#a1a1aa] hover:bg-[#fafafa]">
                      <X className="size-4" strokeWidth={2} />
                      <span className="sr-only">关闭</span>
                    </DialogClose>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <section className="mb-4 rounded-xl border border-[#e4e4e7] bg-[#fafafa] p-3">
                    <p className="mb-1 text-xs font-semibold text-[#71717a]">
                      用户故事
                    </p>
                    <p className="text-sm leading-6 text-[#3f3f46]">
                      {task.userStory || "未填写用户故事。"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#71717a]">
                      <Bot className="size-3.5" strokeWidth={2} />
                      负责人 {task.assigneeName ?? "未指派"}
                    </div>
                  </section>

                  <section className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                      验收标准
                    </h3>
                    <ul className="space-y-1.5">
                      {(task.acceptanceCriteria ?? "")
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <li className="flex items-start gap-2 text-sm text-[#3f3f46]" key={line}>
                            <span className="mt-0.5 grid h-4 w-4 place-items-center rounded bg-emerald-100 text-emerald-600">
                              <Check className="size-3" strokeWidth={2} />
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                    </ul>
                  </section>

                  <section className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                      状态历史
                    </h3>
                    <ol className="relative space-y-3 border-l border-[#e4e4e7] pl-4">
                      {task.updates.length === 0 ? (
                        <li className="text-sm text-[#a1a1aa]">暂无状态记录。</li>
                      ) : (
                        task.updates.map((update) => (
                          <li className="text-sm" key={update.id}>
                            <span className="absolute -left-[5px] mt-1 h-2 w-2 rounded-full bg-[#4f7cff]" />
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#18181b]">
                                {update.actorName ?? "Agent"}
                              </span>
                              <span className="font-mono text-[10px] text-[#a1a1aa]">
                                {formatDateTime(update.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[#71717a]">
                              {update.previousStatus ? `${update.previousStatus} → ` : ""}
                              {update.newStatus ?? "update"} · {update.progress}
                            </p>
                          </li>
                        ))
                      )}
                    </ol>
                  </section>

                  <section className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                      关联 PR
                    </h3>
                    <div className="space-y-2">
                      {task.githubRefs.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[#e4e4e7] px-3 py-2 text-sm text-[#a1a1aa]">
                          暂无 PR 记录。
                        </p>
                      ) : (
                        task.githubRefs.map((ref) => (
                          <a
                            className="flex items-center gap-2 rounded-lg border border-[#e4e4e7] px-3 py-2 text-sm text-[#3f3f46] hover:border-[#4f7cff]"
                            href={ref.pullRequestUrl ?? "#"}
                            key={ref.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <GitBranch className="size-4 text-[#71717a]" strokeWidth={2} />
                            <span className="min-w-0 flex-1 truncate font-mono text-xs">
                              {ref.branch ?? ref.pullRequestUrl ?? "PR"}
                            </span>
                            <span className="text-xs text-[#047857]">
                              {ref.checksStatus ?? "linked"}
                            </span>
                            <ExternalLink className="size-3.5 text-[#a1a1aa]" strokeWidth={2} />
                          </a>
                        ))
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
                      审批记录
                    </h3>
                    <div className="space-y-2">
                      {task.decisions.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[#e4e4e7] px-3 py-2 text-sm text-[#a1a1aa]">
                          暂无人工审批记录。
                        </p>
                      ) : (
                        task.decisions.map((decision) => (
                          <div className="rounded-lg border border-[#e4e4e7] px-3 py-2" key={decision.id}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-[#18181b]">
                                {decision.title}
                              </p>
                              <span className="font-mono text-[10px] text-[#a1a1aa]">
                                {formatDateTime(decision.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[#71717a]">
                              {decision.decision}
                            </p>
                            {decision.reason ? (
                              <p className="mt-1 text-xs text-[#be123c]">
                                {decision.reason}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </>
            ) : null}
          </DialogPrimitive.Popup>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
