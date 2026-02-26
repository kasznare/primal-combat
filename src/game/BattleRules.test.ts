import { describe, expect, it } from "vitest";
import { getBattleOutcome } from "./BattleRules";

describe("getBattleOutcome", () => {
  it("returns ongoing while both fighters are alive", () => {
    expect(getBattleOutcome(100, 100)).toBe("ongoing");
  });

  it("returns player_defeated when player health is zero", () => {
    expect(getBattleOutcome(0, 10)).toBe("player_defeated");
  });

  it("returns opponent_defeated when opponent health is zero", () => {
    expect(getBattleOutcome(10, 0)).toBe("opponent_defeated");
  });
});
