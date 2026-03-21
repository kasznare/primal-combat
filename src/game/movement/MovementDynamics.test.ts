import * as CANNON from "cannon-es";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { Character } from "../../entities/Character";
import { CHARACTER_CONFIGS } from "../roster/characterConfigs";
import {
  applyDesiredHorizontalVelocity,
  isTargetWithinFieldOfView,
} from "./MovementDynamics";

function createMockCharacter(x: number, z: number, rotationY = 0): Character {
  const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(1) });
  body.position.set(x, 1, z);
  const mesh = new THREE.Group();
  mesh.position.copy(body.position as unknown as THREE.Vector3);
  mesh.rotation.y = rotationY;
  return {
    name: "Mock",
    color: 0xffffff,
    weight: 1,
    dimensions: { width: 1, height: 1, depth: 1 },
    maxVelocity: 10,
    maxAcceleration: 5,
    movementType: 0,
    mesh,
    body,
    health: 100,
    maxHealth: 100,
    healthBarContainer: {} as HTMLDivElement,
    healthBar: {} as HTMLDivElement,
    update: () => undefined,
    updateHealthBar: () => undefined,
    move: () => undefined,
    isHitFlashing: () => false,
    applyDamage: () => undefined,
    healToFull: () => undefined,
    heal: () => undefined,
    setHealthBarVisible: () => undefined,
    destroy: () => undefined,
  } as unknown as Character;
}

describe("MovementDynamics", () => {
  it("uses field of view rather than raw distance only", () => {
    const actor = createMockCharacter(0, 0, 0);
    const targetInFront = createMockCharacter(0, 4);
    const targetBehind = createMockCharacter(0, -4);

    expect(isTargetWithinFieldOfView(actor, targetInFront, 120)).toBe(true);
    expect(isTargetWithinFieldOfView(actor, targetBehind, 120)).toBe(false);
  });

  it("slows down sharp reversals instead of snapping instantly", () => {
    const character = createMockCharacter(0, 0);
    character.body.velocity.set(4, 0, 0);
    const config = CHARACTER_CONFIGS.Human;

    applyDesiredHorizontalVelocity(character, config, new THREE.Vector3(-1, 0, 0), 4, 1 / 60);

    expect(character.body.velocity.x).toBeLessThan(4);
    expect(character.body.velocity.x).toBeGreaterThan(-4);
  });
});
