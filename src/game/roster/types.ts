import type { Character, ICharacterOptions } from "../../entities/Character";

export type CharacterClass = new (...args: any[]) => Character;

export type MovementArchetype =
  | "biped"
  | "quadruped"
  | "vehicle"
  | "flying"
  | "colossus"
  | "tiny";

export type AttackInput = "primary" | "secondary";

export type HitboxProfile = {
  forward: number;
  up: number;
  radius: number;
  length: number;
  lateral?: number;
};

export type HurtboxProfile = {
  torsoRadius: number;
  torsoHeight: number;
  headRadius: number;
  headHeight: number;
};

export type AttackProfile = {
  id: string;
  label: string;
  input: AttackInput;
  damage: number;
  range: number;
  idealRange: number;
  cooldownMs: number;
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  hitstunMs: number;
  blockstunMs: number;
  hitstopMs: number;
  blockHitstopMs: number;
  arcDegrees: number;
  knockback: number;
  chipDamage: number;
  bleedChance: number;
  bleedDurationMs: number;
  bleedTickDamage: number;
  bleedTickMs: number;
  aiWeight: number;
  hitbox: HitboxProfile;
};

export type DefenseProfile = {
  blockDamageMultiplier: number;
  blockAngleDegrees: number;
  dodgeCooldownMs: number;
  dodgeDurationMs: number;
  dodgeSpeedMultiplier: number;
  stunScale: number;
  hurtbox: HurtboxProfile;
};

export type MovementProfile = {
  archetype: MovementArchetype;
  speedMultiplier: number;
  jumpStrength: number;
  hoverHeight?: number;
  canStrafe: boolean;
  turnSpeed: number;
  fieldOfViewDegrees?: number;
  accelerationResponsiveness?: number;
  decelerationResponsiveness?: number;
  reversePenalty?: number;
};

export type AnimationProfile = {
  idleBobAmplitude: number;
  idleBobSpeed: number;
  moveBobAmplitude: number;
  leanAmount: number;
  attackLunge: number;
  dodgeTilt: number;
  hitTilt: number;
  rigProfile?: "generic" | "human" | "bear" | "humanoid" | "quadruped" | "winged" | "vehicle" | "colossus" | "tiny";
};

export type AudioProfile = {
  attackPitch: number;
  hitPitch: number;
  blockPitch: number;
  dodgePitch: number;
  ambiencePitch: number;
};

export type AiBehaviorStyle =
  | "duelist"
  | "bruiser"
  | "skirmisher"
  | "charger"
  | "trickster"
  | "flyer";

export type AiProfile = {
  style: AiBehaviorStyle;
  preferredRange: number;
  aggression: number;
  strafeBias: number;
  retreatRange: number;
  blockChance: number;
  dodgeChance: number;
  pressureBias: number;
};

export type ContentProfile = {
  presentationId: string;
  audioTheme: string;
  artStyle: "procedural";
  tags: string[];
  assetKey: string | null;
};

export type CharacterConfig = {
  key: string;
  label: string;
  classRef: CharacterClass;
  dataName: string;
  stats: ICharacterOptions;
  movement: MovementProfile;
  attack: AttackProfile;
  attacks: AttackProfile[];
  defense: DefenseProfile;
  ai: AiProfile;
  animation: AnimationProfile;
  audio: AudioProfile;
  content: ContentProfile;
};
