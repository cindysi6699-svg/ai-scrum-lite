import crypto from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";
import pg from "pg";

/**
 * Sprint 1 验收套件 —— 对照 ACCEPTANCE-SPRINT1.md 真实点击 + 断言。
 * 前置:pnpm seed:e2e && pnpm seed:sprint1(造测试用户 + Helmsman 数据)。
 * 登录:用 seed:e2e 写入的 next-auth.session-token cookie 跳过 OAuth。
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const SESSION_TOKEN = process.env.E2E_SESSION_TOKEN ?? "e2e-playwright-session-token";
config({ path: ".env.local" });
config();

// 串行:用例之间共享 DB 状态(指派/提 PR/验收会改变看板)
test.describe.configure({ mode: "serial" });

let projectId = "";

const { Client } = pg;

function normalizeDatabaseUrl(rawConnectionString: string) {
  const url = new URL(rawConnectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

async function ensureSwitcherSprint(projectId: string) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({
    connectionString: normalizeDatabaseUrl(connectionString),
  });

  await client.connect();

  try {
    const existing = await client.query(
      'SELECT * FROM "Sprint" WHERE "projectId" = $1 AND "name" = $2 LIMIT 1',
      [projectId, "Sprint 2 - Switcher E2E"],
    );

    if (existing.rows[0]) {
      return existing.rows[0] as { id: string; name: string };
    }

    const now = new Date();
    const created = await client.query(
      `INSERT INTO "Sprint"
        ("id", "projectId", "name", "goal", "status", "startDate", "endDate", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5::"SprintStatus", $6, $7, $8, $9)
       RETURNING *`,
      [
        crypto.randomUUID(),
        projectId,
        "Sprint 2 - Switcher E2E",
        "E2E fixture for sprint switching only.",
        "planning",
        new Date("2026-06-18T00:00:00.000Z"),
        new Date("2026-06-25T00:00:00.000Z"),
        now,
        now,
      ],
    );

    return created.rows[0] as { id: string; name: string };
  } finally {
    await client.end();
  }
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "next-auth.session-token", value: SESSION_TOKEN, url: BASE },
  ]);
});

// 看板某一列(按列头文字定位最近的 section 祖先)
function column(page: Page, name: string) {
  return page
    .getByText(name, { exact: true })
    .first()
    .locator("xpath=ancestor::section[1]");
}

// server action 提交后,dev 模式首跑 + 远端 DB 往返较慢。
// 不重载(重载会打断未落库的请求),直接轮询实时 DOM 等 revalidate 后的客户端重渲染。
async function expectEventually(page: Page, makeCount: () => Promise<number>, timeout = 40000) {
  await expect
    .poll(makeCount, { timeout, intervals: [1000, 2000, 3000, 5000] })
    .toBeGreaterThan(0);
}

async function openHelmsmanBoard(page: Page) {
  await page.goto(`${BASE}/dashboard`);
  // 用仓库名唯一定位项目卡(避免匹配到验收收件箱里的同名链接)
  const card = page.getByRole("link", { name: /ai-scrum-lite/ }).first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.click();
  await expect(page).toHaveURL(/\/projects\//, { timeout: 20000 });
  projectId = new URL(page.url()).pathname.split("/").pop() ?? "";
}

test("US-1 看板加载:登录后进入 Helmsman,看板渲染 4 列 + 导航", async ({ page }) => {
  await openHelmsmanBoard(page);

  for (const col of ["To Do", "Agent 执行中", "待验收", "Done"]) {
    await expect(page.getByText(col, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "工作台" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sprint 仪表盘" })).toBeVisible();
  await expect(page.getByRole("link", { name: /验收闸门/ })).toBeVisible();
});

test("US-8 Sprint 切换器:?sprint 渲染目标 sprint,非法 id 回退默认 active sprint", async ({ page }) => {
  await openHelmsmanBoard(page);

  const targetSprint = await ensureSwitcherSprint(projectId);

  await page.goto(`${BASE}/projects/${projectId}?sprint=${targetSprint.id}`);
  await expect(page.getByRole("button", { name: /Sprint/ })).toContainText(
    targetSprint.name,
  );
  await page.getByRole("button", { name: /Sprint/ }).click();
  await expect(page.getByText("切换 Sprint")).toBeVisible();
  await expect(page.getByText("导入 / 新建 Sprint")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(targetSprint.name) }),
  ).toBeVisible();

  await page.goto(`${BASE}/projects/${projectId}?sprint=not-a-real-sprint`);
  await expect(
    page.getByRole("heading", { name: /Sprint 1 - Walking Skeleton/ }),
  ).toBeVisible();
});

test("US-2 指派:把一个 To Do story 指派给在线 agent → 流入「Agent 执行中」", async ({ page }) => {
  test.setTimeout(90000);
  await openHelmsmanBoard(page);

  const todo = column(page, "To Do");
  const firstCard = todo.locator("article").first();
  await expect(firstCard).toBeVisible();
  const cardTitle = (await firstCard.locator("p").first().innerText()).trim();

  // 选一个在线 agent(seed 造了 Dev Agent 01 / QA Agent 01)并指派
  await firstCard.locator('select[name="assigneeId"]').selectOption({ index: 1 });
  await firstCard.getByRole("button", { name: "指派" }).click();

  // 断言:该 story 现在出现在「Agent 执行中」列(重载轮询读持久化状态)
  await expectEventually(page, () =>
    column(page, "Agent 执行中").getByText(cardTitle, { exact: false }).count(),
  );
});

test("US-3/US-5(手动)提交 PR:执行中卡片填 PR URL → 流入「待验收」(状态回填)", async ({ page }) => {
  test.setTimeout(90000);
  await openHelmsmanBoard(page);

  // 用「提交 PR URL」路径(submitPullRequestAction)演示 in_progress → 待验收,
  // 覆盖可选 branch/note 缺失时不再因 null 抛 ZodError。
  const agentCol = column(page, "Agent 执行中");
  const runningCard = agentCol
    .locator("article")
    .filter({ has: page.locator('input[name="pullRequestUrl"]') })
    .last();
  await expect(runningCard).toBeVisible();
  const cardTitle = (await runningCard.locator("p").first().innerText()).trim();

  await runningCard
    .locator('input[name="pullRequestUrl"]')
    .fill(`https://github.com/cindysi6699-svg/ai-scrum-lite/pull/${Date.now()}`);
  await runningCard.locator('form:has(input[name="pullRequestUrl"]) button[type="submit"]').click();

  await expectEventually(page, () =>
    column(page, "待验收").getByText(cardTitle, { exact: false }).count(),
  );
});

test("US-4 验收闸门:红线可见 + 「通过验收」让 story 离开待验收进入 Done", async ({ page }) => {
  test.setTimeout(30000);
  await page.goto(`${BASE}/projects/${projectId}?view=review`);

  await expect(page.getByText("未验收 · push 被阻止")).toBeVisible();

  const queueBadge = page.getByText(/\d+ 待处理/);
  const before = parseInt((await queueBadge.innerText()).match(/\d+/)?.[0] ?? "0", 10);
  expect(before).toBeGreaterThan(0);

  await page.getByRole("button", { name: /通过验收 · 解锁 push/ }).click();

  await expect
    .poll(
      async () => {
        const txt = await page.getByText(/\d+ 待处理/).innerText().catch(() => "0 待处理");
        return parseInt(txt.match(/\d+/)?.[0] ?? "0", 10);
      },
      { timeout: 8000, intervals: [1000, 2000] },
    )
    .toBeLessThan(before);
});

test("US-4 打回:填反馈打回 → story 退回执行(Scrum:回到 in_progress,不是新列)", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`${BASE}/projects/${projectId}?view=review`);

  const badge = page.getByText(/\d+ 待处理/);
  if ((await badge.count()) === 0) {
    test.skip(true, "已无待验收项可打回(前序用例已清空)");
  }
  const before = parseInt((await badge.innerText()).match(/\d+/)?.[0] ?? "0", 10);

  await page.getByPlaceholder("打回反馈").fill("E2E:并发竞态未解决,打回返工");
  await page.getByRole("button", { name: /打回 \+ 反馈/ }).click();

  await expect
    .poll(
      async () => {
        const b = page.getByText(/\d+ 待处理/);
        if ((await b.count()) === 0) return 0;
        return parseInt((await b.innerText()).match(/\d+/)?.[0] ?? "0", 10);
      },
      { timeout: 40000, intervals: [1000, 2000, 3000, 5000] },
    )
    .toBeLessThan(before);
});

test("US-1 新建 Story:弹窗填写四字段提交 → 新卡片出现在「To Do」", async ({ page }) => {
  test.setTimeout(60000);
  await openHelmsmanBoard(page);

  const unique = `E2E 验收 Story ${Date.now()}`;
  await page.getByRole("button", { name: "新建 Story" }).click();

  await expect(page.getByRole("heading", { name: "新建 Story" })).toBeVisible();
  await page.getByPlaceholder("一句话说明这个 story").fill(unique);
  await page.getByPlaceholder("团队 Lead").fill("团队 Lead");
  await page.getByPlaceholder("把 story 指派给一个在线 agent").fill("自动跑通验收流程");
  await page.getByPlaceholder("它能领走这件可验证的活").fill("证明端到端可用");
  await page
    .getByRole("textbox", { name: "" })
    .last()
    .fill("Given 看板\nWhen 新建 story\nThen 出现在 To Do 列");
  await page.getByRole("button", { name: /创建 Story/ }).click();

  await expectEventually(page, () =>
    column(page, "To Do").getByText(unique, { exact: false }).count(),
  );
});
