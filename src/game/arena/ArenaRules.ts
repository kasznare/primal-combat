import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { SceneType } from "../../scene/SceneSelector";

export type ArenaDefinition = {
  title: string;
  effectDescription: string;
  radius: number;
  playerSpawn: THREE.Vector3;
  opponentSpawn: THREE.Vector3;
  boundaryDamagePerSecond: number;
  gravityScale: number;
  movementSpeedMultiplier: number;
  jumpMultiplier: number;
  knockbackMultiplier: number;
  healingZoneRadius?: number;
  healingPerSecond?: number;
  hazardBandHalfWidth?: number;
  hazardPeriodMs?: number;
  hazardActiveMs?: number;
  hazardDamagePerSecond?: number;
};

export type ArenaRuntimeModifiers = {
  title: string;
  effectDescription: string;
  radius: number;
  gravityScale: number;
  movementSpeedMultiplier: number;
  jumpMultiplier: number;
  knockbackMultiplier: number;
  hazardActive: boolean;
};

export const ARENA_DEFINITIONS: Record<SceneType, ArenaDefinition> = {
  Forest: {
    title: "Forest Runoff",
    effectDescription: "Center glade slowly heals both fighters.",
    radius: 24,
    playerSpawn: new THREE.Vector3(-6, 0, 0),
    opponentSpawn: new THREE.Vector3(6, 0, 0),
    boundaryDamagePerSecond: 18,
    gravityScale: 1,
    movementSpeedMultiplier: 0.98,
    jumpMultiplier: 1,
    knockbackMultiplier: 1,
    healingZoneRadius: 5.2,
    healingPerSecond: 8,
  },
  City: {
    title: "City Circuit",
    effectDescription: "The center lane surges with traffic energy every few seconds.",
    radius: 22,
    playerSpawn: new THREE.Vector3(-5.5, 0, -3),
    opponentSpawn: new THREE.Vector3(5.5, 0, 3),
    boundaryDamagePerSecond: 20,
    gravityScale: 1,
    movementSpeedMultiplier: 1.03,
    jumpMultiplier: 0.94,
    knockbackMultiplier: 1,
    hazardBandHalfWidth: 2.2,
    hazardPeriodMs: 4200,
    hazardActiveMs: 1300,
    hazardDamagePerSecond: 24,
  },
  Moon: {
    title: "Moon Basin",
    effectDescription: "Low gravity boosts jumps and makes knockback harsher.",
    radius: 26,
    playerSpawn: new THREE.Vector3(-7, 0, 2),
    opponentSpawn: new THREE.Vector3(7, 0, -2),
    boundaryDamagePerSecond: 16,
    gravityScale: 0.58,
    movementSpeedMultiplier: 1,
    jumpMultiplier: 1.4,
    knockbackMultiplier: 1.22,
  },
};

export class ArenaRules {
  public getDefinition(sceneType: SceneType): ArenaDefinition {
    return ARENA_DEFINITIONS[sceneType];
  }

  public getRuntimeModifiers(sceneType: SceneType, timestamp: number): ArenaRuntimeModifiers {
    const definition = ARENA_DEFINITIONS[sceneType];
    return {
      title: definition.title,
      effectDescription: definition.effectDescription,
      radius: definition.radius,
      gravityScale: definition.gravityScale,
      movementSpeedMultiplier: definition.movementSpeedMultiplier,
      jumpMultiplier: definition.jumpMultiplier,
      knockbackMultiplier: definition.knockbackMultiplier,
      hazardActive: this.isHazardActive(sceneType, timestamp),
    };
  }

  public enforceBounds(character: Character, sceneType: SceneType, deltaSeconds: number): void {
    const definition = ARENA_DEFINITIONS[sceneType];
    const position2d = new THREE.Vector2(character.body.position.x, character.body.position.z);
    const distance = position2d.length();
    if (distance <= definition.radius) {
      return;
    }

    const normal = position2d.normalize();
    character.body.position.x = normal.x * definition.radius;
    character.body.position.z = normal.y * definition.radius;
    character.body.velocity.x *= -0.35;
    character.body.velocity.z *= -0.35;
    character.applyDamage(definition.boundaryDamagePerSecond * deltaSeconds);
  }

  public applySceneEffects(
    character: Character,
    sceneType: SceneType,
    deltaSeconds: number,
    timestamp: number
  ): void {
    const definition = ARENA_DEFINITIONS[sceneType];
    const position2d = new THREE.Vector2(character.body.position.x, character.body.position.z);

    if (definition.healingZoneRadius && definition.healingPerSecond && position2d.length() <= definition.healingZoneRadius) {
      character.heal(definition.healingPerSecond * deltaSeconds);
    }

    if (
      definition.hazardBandHalfWidth &&
      definition.hazardDamagePerSecond &&
      this.isHazardActive(sceneType, timestamp) &&
      Math.abs(character.body.position.z) <= definition.hazardBandHalfWidth
    ) {
      character.applyDamage(definition.hazardDamagePerSecond * deltaSeconds);
      character.body.velocity.x += Math.sign(character.body.position.x || 1) * deltaSeconds * 6;
    }
  }

  private isHazardActive(sceneType: SceneType, timestamp: number): boolean {
    const definition = ARENA_DEFINITIONS[sceneType];
    if (!definition.hazardPeriodMs || !definition.hazardActiveMs) {
      return false;
    }

    const cycle = timestamp % definition.hazardPeriodMs;
    return cycle <= definition.hazardActiveMs;
  }
}
