import * as THREE from 'three';
import { Character, ICharacterOptions } from './Character';

export class Human extends Character {
  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    const totalHeight = this.dimensions.height;
    const totalWidth = this.dimensions.width;
    const totalDepth = this.dimensions.depth;
    const material = new THREE.MeshLambertMaterial({ color: this.color });

    // Legs.
    const legHeight = totalHeight * 0.4;
    const legGeometry = new THREE.BoxGeometry(totalWidth * 0.4, legHeight, totalDepth * 0.4);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-totalWidth * 0.2, legHeight / 2, 0);
    group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.set(totalWidth * 0.2, legHeight / 2, 0);
    group.add(rightLeg);

    // Torso.
    const torsoHeight = totalHeight * 0.4;
    const torsoGeometry = new THREE.BoxGeometry(totalWidth, torsoHeight, totalDepth);
    const torso = new THREE.Mesh(torsoGeometry, material);
    torso.position.set(0, legHeight + torsoHeight / 2, 0);
    group.add(torso);

    // Head.
    const headRadius = totalWidth * 0.6;
    const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, legHeight + torsoHeight + headRadius, 0);
    group.add(head);

    // Arms.
    const armLength = torsoHeight * 0.8;
    const armRadius = totalWidth * 0.1;
    const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.position.set(-totalWidth / 2 - armLength / 2, legHeight + torsoHeight * 0.75, 0);
    group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.set(totalWidth / 2 + armLength / 2, legHeight + torsoHeight * 0.75, 0);
    group.add(rightArm);

    return group;
  }
}
