import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class GiantFly extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Giant Fly",
      color: 0xAAAAAA,
      weight: 50,
      dimensions: { width: 1.0, height: 1.0, depth: 1.0 },
      maxVelocity: 15,
      maxAcceleration: 5,
      movementType: MovementType.Flying,
      health: 70,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Body: sphere
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Wings: two semi-transparent planes
    const wingGeometry = new THREE.PlaneGeometry(0.8, 0.5);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: this.color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.rotation.y = Math.PI / 8;
    leftWing.position.set(-0.3, 0, -0.5);
    group.add(leftWing);
    const rightWing = leftWing.clone();
    rightWing.rotation.y = -Math.PI / 8;
    rightWing.position.set(-0.3, 0, 0.5);
    group.add(rightWing);
    
    return group;
  }
}
