import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class Housefly extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Housefly",
      color: 0x808080,
      weight: 0.00002,
      dimensions: { width: 0.005, height: 0.005, depth: 0.005 },
      maxVelocity: 2,
      maxAcceleration: 20,
      movementType: MovementType.Flying,
      health: 10,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });

    // Body: tiny sphere
    const bodyGeometry = new THREE.SphereGeometry(0.003, 8, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);

    // Wings: two small planes
    const wingGeometry = new THREE.PlaneGeometry(0.005, 0.01);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: this.color, side: THREE.DoubleSide });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.003, 0, 0);
    leftWing.rotation.y = Math.PI / 8;
    group.add(leftWing);
    const rightWing = leftWing.clone();
    rightWing.position.set(0.003, 0, 0);
    rightWing.rotation.y = -Math.PI / 8;
    group.add(rightWing);

    return group;
  }
}
