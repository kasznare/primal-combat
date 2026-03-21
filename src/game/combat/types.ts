import type { Character } from "../../entities/Character";

export type FighterPhase =
  | "idle"
  | "moving"
  | "attackStartup"
  | "attackActive"
  | "attackRecovery"
  | "blocking"
  | "dodging"
  | "stunned"
  | "defeated";

export type FighterCombatState = {
  phase: FighterPhase;
  phaseEndsAt: number | null;
  attackTarget: Character | null;
  attackResolved: boolean;
  blockHeld: boolean;
  invulnerableUntil: number;
  dodgeCooldownUntil: number;
  lastAttackAt: number;
  lastHitAt: number;
};

export type CombatEventType =
  | "attack_start"
  | "attack_whiff"
  | "attack_hit"
  | "attack_blocked"
  | "attack_evaded"
  | "block_start"
  | "block_end"
  | "dodge"
  | "state_change";

export type CombatEvent = {
  type: CombatEventType;
  attacker?: Character;
  target?: Character;
  damage?: number;
  hitstopMs?: number;
  phase?: FighterPhase;
  bleed?: {
    applied: boolean;
    chance: number;
    durationMs: number;
    tickDamage: number;
    tickMs: number;
  };
};
