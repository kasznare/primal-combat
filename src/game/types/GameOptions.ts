import type { QualityLevel } from "../../types/Quality";
import type { HudState } from "./HudState";
import type { RoundState } from "./RoundState";

export type QualityChangeSource = "manual" | "adaptive";

export type GameOptions = {
  onQualityChanged?: (quality: QualityLevel, source: QualityChangeSource) => void;
  onRoundStateChanged?: (state: RoundState) => void;
  onHudStateChanged?: (state: HudState) => void;
};
