import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { CharacterConfig } from "../roster/types";

function moveTowardVector2(current: THREE.Vector2, target: THREE.Vector2, maxDelta: number): THREE.Vector2 {
  const delta = target.clone().sub(current);
  const distance = delta.length();
  if (distance <= maxDelta || distance === 0) {
    return target;
  }
  return current.add(delta.multiplyScalar(maxDelta / distance));
}

export function getForwardVector(character: Character): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(character.mesh.rotation.y),
    0,
    Math.cos(character.mesh.rotation.y)
  );
}

export function isTargetWithinFieldOfView(
  actor: Character,
  target: Character,
  fovDegrees: number
): boolean {
  const toTarget = new THREE.Vector3().subVectors(target.mesh.position, actor.mesh.position);
  toTarget.y = 0;
  if (toTarget.lengthSq() === 0) {
    return true;
  }

  const forward = getForwardVector(actor);
  toTarget.normalize();
  const angle = THREE.MathUtils.radToDeg(forward.angleTo(toTarget));
  return angle <= fovDegrees / 2;
}

export function rotateTowardDirection(
  character: Character,
  direction: THREE.Vector3,
  turnSpeed: number,
  deltaSeconds: number
): number {
  if (direction.lengthSq() === 0) {
    return 0;
  }

  const targetAngle = Math.atan2(direction.x, direction.z);
  const currentAngle = character.mesh.rotation.y;
  const deltaAngle = Math.atan2(
    Math.sin(targetAngle - currentAngle),
    Math.cos(targetAngle - currentAngle)
  );
  const interpolation = 1 - Math.exp(-(turnSpeed * 10) * deltaSeconds);
  character.mesh.rotation.y = currentAngle + deltaAngle * interpolation;
  return Math.abs(deltaAngle);
}

export function applyDesiredHorizontalVelocity(
  character: Character,
  config: CharacterConfig,
  desiredDirection: THREE.Vector3,
  desiredSpeed: number,
  deltaSeconds: number
): void {
  const currentVelocity = new THREE.Vector2(character.body.velocity.x, character.body.velocity.z);
  const targetVelocity = new THREE.Vector2();

  if (desiredDirection.lengthSq() > 0) {
    const horizontalDirection = desiredDirection.clone().setY(0).normalize();
    targetVelocity.set(horizontalDirection.x * desiredSpeed, horizontalDirection.z * desiredSpeed);
  }

  const accelerationResponse = config.movement.accelerationResponsiveness ?? 2.1;
  const decelerationResponse = config.movement.decelerationResponsiveness ?? 2.5;
  const reversePenalty = config.movement.reversePenalty ?? 0.42;

  if (targetVelocity.lengthSq() === 0) {
    const decelerationStep = config.stats.maxAcceleration * decelerationResponse * deltaSeconds;
    const nextVelocity = moveTowardVector2(currentVelocity, new THREE.Vector2(0, 0), decelerationStep);
    character.body.velocity.x = nextVelocity.x;
    character.body.velocity.z = nextVelocity.y;
    return;
  }

  let alignment = 1;
  if (currentVelocity.lengthSq() > 0.001) {
    alignment = currentVelocity.clone().normalize().dot(targetVelocity.clone().normalize());
  }

  let workingVelocity = currentVelocity.clone();
  let accelerationStep = config.stats.maxAcceleration * accelerationResponse * deltaSeconds;
  if (alignment < -0.15) {
    const switchCost = 1 - Math.min(0.82, 1 - reversePenalty);
    workingVelocity.multiplyScalar(1 - deltaSeconds * (3.8 * switchCost));
    accelerationStep *= reversePenalty;
  } else if (alignment < 0.25) {
    accelerationStep *= 0.72;
  }

  const nextVelocity = moveTowardVector2(workingVelocity, targetVelocity, accelerationStep);
  character.body.velocity.x = nextVelocity.x;
  character.body.velocity.z = nextVelocity.y;
}
