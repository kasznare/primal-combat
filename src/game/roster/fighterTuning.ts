import { MovementType } from "../../entities/Character";
import type {
  AiProfile,
  AnimationProfile,
  AttackInput,
  AttackProfile,
  AudioProfile,
  DefenseProfile,
  HitboxProfile,
  HurtboxProfile,
  MovementProfile,
} from "./types";

export type FighterTuning = {
  key: string;
  color: number;
  health: number;
  movementType: MovementType;
  movement: MovementProfile;
  attack: AttackProfile;
  attacks: AttackProfile[];
  defense: DefenseProfile;
  ai: AiProfile;
  animation: AnimationProfile;
  audio: AudioProfile;
};

type AttackSeed = {
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

const COMMON_HURTBOX = {
  torsoRadius: 0.6,
  torsoHeight: 1.1,
  headRadius: 0.34,
  headHeight: 1.72,
} satisfies HurtboxProfile;

const COMMON_DEFENSE = {
  blockAngleDegrees: 112,
  dodgeCooldownMs: 900,
  dodgeDurationMs: 240,
  dodgeSpeedMultiplier: 1.2,
  stunScale: 1,
} satisfies Omit<DefenseProfile, "blockDamageMultiplier" | "hurtbox">;

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
  hitstunMs: 340,
  blockstunMs: 165,
  hitstopMs: 90,
  blockHitstopMs: 44,
  chipDamage: 2,
  bleedChance: 0.18,
  bleedDurationMs: 3_800,
  bleedTickDamage: 2,
  bleedTickMs: 750,
  aiWeight: 0.58,
} satisfies Pick<
  AttackSeed,
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
  | "aiWeight"
>;

const HEAVY_ATTACK = {
  activeMs: 145,
  hitstunMs: 520,
  blockstunMs: 245,
  hitstopMs: 120,
  blockHitstopMs: 60,
  chipDamage: 4,
  bleedChance: 0.34,
  bleedDurationMs: 5_000,
  bleedTickDamage: 4,
  bleedTickMs: 820,
  aiWeight: 0.42,
} satisfies Pick<
  AttackSeed,
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
  | "aiWeight"
>;

function createAttack(
  id: string,
  label: string,
  input: AttackInput,
  seed: AttackSeed
): AttackProfile {
  return {
    id,
    label,
    input,
    ...seed,
  };
}

function createMoves(primary: AttackSeed & { id: string; label: string }, secondary: AttackSeed & { id: string; label: string }) {
  const primaryMove = createAttack(primary.id, primary.label, "primary", primary);
  const secondaryMove = createAttack(secondary.id, secondary.label, "secondary", secondary);
  return {
    attack: primaryMove,
    attacks: [primaryMove, secondaryMove],
  };
}

function makeHurtbox(
  torsoRadius: number,
  torsoHeight: number,
  headRadius = torsoRadius * 0.62,
  headHeight = torsoHeight + 0.58
): HurtboxProfile {
  return { torsoRadius, torsoHeight, headRadius, headHeight };
}

export const FIGHTER_TUNING: Record<string, FighterTuning> = {
  Human: {
    key: "Human",
    color: 0xfad6a5,
    health: 130,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "biped",
      speedMultiplier: 0.44,
      jumpStrength: 8.2,
      canStrafe: true,
      turnSpeed: 0.19,
      fieldOfViewDegrees: 154,
      accelerationResponsiveness: 2.5,
      decelerationResponsiveness: 3,
      reversePenalty: 0.46,
    },
    ...createMoves(
      {
        id: "cross",
        label: "Cross",
        damage: 16,
        range: 2.05,
        idealRange: 1.55,
        cooldownMs: 430,
        startupMs: 92,
        recoveryMs: 170,
        arcDegrees: 70,
        knockback: 5.2,
        hitbox: { forward: 1.15, up: 1.15, radius: 0.42, length: 0.55 },
        ...LIGHT_ATTACK,
      },
      {
        id: "roundhouse",
        label: "Roundhouse",
        damage: 28,
        range: 2.45,
        idealRange: 1.95,
        cooldownMs: 760,
        startupMs: 160,
        recoveryMs: 300,
        arcDegrees: 108,
        knockback: 8.6,
        chipDamage: 5,
        bleedChance: 0.24,
        bleedDurationMs: 4_600,
        bleedTickDamage: 3,
        bleedTickMs: 720,
        aiWeight: 0.34,
        hitbox: { forward: 1.32, up: 0.92, radius: 0.52, length: 0.88, lateral: 0.15 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.24, hurtbox: makeHurtbox(0.56, 1.05, 0.31, 1.68) },
    ai: { style: "duelist", preferredRange: 1.75, aggression: 0.64, strafeBias: 0.5, retreatRange: 1.08, blockChance: 0.64, dodgeChance: 0.3, pressureBias: 0.62 },
    animation: { ...COMMON_ANIMATION, rigProfile: "human" },
    audio: { attackPitch: 255, hitPitch: 170, blockPitch: 220, dodgePitch: 320, ambiencePitch: 110 },
  },
  Bear: {
    key: "Bear",
    color: 0x8b4513,
    health: 230,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "quadruped",
      speedMultiplier: 0.4,
      jumpStrength: 5.8,
      canStrafe: false,
      turnSpeed: 0.13,
      fieldOfViewDegrees: 140,
      accelerationResponsiveness: 1.95,
      decelerationResponsiveness: 2.24,
      reversePenalty: 0.34,
    },
    ...createMoves(
      {
        id: "paw-swipe",
        label: "Paw Swipe",
        damage: 24,
        range: 2.2,
        idealRange: 1.8,
        cooldownMs: 560,
        startupMs: 120,
        recoveryMs: 230,
        arcDegrees: 82,
        knockback: 6.8,
        hitbox: { forward: 1.42, up: 0.95, radius: 0.6, length: 0.7, lateral: 0.22 },
        bleedChance: 0.26,
        bleedDurationMs: 4_200,
        bleedTickDamage: 3,
        bleedTickMs: 700,
        ...LIGHT_ATTACK,
      },
      {
        id: "bite-lunge",
        label: "Bite Lunge",
        damage: 34,
        range: 2.65,
        idealRange: 2.15,
        cooldownMs: 840,
        startupMs: 180,
        recoveryMs: 320,
        arcDegrees: 74,
        knockback: 10.2,
        hitbox: { forward: 1.76, up: 1.1, radius: 0.56, length: 0.62 },
        chipDamage: 5,
        bleedChance: 0.46,
        bleedDurationMs: 5_600,
        bleedTickDamage: 4.5,
        bleedTickMs: 760,
        aiWeight: 0.4,
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.36, dodgeCooldownMs: 1200, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.05, stunScale: 0.92, hurtbox: makeHurtbox(0.82, 0.98, 0.38, 1.48) },
    ai: { style: "bruiser", preferredRange: 2.05, aggression: 0.84, strafeBias: 0.12, retreatRange: 1.18, blockChance: 0.24, dodgeChance: 0.06, pressureBias: 0.92 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.04, moveBobAmplitude: 0.08, leanAmount: 0.1, attackLunge: 0.35, rigProfile: "bear" },
    audio: { attackPitch: 160, hitPitch: 120, blockPitch: 180, dodgePitch: 150, ambiencePitch: 70 },
  },
  MallardDuck: {
    key: "MallardDuck",
    color: 0x668c44,
    health: 78,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.58, jumpStrength: 0, hoverHeight: 2.2, canStrafe: true, turnSpeed: 0.22 },
    ...createMoves(
      {
        id: "peck",
        label: "Peck",
        damage: 9,
        range: 1.28,
        idealRange: 1.02,
        cooldownMs: 280,
        startupMs: 64,
        recoveryMs: 120,
        arcDegrees: 92,
        knockback: 2.2,
        hitbox: { forward: 0.78, up: 0.82, radius: 0.25, length: 0.25 },
        bleedChance: 0.1,
        bleedDurationMs: 2_800,
        bleedTickDamage: 1,
        bleedTickMs: 780,
        ...LIGHT_ATTACK,
      },
      {
        id: "wing-buffet",
        label: "Wing Buffet",
        damage: 15,
        range: 1.75,
        idealRange: 1.35,
        cooldownMs: 620,
        startupMs: 110,
        recoveryMs: 210,
        arcDegrees: 128,
        knockback: 4.8,
        chipDamage: 3,
        bleedChance: 0.18,
        bleedDurationMs: 3_300,
        bleedTickDamage: 2,
        bleedTickMs: 760,
        aiWeight: 0.35,
        hitbox: { forward: 0.92, up: 0.88, radius: 0.38, length: 0.72 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.42, dodgeCooldownMs: 680, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.5, stunScale: 1.1, hurtbox: makeHurtbox(0.34, 0.7, 0.2, 1.04) },
    ai: { style: "flyer", preferredRange: 1.24, aggression: 0.54, strafeBias: 0.68, retreatRange: 0.82, blockChance: 0.2, dodgeChance: 0.52, pressureBias: 0.42 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.14, moveBobAmplitude: 0.08, attackLunge: 0.16, dodgeTilt: 0.44, rigProfile: "winged" },
    audio: { attackPitch: 480, hitPitch: 310, blockPitch: 360, dodgePitch: 540, ambiencePitch: 250 },
  },
  Cheetah: {
    key: "Cheetah",
    color: 0xd2b48c,
    health: 118,
    movementType: MovementType.Grounded,
    movement: { archetype: "quadruped", speedMultiplier: 0.54, jumpStrength: 6.5, canStrafe: false, turnSpeed: 0.17 },
    ...createMoves(
      {
        id: "rake",
        label: "Rake",
        damage: 18,
        range: 1.9,
        idealRange: 1.45,
        cooldownMs: 360,
        startupMs: 84,
        recoveryMs: 160,
        arcDegrees: 72,
        knockback: 4.6,
        hitbox: { forward: 1.2, up: 0.82, radius: 0.34, length: 0.56, lateral: 0.12 },
        bleedChance: 0.22,
        bleedDurationMs: 4_000,
        bleedTickDamage: 2.4,
        bleedTickMs: 700,
        ...LIGHT_ATTACK,
      },
      {
        id: "pounce",
        label: "Pounce",
        damage: 24,
        range: 2.45,
        idealRange: 1.95,
        cooldownMs: 720,
        startupMs: 135,
        recoveryMs: 250,
        arcDegrees: 80,
        knockback: 7.4,
        chipDamage: 4,
        bleedChance: 0.32,
        bleedDurationMs: 4_600,
        bleedTickDamage: 3,
        bleedTickMs: 760,
        aiWeight: 0.39,
        hitbox: { forward: 1.45, up: 0.9, radius: 0.44, length: 0.84 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.3, dodgeCooldownMs: 760, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.42, stunScale: 0.95, hurtbox: makeHurtbox(0.48, 0.82, 0.24, 1.22) },
    ai: { style: "skirmisher", preferredRange: 1.62, aggression: 0.8, strafeBias: 0.18, retreatRange: 1.02, blockChance: 0.22, dodgeChance: 0.45, pressureBias: 0.86 },
    animation: { ...COMMON_ANIMATION, moveBobAmplitude: 0.16, leanAmount: 0.22, attackLunge: 0.3, rigProfile: "quadruped" },
    audio: { attackPitch: 330, hitPitch: 210, blockPitch: 250, dodgePitch: 430, ambiencePitch: 160 },
  },
  Housefly: {
    key: "Housefly",
    color: 0x111111,
    health: 36,
    movementType: MovementType.Flying,
    movement: { archetype: "tiny", speedMultiplier: 1.02, jumpStrength: 0, hoverHeight: 1.8, canStrafe: true, turnSpeed: 0.27 },
    ...createMoves(
      {
        id: "sting-dart",
        label: "Sting Dart",
        damage: 5,
        range: 0.95,
        idealRange: 0.78,
        cooldownMs: 220,
        startupMs: 34,
        recoveryMs: 84,
        arcDegrees: 108,
        knockback: 1.1,
        hitbox: { forward: 0.46, up: 0.42, radius: 0.12, length: 0.18 },
        bleedChance: 0.14,
        bleedDurationMs: 2_600,
        bleedTickDamage: 1,
        bleedTickMs: 700,
        ...LIGHT_ATTACK,
      },
      {
        id: "swarm-scrape",
        label: "Swarm Scrape",
        damage: 8,
        range: 1.22,
        idealRange: 1,
        cooldownMs: 480,
        startupMs: 70,
        recoveryMs: 130,
        arcDegrees: 120,
        knockback: 2,
        chipDamage: 3,
        bleedChance: 0.28,
        bleedDurationMs: 3_400,
        bleedTickDamage: 2,
        bleedTickMs: 680,
        aiWeight: 0.33,
        hitbox: { forward: 0.6, up: 0.48, radius: 0.18, length: 0.36 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.55, dodgeCooldownMs: 500, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.85, stunScale: 1.3, hurtbox: makeHurtbox(0.16, 0.32, 0.08, 0.56) },
    ai: { style: "trickster", preferredRange: 0.94, aggression: 0.54, strafeBias: 0.78, retreatRange: 0.62, blockChance: 0.08, dodgeChance: 0.76, pressureBias: 0.46 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.18, idleBobSpeed: 2.2, moveBobAmplitude: 0.04, attackLunge: 0.1, dodgeTilt: 0.56, rigProfile: "tiny" },
    audio: { attackPitch: 620, hitPitch: 380, blockPitch: 420, dodgePitch: 760, ambiencePitch: 320 },
  },
  SedanCar: {
    key: "SedanCar",
    color: 0x2956d1,
    health: 275,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "vehicle",
      speedMultiplier: 0.34,
      jumpStrength: 0,
      canStrafe: false,
      turnSpeed: 0.08,
      fieldOfViewDegrees: 118,
      accelerationResponsiveness: 1.8,
      decelerationResponsiveness: 2,
      reversePenalty: 0.24,
    },
    ...createMoves(
      {
        id: "bumper-check",
        label: "Bumper Check",
        damage: 24,
        range: 2.35,
        idealRange: 1.9,
        cooldownMs: 500,
        startupMs: 90,
        recoveryMs: 180,
        arcDegrees: 46,
        knockback: 6.6,
        hitbox: { forward: 1.55, up: 0.78, radius: 0.62, length: 0.6 },
        bleedChance: 0.08,
        bleedDurationMs: 2_600,
        bleedTickDamage: 1.5,
        bleedTickMs: 840,
        ...LIGHT_ATTACK,
      },
      {
        id: "handbrake-swing",
        label: "Handbrake Swing",
        damage: 38,
        range: 3.05,
        idealRange: 2.45,
        cooldownMs: 960,
        startupMs: 180,
        recoveryMs: 360,
        arcDegrees: 86,
        knockback: 12.4,
        chipDamage: 6,
        bleedChance: 0.12,
        bleedDurationMs: 3_200,
        bleedTickDamage: 2,
        bleedTickMs: 860,
        aiWeight: 0.44,
        hitbox: { forward: 1.8, up: 0.82, radius: 0.68, length: 1.25 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.48, blockAngleDegrees: 135, dodgeCooldownMs: 1100, dodgeDurationMs: 160, dodgeSpeedMultiplier: 1.08, stunScale: 0.84, hurtbox: makeHurtbox(0.82, 0.86, 0.42, 1.2) },
    ai: { style: "charger", preferredRange: 2.45, aggression: 0.7, strafeBias: 0.05, retreatRange: 1.85, blockChance: 0.14, dodgeChance: 0.12, pressureBias: 0.86 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.04, leanAmount: 0.08, attackLunge: 0.22, dodgeTilt: 0.12, rigProfile: "vehicle" },
    audio: { attackPitch: 140, hitPitch: 95, blockPitch: 150, dodgePitch: 180, ambiencePitch: 60 },
  },
  SportMotorcycle: {
    key: "SportMotorcycle",
    color: 0xe43c33,
    health: 170,
    movementType: MovementType.Grounded,
    movement: {
      archetype: "vehicle",
      speedMultiplier: 0.42,
      jumpStrength: 0,
      canStrafe: false,
      turnSpeed: 0.11,
      fieldOfViewDegrees: 124,
      accelerationResponsiveness: 2.18,
      decelerationResponsiveness: 2.25,
      reversePenalty: 0.28,
    },
    ...createMoves(
      {
        id: "clip",
        label: "Clip",
        damage: 18,
        range: 2.1,
        idealRange: 1.75,
        cooldownMs: 360,
        startupMs: 84,
        recoveryMs: 155,
        arcDegrees: 54,
        knockback: 5.8,
        hitbox: { forward: 1.32, up: 0.76, radius: 0.44, length: 0.72 },
        ...LIGHT_ATTACK,
      },
      {
        id: "rear-wheel-snap",
        label: "Rear Wheel Snap",
        damage: 29,
        range: 2.55,
        idealRange: 2,
        cooldownMs: 760,
        startupMs: 135,
        recoveryMs: 270,
        arcDegrees: 74,
        knockback: 9.2,
        chipDamage: 5,
        bleedChance: 0.14,
        bleedDurationMs: 3_400,
        bleedTickDamage: 2,
        bleedTickMs: 820,
        aiWeight: 0.38,
        hitbox: { forward: 1.55, up: 0.78, radius: 0.48, length: 1 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.32, blockAngleDegrees: 120, dodgeCooldownMs: 760, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.3, stunScale: 0.96, hurtbox: makeHurtbox(0.52, 0.78, 0.26, 1.1) },
    ai: { style: "charger", preferredRange: 2.18, aggression: 0.74, strafeBias: 0.08, retreatRange: 1.45, blockChance: 0.1, dodgeChance: 0.3, pressureBias: 0.82 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.06, leanAmount: 0.12, attackLunge: 0.18, rigProfile: "vehicle" },
    audio: { attackPitch: 200, hitPitch: 120, blockPitch: 180, dodgePitch: 280, ambiencePitch: 82 },
  },
  Bicycle: {
    key: "Bicycle",
    color: 0x00c86a,
    health: 86,
    movementType: MovementType.Grounded,
    movement: { archetype: "vehicle", speedMultiplier: 0.38, jumpStrength: 0, canStrafe: false, turnSpeed: 0.14 },
    ...createMoves(
      {
        id: "pedal-jab",
        label: "Pedal Jab",
        damage: 10,
        range: 1.75,
        idealRange: 1.4,
        cooldownMs: 320,
        startupMs: 76,
        recoveryMs: 130,
        arcDegrees: 58,
        knockback: 3.4,
        hitbox: { forward: 1.05, up: 0.76, radius: 0.34, length: 0.58 },
        ...LIGHT_ATTACK,
      },
      {
        id: "frame-whip",
        label: "Frame Whip",
        damage: 18,
        range: 2.15,
        idealRange: 1.7,
        cooldownMs: 620,
        startupMs: 120,
        recoveryMs: 220,
        arcDegrees: 92,
        knockback: 6.2,
        chipDamage: 4,
        bleedChance: 0.2,
        bleedDurationMs: 3_600,
        bleedTickDamage: 2,
        bleedTickMs: 760,
        aiWeight: 0.35,
        hitbox: { forward: 1.12, up: 0.84, radius: 0.42, length: 0.98 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.28, dodgeCooldownMs: 640, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.4, stunScale: 1.08, hurtbox: makeHurtbox(0.44, 0.76, 0.22, 1.02) },
    ai: { style: "skirmisher", preferredRange: 1.8, aggression: 0.58, strafeBias: 0.05, retreatRange: 1.1, blockChance: 0.16, dodgeChance: 0.44, pressureBias: 0.48 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.03, moveBobAmplitude: 0.05, leanAmount: 0.1, attackLunge: 0.16, rigProfile: "vehicle" },
    audio: { attackPitch: 280, hitPitch: 170, blockPitch: 210, dodgePitch: 340, ambiencePitch: 120 },
  },
  GiantFly: {
    key: "GiantFly",
    color: 0x88ff88,
    health: 136,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.5, jumpStrength: 0, hoverHeight: 2.8, canStrafe: true, turnSpeed: 0.21 },
    ...createMoves(
      {
        id: "mandible-jab",
        label: "Mandible Jab",
        damage: 16,
        range: 1.65,
        idealRange: 1.32,
        cooldownMs: 360,
        startupMs: 64,
        recoveryMs: 140,
        arcDegrees: 94,
        knockback: 4.2,
        hitbox: { forward: 0.96, up: 0.88, radius: 0.28, length: 0.34 },
        bleedChance: 0.2,
        bleedDurationMs: 3_800,
        bleedTickDamage: 2,
        bleedTickMs: 720,
        ...LIGHT_ATTACK,
      },
      {
        id: "dive-rend",
        label: "Dive Rend",
        damage: 24,
        range: 2.15,
        idealRange: 1.72,
        cooldownMs: 700,
        startupMs: 120,
        recoveryMs: 220,
        arcDegrees: 88,
        knockback: 6.8,
        chipDamage: 4,
        bleedChance: 0.34,
        bleedDurationMs: 4_700,
        bleedTickDamage: 3,
        bleedTickMs: 740,
        aiWeight: 0.39,
        hitbox: { forward: 1.12, up: 0.92, radius: 0.36, length: 0.88 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.34, dodgeCooldownMs: 620, dodgeDurationMs: 220, dodgeSpeedMultiplier: 1.48, stunScale: 1.04, hurtbox: makeHurtbox(0.42, 0.78, 0.2, 1.12) },
    ai: { style: "flyer", preferredRange: 1.54, aggression: 0.68, strafeBias: 0.62, retreatRange: 1.02, blockChance: 0.14, dodgeChance: 0.58, pressureBias: 0.68 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.16, idleBobSpeed: 1.8, moveBobAmplitude: 0.06, attackLunge: 0.18, dodgeTilt: 0.48, rigProfile: "winged" },
    audio: { attackPitch: 440, hitPitch: 280, blockPitch: 340, dodgePitch: 530, ambiencePitch: 230 },
  },
  SentientVolcano: {
    key: "SentientVolcano",
    color: 0xff5500,
    health: 390,
    movementType: MovementType.Grounded,
    movement: { archetype: "colossus", speedMultiplier: 0.23, jumpStrength: 0, canStrafe: false, turnSpeed: 0.06 },
    ...createMoves(
      {
        id: "magma-pulse",
        label: "Magma Pulse",
        damage: 28,
        range: 2.8,
        idealRange: 2.25,
        cooldownMs: 640,
        startupMs: 145,
        recoveryMs: 230,
        arcDegrees: 110,
        knockback: 7.8,
        chipDamage: 4,
        bleedChance: 0.26,
        bleedDurationMs: 4_200,
        bleedTickDamage: 2.6,
        bleedTickMs: 720,
        hitbox: { forward: 1.4, up: 1.4, radius: 0.88, length: 1.2 },
        ...LIGHT_ATTACK,
      },
      {
        id: "lava-burst",
        label: "Lava Burst",
        damage: 44,
        range: 3.5,
        idealRange: 2.95,
        cooldownMs: 1180,
        startupMs: 260,
        recoveryMs: 400,
        arcDegrees: 118,
        knockback: 12,
        chipDamage: 7,
        bleedChance: 0.44,
        bleedDurationMs: 5_600,
        bleedTickDamage: 4.8,
        bleedTickMs: 780,
        aiWeight: 0.46,
        hitbox: { forward: 1.8, up: 1.65, radius: 1.05, length: 1.8 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.56, blockAngleDegrees: 145, dodgeCooldownMs: 1500, dodgeDurationMs: 120, dodgeSpeedMultiplier: 0.9, stunScale: 0.72, hurtbox: makeHurtbox(1.08, 1.5, 0.48, 2.1) },
    ai: { style: "bruiser", preferredRange: 2.95, aggression: 0.72, strafeBias: 0.04, retreatRange: 1.9, blockChance: 0.1, dodgeChance: 0.02, pressureBias: 0.9 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.02, moveBobAmplitude: 0.04, leanAmount: 0.06, attackLunge: 0.18, hitTilt: 0.1, rigProfile: "colossus" },
    audio: { attackPitch: 90, hitPitch: 75, blockPitch: 110, dodgePitch: 95, ambiencePitch: 45 },
  },
  WalkingPencil: {
    key: "WalkingPencil",
    color: 0xffdd55,
    health: 48,
    movementType: MovementType.Grounded,
    movement: { archetype: "tiny", speedMultiplier: 0.58, jumpStrength: 4.8, canStrafe: true, turnSpeed: 0.25 },
    ...createMoves(
      {
        id: "jab",
        label: "Jab",
        damage: 8,
        range: 1.05,
        idealRange: 0.82,
        cooldownMs: 240,
        startupMs: 48,
        recoveryMs: 100,
        arcDegrees: 70,
        knockback: 2.2,
        hitbox: { forward: 0.58, up: 0.66, radius: 0.18, length: 0.28 },
        ...LIGHT_ATTACK,
      },
      {
        id: "eraser-slap",
        label: "Eraser Slap",
        damage: 13,
        range: 1.4,
        idealRange: 1.1,
        cooldownMs: 520,
        startupMs: 90,
        recoveryMs: 165,
        arcDegrees: 96,
        knockback: 4.4,
        chipDamage: 3,
        bleedChance: 0.12,
        bleedDurationMs: 3_000,
        bleedTickDamage: 1,
        bleedTickMs: 840,
        aiWeight: 0.34,
        hitbox: { forward: 0.66, up: 0.84, radius: 0.24, length: 0.6 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.38, dodgeCooldownMs: 560, dodgeDurationMs: 180, dodgeSpeedMultiplier: 1.7, stunScale: 1.22, hurtbox: makeHurtbox(0.2, 0.58, 0.12, 0.92) },
    ai: { style: "trickster", preferredRange: 1.02, aggression: 0.62, strafeBias: 0.72, retreatRange: 0.72, blockChance: 0.2, dodgeChance: 0.7, pressureBias: 0.56 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.1, idleBobSpeed: 2.1, moveBobAmplitude: 0.12, attackLunge: 0.22, dodgeTilt: 0.62, rigProfile: "tiny" },
    audio: { attackPitch: 560, hitPitch: 320, blockPitch: 390, dodgePitch: 640, ambiencePitch: 280 },
  },
  HumanoidRobot: {
    key: "HumanoidRobot",
    color: 0x7d8a9e,
    health: 190,
    movementType: MovementType.Grounded,
    movement: { archetype: "biped", speedMultiplier: 0.4, jumpStrength: 6.8, canStrafe: true, turnSpeed: 0.17 },
    ...createMoves(
      {
        id: "servo-jab",
        label: "Servo Jab",
        damage: 20,
        range: 2.1,
        idealRange: 1.6,
        cooldownMs: 420,
        startupMs: 86,
        recoveryMs: 150,
        arcDegrees: 72,
        knockback: 5.8,
        chipDamage: 3,
        bleedChance: 0.08,
        bleedDurationMs: 2_400,
        bleedTickDamage: 1,
        bleedTickMs: 820,
        hitbox: { forward: 1.18, up: 1.1, radius: 0.42, length: 0.48 },
        ...LIGHT_ATTACK,
      },
      {
        id: "piston-kick",
        label: "Piston Kick",
        damage: 30,
        range: 2.45,
        idealRange: 1.95,
        cooldownMs: 760,
        startupMs: 140,
        recoveryMs: 260,
        arcDegrees: 94,
        knockback: 9,
        chipDamage: 5,
        bleedChance: 0.12,
        bleedDurationMs: 2_800,
        bleedTickDamage: 1.2,
        bleedTickMs: 860,
        aiWeight: 0.4,
        hitbox: { forward: 1.34, up: 0.95, radius: 0.48, length: 0.84 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.2, blockAngleDegrees: 118, dodgeCooldownMs: 820, dodgeDurationMs: 210, dodgeSpeedMultiplier: 1.26, stunScale: 0.9, hurtbox: makeHurtbox(0.6, 1.1, 0.28, 1.68) },
    ai: { style: "duelist", preferredRange: 1.95, aggression: 0.72, strafeBias: 0.52, retreatRange: 1.16, blockChance: 0.72, dodgeChance: 0.34, pressureBias: 0.7 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.04, moveBobAmplitude: 0.08, leanAmount: 0.14, attackLunge: 0.24, rigProfile: "humanoid" },
    audio: { attackPitch: 230, hitPitch: 150, blockPitch: 260, dodgePitch: 340, ambiencePitch: 100 },
  },
  Dragon: {
    key: "Dragon",
    color: 0x7a2f22,
    health: 460,
    movementType: MovementType.Flying,
    movement: { archetype: "flying", speedMultiplier: 0.44, jumpStrength: 0, hoverHeight: 4.2, canStrafe: true, turnSpeed: 0.12 },
    ...createMoves(
      {
        id: "claw-rake",
        label: "Claw Rake",
        damage: 30,
        range: 2.9,
        idealRange: 2.35,
        cooldownMs: 540,
        startupMs: 110,
        recoveryMs: 180,
        arcDegrees: 88,
        knockback: 7.5,
        hitbox: { forward: 1.8, up: 1.6, radius: 0.58, length: 0.95 },
        bleedChance: 0.3,
        bleedDurationMs: 4_400,
        bleedTickDamage: 3,
        bleedTickMs: 740,
        ...LIGHT_ATTACK,
      },
      {
        id: "maw-crush",
        label: "Maw Crush",
        damage: 52,
        range: 3.7,
        idealRange: 3.1,
        cooldownMs: 1060,
        startupMs: 230,
        recoveryMs: 360,
        arcDegrees: 98,
        knockback: 14.5,
        chipDamage: 6,
        bleedChance: 0.42,
        bleedDurationMs: 5_400,
        bleedTickDamage: 5,
        bleedTickMs: 780,
        aiWeight: 0.47,
        hitbox: { forward: 2.2, up: 1.8, radius: 0.72, length: 1.12 },
        ...HEAVY_ATTACK,
      }
    ),
    defense: { ...COMMON_DEFENSE, blockDamageMultiplier: 0.4, blockAngleDegrees: 130, dodgeCooldownMs: 1100, dodgeDurationMs: 260, dodgeSpeedMultiplier: 1.12, stunScale: 0.82, hurtbox: makeHurtbox(0.88, 1.6, 0.42, 2.22) },
    ai: { style: "flyer", preferredRange: 3.1, aggression: 0.78, strafeBias: 0.45, retreatRange: 1.95, blockChance: 0.26, dodgeChance: 0.26, pressureBias: 0.84 },
    animation: { ...COMMON_ANIMATION, idleBobAmplitude: 0.1, moveBobAmplitude: 0.1, leanAmount: 0.1, attackLunge: 0.32, dodgeTilt: 0.22, rigProfile: "winged" },
    audio: { attackPitch: 125, hitPitch: 95, blockPitch: 150, dodgePitch: 200, ambiencePitch: 55 },
  },
};
