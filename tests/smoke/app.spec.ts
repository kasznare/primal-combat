import { expect, test, type Page } from "@playwright/test";

type DebugSnapshot = {
  hudState: {
    phase: string;
    player: { health: number; phase: string } | null;
    opponent: { health: number; phase: string } | null;
  };
  playerPosition: { x: number; y: number; z: number } | null;
  opponentPosition: { x: number; y: number; z: number } | null;
  blood: { pools: number; sprays: number };
};

type DebugApi = {
  forceRoundOver: (outcome: "player" | "opponent" | "draw", message: string) => void;
  restartBattle: () => void;
  setPositions: (player: { x: number; z: number }, opponent: { x: number; z: number }) => void;
  triggerPlayerAttack: (move: "primary" | "secondary") => void;
  simulatePlayerMovement: (direction: "forward" | "back" | "left" | "right", steps?: number) => void;
  debugStrikeOpponent: (move: "primary" | "secondary") => void;
};

async function getDebugSnapshot(page: Page): Promise<DebugSnapshot> {
  return page.evaluate(() => (window as Window & { __PRIMAL_DEBUG__: DebugSnapshot }).__PRIMAL_DEBUG__);
}

async function waitForPlaying(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const debug = await getDebugSnapshot(page);
      return debug?.hudState.phase;
    })
    .toBe("playing");
}

async function focusViewport(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.querySelector('canvas[aria-label="Game viewport"]') as HTMLCanvasElement | null)?.focus();
  });
}

test("loads the control panel and starts a battle without an instant game-over", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Primal Combat" })).toBeVisible();
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();

  await expect(page.getByText("Get Ready")).toBeVisible();
  await waitForPlaying(page);

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

test("player movement changes position after battle start", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Arena").selectOption("Forest");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await waitForPlaying(page);
  const before = await getDebugSnapshot(page);

  await page.evaluate(() => {
    const debugApi = (window as Window & { __PRIMAL_DEBUG_API__: DebugApi }).__PRIMAL_DEBUG_API__;
    const snapshot = (window as Window & { __PRIMAL_DEBUG__: DebugSnapshot }).__PRIMAL_DEBUG__;
    debugApi.setPositions(
      { x: (snapshot.playerPosition?.x ?? 0) + 1.1, z: snapshot.playerPosition?.z ?? 0 },
      { x: snapshot.opponentPosition?.x ?? 0, z: snapshot.opponentPosition?.z ?? 0 }
    );
  });

  const after = await getDebugSnapshot(page);
  const deltaX = (after.playerPosition?.x ?? 0) - (before.playerPosition?.x ?? 0);
  const deltaZ = (after.playerPosition?.z ?? 0) - (before.playerPosition?.z ?? 0);
  expect(Math.hypot(deltaX, deltaZ)).toBeGreaterThan(0.25);
});

test("attacks can damage the opponent and spawn blood effects", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Player").selectOption("Human");
  await page.getByLabel("Opponent").selectOption("Human");
  await page.getByLabel("Arena").selectOption("Forest");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await waitForPlaying(page);

  const initial = await getDebugSnapshot(page);
  await page.evaluate(() => {
    (window as Window & { __PRIMAL_DEBUG_API__: DebugApi }).__PRIMAL_DEBUG_API__.setPositions(
      { x: -0.9, z: 0 },
      { x: 0.9, z: 0 }
    );
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    (window as Window & { __PRIMAL_DEBUG_API__: DebugApi }).__PRIMAL_DEBUG_API__.debugStrikeOpponent("primary");
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    (window as Window & { __PRIMAL_DEBUG_API__: DebugApi }).__PRIMAL_DEBUG_API__.debugStrikeOpponent("secondary");
  });

  await expect
    .poll(async () => {
      const debug = await getDebugSnapshot(page);
      return debug.hudState.opponent?.health ?? 0;
    }, { timeout: 6000 })
    .toBeLessThan(initial.hudState.opponent?.health ?? 9999);

  await expect
    .poll(async () => {
      const debug = await getDebugSnapshot(page);
      return debug.blood.pools + debug.blood.sprays;
    }, { timeout: 6000 })
    .toBeGreaterThan(0);

  const after = await getDebugSnapshot(page);
  expect(after.hudState.opponent?.health ?? 0).toBeLessThan(initial.hudState.opponent?.health ?? 9999);
  expect(after.blood.pools + after.blood.sprays).toBeGreaterThan(0);
});

test("supports pause and resume without leaving the app shell", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await waitForPlaying(page);

  await page.getByRole("button", { name: "Pause Match" }).click();
  await expect(page.getByRole("heading", { name: "Paused" })).toBeVisible();

  await page.getByRole("button", { name: "Resume Match" }).click();
  await expect(page.getByRole("heading", { name: "Paused" })).toHaveCount(0);
  await expect(page.locator(".match-status")).toContainText("PLAYING");
});

test("debug-forced round over still rematches through the React flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await waitForPlaying(page);

  await page.evaluate(() => {
    (window as Window & {
      __PRIMAL_DEBUG_API__: DebugApi;
    }).__PRIMAL_DEBUG_API__.forceRoundOver("opponent", "Debug Loss");
  });

  await expect(page.getByRole("heading", { name: "Debug Loss" })).toBeVisible();
  await page.getByRole("button", { name: "Rematch" }).click();
  await expect(page.getByText("Get Ready")).toBeVisible();
  await waitForPlaying(page);
});

test("space input does not reset the match after starting", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Arena").selectOption("City");
  await page.getByLabel("Quality").selectOption("Low");
  await page.getByRole("button", { name: "Start Battle" }).click();
  await waitForPlaying(page);
  await focusViewport(page);

  await page.keyboard.press("Space");
  await page.waitForTimeout(150);

  await expect(page.locator(".match-status")).toContainText("PLAYING");
  await expect(page.getByText("Get Ready")).toHaveCount(0);
});
