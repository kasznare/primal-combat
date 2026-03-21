import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { QualityLevel } from "../../types/Quality";

export const PROCEDURAL_BODY_FLAG = "__proceduralStaticBody";

let qualityMultiplier = 1;

export function setProceduralQuality(level: QualityLevel): void {
  if (level === "low") {
    qualityMultiplier = 0.6;
    return;
  }
  if (level === "high") {
    qualityMultiplier = 1.25;
    return;
  }
  qualityMultiplier = 1;
}

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function scaledCount(base: number, spread: number): number {
  return Math.max(1, Math.floor((Math.random() * spread + base) * qualityMultiplier));
}

export function addPhysicsForObject(
  object: THREE.Object3D,
  physicsWorld: CANNON.World,
  staticMaterial: CANNON.Material
): void {
  const bbox = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
  const shape = new CANNON.Box(halfExtents);
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(center.x, center.y, center.z);
  body.material = staticMaterial;
  (body as unknown as Record<string, boolean>)[PROCEDURAL_BODY_FLAG] = true;

  object.userData.physicsBody = body;
  physicsWorld.addBody(body);
}

export function clearGenerated(scene: THREE.Scene, physicsWorld: CANNON.World): void {
  const toRemove = scene.children.filter((child) => child.userData.generated);
  toRemove.forEach((child) => {
    scene.remove(child);
    if (child.userData.physicsBody) {
      physicsWorld.removeBody(child.userData.physicsBody);
    }
  });

  const proceduralBodies = [...physicsWorld.bodies].filter((body) => {
    return Boolean((body as unknown as Record<string, boolean>)[PROCEDURAL_BODY_FLAG]);
  });
  proceduralBodies.forEach((body) => physicsWorld.removeBody(body));
}
