import type { FighterPhase } from "../combat/types";
import type { QualityLevel } from "../../types/Quality";
import type { SceneType } from "../../scene/SceneSelector";
import type { RoundPhase } from "./RoundState";

export type CombatantHudState = {
  key: string;
  label: string;
  health: number;
  maxHealth: number;
  cooldownProgress: number;
  dodgeReady: boolean;
  phase: FighterPhase;
  blocking: boolean;
};

export type ArenaHudState = {
  scene: SceneType;
  title: string;
  effect: string;
  hazardActive: boolean;
};

export type HudState = {
  phase: RoundPhase;
  quality: QualityLevel;
  timerMs: number;
  player: CombatantHudState | null;
  opponent: CombatantHudState | null;
  arena: ArenaHudState;
};
