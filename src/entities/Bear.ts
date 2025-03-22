import * as THREE from 'three';
import { Character, ICharacterOptions } from './Character';

export class Bear extends Character {
  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    
    // Use a scaling factor to visually enlarge the bear relative to its base dimensions.
    const scaleFactor = 2; // Adjust this factor as needed.
    
    // Torso: use a sphere to represent a stocky body.
    const torsoRadius = 0.5 * scaleFactor;
    const torso = new THREE.Mesh(new THREE.SphereGeometry(torsoRadius, 16, 16), material);
    // Scale the sphere to create a more elongated shape.
    torso.scale.set(1, 0.8, 1.2);
    torso.position.set(0, 0.5 * scaleFactor, 0);
    group.add(torso);

    // Head: a sphere positioned forward.
    const headRadius = 0.3 * scaleFactor;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 16, 16), material);
    head.position.set(0, 0.9 * scaleFactor, 0.8 * scaleFactor);
    group.add(head);

    // Ears.
    const earRadius = 0.1 * scaleFactor;
    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(earRadius, 8, 8), material);
    leftEar.position.set(-0.25 * scaleFactor, 1.1 * scaleFactor, 0.7 * scaleFactor);
    group.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.25 * scaleFactor, 1.1 * scaleFactor, 0.7 * scaleFactor);
    group.add(rightEar);

    // Legs: create four legs using cylinders.
    const legRadius = 0.15 * scaleFactor;
    const legHeight = 0.8 * scaleFactor;
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
    const legPositions = [
      [-0.3 * scaleFactor, 0.4 * scaleFactor, 0.4 * scaleFactor],
      [0.3 * scaleFactor, 0.4 * scaleFactor, 0.4 * scaleFactor],
      [-0.3 * scaleFactor, 0.4 * scaleFactor, -0.4 * scaleFactor],
      [0.3 * scaleFactor, 0.4 * scaleFactor, -0.4 * scaleFactor]
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });

    return group;
  }
}
