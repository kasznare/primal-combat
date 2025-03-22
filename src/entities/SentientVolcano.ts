import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class SentientVolcano extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Sentient Volcano",
      color: 0x8B0000,
      weight: 10000,
      dimensions: { width: 8.0, height: 8.0, depth: 8.0 },
      maxVelocity: 2,
      maxAcceleration: 0.5,
      movementType: MovementType.Grounded,
      health: 500,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Volcano body: cone
    const coneGeometry = new THREE.ConeGeometry(4, 8, 16);
    const cone = new THREE.Mesh(coneGeometry, material);
    cone.position.set(0, 4, 0);
    group.add(cone);
    
    // Crater: sphere at the top
    const craterGeometry = new THREE.SphereGeometry(1, 16, 16);
    const crater = new THREE.Mesh(craterGeometry, material);
    crater.position.set(0, 8, 0);
    group.add(crater);
    
    return group;
  }
}
