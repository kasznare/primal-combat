import { expect, test } from "@playwright/test";

test("loads the control panel and starts a battle without an instant game-over", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Primal Combat" })).toBeVisible();
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();

  await expect(page.getByText("Get Ready")).toBeVisible();
  await page.waitForTimeout(1800);

  await expect(page.locator(".match-timer")).toBeVisible();
  await expect(page.locator(".combatant-panel")).toHaveCount(2);
  await expect(page.getByText("You Win")).toHaveCount(0);
  await expect(page.getByText("You Lose")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fight Again" })).toHaveCount(0);
});

test("persists arena and quality selections across reload", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Arena").selectOption("Moon");
  await page.getByLabel("Quality").selectOption("High");
  await page.reload();

  await expect(page.getByLabel("Arena")).toHaveValue("Moon");
  await expect(page.getByLabel("Quality")).toHaveValue("high");
});

test("supports pause and resume without leaving the app shell", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await page.waitForTimeout(1600);

  await page.getByRole("button", { name: "Pause Match" }).click();
  await expect(page.getByRole("heading", { name: "Paused" })).toBeVisible();

  await page.getByRole("button", { name: "Resume Match" }).click();
  await expect(page.getByRole("heading", { name: "Paused" })).toHaveCount(0);
  await expect(page.locator(".match-status")).toContainText("PLAYING");
});

test("space input does not reset the match after starting", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await page.waitForTimeout(1600);

  await page.keyboard.press("Space");
  await page.waitForTimeout(150);

  await expect(page.locator(".match-status")).toContainText("PLAYING");
  await expect(page.getByText("Get Ready")).toHaveCount(0);
});
