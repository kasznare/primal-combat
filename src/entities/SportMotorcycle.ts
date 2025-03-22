import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class SportMotorcycle extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Sport Motorcycle",
      color: 0xFF0000,
      weight: 200,
      dimensions: { width: 2.1, height: 1.0, depth: 1.5 },
      maxVelocity: 75,
      maxAcceleration: 10,
      movementType: MovementType.Grounded,
      health: 100,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });

    // Motorcycle body
    const bodyGeometry = new THREE.BoxGeometry(2.1, 0.5, 1.5);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0.9, -0.25, 0.8);
    group.add(frontWheel);
    const rearWheel = frontWheel.clone();
    rearWheel.position.set(-0.9, -0.25, 0.8);
    group.add(rearWheel);

    return group;
  }
}
