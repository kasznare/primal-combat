import * as THREE from 'three';
import { Character, ICharacterOptions, MovementType } from './Character';

export class MallardDuck extends Character {
  constructor(physicsEngine: { characterMaterial: THREE.Material }) {
    super({
      name: "Mallard Duck",
      color: 0x228B22,
      weight: 1.2,
      dimensions: { width: 0.6, height: 0.6, depth: 0.6 },
      maxVelocity: 20,
      maxAcceleration: 5,
      movementType: MovementType.Flying,
      health: 50,
    }, physicsEngine);
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0.35, 0.15, 0);
    group.add(head);

    // Bill
    const billGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const bill = new THREE.Mesh(billGeometry, material);
    bill.rotation.z = Math.PI / 2;
    bill.position.set(0.5, 0.15, 0);
    group.add(bill);

    // Wings (using planes)
    const wingGeometry = new THREE.PlaneGeometry(0.3, 0.2);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: this.color, side: THREE.DoubleSide });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.rotation.y = Math.PI / 4;
    leftWing.position.set(-0.1, 0, -0.2);
    group.add(leftWing);
    const rightWing = leftWing.clone();
    rightWing.rotation.y = -Math.PI / 4;
    rightWing.position.set(-0.1, 0, 0.2);
    group.add(rightWing);

    return group;
  }
}
