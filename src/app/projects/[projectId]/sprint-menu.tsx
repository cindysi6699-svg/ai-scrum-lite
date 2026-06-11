"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  Download,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { importSprintAction } from "@/server/actions/tasks";

type SprintOption = {
  id: string;
  name: string;
  status: string;
};

type ImportSummary =
  | {
      ok: true;
      sprintName: string;
      epics: number;
      stories: number;
      tasks: number;
    }
  | {
      ok: false;
      errors: Array<{ path: string; message: string }>;
    }
  | null;

const sprintSpecPlaceholder = `{
  "sprint": { "name": "Sprint 2 - 闭环加固", "goal": "...", "startDate": "2026-06-18", "endDate": "2026-06-25" },
  "epics": [ { "code": "E3", "title": "...", "value": "...", "priority": "P0", "targetSprint": "S2" } ],
  "stories": [
    { "code": "US-9", "epic": "E3", "title": "...", "priority": "P1",
      "userStory": "作为 ..., 我想要 ..., 以便于 ...",
      "acceptanceCriteria": "Given ...\\nWhen ...\\nThen ...",
      "tasks": ["[BE] ...", "[FE] ...", "[TEST] 🛡 ..."] }
  ]
}`;

function sprintStatusLabel(status: string) {
  if (status === "active") {
    return {
      label: "active",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "closed") {
    return {
      label: "done",
      className: "bg-zinc-100 text-[#71717a]",
    };
  }

  return {
    label: status,
    className: "bg-zinc-100 text-[#71717a]",
  };
}

function validateSpecInput(value: string): ImportSummary {
  if (!value.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      sprint?: Record<string, unknown>;
      epics?: Array<Record<string, unknown>>;
      stories?: Array<Record<string, unknown> & { tasks?: unknown[] }>;
    };
    const errors: Array<{ path: string; message: string }> = [];

    for (const key of ["name", "goal", "startDate", "endDate"] as const) {
      if (typeof parsed.sprint?.[key] !== "string" || !parsed.sprint[key]?.trim()) {
        errors.push({ path: `sprint.${key}`, message: "缺失" });
      }
    }

    if (!Array.isArray(parsed.epics)) {
      errors.push({ path: "epics", message: "必须是数组" });
    }

    parsed.epics?.forEach((epic, index) => {
      for (const key of ["code", "title", "value", "priority", "targetSprint"] as const) {
        if (typeof epic[key] !== "string" || !epic[key]?.trim()) {
          errors.push({ path: `epics[${index}].${key}`, message: "缺失" });
        }
      }
    });

    if (!Array.isArray(parsed.stories) || parsed.stories.length === 0) {
      errors.push({ path: "stories", message: "至少一条" });
    }

    parsed.stories?.forEach((story, index) => {
      for (const key of [
        "code",
        "title",
        "priority",
        "userStory",
        "acceptanceCriteria",
      ] as const) {
        if (typeof story[key] !== "string" || !story[key]?.trim()) {
          errors.push({ path: `stories[${index}].${key}`, message: "缺失" });
        }
      }

      if (!Array.isArray(story.tasks) || story.tasks.length === 0) {
        errors.push({ path: `stories[${index}].tasks`, message: "至少一条" });
      }
    });

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      sprintName: typeof parsed.sprint?.name === "string" ? parsed.sprint.name : "Sprint",
      epics: parsed.epics?.length ?? 0,
      stories: parsed.stories?.length ?? 0,
      tasks:
        parsed.stories?.reduce(
          (sum, story) => sum + (Array.isArray(story.tasks) ? story.tasks.length : 0),
          0,
        ) ?? 0,
    };
  } catch {
    return {
      ok: false,
      errors: [{ path: "json", message: "不是合法 JSON" }],
    };
  }
}

export function SprintMenu({
  selectedSprintId,
  selectedSprintName,
  sprints,
  projectId,
}: {
  projectId: string;
  selectedSprintId?: string;
  selectedSprintName: string;
  sprints: SprintOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [source, setSource] = useState<"paste" | "upload">("paste");
  const [specJson, setSpecJson] = useState("");
  const [serverErrors, setServerErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [isPending, startTransition] = useTransition();
  const validation = useMemo(() => validateSpecInput(specJson), [specJson]);
  const visibleValidation =
    serverErrors.length > 0 ? { ok: false as const, errors: serverErrors } : validation;
  const canImport = validation?.ok === true && !isPending;

  function sprintHref(sprintId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sprint", sprintId);

    return `${pathname}?${params.toString()}`;
  }

  function goToSprint(sprintId: string) {
    router.push(sprintHref(sprintId));
  }

  function resetDialog() {
    setSpecJson("");
    setServerErrors([]);
    setSource("paste");
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        setDialogOpen(open);

        if (!open) {
          resetDialog();
        }
      }}
      open={dialogOpen}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-3 py-1.5 text-sm text-[#3f3f46]">
          <span className="text-[#a1a1aa]">Sprint</span>
          <span className="max-w-52 truncate font-medium text-[#18181b]">
            {selectedSprintName}
          </span>
          <ChevronDown className="size-3.5 text-[#71717a]" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>切换 Sprint</DropdownMenuLabel>
          {sprints.map((sprint) => {
            const current = sprint.id === selectedSprintId;
            const status = sprintStatusLabel(sprint.status);

            return (
              <DropdownMenuItem
                className={current ? "bg-[#fafafa]" : ""}
                key={sprint.id}
                onClick={() => goToSprint(sprint.id)}
              >
                {current ? (
                  <Check className="size-3.5 text-[#4f7cff]" strokeWidth={2.5} />
                ) : (
                  <span className="w-3.5" />
                )}
                <span
                  className={`flex-1 truncate ${
                    current ? "text-[#18181b]" : "text-[#3f3f46]"
                  }`}
                >
                  {sprint.name}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${status.className}`}>
                  {status.label}
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[#3a5bd0] hover:bg-[#eef2ff] data-[highlighted]:bg-[#eef2ff]"
            closeOnClick={false}
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-3.5" strokeWidth={2} />
            导入 / 新建 Sprint
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent
        className="max-w-[560px] overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,.28)]"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#eef2ff] text-[#3a5bd0]">
              <Download className="size-3.5" strokeWidth={2} />
            </span>
            <DialogTitle>导入 Sprint</DialogTitle>
          </div>
          <DialogClose className="grid h-7 w-7 place-items-center rounded-md text-[#a1a1aa] hover:bg-[#fafafa]">
            <X className="size-4" strokeWidth={2} />
          </DialogClose>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-[#e4e4e7] bg-white p-0.5 text-xs">
              <button
                className={`rounded-md px-2.5 py-1 ${
                  source === "paste"
                    ? "bg-[#4f7cff] font-medium text-white"
                    : "text-[#71717a] hover:text-[#18181b]"
                }`}
                onClick={() => setSource("paste")}
                type="button"
              >
                粘贴 JSON
              </button>
              <label
                className={`cursor-pointer rounded-md px-2.5 py-1 ${
                  source === "upload"
                    ? "bg-[#4f7cff] font-medium text-white"
                    : "text-[#71717a] hover:text-[#18181b]"
                }`}
              >
                上传 .json
                <input
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    setSource("upload");
                    setServerErrors([]);
                    setSpecJson(await file.text());
                  }}
                  type="file"
                />
              </label>
            </div>
            <span className="text-[11px] text-[#3a5bd0]">
              查看 Sprint Spec 格式 ↗
            </span>
          </div>

          <Textarea
            className="min-h-[200px] resize-y rounded-lg border-[#e4e4e7] bg-white px-3 py-2.5 font-mono text-xs leading-relaxed text-[#18181b] placeholder:text-[#a1a1aa] focus-visible:border-[#4f7cff] focus-visible:ring-[#4f7cff]/15"
            onChange={(event) => {
              setServerErrors([]);
              setSpecJson(event.target.value);
            }}
            placeholder={sprintSpecPlaceholder}
            value={specJson}
          />

          {visibleValidation?.ok === true ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
              <span>
                <span className="font-medium">校验通过</span> ·{" "}
                {visibleValidation.sprintName} · {visibleValidation.epics} epic ·{" "}
                {visibleValidation.stories} story · {visibleValidation.tasks} tasks,将创建为新的
                active Sprint。
              </span>
            </div>
          ) : null}

          {visibleValidation?.ok === false ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <CircleAlert className="size-3.5" strokeWidth={2} />
                校验失败({visibleValidation.errors.length})
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-rose-600/90">
                {visibleValidation.errors.map((error) => (
                  <li key={`${error.path}-${error.message}`}>
                    <span className="font-mono">{error.path}</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e4e4e7] bg-[#fafafa] px-5 py-3">
          <DialogClose className="rounded-lg px-3.5 py-2 text-sm text-[#71717a] hover:bg-zinc-100">
            取消
          </DialogClose>
          <Button
            className="bg-[#4f7cff] px-4 text-white hover:bg-[#3a5bd0]"
            disabled={!canImport}
            onClick={() => {
              startTransition(async () => {
                const result = await importSprintAction(projectId, specJson);

                if (!result.ok) {
                  setServerErrors(result.errors);
                  return;
                }

                setDialogOpen(false);
                resetDialog();
                goToSprint(result.newSprintId);
              });
            }}
            type="button"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Upload className="size-3.5" strokeWidth={2} />
            )}
            导入并切换过去
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
