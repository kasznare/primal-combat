import { describe, expect, it } from "vitest";
import { HUMAN_RIG_NODES, HUMAN_ASSET_DESIGN, resolveHumanDimensions } from "./humanAssetDesign";

describe("humanAssetDesign", () => {
  it("enforces minimum dimensions and stable ratios", () => {
    const dims = resolveHumanDimensions({ width: 0.2, height: 1.2, depth: 0.1 });

    expect(dims.totalHeight).toBe(HUMAN_ASSET_DESIGN.minimumSize.height);
    expect(dims.totalWidth).toBe(HUMAN_ASSET_DESIGN.minimumSize.width);
    expect(dims.totalDepth).toBe(HUMAN_ASSET_DESIGN.minimumSize.depth);
    expect(dims.torsoHeight).toBeCloseTo(dims.totalHeight * HUMAN_ASSET_DESIGN.proportions.torsoHeight);
    expect(dims.shoulderSpan).toBeCloseTo(dims.totalWidth * HUMAN_ASSET_DESIGN.proportions.shoulderSpan);
  });

  it("keeps the rig contract used by the animation system", () => {
    expect(HUMAN_RIG_NODES).toEqual([
      "torso",
      "head",
      "leftArm",
      "rightArm",
      "leftForearm",
      "rightForearm",
      "leftLeg",
      "rightLeg",
      "leftShin",
      "rightShin",
    ]);
  });
});
