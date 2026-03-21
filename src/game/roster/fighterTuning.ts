import { MovementType } from "../../entities/Character";
import type {
  AiProfile,
  AnimationProfile,
  AttackProfile,
  AudioProfile,
  DefenseProfile,
  MovementProfile,
} from "./types";

export type FighterTuning = {
  key: string;
  color: number;
  health: number;
  movementType: MovementType;
  movement: MovementProfile;
  attack: AttackProfile;
  defense: DefenseProfile;
  ai: AiProfile;
  animation: AnimationProfile;
  audio: AudioProfile;
};

const COMMON_DEFENSE = {
  blockAngleDegrees: 112,
  dodgeCooldownMs: 900,
  dodgeDurationMs: 240,
  dodgeSpeedMultiplier: 1.2,
  stunScale: 1,
} satisfies Omit<DefenseProfile, "blockDamageMultiplier">;

const COMMON_ANIMATION = {
  idleBobAmplitude: 0.06,
  idleBobSpeed: 1.2,
  moveBobAmplitude: 0.12,
  leanAmount: 0.16,
  attackLunge: 0.28,
  dodgeTilt: 0.34,
  hitTilt: 0.2,
} satisfies AnimationProfile;

const LIGHT_ATTACK = {
  activeMs: 100,
  hitstunMs: 360,
  blockstunMs: 170,
  hitstopMs: 90,
  blockHitstopMs: 44,
  chipDamage: 2,
  bleedChance: 0.22,
  bleedDurationMs: 4_000,
  bleedTickDamage: 2,
  bleedTickMs: 750,
} satisfies Pick<
  AttackProfile,
  | "activeMs"
  | "hitstunMs"
  | "blockstunMs"
  | "hitstopMs"
  | "blockHitstopMs"
  | "chipDamage"
  | "bleedChance"
  | "bleedDurationMs"
  | "bleedTickDamage"
  | "bleedTickMs"
>;

const HEAVY_ATTACK = {
  activeMs: 140,
  hitstunMs: 520,
  blockstunMs: 240,
  hitstopMs: 120,
  blockHitstopMs: 60,
  chipDamage: 4,
  bleedChance: 0.38,
  bleedDurationMs: 5_200,
  bleedTickDamage: 4,
  bleedTickMs: 800,
} satisfies Pick<
  AttackProfile,
  | "activeMs"
  | "hitstunMs"
  | "blockstunMs"
  | "hitstopMs"
  | "blockHitstopMs"
  | "chipDamage"
  | "bleedChance"
  | "bleedDurationMs"
  | "bleedTickDamage"
  | "bleedTickMs"
>;

export const FIGHTER_TUNING: Record<string, FighterTuning> = {
  Human: {
    key: "Human",
    color: 0xfad6a5,
    health: 120,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "biped",
      speedMultiplier: 0.42,
      jumpStrength: 8,
      canStrafe: true,
      turnSpeed: 0.18,
      fieldOfViewDegrees: 150,
      accelerationResponsiveness: 2.35,
      decelerationResponsiveness: 2.8,
      reversePenalty: 0.42,
    },
    attack: { damage: 18, range: 2, cooldownMs: 520, startupMs: 110, recoveryMs: 220, arcDegrees: 75, knockback: 6, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.24 },
    ai: { style: "duelist", preferredRange: 1.7, aggression: 0.6, strafeBias: 0.5, retreatRange: 1.1, blockChance: 0.64, dodgeChance: 0.28, pressureBias: 0.55 },
    animation: { ...COMMON_ANIMATION, rigProfile: "human" },
    audio: { attackPitch: 255, hitPitch: 170, blockPitch: 220, dodgePitch: 320, ambiencePitch: 110 },
  },
  Bear: {
    key: "Bear",
    color: 0x8b4513,
    health: 220,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "quadruped",
      speedMultiplier: 0.38,
      jumpStrength: 5.8,
      canStrafe: false,
      turnSpeed: 0.13,
      fieldOfViewDegrees: 138,
      accelerationResponsiveness: 1.9,
      decelerationResponsiveness: 2.2,
      reversePenalty: 0.34,
    },
    attack: { damage: 30, range: 2.4, cooldownMs: 780, startupMs: 170, recoveryMs: 310, arcDegrees: 85, knockback: 9, ...HEAVY_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.36, dodgeCooldownMs: 1200, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.05, stunScale: 0.92 },
    ai: { style: "bruiser", preferredRange: 2.1, aggression: 0.82, strafeBias: 0.12, retreatRange: 1.2, blockChance: 0.25, dodgeChance: 0.06, pressureBias: 0.9 },
    animation: {
      ...COMMON_ANIMATION,
      idleBobAmplitude: 0.04,
      moveBobAmplitude: 0.08,
      leanAmount: 0.1,
      attackLunge: 0.35,
      rigProfile: "bear",
    },
    audio: { attackPitch: 160, hitPitch: 120, blockPitch: 180, dodgePitch: 150, ambiencePitch: 70 },
  },
  MallardDuck: {
    key: "MallardDuck",
    color: 0x668c44,
    health: 70,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.55, jumpStrength: 0, hoverHeight: 2.2, canStrafe: true, turnSpeed: 0.2 },
    attack: { damage: 10, range: 1.3, cooldownMs: 320, startupMs: 70, recoveryMs: 160, arcDegrees: 95, knockback: 2.4, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.42, dodgeCooldownMs: 680, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.5, stunScale: 1.1 },
    ai: { style: "flyer", preferredRange: 1.25, aggression: 0.5, strafeBias: 0.65, retreatRange: 0.8, blockChance: 0.22, dodgeChance: 0.5, pressureBias: 0.38 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.14, moveBobAmplitude: 0.08, attackLunge: 0.16, dodgeTilt: 0.44 },
    audio: { attackPitch: 480, hitPitch: 310, blockPitch: 360, dodgePitch: 540, ambiencePitch: 250 },
  },
  Cheetah: {
    key: "Cheetah",
    color: 0xd2b48c,
    health: 110,
    movementType: MovementType.Grounded,
    movement: { archetype: "quadruped", speedMultiplier: 0.5, jumpStrength: 6.2, canStrafe: false, turnSpeed: 0.16 },
    attack: { damage: 20, range: 1.9, cooldownMs: 420, startupMs: 90, recoveryMs: 200, arcDegrees: 70, knockback: 5.5, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.3, dodgeCooldownMs: 760, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.42, stunScale: 0.95 },
    ai: { style: "skirmisher", preferredRange: 1.6, aggression: 0.78, strafeBias: 0.18, retreatRange: 1.05, blockChance: 0.24, dodgeChance: 0.45, pressureBias: 0.84 },
    animation: { ...COMMON_ANIMATION, moveBobAmplitude: 0.16, leanAmount: 0.22, attackLunge: 0.3 },
    audio: { attackPitch: 330, hitPitch: 210, blockPitch: 250, dodgePitch: 430, ambiencePitch: 160 },
  },
  Housefly: {
    key: "Housefly",
    color: 0x111111,
    health: 30,
    movementType: MovementType.Flying,
    movement: { archetype: "tiny", speedMultiplier: 1, jumpStrength: 0, hoverHeight: 1.8, canStrafe: true, turnSpeed: 0.25 },
    attack: { damage: 5, range: 1, cooldownMs: 260, startupMs: 40, recoveryMs: 120, arcDegrees: 110, knockback: 1.2, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.55, dodgeCooldownMs: 500, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.85, stunScale: 1.3 },
    ai: { style: "trickster", preferredRange: 0.95, aggression: 0.5, strafeBias: 0.75, retreatRange: 0.65, blockChance: 0.1, dodgeChance: 0.74, pressureBias: 0.42 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.18, idleBobSpeed: 2.2, moveBobAmplitude: 0.04, attackLunge: 0.1, dodgeTilt: 0.56 },
    audio: { attackPitch: 620, hitPitch: 380, blockPitch: 420, dodgePitch: 760, ambiencePitch: 320 },
  },
  SedanCar: {
    key: "SedanCar",
    color: 0x2956d1,
    health: 260,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "vehicle",
      speedMultiplier: 0.32,
      jumpStrength: 0,
      canStrafe: false,
      turnSpeed: 0.08,
      fieldOfViewDegrees: 118,
      accelerationResponsiveness: 1.7,
      decelerationResponsiveness: 1.95,
      reversePenalty: 0.22,
    },
    attack: { damage: 34, range: 2.8, cooldownMs: 850, startupMs: 140, recoveryMs: 340, arcDegrees: 50, knockback: 12, ...HEAVY_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.48, blockAngleDegrees: 135, dodgeCooldownMs: 1100, dodgeDurationMs: 160, dodgeSpeedMultiplier: 1.08, stunScale: 0.84 },
    ai: { style: "charger", preferredRange: 2.6, aggression: 0.68, strafeBias: 0.05, retreatRange: 1.8, blockChance: 0.16, dodgeChance: 0.12, pressureBias: 0.82 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.04, leanAmount: 0.08, attackLunge: 0.22, dodgeTilt: 0.12 },
    audio: { attackPitch: 140, hitPitch: 95, blockPitch: 150, dodgePitch: 180, ambiencePitch: 60 },
  },
  SportMotorcycle: {
    key: "SportMotorcycle",
    color: 0xe43c33,
    health: 160,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "vehicle",
      speedMultiplier: 0.4,
      jumpStrength: 0,
      canStrafe: false,
      turnSpeed: 0.11,
      fieldOfViewDegrees: 124,
      accelerationResponsiveness: 2.1,
      decelerationResponsiveness: 2.2,
      reversePenalty: 0.28,
    },
    attack: { damage: 26, range: 2.3, cooldownMs: 520, startupMs: 100, recoveryMs: 220, arcDegrees: 58, knockback: 8.5, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.32, blockAngleDegrees: 120, dodgeCooldownMs: 760, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.3, stunScale: 0.96 },
    ai: { style: "charger", preferredRange: 2.2, aggression: 0.72, strafeBias: 0.08, retreatRange: 1.5, blockChance: 0.12, dodgeChance: 0.28, pressureBias: 0.78 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.06, leanAmount: 0.12, attackLunge: 0.18 },
    audio: { attackPitch: 200, hitPitch: 120, blockPitch: 180, dodgePitch: 280, ambiencePitch: 82 },
  },
  Bicycle: {
    key: "Bicycle",
    color: 0x00c86a,
    health: 80,
    movementType: MovementType.Grounded,
    movement: { archetype: "vehicle", speedMultiplier: 0.36, jumpStrength: 0, canStrafe: false, turnSpeed: 0.14 },
    attack: { damage: 12, range: 1.9, cooldownMs: 450, startupMs: 90, recoveryMs: 180, arcDegrees: 62, knockback: 4, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.28, dodgeCooldownMs: 640, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.4, stunScale: 1.08 },
    ai: { style: "skirmisher", preferredRange: 1.8, aggression: 0.56, strafeBias: 0.05, retreatRange: 1.15, blockChance: 0.18, dodgeChance: 0.42, pressureBias: 0.46 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.03, moveBobAmplitude: 0.05, leanAmount: 0.1, attackLunge: 0.16 },
    audio: { attackPitch: 280, hitPitch: 170, blockPitch: 210, dodgePitch: 340, ambiencePitch: 120 },
  },
  GiantFly: {
    key: "GiantFly",
    color: 0x88ff88,
    health: 130,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.48, jumpStrength: 0, hoverHeight: 2.8, canStrafe: true, turnSpeed: 0.2 },
    attack: { damage: 18, range: 1.8, cooldownMs: 500, startupMs: 80, recoveryMs: 190, arcDegrees: 90, knockback: 5.2, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.34, dodgeCooldownMs: 620, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.48, stunScale: 1.04 },
    ai: { style: "flyer", preferredRange: 1.5, aggression: 0.66, strafeBias: 0.62, retreatRange: 1, blockChance: 0.16, dodgeChance: 0.56, pressureBias: 0.64 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.16, idleBobSpeed: 1.8, moveBobAmplitude: 0.06, attackLunge: 0.18, dodgeTilt: 0.48 },
    audio: { attackPitch: 440, hitPitch: 280, blockPitch: 340, dodgePitch: 530, ambiencePitch: 230 },
  },
  SentientVolcano: {
    key: "SentientVolcano",
    color: 0xff5500,
    health: 380,
    movementType: MovementType.Grounded,
    movement: { archetype: "colossus", speedMultiplier: 0.22, jumpStrength: 0, canStrafe: false, turnSpeed: 0.06 },
    attack: { damage: 42, range: 3.2, cooldownMs: 1200, startupMs: 260, recoveryMs: 420, arcDegrees: 100, knockback: 11, ...HEAVY_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.56, blockAngleDegrees: 145, dodgeCooldownMs: 1500, dodgeDurationMs: 120, dodgeSpeedMultiplier: 0.9, stunScale: 0.72 },
    ai: { style: "bruiser", preferredRange: 2.9, aggression: 0.7, strafeBias: 0.04, retreatRange: 1.8, blockChance: 0.12, dodgeChance: 0.02, pressureBias: 0.86 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.04, leanAmount: 0.06, attackLunge: 0.18, hitTilt: 0.1 },
    audio: { attackPitch: 90, hitPitch: 75, blockPitch: 110, dodgePitch: 95, ambiencePitch: 45 },
  },
  WalkingPencil: {
    key: "WalkingPencil",
    color: 0xffdd55,
    health: 40,
    movementType: MovementType.Grounded,
    movement: { archetype: "tiny", speedMultiplier: 0.55, jumpStrength: 4.5, canStrafe: true, turnSpeed: 0.24 },
    attack: { damage: 8, range: 1.15, cooldownMs: 340, startupMs: 55, recoveryMs: 140, arcDegrees: 70, knockback: 2.4, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.38, dodgeCooldownMs: 560, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.7, stunScale: 1.22 },
    ai: { style: "trickster", preferredRange: 1, aggression: 0.6, strafeBias: 0.7, retreatRange: 0.7, blockChance: 0.22, dodgeChance: 0.68, pressureBias: 0.52 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.1, idleBobSpeed: 2.1, moveBobAmplitude: 0.12, attackLunge: 0.22, dodgeTilt: 0.62 },
    audio: { attackPitch: 560, hitPitch: 320, blockPitch: 390, dodgePitch: 640, ambiencePitch: 280 },
  },
  HumanoidRobot: {
    key: "HumanoidRobot",
    color: 0x7d8a9e,
    health: 180,
    movementType: MovementType.Grounded,
    movement: { archetype: "biped", speedMultiplier: 0.38, jumpStrength: 6.5, canStrafe: true, turnSpeed: 0.16 },
    attack: { damage: 24, range: 2.15, cooldownMs: 600, startupMs: 120, recoveryMs: 240, arcDegrees: 75, knockback: 7.5, ...LIGHT_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.2, blockAngleDegrees: 118, dodgeCooldownMs: 820, dodgeDurationMs: 210, dodgeSpeedMultiplier: 1.26, stunScale: 0.9 },
    ai: { style: "duelist", preferredRange: 1.95, aggression: 0.7, strafeBias: 0.52, retreatRange: 1.2, blockChance: 0.7, dodgeChance: 0.34, pressureBias: 0.66 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.04, moveBobAmplitude: 0.08, leanAmount: 0.14, attackLunge: 0.24 },
    audio: { attackPitch: 230, hitPitch: 150, blockPitch: 260, dodgePitch: 340, ambiencePitch: 100 },
  },
  Dragon: {
    key: "Dragon",
    color: 0x7a2f22,
    health: 450,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.42, jumpStrength: 0, hoverHeight: 4.2, canStrafe: true, turnSpeed: 0.12 },
    attack: { damage: 50, range: 3.5, cooldownMs: 1000, startupMs: 220, recoveryMs: 340, arcDegrees: 95, knockback: 14, ...HEAVY_ATTACK },
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.4, blockAngleDegrees: 130, dodgeCooldownMs: 1100, dodgeDurationMs: 260, dodgeSpeedMultiplier: 1.12, stunScale: 0.82 },
    ai: { style: "flyer", preferredRange: 3.1, aggression: 0.76, strafeBias: 0.45, retreatRange: 1.9, blockChance: 0.28, dodgeChance: 0.26, pressureBias: 0.8 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.1, moveBobAmplitude: 0.1, leanAmount: 0.1, attackLunge: 0.32, dodgeTilt: 0.22 },
    audio: { attackPitch: 125, hitPitch: 95, blockPitch: 150, dodgePitch: 200, ambiencePitch: 55 },
  },
};
