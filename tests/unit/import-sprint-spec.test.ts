import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseSprintSpecJson } from "../../src/server/actions/import-sprint-spec.ts";

const validSpec = {
  sprint: {
    name: "Sprint 2 - 闭环加固",
    goal: "跑通导入流程",
    startDate: "2026-06-18",
    endDate: "2026-06-25",
  },
  epics: [
    {
      code: "E3",
      title: "Agent 执行流水线",
      value: "消灭手工回填",
      priority: "P0",
      targetSprint: "S2",
    },
  ],
  stories: [
    {
      code: "US-8",
      epic: "E3",
      title: "Sprint 菜单导入",
      priority: "P1",
      userStory: "作为 Scrum Master, 我想导入 sprint spec, 以便快速建计划",
      acceptanceCriteria: "Given 合法 JSON\nWhen 导入\nThen 创建 Sprint",
      tasks: ["[BE] import action", "[FE] import dialog"],
    },
  ],
};

describe("parseSprintSpecJson", () => {
  test("accepts the sprint spec template shape", () => {
    const result = parseSprintSpecJson(JSON.stringify(validSpec));

    assert.equal(result.ok, true);
    assert.equal(result.ok ? result.data.sprint.name : "", validSpec.sprint.name);
    assert.equal(result.ok ? result.data.stories[0]?.tasks.length : 0, 2);
  });

  test("returns a structured JSON parse error", () => {
    const result = parseSprintSpecJson("{ not valid json");

    assert.equal(result.ok, false);
    assert.deepEqual(result.ok ? [] : result.errors, [
      { path: "json", message: "不是合法 JSON" },
    ]);
  });

  test("returns field errors without accepting missing story fields", () => {
    const brokenSpec = structuredClone(validSpec);
    brokenSpec.stories[0]!.acceptanceCriteria = "";
    brokenSpec.stories[0]!.tasks = [];

    const result = parseSprintSpecJson(JSON.stringify(brokenSpec));

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.ok ? [] : result.errors.map((error) => error.path),
      ["stories[0].acceptanceCriteria", "stories[0].tasks"],
    );
  });
});
