import { describe, expect, it } from "vitest";
import { GameStateManager } from "./GameStateManager";

describe("GameStateManager", () => {
  it("transitions from countdown to playing and tracks remaining time", () => {
    const manager = new GameStateManager();
    manager.startCountdown(100, 500, 10_000);

    expect(manager.getPhase()).toBe("countdown");
    expect(manager.getRemainingMs(300)).toBe(300);

    expect(manager.update(650)).toBe(true);
    expect(manager.getPhase()).toBe("playing");
    expect(manager.getRemainingMs(1_650)).toBe(9_000);
  });

  it("shifts timers forward when paused and resumed", () => {
    const manager = new GameStateManager();
    manager.startCountdown(0, 500, 10_000);
    manager.update(600);
    manager.setPaused(true, 1_000);
    manager.setPaused(false, 2_000);

    expect(manager.getPhase()).toBe("playing");
    expect(manager.getRemainingMs(2_600)).toBe(9_000);
  });
});
