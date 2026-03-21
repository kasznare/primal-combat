import { describe, expect, it } from "vitest";
import { CONTENT_MANIFEST } from "./contentManifest";
import { ENTITY_PRESENTATIONS } from "./entityPresentations";
import { validateContentManifest } from "./validateContent";
import { CHARACTER_CONFIGS } from "../game/roster/characterConfigs";

describe("validateContentManifest", () => {
  it("keeps the manifest aligned with fighter configs and presentations", () => {
    const issues = validateContentManifest(
      CONTENT_MANIFEST,
      ENTITY_PRESENTATIONS,
      Object.keys(CHARACTER_CONFIGS)
    );
    expect(issues).toEqual([]);
  });
});
