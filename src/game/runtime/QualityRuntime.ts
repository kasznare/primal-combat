import type { QualityLevel } from "../../types/Quality";

export function getPixelRatioCap(quality: QualityLevel): number {
  const device = window.devicePixelRatio || 1;
  if (quality === "low") {
    return Math.min(device, 1);
  }
  if (quality === "high") {
    return Math.min(device, 2);
  }
  return Math.min(device, 1.5);
}
