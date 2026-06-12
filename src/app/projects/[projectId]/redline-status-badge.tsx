import { Lock, LockOpen } from "lucide-react";

type RedlineStatusBadgeProps = {
  status: string | null | undefined;
  approvedByName?: string | null;
};

export function RedlineStatusBadge({
  approvedByName,
  status,
}: RedlineStatusBadgeProps) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[#fffbeb] px-1.5 py-0.5 text-[11px] font-medium text-[#b45309]">
        <Lock className="size-3.5" strokeWidth={2} />
        合并已锁 · 待批
      </span>
    );
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[11px] font-medium text-[#047857]">
        <LockOpen className="size-3.5" strokeWidth={2} />
        合并已解锁 · 批准人 {approvedByName ?? "人类验收员"}
      </span>
    );
  }

  if (status === "failure") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[#fff1f2] px-1.5 py-0.5 text-[11px] font-medium text-[#be123c]">
        <Lock className="size-3.5" strokeWidth={2} />
        已打回 · 合并仍锁
      </span>
    );
  }

  return null;
}
