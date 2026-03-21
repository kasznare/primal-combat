import * as THREE from "three";
import type { Character } from "../../entities/Character";
import { isTargetWithinFieldOfView } from "../movement/MovementDynamics";
import type { CharacterConfig } from "../roster/types";
import type { CombatEvent, FighterCombatState, FighterPhase } from "./types";

function createDefaultState(): FighterCombatState {
  return {
    phase: "idle",
    phaseEndsAt: null,
    attackTarget: null,
    attackResolved: false,
    blockHeld: false,
    invulnerableUntil: Number.NEGATIVE_INFINITY,
    dodgeCooldownUntil: Number.NEGATIVE_INFINITY,
    lastAttackAt: Number.NEGATIVE_INFINITY,
    lastHitAt: Number.NEGATIVE_INFINITY,
  };
}

export class CombatSystem {
  private states = new WeakMap<Character, FighterCombatState>();

  constructor(private randomFn: () => number = Math.random) {}

  public resetCharacter(character: Character): void {
    this.states.set(character, createDefaultState());
  }

  public getState(character: Character): FighterCombatState {
    return { ...this.ensureState(character) };
  }

  public getPhase(character: Character): FighterPhase {
    return this.ensureState(character).phase;
  }

  public canMove(character: Character): boolean {
    const phase = this.ensureState(character).phase;
    return !["attackStartup", "attackActive", "stunned", "defeated"].includes(phase);
  }

  public getMovementScale(character: Character): number {
    const phase = this.ensureState(character).phase;
    if (phase === "blocking") {
      return 0.42;
    }
    if (phase === "attackRecovery") {
      return 0.32;
    }
    if (phase === "dodging") {
      return 1.2;
    }
    if (phase === "stunned" || phase === "defeated") {
      return 0;
    }
    return 1;
  }

  public setBlocking(
    character: Character,
    config: CharacterConfig,
    active: boolean,
    timestamp: number
  ): CombatEvent | null {
    const state = this.ensureState(character);
    if (character.health <= 0) {
      state.phase = "defeated";
      return null;
    }

    if (!active) {
      const hadBlock = state.blockHeld;
      state.blockHeld = false;
      if (hadBlock && state.phase === "blocking" && (state.phaseEndsAt ?? timestamp) <= timestamp) {
        this.resetToLocomotion(character, state);
        return { type: "block_end", target: character, phase: state.phase };
      }
      return null;
    }

    if (["attackStartup", "attackActive", "attackRecovery", "stunned", "dodging", "defeated"].includes(state.phase)) {
      return null;
    }

    state.blockHeld = true;
    if (state.phase !== "blocking") {
      state.phase = "blocking";
      state.phaseEndsAt = null;
      return { type: "block_start", target: character, phase: "blocking" };
    }

    if (state.phaseEndsAt !== null && state.phaseEndsAt <= timestamp) {
      state.phaseEndsAt = null;
    }

    return null;
  }

  public tryDodge(
    character: Character,
    config: CharacterConfig,
    direction: THREE.Vector3,
    timestamp: number
  ): CombatEvent | null {
    const state = this.ensureState(character);
    if (character.health <= 0) {
      state.phase = "defeated";
      return null;
    }
    if (["attackStartup", "attackActive", "attackRecovery", "stunned", "dodging", "defeated"].includes(state.phase)) {
      return null;
    }
    if (timestamp < state.dodgeCooldownUntil) {
      return null;
    }

    const dodgeDirection = direction.clone();
    dodgeDirection.y = 0;
    if (dodgeDirection.lengthSq() === 0) {
      dodgeDirection.set(Math.sin(character.mesh.rotation.y), 0, Math.cos(character.mesh.rotation.y));
    }
    dodgeDirection.normalize();

    const dodgeSpeed = config.stats.maxVelocity * config.defense.dodgeSpeedMultiplier;
    character.body.velocity.x = dodgeDirection.x * dodgeSpeed;
    character.body.velocity.z = dodgeDirection.z * dodgeSpeed;
    if (config.movement.archetype === "flying") {
      character.body.velocity.y = Math.max(character.body.velocity.y, dodgeSpeed * 0.16);
    }

    state.phase = "dodging";
    state.phaseEndsAt = timestamp + config.defense.dodgeDurationMs;
    state.invulnerableUntil = state.phaseEndsAt;
    state.dodgeCooldownUntil = timestamp + config.defense.dodgeCooldownMs;
    state.blockHeld = false;
    return { type: "dodge", target: character, phase: "dodging" };
  }

  public startAttack(
    attacker: Character,
    target: Character,
    config: CharacterConfig,
    timestamp: number
  ): CombatEvent | null {
    const state = this.ensureState(attacker);
    if (!this.canStartAttack(attacker, config, timestamp)) {
      return null;
    }

    const distance = attacker.mesh.position.distanceTo(target.mesh.position);
    const startFov = Math.max(config.attack.arcDegrees + 12, config.movement.fieldOfViewDegrees ?? 0);
    if (distance > config.attack.range * 1.15 || !isTargetWithinFieldOfView(attacker, target, startFov)) {
      return null;
    }

    state.phase = "attackStartup";
    state.phaseEndsAt = timestamp + config.attack.startupMs;
    state.attackTarget = target;
    state.attackResolved = false;
    state.blockHeld = false;
    state.lastAttackAt = timestamp;

    const toTarget = new THREE.Vector3().subVectors(target.mesh.position, attacker.mesh.position);
    attacker.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);

    return { type: "attack_start", attacker, target, phase: "attackStartup" };
  }

  public updateFighter(
    actor: Character,
    target: Character,
    actorConfig: CharacterConfig,
    targetConfig: CharacterConfig,
    timestamp: number,
    knockbackScale = 1
  ): CombatEvent[] {
    const events: CombatEvent[] = [];
    const state = this.ensureState(actor);

    if (actor.health <= 0) {
      if (state.phase !== "defeated") {
        state.phase = "defeated";
        state.phaseEndsAt = null;
        events.push({ type: "state_change", target: actor, phase: "defeated" });
      }
      return events;
    }

    if (state.phase === "attackStartup" && state.phaseEndsAt !== null && timestamp >= state.phaseEndsAt) {
      state.phase = "attackActive";
      state.phaseEndsAt = timestamp + actorConfig.attack.activeMs;
      events.push({ type: "state_change", target: actor, phase: "attackActive" });
    }

    if (state.phase === "attackActive" && !state.attackResolved) {
      events.push(this.resolveAttack(actor, target, actorConfig, targetConfig, timestamp, knockbackScale));
      state.attackResolved = true;
    }

    if (state.phase === "attackActive" && state.phaseEndsAt !== null && timestamp >= state.phaseEndsAt) {
      state.phase = "attackRecovery";
      state.phaseEndsAt = timestamp + actorConfig.attack.recoveryMs;
      events.push({ type: "state_change", target: actor, phase: "attackRecovery" });
    }

    if (["attackRecovery", "stunned", "dodging"].includes(state.phase) && state.phaseEndsAt !== null && timestamp >= state.phaseEndsAt) {
      this.resetToLocomotion(actor, state);
      events.push({ type: "state_change", target: actor, phase: state.phase });
    }

    if (state.phase === "blocking" && !state.blockHeld && (state.phaseEndsAt ?? timestamp) <= timestamp) {
      this.resetToLocomotion(actor, state);
      events.push({ type: "block_end", target: actor, phase: state.phase });
    }

    if (["idle", "moving"].includes(state.phase)) {
      this.resetToLocomotion(actor, state);
    }

    return events;
  }

  public isDodgeReady(character: Character, timestamp: number): boolean {
    return timestamp >= this.ensureState(character).dodgeCooldownUntil;
  }

  public getCooldownProgress(
    character: Character,
    config: CharacterConfig,
    timestamp: number
  ): number {
    const state = this.ensureState(character);
    const elapsed = timestamp - state.lastAttackAt;
    if (!Number.isFinite(elapsed)) {
      return 1;
    }
    return THREE.MathUtils.clamp(elapsed / config.attack.cooldownMs, 0, 1);
  }

  private canStartAttack(attacker: Character, config: CharacterConfig, timestamp: number): boolean {
    const state = this.ensureState(attacker);
    if (attacker.health <= 0) {
      state.phase = "defeated";
      return false;
    }
    if (["attackStartup", "attackActive", "attackRecovery", "stunned", "dodging", "defeated"].includes(state.phase)) {
      return false;
    }
    return timestamp - state.lastAttackAt >= config.attack.cooldownMs;
  }

  private resolveAttack(
    attacker: Character,
    target: Character,
    attackerConfig: CharacterConfig,
    targetConfig: CharacterConfig,
    timestamp: number,
    knockbackScale: number
  ): CombatEvent {
    const state = this.ensureState(target);
    if (target.health <= 0) {
      state.phase = "defeated";
      return { type: "attack_whiff", attacker, target };
    }

    const toTarget = new THREE.Vector3().subVectors(target.mesh.position, attacker.mesh.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (distance > attackerConfig.attack.range || distance === 0) {
      return { type: "attack_whiff", attacker, target };
    }

    toTarget.normalize();
    const forward = new THREE.Vector3(Math.sin(attacker.mesh.rotation.y), 0, Math.cos(attacker.mesh.rotation.y));
    const angle = THREE.MathUtils.radToDeg(forward.angleTo(toTarget));
    if (angle > attackerConfig.attack.arcDegrees / 2 && distance > attackerConfig.attack.range * 0.72) {
      return { type: "attack_whiff", attacker, target };
    }

    if (timestamp < state.invulnerableUntil) {
      return {
        type: "attack_evaded",
        attacker,
        target,
        hitstopMs: Math.round(attackerConfig.attack.blockHitstopMs * 0.65),
      };
    }

    const blocked = this.isBlockingHit(target, attacker, targetConfig);
    const damage = blocked
      ? Math.max(attackerConfig.attack.chipDamage, attackerConfig.attack.damage * targetConfig.defense.blockDamageMultiplier)
      : attackerConfig.attack.damage;
    target.applyDamage(damage);
    state.lastHitAt = timestamp;

    const knockback = attackerConfig.attack.knockback * knockbackScale * (blocked ? 0.32 : 1);
    target.body.velocity.x += toTarget.x * knockback;
    target.body.velocity.z += toTarget.z * knockback;
    target.body.velocity.y = Math.max(target.body.velocity.y, knockback * (blocked ? 0.08 : 0.16));

    if (blocked) {
      state.phase = "blocking";
      state.phaseEndsAt = timestamp + attackerConfig.attack.blockstunMs;
      return {
        type: "attack_blocked",
        attacker,
        target,
        damage,
        hitstopMs: attackerConfig.attack.blockHitstopMs,
        phase: state.phase,
      };
    }

    state.phase = "stunned";
    state.phaseEndsAt = timestamp + attackerConfig.attack.hitstunMs * targetConfig.defense.stunScale;
    state.blockHeld = false;
    const bleedApplied = this.randomFn() < attackerConfig.attack.bleedChance;
    return {
      type: "attack_hit",
      attacker,
      target,
      damage,
      hitstopMs: attackerConfig.attack.hitstopMs,
      phase: state.phase,
      bleed: {
        applied: bleedApplied,
        chance: attackerConfig.attack.bleedChance,
        durationMs: attackerConfig.attack.bleedDurationMs,
        tickDamage: attackerConfig.attack.bleedTickDamage,
        tickMs: attackerConfig.attack.bleedTickMs,
      },
    };
  }

  private isBlockingHit(target: Character, attacker: Character, targetConfig: CharacterConfig): boolean {
    const state = this.ensureState(target);
    if (state.phase !== "blocking") {
      return false;
    }

    const toAttacker = new THREE.Vector3().subVectors(attacker.mesh.position, target.mesh.position);
    toAttacker.y = 0;
    if (toAttacker.lengthSq() === 0) {
      return true;
    }
    toAttacker.normalize();
    const forward = new THREE.Vector3(Math.sin(target.mesh.rotation.y), 0, Math.cos(target.mesh.rotation.y));
    const angle = THREE.MathUtils.radToDeg(forward.angleTo(toAttacker));
    return angle <= targetConfig.defense.blockAngleDegrees / 2;
  }

  private resetToLocomotion(character: Character, state: FighterCombatState): void {
    const speed = Math.hypot(character.body.velocity.x, character.body.velocity.z);
    state.phase = speed > 0.2 ? "moving" : "idle";
    state.phaseEndsAt = null;
    state.attackTarget = null;
    state.attackResolved = false;
  }

  private ensureState(character: Character): FighterCombatState {
    const existing = this.states.get(character);
    if (existing) {
      return existing;
    }
    const created = createDefaultState();
    this.states.set(character, created);
    return created;
  }
}
