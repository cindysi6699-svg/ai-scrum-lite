export const taskStatusValues = [
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
  "accepted",
] as const;

export type TaskStatusValue = (typeof taskStatusValues)[number];

const allowedTransitions: Record<TaskStatusValue, TaskStatusValue[]> = {
  todo: ["in_progress", "blocked"],
  in_progress: ["todo", "blocked", "review"],
  blocked: ["in_progress", "todo"],
  review: ["in_progress", "done", "accepted"],
  done: [],
  accepted: [],
};

export function canMoveTaskStatus(
  from: TaskStatusValue,
  to: TaskStatusValue,
) {
  if (from === to) {
    return true;
  }

  return allowedTransitions[from]?.includes(to) ?? false;
}

export function taskStatusMoveError(
  from: TaskStatusValue,
  to: TaskStatusValue,
) {
  if (canMoveTaskStatus(from, to)) {
    return null;
  }

  if (to === "done" || to === "accepted") {
    return "Done 只能从待验收流转。";
  }

  return `不能从 ${from} 直接流转到 ${to}。`;
}
