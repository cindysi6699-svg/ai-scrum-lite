import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, describe, test } from "node:test";

import {
  humanApprovalContext,
  setHumanApprovalFailure,
  setHumanApprovalPending,
} from "../../src/server/github/redline-status.ts";

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;
const originalRepository = process.env.GITHUB_REPOSITORY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.GITHUB_TOKEN = originalToken;
  process.env.GITHUB_REPOSITORY = originalRepository;
});

describe("GitHub redline commit statuses", () => {
  test("writes pending status to the configured repository and SHA", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    globalThis.fetch = (async (url, init) => {
      calls.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
      });
      return new Response("{}", { status: 201 });
    }) as typeof fetch;

    await setHumanApprovalPending({
      sha: "abc123",
      targetUrl: "https://github.test/pr/1",
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.github.com/repos/owner/repo/statuses/abc123");
    assert.equal(calls[0].body.state, "pending");
    assert.equal(calls[0].body.context, humanApprovalContext);
    assert.equal(calls[0].body.target_url, "https://github.test/pr/1");
  });

  test("bubbles GitHub failures instead of silently moving workflow state", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    globalThis.fetch = (async () =>
      new Response("bad token", { status: 401 })) as typeof fetch;

    await assert.rejects(
      setHumanApprovalFailure({ sha: "abc123" }),
      /GitHub commit status failure failed: 401 bad token/,
    );
  });

  test("agent PR script never imports the human success unlock path", async () => {
    const script = await readFile("scripts/agent-pr.mjs", "utf8");

    assert.equal(script.includes("src/server/github/human-approval"), false);
    assert.equal(script.includes("@/server/github/human-approval"), false);
    assert.equal(script.includes("setHumanApprovalSuccess"), false);
  });
});
