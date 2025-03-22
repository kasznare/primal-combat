import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class WalkingPencil extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Walking Pencil",
      color: 0xFFFF00,
      weight: 0.01,
      dimensions: { width: 0.19, height: 0.19, depth: 0.19 },
      maxVelocity: 1,
      maxAcceleration: 2,
      movementType: MovementType.Grounded,
      health: 5,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Pencil body: long, thin cylinder
    const bodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Pencil tip: cone at one end
    const tipGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const tip = new THREE.Mesh(tipGeometry, material);
    tip.position.set(0, 0.6, 0);
    group.add(tip);
    
    return group;
  }
}
