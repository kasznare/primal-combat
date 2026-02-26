import { describe, expect, it } from "vitest";
import { resolveCharacterKey } from "./CharacterSetup";

describe("resolveCharacterKey", () => {
  it("keeps known character key", () => {
    expect(resolveCharacterKey("Bear", "Human")).toBe("Bear");
  });

  it("falls back for unknown key", () => {
    expect(resolveCharacterKey("Dragon", "Human")).toBe("Human");
  });

  it("falls back for missing key", () => {
    expect(resolveCharacterKey(undefined, "Human")).toBe("Human");
  });
});
