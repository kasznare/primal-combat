import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class Cheetah extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Cheetah",
      color: 0xD2B48C,
      weight: 50,
      dimensions: { width: 1.5, height: 1.0, depth: 0.8 },
      maxVelocity: 30,
      maxAcceleration: 9,
      movementType: MovementType.Grounded,
      health: 80,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Body: elongated box
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.6, 0.8);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Head: sphere
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0.8, 0.2, 0);
    group.add(head);
    
    // Legs: four cylinders
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    const legPositions = [
      [-0.5, -0.3, 0.3],
      [0.5, -0.3, 0.3],
      [-0.5, -0.3, -0.3],
      [0.5, -0.3, -0.3]
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });
    
    // Tail: a small cylinder
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.rotation.z = Math.PI / 4;
    tail.position.set(-0.8, 0, 0);
    group.add(tail);
    
    return group;
  }
}
