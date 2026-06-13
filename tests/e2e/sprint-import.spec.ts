import { expect, test, type Page } from "@playwright/test";

/**
 * US-8 导入验收(QA 独立编写)。覆盖验收标准:
 *  - 导入合法 Spec → 事务创建 Sprint+Epics+Stories+Tasks → 切换到新 Sprint(看板显示其任务)
 *  - 导入非法(服务端 zod 拒绝)→ 弹窗内联报错,不创建/不切换
 * 注:本套件会把当前 active Sprint 关掉并新建,故独立于 sprint1-acceptance 跑(跑前 reseed)。
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const SESSION_TOKEN = process.env.E2E_SESSION_TOKEN ?? "e2e-playwright-session-token";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "next-auth.session-token", value: SESSION_TOKEN, url: BASE }]);
});

function column(page: Page, name: string) {
  return page.getByText(name, { exact: true }).first().locator("xpath=ancestor::section[1]");
}

async function openBoard(page: Page) {
  await page.goto(`${BASE}/dashboard`);
  const card = page.getByRole("link", { name: /ai-scrum-lite/ }).first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.click();
  await expect(page).toHaveURL(/\/projects\//, { timeout: 20000 });
}

async function openImportDialog(page: Page) {
  await page.getByRole("button", { name: /Sprint/ }).first().click();
  await page.getByRole("menuitem", { name: /导入/ }).click();
  await expect(page.getByRole("heading", { name: "导入 Sprint" })).toBeVisible();
}

test("导入合法 Sprint Spec → 创建并切换到新 Sprint,看板显示其任务", async ({ page }) => {
  test.setTimeout(90000);
  await openBoard(page);

  const sprintName = `Imported E2E ${Date.now()}`;
  const taskTitle = `[BE] 导入任务 ${Date.now()}`;
  const spec = JSON.stringify({
    sprint: { name: sprintName, goal: "e2e 导入目标", startDate: "2026-07-01", endDate: "2026-07-08" },
    epics: [{ code: "E9", title: "Import Epic", value: "test", priority: "P1", targetSprint: "S9" }],
    stories: [
      {
        code: "US-99",
        epic: "E9",
        title: "Import Story",
        priority: "P1",
        userStory: "作为 X, 我想要 Y, 以便于 Z",
        acceptanceCriteria: "Given a\nWhen b\nThen c",
        tasks: [taskTitle],
      },
    ],
  });

  await openImportDialog(page);
  await page.getByRole("textbox").fill(spec);
  await expect(page.getByText(/校验通过/)).toBeVisible();
  // 弹层规范:底部操作按钮必须在视口内(不靠 Playwright 自动滚动掩盖溢出 bug)
  await expect(page.getByRole("button", { name: /导入并切换过去/ })).toBeInViewport();
  await page.getByRole("button", { name: /导入并切换过去/ }).click();

  // 切到新 Sprint:URL 带 ?sprint=,头部显示新名,看板出现导入的任务
  await expect(page).toHaveURL(/\?sprint=/, { timeout: 30000 });
  await expect(page.getByRole("button", { name: /Sprint/ }).first()).toContainText(sprintName, {
    timeout: 30000,
  });
  await expect(column(page, "To Do").getByText(taskTitle.replace(/^\[BE\] /, ""), { exact: false }))
    .toBeVisible({ timeout: 30000 });
});

test("导入非法 Spec(priority 非法)→ 弹窗内联报错,不切换", async ({ page }) => {
  test.setTimeout(60000);
  await openBoard(page);

  const badSpec = JSON.stringify({
    sprint: { name: "Bad Spec", goal: "x", startDate: "2026-07-01", endDate: "2026-07-08" },
    epics: [{ code: "E9", title: "E", value: "v", priority: "P1", targetSprint: "S9" }],
    stories: [
      {
        code: "US-98",
        epic: "E9",
        title: "Bad",
        priority: "P9",
        userStory: "作为 X, 我想要 Y, 以便于 Z",
        acceptanceCriteria: "Given a\nWhen b\nThen c",
        tasks: ["[BE] x"],
      },
    ],
  });

  await openImportDialog(page);
  await page.getByRole("textbox").fill(badSpec);
  await page.getByRole("button", { name: /导入并切换过去/ }).click();

  // 服务端 zod 拒绝 → 内联报错,弹窗仍开,未切换到新 Sprint
  await expect(page.getByText(/校验失败/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "导入 Sprint" })).toBeVisible();
  await expect(page).not.toHaveURL(/\?sprint=/);
});

test("弹层规范:底部按钮在视口内 + 有输入时点遮罩不关闭(不丢内容)", async ({ page }) => {
  test.setTimeout(60000);
  // 压矮视口逼出"弹窗无 max-height/无内部滚动 → 底部按钮被裁出页面"的 bug
  await page.setViewportSize({ width: 1100, height: 300 });
  await openBoard(page);
  await openImportDialog(page);

  const spec = JSON.stringify(
    {
      sprint: { name: "Overflow Check", goal: "x", startDate: "2026-07-01", endDate: "2026-07-08" },
      epics: [{ code: "E9", title: "E", value: "v", priority: "P1", targetSprint: "S9" }],
      stories: [
        {
          code: "US-97",
          epic: "E9",
          title: "T",
          priority: "P1",
          userStory: "作为 X, 我想要 Y, 以便于 Z",
          acceptanceCriteria: "Given a\nWhen b\nThen c",
          tasks: ["[BE] x", "[FE] y", "[TEST] z"],
        },
      ],
    },
    null,
    2,
  );
  await page.getByRole("textbox").fill(spec);

  // ① 底部按钮必须"完整"在视口内(ratio:1)—— 抓"弹窗溢出、按钮被裁出页面"
  await expect(page.getByRole("button", { name: /导入并切换过去/ })).toBeInViewport({ ratio: 1 });

  // ② 有输入时点遮罩(弹窗外)→ 不关闭、不丢内容 —— 抓"点空白整个框消失"
  await page.mouse.click(15, 15);
  await expect(page.getByRole("heading", { name: "导入 Sprint" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue(spec);
});
