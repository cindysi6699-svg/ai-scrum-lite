"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SprintOption = {
  id: string;
  name: string;
  status: string;
};

export function SprintSwitcher({
  selectedSprintId,
  sprints,
}: {
  selectedSprintId?: string;
  sprints: SprintOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (sprints.length <= 1) {
    return null;
  }

  return (
    <label className="hidden items-center gap-2 rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-2 py-1 text-xs text-[#71717a] sm:flex">
      <span>Sprint</span>
      <select
        aria-label="Sprint 切换器"
        className="h-7 min-w-44 rounded-md border border-[#e4e4e7] bg-white px-2 text-xs font-medium text-[#3f3f46] outline-none transition focus-visible:border-[#4f7cff] focus-visible:ring-2 focus-visible:ring-[#eef2ff]"
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sprint", event.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        value={selectedSprintId ?? ""}
      >
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name}
          </option>
        ))}
      </select>
    </label>
  );
}
