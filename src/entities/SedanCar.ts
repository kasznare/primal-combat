import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class SedanCar extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Sedan Car",
      color: 0x0000FF,
      weight: 1500,
      dimensions: { width: 4.5, height: 1.5, depth: 2 },
      maxVelocity: 50,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 200,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4.5, 1.5, 2);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 12);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const wheelPositions = [
      [-1.5, -0.75, 0.9],
      [1.5, -0.75, 0.9],
      [-1.5, -0.75, -0.9],
      [1.5, -0.75, -0.9]
    ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });

    return group;
  }
}
