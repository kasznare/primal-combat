import * as THREE from "three";
import type { Character } from "../entities/Character";
import type { ArenaRuntimeModifiers } from "./arena/ArenaRules";
import type { CombatSystem } from "./combat/CombatSystem";
import type { CombatEvent } from "./combat/types";
import {
  applyDesiredHorizontalVelocity,
  isTargetWithinFieldOfView,
  rotateTowardDirection,
} from "./movement/MovementDynamics";
import type { AttackProfile, CharacterConfig } from "./roster/types";

export class AIController {
  public update(
    player: Character,
    opponent: Character,
    opponentConfig: CharacterConfig,
    playerConfig: CharacterConfig,
    combatSystem: CombatSystem,
    timestamp: number,
    arenaModifiers: ArenaRuntimeModifiers,
    deltaSeconds: number
  ): CombatEvent[] {
    const events: CombatEvent[] = [];
    if (opponent.health <= 0 || player.health <= 0) {
      return events;
    }

    const offset = new THREE.Vector3().subVectors(player.mesh.position, opponent.mesh.position);
    const horizontal = new THREE.Vector3(offset.x, 0, offset.z);
    const distance = horizontal.length();
    if (distance === 0) {
      return events;
    }

    const desiredDirection = horizontal.normalize();
    const lateral = new THREE.Vector3(-desiredDirection.z, 0, desiredDirection.x);
    const preferredRange = opponentConfig.ai.preferredRange;
    const retreatRange = opponentConfig.ai.retreatRange;
    const moveSpeed =
      opponentConfig.stats.maxVelocity *
      opponentConfig.movement.speedMultiplier *
      combatSystem.getMovementScale(opponent) *
      arenaModifiers.movementSpeedMultiplier;
    const fieldOfViewDegrees = opponentConfig.movement.fieldOfViewDegrees ?? 148;
    const canSeeTarget = isTargetWithinFieldOfView(opponent, player, fieldOfViewDegrees);

    const playerState = combatSystem.getState(player);
    const threatRhythm = (Math.sin(timestamp / 170 + opponentConfig.stats.weight * 0.013) + 1) / 2;
    const underThreat =
      (playerState.phase === "attackStartup" || playerState.phase === "attackActive") &&
      distance <= playerConfig.attack.range * 1.35;

    const shouldDodge = underThreat && threatRhythm <= opponentConfig.ai.dodgeChance;
    const shouldBlock = underThreat && threatRhythm <= opponentConfig.ai.blockChance + 0.18;

    if (shouldDodge) {
      const dodgeDirection = lateral.clone().multiplyScalar(threatRhythm > 0.5 ? 1 : -1).add(desiredDirection.clone().multiplyScalar(-0.25));
      const dodgeEvent = combatSystem.tryDodge(opponent, opponentConfig, dodgeDirection, timestamp);
      if (dodgeEvent) {
        events.push(dodgeEvent);
      }
    } else {
      const blockEvent = combatSystem.setBlocking(opponent, opponentConfig, shouldBlock && canSeeTarget, timestamp);
      if (blockEvent) {
        events.push(blockEvent);
      }
    }

    if (combatSystem.canMove(opponent)) {
      const styleVector = this.getStyleMovement(
        opponentConfig,
        desiredDirection,
        lateral,
        distance,
        preferredRange,
        retreatRange,
        timestamp,
        canSeeTarget
      );
      const angleDelta = rotateTowardDirection(
        opponent,
        desiredDirection,
        opponentConfig.movement.turnSpeed,
        deltaSeconds
      );
      const trackingPenalty = canSeeTarget ? 1 : 0.55;
      const turnPenalty = THREE.MathUtils.clamp(1 - angleDelta / Math.PI, 0.28, 1);
      applyDesiredHorizontalVelocity(
        opponent,
        opponentConfig,
        styleVector,
        moveSpeed * trackingPenalty * turnPenalty,
        deltaSeconds
      );
    }

    if (opponentConfig.movement.archetype === "flying") {
      const hoverHeight = opponentConfig.movement.hoverHeight ?? opponent.dimensions.height + 2;
      const hoverDelta = hoverHeight - opponent.body.position.y;
      opponent.body.velocity.y = hoverDelta * 2;
    }

    const attackRhythm = (Math.sin(timestamp / 250 + opponentConfig.attack.damage) + 1) / 2;
    const selectedAttack = this.chooseAttack(opponentConfig, playerState, distance, attackRhythm);
    const inRange = distance <= selectedAttack.range * (0.95 + opponentConfig.ai.pressureBias * 0.18);
    if (inRange && canSeeTarget && attackRhythm <= opponentConfig.ai.aggression) {
      const attackEvent = combatSystem.startAttack(
        opponent,
        player,
        opponentConfig,
        timestamp,
        selectedAttack.id
      );
      if (attackEvent) {
        events.push(attackEvent);
      }
    }

    return events;
  }

  private getStyleMovement(
    config: CharacterConfig,
    desiredDirection: THREE.Vector3,
    lateral: THREE.Vector3,
    distance: number,
    preferredRange: number,
    retreatRange: number,
    timestamp: number,
    canSeeTarget: boolean
  ): THREE.Vector3 {
    const strafeDirection = Math.sin(timestamp / 280) >= 0 ? 1 : -1;
    const style = config.ai.style;

    if (!canSeeTarget) {
      return desiredDirection.clone().multiplyScalar(0.38).add(lateral.multiplyScalar(0.06 * strafeDirection)).normalize();
    }

    if (style === "charger") {
      return desiredDirection.clone().multiplyScalar(distance < preferredRange * 0.85 ? 0.5 : 1).normalize();
    }

    if (style === "bruiser") {
      if (distance < retreatRange * 0.85) {
        return desiredDirection.clone().multiplyScalar(-0.65).normalize();
      }
      return desiredDirection.clone().add(lateral.multiplyScalar(0.12 * strafeDirection)).normalize();
    }

    if (style === "skirmisher" || style === "trickster") {
      if (distance < retreatRange) {
        return desiredDirection.clone().multiplyScalar(-0.72).add(lateral.multiplyScalar(0.44 * strafeDirection)).normalize();
      }
      return lateral.multiplyScalar(config.ai.strafeBias * strafeDirection).add(desiredDirection.clone().multiplyScalar(0.32)).normalize();
    }

    if (style === "flyer") {
      if (distance < retreatRange) {
        return desiredDirection.clone().multiplyScalar(-0.52).add(lateral.multiplyScalar(0.38 * strafeDirection)).normalize();
      }
      return lateral.multiplyScalar(config.ai.strafeBias * strafeDirection).add(desiredDirection.clone().multiplyScalar(0.42)).normalize();
    }

    if (distance < retreatRange) {
      return desiredDirection.clone().multiplyScalar(-0.6).normalize();
    }
    return lateral.multiplyScalar(config.ai.strafeBias * strafeDirection).add(desiredDirection.clone().multiplyScalar(0.3)).normalize();
  }

  private chooseAttack(
    config: CharacterConfig,
    playerState: ReturnType<CombatSystem["getState"]>,
    distance: number,
    rhythm: number
  ): AttackProfile {
    let bestAttack = config.attack;
    let bestScore = Number.NEGATIVE_INFINITY;

    config.attacks.forEach((attack) => {
      const rangeScore = 1 - Math.min(1.3, Math.abs(distance - attack.idealRange) / Math.max(0.5, attack.range));
      const pressureBonus = playerState.phase === "blocking" ? attack.chipDamage * 0.06 : 0;
      const finishBonus = attack.damage * 0.012 + attack.bleedChance * 0.3;
      const cadenceBonus = rhythm > 0.65 && attack.input === "secondary" ? 0.22 : 0;
      const score = rangeScore + attack.aiWeight + pressureBonus + finishBonus + cadenceBonus;
      if (score > bestScore) {
        bestScore = score;
        bestAttack = attack;
      }
    });

    return bestAttack;
  }
}
