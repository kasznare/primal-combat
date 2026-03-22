import { describe, expect, it } from "vitest";
import { BEAR_ASSET_DESIGN, BEAR_RIG_NODES, resolveBearDimensions } from "./bearAssetDesign";

describe("bearAssetDesign", () => {
  it("enforces minimum bear dimensions and stable offsets", () => {
    const dims = resolveBearDimensions({ width: 0.6, height: 0.7, depth: 0.9 });

    expect(dims.bodyLength).toBe(BEAR_ASSET_DESIGN.minimumSize.length);
    expect(dims.bodyHeight).toBe(BEAR_ASSET_DESIGN.minimumSize.height);
    expect(dims.bodyWidth).toBe(BEAR_ASSET_DESIGN.minimumSize.width);
    expect(dims.shoulderY).toBeCloseTo(dims.bodyHeight * BEAR_ASSET_DESIGN.proportions.shoulderHeight);
    expect(dims.frontLegX).toBeCloseTo(dims.bodyLength * BEAR_ASSET_DESIGN.proportions.frontLegX);
    expect(dims.upperLegLength).toBeCloseTo(dims.bodyHeight * BEAR_ASSET_DESIGN.proportions.upperLegLength);
  });

  it("keeps the rig contract used by the bear animation system", () => {
    expect(BEAR_RIG_NODES).toEqual([
      "torso",
      "head",
      "jaw",
      "frontLeftLeg",
      "frontRightLeg",
      "rearLeftLeg",
      "rearRightLeg",
    ]);
  });
});
