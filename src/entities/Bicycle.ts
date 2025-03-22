import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class Bicycle extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Bicycle",
      color: 0x00FF00,
      weight: 15,
      dimensions: { width: 1.8, height: 1.0, depth: 1.0 },
      maxVelocity: 15,
      maxAcceleration: 3,
      movementType: MovementType.Grounded,
      health: 50,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Frame
    const frameGeometry = new THREE.BoxGeometry(1.8, 0.1, 0.1);
    const frame = new THREE.Mesh(frameGeometry, material);
    group.add(frame);
    
    // Wheels (using thin cylinders)
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0.9, -0.2, 0);
    group.add(frontWheel);
    const rearWheel = frontWheel.clone();
    rearWheel.position.set(-0.9, -0.2, 0);
    group.add(rearWheel);

    return group;
  }
}
