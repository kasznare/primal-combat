import type { QualityLevel } from "../../types/Quality";

export class AdaptiveQualityController {
  private enabled = true;
  private windowMs = 0;
  private windowFrames = 0;
  private windowStartTs = 0;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public update(
    frameMs: number,
    timestamp: number,
    quality: QualityLevel,
    onQualityChange: (quality: QualityLevel) => void
  ): void {
    if (!this.enabled) {
      return;
    }

    if (!this.windowStartTs) {
      this.windowStartTs = timestamp;
    }

    this.windowMs += frameMs;
    this.windowFrames += 1;

    if (timestamp - this.windowStartTs < 2600) {
      return;
    }

    const avgFrameMs = this.windowMs / Math.max(1, this.windowFrames);
    const fps = 1000 / Math.max(1, avgFrameMs);

    if (quality === "high" && fps < 50) {
      onQualityChange("medium");
    } else if (quality === "medium" && fps < 42) {
      onQualityChange("low");
    }

    this.windowStartTs = timestamp;
    this.windowMs = 0;
    this.windowFrames = 0;
  }
}
