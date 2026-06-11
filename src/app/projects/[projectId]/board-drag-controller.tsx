"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { moveTaskStatusAction } from "@/server/actions/tasks";
import type { TaskStatusValue } from "@/server/actions/task-status-rules";

const statusByColumn: Record<string, TaskStatusValue> = {
  todo: "todo",
  agent: "in_progress",
  review: "review",
  done: "done",
};

export function BoardDragController({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function clearColumnState() {
      document
        .querySelectorAll("[data-board-column]")
        .forEach((column) => column.removeAttribute("data-drag-over"));
    }

    function onDragStart(event: DragEvent) {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-task-card]",
      );

      if (!card || !event.dataTransfer) {
        return;
      }

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.taskId ?? "");
      event.dataTransfer.setData("application/x-task-status", card.dataset.taskStatus ?? "");
      card.setAttribute("data-dragging", "true");
    }

    function onDragEnd(event: DragEvent) {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-task-card]",
      );

      card?.removeAttribute("data-dragging");
      clearColumnState();
    }

    function onDragOver(event: DragEvent) {
      const column = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-board-column]",
      );

      if (!column) {
        return;
      }

      event.preventDefault();
      column.setAttribute("data-drag-over", "true");
    }

    function onDragLeave(event: DragEvent) {
      const column = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-board-column]",
      );

      if (!column || column.contains(event.relatedTarget as Node | null)) {
        return;
      }

      column.removeAttribute("data-drag-over");
    }

    function onDrop(event: DragEvent) {
      const column = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-board-column]",
      );

      if (!column || !event.dataTransfer) {
        return;
      }

      event.preventDefault();
      clearColumnState();

      const taskId = event.dataTransfer.getData("text/plain");
      const targetStatus = statusByColumn[column.dataset.columnKey ?? ""];

      if (!taskId || !targetStatus) {
        return;
      }

      startTransition(async () => {
        const result = await moveTaskStatusAction({
          projectId,
          taskId,
          status: targetStatus,
        });

        if (result.ok) {
          setMessage("状态已更新");
          router.refresh();
        } else {
          setMessage(result.message);
        }
      });
    }

    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragend", onDragEnd);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("dragend", onDragEnd);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [projectId, router]);

  if (!message && !isPending) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-xs text-[#3f3f46] shadow-lg">
      {isPending ? "正在更新状态..." : message}
    </div>
  );
}
