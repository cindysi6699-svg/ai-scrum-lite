import crypto from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";
import pg from "pg";

/**
 * Sprint 2 验收(QA 独立编写)。覆盖:
 *  US-9  Story 详情只读抽屉(点卡片打开 / Esc 关闭 / 渲染验收标准+历史+PR+审批,保留视图)
 *  US-10 多 Agent 可观测面板(机群表格 + 点 agent 看其活动流,真实数据)
 *  US-11 Sprint 生命周期页(列表 + 激活/关闭/归档 + 唯一 active)
 *  US-12 看板拖拽流转(合法流转更新状态;非法流转拦截 + 提示)
 * 前置:pnpm seed:e2e && pnpm seed:sprint1。注:US-11 会改 active sprint,故放最后。
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const SESSION_TOKEN = process.env.E2E_SESSION_TOKEN ?? "e2e-playwright-session-token";
config({ path: ".env.local" });
config();

test.describe.configure({ mode: "serial" });

const { Client } = pg;

function normalizeDatabaseUrl(raw: string) {
  const url = new URL(raw);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

async function ensurePlanningSprint(projectId: string) {
  const client = new Client({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL!) });
  await client.connect();
  try {
    const existing = await client.query(
      'SELECT * FROM "Sprint" WHERE "projectId" = $1 AND "name" = $2 LIMIT 1',
      [projectId, "Sprint 2 - Lifecycle E2E"],
    );
    if (existing.rows[0]) return existing.rows[0] as { id: string; name: string };
    const now = new Date();
    const created = await client.query(
      `INSERT INTO "Sprint" ("id","projectId","name","goal","status","startDate","endDate","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5::"SprintStatus",$6,$7,$8,$9) RETURNING *`,
      [crypto.randomUUID(), projectId, "Sprint 2 - Lifecycle E2E", "生命周期 e2e", "planning",
        new Date("2026-06-18T00:00:00Z"), new Date("2026-06-25T00:00:00Z"), now, now],
    );
    return created.rows[0] as { id: string; name: string };
  } finally {
    await client.end();
  }
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "next-auth.session-token", value: SESSION_TOKEN, url: BASE }]);
});

let projectId = "";

function column(page: Page, name: string) {
  return page.getByText(name, { exact: true }).first().locator("xpath=ancestor::section[1]");
}

async function openBoard(page: Page) {
  await page.goto(`${BASE}/dashboard`);
  const card = page.getByRole("link", { name: /ai-scrum-lite/ }).first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.click();
  await expect(page).toHaveURL(/\/projects\//, { timeout: 20000 });
  projectId = new URL(page.url()).pathname.split("/").pop() ?? "";
}

// 原生 HTML5 拖拽:在浏览器内派发 dragstart→dragover→drop,共享 DataTransfer(文档级监听器)
async function dragCardToColumn(page: Page, taskId: string, columnKey: string) {
  await page.evaluate(
    ({ taskId, columnKey }) => {
      const card = document.querySelector(`[data-task-card][data-task-id="${taskId}"]`) as HTMLElement;
      const col = document.querySelector(`[data-board-column][data-column-key="${columnKey}"]`) as HTMLElement;
      const dt = new DataTransfer();
      card.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
      col.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
      col.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      card.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: dt }));
    },
    { taskId, columnKey },
  );
}

test("US-9 Story 详情抽屉:点卡片打开只读详情(标题/验收标准/历史/PR/审批),Esc 关闭且保留视图", async ({ page }) => {
  await openBoard(page);

  const titleLink = page.locator('[data-task-card] a[href*="task="]').first();
  const cardTitle = (await titleLink.innerText()).trim();
  await titleLink.click();

  await expect(page).toHaveURL(/[?&]task=/);
  const drawer = page.locator('[data-slot="story-detail-drawer"]');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(cardTitle, { exact: false }).first()).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "验收标准" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "状态历史" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "关联 PR" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "审批记录" })).toBeVisible();

  // 只读 → Esc 关闭,回到看板视图,URL 不再带 ?task
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page).not.toHaveURL(/[?&]task=/);
});

test("US-10 多 Agent 可观测:机群表格列出 agent,点 agent → 活动流过滤(真实数据)", async ({ page }) => {
  await openBoard(page);
  await page.goto(`${BASE}/projects/${projectId}?view=agents`);

  await expect(page.getByRole("heading", { name: /Agent 机群/ })).toBeVisible();
  for (const col of ["当前 Story", "领取", "提 PR", "打回"]) {
    await expect(page.getByText(col, { exact: true }).first()).toBeVisible();
  }
  // seed 造了 Dev Agent 01 / QA Agent 01
  const agentRow = page.locator('a[href*="agent="]').first();
  await expect(agentRow).toBeVisible();
  await agentRow.click();
  await expect(page).toHaveURL(/[?&]agent=/);
  await expect(page.getByText("活动流")).toBeVisible();
});

test("US-12 拖拽:合法流转(To Do → Agent 执行中)更新状态", async ({ page }) => {
  test.setTimeout(60000);
  await openBoard(page);

  const todoCard = column(page, "To Do").locator("[data-task-card]").first();
  await expect(todoCard).toBeVisible();
  const taskId = (await todoCard.getAttribute("data-task-id"))!;
  const cardTitle = (await todoCard.locator("a").first().innerText()).trim();

  await dragCardToColumn(page, taskId, "agent");

  await expect
    .poll(async () => column(page, "Agent 执行中").getByText(cardTitle, { exact: false }).count(), {
      timeout: 30000,
      intervals: [1000, 2000, 3000],
    })
    .toBeGreaterThan(0);
});

test("US-12 拖拽:非法流转(To Do → Done)被拦截 + 提示,卡片不动", async ({ page }) => {
  test.setTimeout(60000);
  await openBoard(page);

  const todoCard = column(page, "To Do").locator("[data-task-card]").first();
  await expect(todoCard).toBeVisible();
  const taskId = (await todoCard.getAttribute("data-task-id"))!;
  const cardTitle = (await todoCard.locator("a").first().innerText()).trim();

  await dragCardToColumn(page, taskId, "done");

  // 非法 → toast 提示,卡片仍在 To Do
  await expect(page.getByText(/Done 只能从待验收流转/)).toBeVisible({ timeout: 10000 });
  await expect(column(page, "To Do").getByText(cardTitle, { exact: false }).first()).toBeVisible();
});

test("US-11 Sprint 生命周期:列表 + 激活另一个 Sprint → 唯一 active(原 active 关闭)", async ({ page }) => {
  test.setTimeout(60000);
  await openBoard(page);
  const planning = await ensurePlanningSprint(projectId);

  await page.goto(`${BASE}/projects/${projectId}?view=sprints`);
  await expect(page.getByRole("heading", { name: "Sprint 生命周期" })).toBeVisible();

  const activeArticle = page.locator("article").filter({ hasText: "Sprint 1 - Walking Skeleton" });
  const planningArticle = page.locator("article").filter({ hasText: planning.name });
  await expect(activeArticle).toBeVisible();
  await expect(planningArticle).toBeVisible();

  // 初始:Sprint 1 是 active(显示「关闭」),新 sprint 非 active(显示「激活」)
  await expect(activeArticle.getByRole("button", { name: "关闭" })).toBeVisible();
  await expect(planningArticle.getByRole("button", { name: "激活" })).toBeVisible();

  // 激活新 sprint → 唯一 active:新的变 active(显示「关闭」),Sprint 1 变非 active(显示「激活」)
  await planningArticle.getByRole("button", { name: "激活" }).click();

  await expect
    .poll(async () => {
      const a = page.locator("article").filter({ hasText: planning.name });
      return a.getByRole("button", { name: "关闭" }).count();
    }, { timeout: 30000, intervals: [1000, 2000, 3000] })
    .toBeGreaterThan(0);
  await expect(
    page.locator("article").filter({ hasText: "Sprint 1 - Walking Skeleton" }).getByRole("button", { name: "激活" }),
  ).toBeVisible();
});
