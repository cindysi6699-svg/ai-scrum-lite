import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  canMoveTaskStatus,
  taskStatusMoveError,
} from "../../src/server/actions/task-status-rules.ts";

describe("task status transition rules", () => {
  test("allows the expected Sprint board flow", () => {
    assert.equal(canMoveTaskStatus("todo", "in_progress"), true);
    assert.equal(canMoveTaskStatus("in_progress", "review"), true);
    assert.equal(canMoveTaskStatus("review", "done"), true);
    assert.equal(canMoveTaskStatus("review", "accepted"), true);
  });

  test("blocks done when the task is not in review", () => {
    assert.equal(canMoveTaskStatus("todo", "done"), false);
    assert.equal(taskStatusMoveError("todo", "done"), "Done 只能从待验收流转。");
  });

  test("keeps terminal states closed", () => {
    assert.equal(canMoveTaskStatus("accepted", "in_progress"), false);
    assert.equal(canMoveTaskStatus("done", "review"), false);
  });
});
