"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Info, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createStoryTaskAction } from "@/server/actions/tasks";

const priorityOptions = [
  { value: "P0", dot: "bg-rose-500" },
  { value: "P1", dot: "bg-amber-500" },
  { value: "P2", dot: "bg-[#4f7cff]" },
  { value: "P3", dot: "bg-[#a1a1aa]" },
];

function fieldClassName(extra = "") {
  return `h-9 rounded-lg border-[#e4e4e7] bg-white px-2.5 text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus-visible:border-[#4f7cff] focus-visible:ring-2 focus-visible:ring-[#eef2ff] ${extra}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "创建 Story 失败,请检查字段后重试。";
}

export function NewStoryDialog({
  projectId,
  sprintName,
}: {
  projectId: string;
  sprintName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [asA, setAsA] = useState("");
  const [iWant, setIWant] = useState("");
  const [soThat, setSoThat] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [priority, setPriority] = useState("P1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setTitle("");
    setAsA("");
    setIWant("");
    setSoThat("");
    setAcceptanceCriteria("");
    setPriority("P1");
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("projectId", projectId);
    formData.set("title", title.trim());
    formData.set(
      "userStory",
      `作为${asA.trim()},我想要${iWant.trim()},以便于${soThat.trim()}`,
    );
    formData.set("acceptanceCriteria", acceptanceCriteria.trim());
    formData.set("priority", priority);

    startTransition(async () => {
      try {
        await createStoryTaskAction(formData);
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (caughtError) {
        setError(errorMessage(caughtError));
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setError(null);
        }
      }}
    >
      <Button
        className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#4f7cff] px-3 py-1.5 text-xs font-medium text-white transition active:scale-[.98]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        新建 Story
      </Button>

      <DialogContent showCloseButton={false}>
        <form
          className="shadow-card w-full max-w-[540px] overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#eef2ff] text-[#3a5bd0]">
                <Plus className="size-3.5" strokeWidth={2} />
              </span>
              <DialogTitle>新建 Story</DialogTitle>
              <span className="rounded bg-[#fafafa] px-1.5 py-0.5 text-[10px] text-[#a1a1aa]">
                {sprintName.replace(" - Walking Skeleton", "")}
              </span>
            </div>
            <DialogClose className="grid h-7 w-7 place-items-center rounded-md text-[#a1a1aa] outline-none transition hover:bg-[#fafafa] hover:text-[#3f3f46]">
              <X className="size-4" strokeWidth={2} />
              <span className="sr-only">关闭</span>
            </DialogClose>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                标题 <span className="text-rose-500">*</span>
              </Label>
              <Input
                className={fieldClassName()}
                name="title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="一句话说明这个 story"
                value={title}
              />
            </div>

            <div className="space-y-1.5">
              <Label>用户故事</Label>
              <div className="space-y-2 rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] text-[#a1a1aa]">
                    作为
                  </span>
                  <Input
                    className={fieldClassName()}
                    onChange={(event) => setAsA(event.target.value)}
                    placeholder="团队 Lead"
                    value={asA}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] text-[#a1a1aa]">
                    我想要
                  </span>
                  <Input
                    className={fieldClassName()}
                    onChange={(event) => setIWant(event.target.value)}
                    placeholder="把 story 指派给一个在线 agent"
                    value={iWant}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] text-[#a1a1aa]">
                    以便于
                  </span>
                  <Input
                    className={fieldClassName()}
                    onChange={(event) => setSoThat(event.target.value)}
                    placeholder="它能领走这件可验证的活"
                    value={soThat}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#a1a1aa]">
                三段会合并存入 <span className="font-mono">userStory</span>
                (后端暂为单文本,未拆独立字段)。
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>验收标准</Label>
              <Textarea
                className={fieldClassName("min-h-24 resize-y py-2 leading-relaxed")}
                name="acceptanceCriteria"
                onChange={(event) => setAcceptanceCriteria(event.target.value)}
                placeholder={`每行一条,例如:\nGiven 一个 agent 在线\nWhen 我把 story 指派给它\nThen story 进入「Agent 执行中」`}
                rows={4}
                value={acceptanceCriteria}
              />
              <p className="text-[11px] text-[#a1a1aa]">
                每行一条,合并存入{" "}
                <span className="font-mono">acceptanceCriteria</span>。
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>优先级</Label>
              <ToggleGroup value={priority} onValueChange={setPriority}>
                {priorityOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
                    {option.value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-[11px] text-[#a1a1aa]">
                默认 <span className="font-mono">P1</span> · 映射{" "}
                <span className="font-mono">priority</span> enum。
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-dashed border-[#e4e4e7] bg-[#fafafa] px-3 py-2 text-[11px] text-[#a1a1aa]">
              <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
              <span>
                <span className="text-[#71717a]">故事点</span>、
                <span className="text-[#71717a]">标签</span>{" "}
                后端暂无字段,待加 schema 后再补到此表单。
              </span>
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-[#be123c]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#e4e4e7] bg-[#fafafa] px-5 py-3">
            <DialogClose className="rounded-lg px-3.5 py-2 text-sm text-[#71717a] transition hover:bg-zinc-100">
              取消
            </DialogClose>
            <Button
              className="flex items-center gap-1.5 rounded-lg bg-[#4f7cff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3a5bd0] active:scale-[.98]"
              disabled={!title.trim() || isPending}
              type="submit"
            >
              <Plus className="size-4" strokeWidth={2} />
              {isPending ? "创建中..." : "创建 Story"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
