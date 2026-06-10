import { expect, test } from "@playwright/test";

test("home page renders the AI Scrum Lite landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "AI Scrum Lite" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with GitHub" })).toBeVisible();
});

test("dashboard redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("button", { name: "Sign in with GitHub" })).toBeVisible();
});
