import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { AttackProfile, CharacterConfig } from "../roster/types";
import { getForwardVector } from "../movement/MovementDynamics";

export type SphereSample = {
  center: THREE.Vector3;
  radius: number;
};

function distancePointToSegment(point: THREE.Vector3, start: THREE.Vector3, end: THREE.Vector3): number {
  const segment = end.clone().sub(start);
  const segmentLengthSq = segment.lengthSq();
  if (segmentLengthSq === 0) {
    return point.distanceTo(start);
  }

  const projected = THREE.MathUtils.clamp(
    point.clone().sub(start).dot(segment) / segmentLengthSq,
    0,
    1
  );
  const closest = start.clone().add(segment.multiplyScalar(projected));
  return point.distanceTo(closest);
}

export function getAttackSegment(attacker: Character, attack: AttackProfile): { start: THREE.Vector3; end: THREE.Vector3; radius: number } {
  const forward = getForwardVector(attacker);
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const base = attacker.mesh.position
    .clone()
    .add(new THREE.Vector3(0, attack.hitbox.up, 0))
    .add(right.multiplyScalar(attack.hitbox.lateral ?? 0));
  const start = base.clone().add(forward.clone().multiplyScalar(attack.hitbox.forward));
  const end = start.clone().add(forward.multiplyScalar(attack.hitbox.length));
  return { start, end, radius: attack.hitbox.radius };
}

export function getAttackSamples(attacker: Character, attack: AttackProfile): SphereSample[] {
  const segment = getAttackSegment(attacker, attack);
  const sampleCount = Math.max(1, Math.ceil(attack.hitbox.length / Math.max(attack.hitbox.radius * 0.8, 0.1)));
  const samples: SphereSample[] = [];

  for (let index = 0; index <= sampleCount; index++) {
    const alpha = sampleCount === 0 ? 0 : index / sampleCount;
    samples.push({
      center: segment.start.clone().lerp(segment.end, alpha),
      radius: segment.radius,
    });
  }

  return samples;
}

export function getHurtboxSamples(target: Character, config: CharacterConfig): SphereSample[] {
  const center = target.mesh.position.clone();
  return [
    {
      center: center.clone().add(new THREE.Vector3(0, config.defense.hurtbox.torsoHeight, 0)),
      radius: config.defense.hurtbox.torsoRadius,
    },
    {
      center: center.clone().add(new THREE.Vector3(0, config.defense.hurtbox.headHeight, 0)),
      radius: config.defense.hurtbox.headRadius,
    },
  ];
}

export function hitboxIntersectsTarget(attacker: Character, attack: AttackProfile, target: Character, targetConfig: CharacterConfig): boolean {
  const hurtboxes = getHurtboxSamples(target, targetConfig);
  const segment = getAttackSegment(attacker, attack);

  return hurtboxes.some((hurtbox) => {
    return distancePointToSegment(hurtbox.center, segment.start, segment.end) <= hurtbox.radius + segment.radius;
  });
}
