import * as CANNON from "cannon-es";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { Character } from "../../entities/Character";
import { CHARACTER_CONFIGS } from "../roster/characterConfigs";
import { CombatSystem } from "./CombatSystem";

function createMockCharacter(name: string, x: number, z: number): Character {
  const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(1) });
  body.position.set(x, 1, z);
  return {
    name,
    color: 0xffffff,
    weight: 1,
    dimensions: { width: 1, height: 1, depth: 1 },
    maxVelocity: 10,
    maxAcceleration: 5,
    movementType: 0,
    mesh: new THREE.Group(),
    body,
    health: 100,
    maxHealth: 100,
    healthBarContainer: {} as HTMLDivElement,
    healthBar: {} as HTMLDivElement,
    update: () => undefined,
    updateHealthBar: () => undefined,
    move: () => undefined,
    isHitFlashing: () => false,
    applyDamage(amount: number) {
      this.health = Math.max(0, this.health - amount);
    },
    healToFull() {
      this.health = this.maxHealth;
    },
    heal(amount: number) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    },
    setHealthBarVisible: () => undefined,
    destroy: () => undefined,
  } as unknown as Character;
}

describe("CombatSystem", () => {
  it("applies damage after startup and transitions through attack phases", () => {
    const combatSystem = new CombatSystem();
    const attacker = createMockCharacter("Human", 0, 0);
    const target = createMockCharacter("Bear", 0, 1.4);
    attacker.mesh.position.copy(attacker.body.position as unknown as THREE.Vector3);
    target.mesh.position.copy(target.body.position as unknown as THREE.Vector3);

    const playerConfig = CHARACTER_CONFIGS.Human;
    const opponentConfig = CHARACTER_CONFIGS.Bear;

    combatSystem.resetCharacter(attacker);
    combatSystem.resetCharacter(target);
    combatSystem.startAttack(attacker, target, playerConfig, 0);

    expect(combatSystem.getPhase(attacker)).toBe("attackStartup");

    combatSystem.updateFighter(attacker, target, playerConfig, opponentConfig, 50, 1);
    expect(target.health).toBe(100);

    const events = combatSystem.updateFighter(attacker, target, playerConfig, opponentConfig, 120, 1);
    expect(events.some((event) => event.type === "attack_hit")).toBe(true);
    expect(target.health).toBeLessThan(100);
    expect(combatSystem.getPhase(attacker)).toBe("attackActive");

    combatSystem.updateFighter(attacker, target, playerConfig, opponentConfig, 260, 1);
    expect(combatSystem.getPhase(attacker)).toBe("attackRecovery");

    combatSystem.updateFighter(attacker, target, playerConfig, opponentConfig, 500, 1);
    expect(["idle", "moving"]).toContain(combatSystem.getPhase(attacker));
  });

  it("reduces damage when the defender is blocking", () => {
    const combatSystem = new CombatSystem();
    const attacker = createMockCharacter("Human", 0, 0);
    const target = createMockCharacter("Bear", 0, 1.4);
    attacker.mesh.position.copy(attacker.body.position as unknown as THREE.Vector3);
    target.mesh.position.copy(target.body.position as unknown as THREE.Vector3);
    target.mesh.rotation.y = Math.PI;

    const playerConfig = CHARACTER_CONFIGS.Human;
    const opponentConfig = CHARACTER_CONFIGS.Bear;

    combatSystem.resetCharacter(attacker);
    combatSystem.resetCharacter(target);
    combatSystem.setBlocking(target, opponentConfig, true, 0);
    combatSystem.startAttack(attacker, target, playerConfig, 0);
    const events = combatSystem.updateFighter(attacker, target, playerConfig, opponentConfig, 120, 1);

    const blockEvent = events.find((event) => event.type === "attack_blocked");
    expect(blockEvent).toBeTruthy();
    expect(target.health).toBeGreaterThan(90);
    expect(combatSystem.getPhase(target)).toBe("blocking");
  });

  it("prevents damage during dodge invulnerability", () => {
    const combatSystem = new CombatSystem();
    const attacker = createMockCharacter("Human", 0, 0);
    const target = createMockCharacter("Duck", 0, 1.2);
    attacker.mesh.position.copy(attacker.body.position as unknown as THREE.Vector3);
    target.mesh.position.copy(target.body.position as unknown as THREE.Vector3);

    const playerConfig = CHARACTER_CONFIGS.Human;
    const targetConfig = CHARACTER_CONFIGS.MallardDuck;

    combatSystem.resetCharacter(attacker);
    combatSystem.resetCharacter(target);
    combatSystem.tryDodge(target, targetConfig, new THREE.Vector3(1, 0, 0), 0);
    combatSystem.startAttack(attacker, target, playerConfig, 0);
    const events = combatSystem.updateFighter(attacker, target, playerConfig, targetConfig, 120, 1);

    expect(events.some((event) => event.type === "attack_evaded")).toBe(true);
    expect(target.health).toBe(100);
  });

  it("can apply bleed metadata on successful hits", () => {
    const combatSystem = new CombatSystem(() => 0);
    const attacker = createMockCharacter("Bear", 0, 0);
    const target = createMockCharacter("Human", 0, 1.4);
    attacker.mesh.position.copy(attacker.body.position as unknown as THREE.Vector3);
    target.mesh.position.copy(target.body.position as unknown as THREE.Vector3);

    const attackerConfig = CHARACTER_CONFIGS.Bear;
    const targetConfig = CHARACTER_CONFIGS.Human;

    combatSystem.resetCharacter(attacker);
    combatSystem.resetCharacter(target);
    combatSystem.startAttack(attacker, target, attackerConfig, 0);
    const events = combatSystem.updateFighter(attacker, target, attackerConfig, targetConfig, 190, 1);

    const hitEvent = events.find((event) => event.type === "attack_hit");
    expect(hitEvent?.bleed?.applied).toBe(true);
    expect(hitEvent?.bleed?.tickDamage).toBe(attackerConfig.attack.bleedTickDamage);
  });
});
