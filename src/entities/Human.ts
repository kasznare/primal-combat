import * as THREE from "three";
import { Character } from "./Character";

function capsuleSegment(
  radius: number,
  length: number,
  material: THREE.Material,
  radialSegments = 10
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, radialSegments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Human extends Character {
  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.userData.rigProfile = "human";

    const totalHeight = Math.max(this.dimensions.height, 1.7);
    const totalWidth = Math.max(this.dimensions.width, 0.48);
    const totalDepth = Math.max(this.dimensions.depth, 0.34);

    const skin = new THREE.MeshLambertMaterial({ color: this.color });
    const hair = new THREE.MeshLambertMaterial({ color: 0x2b231e });
    const jacket = new THREE.MeshStandardMaterial({ color: 0x2c436d, roughness: 0.9, metalness: 0.05 });
    const undershirt = new THREE.MeshLambertMaterial({ color: 0x8fa8c7 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.96 });
    const boots = new THREE.MeshStandardMaterial({ color: 0x191c20, roughness: 0.95, metalness: 0.05 });
    const detail = new THREE.MeshLambertMaterial({ color: 0xc5cbd4 });

    const upperLegLength = totalHeight * 0.23;
    const lowerLegLength = totalHeight * 0.23;
    const bootHeight = totalHeight * 0.065;
    const torsoHeight = totalHeight * 0.34;
    const shoulderSpan = totalWidth * 1.4;
    const upperArmLength = totalHeight * 0.17;
    const lowerArmLength = totalHeight * 0.15;
    const neckHeight = totalHeight * 0.06;
    const headRadius = totalWidth * 0.44;

    const torsoPivot = new THREE.Group();
    torsoPivot.name = "rig:torso";
    torsoPivot.position.set(0, bootHeight + upperLegLength + lowerLegLength + torsoHeight * 0.48, 0);
    group.add(torsoPivot);

    const pelvis = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.95, totalHeight * 0.11, totalDepth * 0.86),
      pants
    );
    pelvis.position.y = -torsoHeight * 0.56;
    pelvis.castShadow = true;
    torsoPivot.add(pelvis);

    const abdomen = capsuleSegment(totalWidth * 0.26, torsoHeight * 0.46, jacket, 12);
    abdomen.position.y = -torsoHeight * 0.08;
    torsoPivot.add(abdomen);

    const ribcage = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 1.05, torsoHeight * 0.46, totalDepth * 0.9),
      jacket
    );
    ribcage.position.y = torsoHeight * 0.16;
    ribcage.castShadow = true;
    torsoPivot.add(ribcage);

    const chestPanel = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.68, torsoHeight * 0.28, totalDepth * 0.12),
      undershirt
    );
    chestPanel.position.set(0, torsoHeight * 0.18, totalDepth * 0.47);
    torsoPivot.add(chestPanel);

    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.98, totalHeight * 0.035, totalDepth * 0.9),
      boots
    );
    belt.position.y = -torsoHeight * 0.44;
    torsoPivot.add(belt);

    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(totalWidth * 0.17, 12, 12), jacket);
    leftShoulder.position.set(-shoulderSpan * 0.42, torsoHeight * 0.28, 0);
    torsoPivot.add(leftShoulder);
    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.x *= -1;
    torsoPivot.add(rightShoulder);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(totalWidth * 0.13, totalWidth * 0.15, neckHeight, 10),
      skin
    );
    neck.position.y = torsoHeight * 0.53;
    torsoPivot.add(neck);

    const headPivot = new THREE.Group();
    headPivot.name = "rig:head";
    headPivot.position.set(0, torsoHeight * 0.55 + neckHeight * 0.35, totalDepth * 0.02);
    torsoPivot.add(headPivot);

    const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 18, 18), skin);
    head.position.y = headRadius * 0.92;
    head.castShadow = true;
    headPivot.add(head);

    const jaw = new THREE.Mesh(
      new THREE.BoxGeometry(headRadius * 1.08, headRadius * 0.48, headRadius * 0.88),
      skin
    );
    jaw.position.set(0, headRadius * 0.35, headRadius * 0.02);
    headPivot.add(jaw);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(headRadius * 0.16, headRadius * 0.18, headRadius * 0.28), skin);
    nose.position.set(0, headRadius * 0.55, headRadius * 0.95);
    headPivot.add(nose);

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(headRadius * 0.72, headRadius * 0.08, headRadius * 0.08),
      hair
    );
    brow.position.set(0, headRadius * 0.9, headRadius * 0.58);
    headPivot.add(brow);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.04, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hair
    );
    hairCap.position.y = headRadius * 1.02;
    headPivot.add(hairCap);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.name = "rig:leftArm";
    leftArmPivot.position.set(-shoulderSpan * 0.46, torsoHeight * 0.28, 0);
    torsoPivot.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.name = "rig:rightArm";
    rightArmPivot.position.set(shoulderSpan * 0.46, torsoHeight * 0.28, 0);
    torsoPivot.add(rightArmPivot);

    const upperArm = capsuleSegment(totalWidth * 0.105, upperArmLength * 0.66, jacket, 10);
    upperArm.position.y = -upperArmLength * 0.46;
    leftArmPivot.add(upperArm);
    rightArmPivot.add(upperArm.clone());

    const leftForearmPivot = new THREE.Group();
    leftForearmPivot.name = "rig:leftForearm";
    leftForearmPivot.position.set(0, -upperArmLength * 0.95, 0);
    leftArmPivot.add(leftForearmPivot);

    const rightForearmPivot = new THREE.Group();
    rightForearmPivot.name = "rig:rightForearm";
    rightForearmPivot.position.set(0, -upperArmLength * 0.95, 0);
    rightArmPivot.add(rightForearmPivot);

    const forearm = capsuleSegment(totalWidth * 0.092, lowerArmLength * 0.64, skin, 10);
    forearm.position.y = -lowerArmLength * 0.46;
    leftForearmPivot.add(forearm);
    rightForearmPivot.add(forearm.clone());

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.18, totalHeight * 0.05, totalDepth * 0.18),
      skin
    );
    hand.position.y = -lowerArmLength * 0.88;
    leftForearmPivot.add(hand);
    rightForearmPivot.add(hand.clone());

    const leftLegPivot = new THREE.Group();
    leftLegPivot.name = "rig:leftLeg";
    leftLegPivot.position.set(-totalWidth * 0.22, bootHeight + upperLegLength + lowerLegLength, 0);
    group.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.name = "rig:rightLeg";
    rightLegPivot.position.set(totalWidth * 0.22, bootHeight + upperLegLength + lowerLegLength, 0);
    group.add(rightLegPivot);

    const thigh = capsuleSegment(totalWidth * 0.115, upperLegLength * 0.68, pants, 10);
    thigh.position.y = -upperLegLength * 0.47;
    leftLegPivot.add(thigh);
    rightLegPivot.add(thigh.clone());

    const knee = new THREE.Mesh(new THREE.SphereGeometry(totalWidth * 0.11, 10, 10), pants);
    knee.position.y = -upperLegLength * 0.94;
    leftLegPivot.add(knee);
    rightLegPivot.add(knee.clone());

    const leftShinPivot = new THREE.Group();
    leftShinPivot.name = "rig:leftShin";
    leftShinPivot.position.set(0, -upperLegLength * 0.95, 0);
    leftLegPivot.add(leftShinPivot);

    const rightShinPivot = new THREE.Group();
    rightShinPivot.name = "rig:rightShin";
    rightShinPivot.position.set(0, -upperLegLength * 0.95, 0);
    rightLegPivot.add(rightShinPivot);

    const shin = capsuleSegment(totalWidth * 0.098, lowerLegLength * 0.68, pants, 10);
    shin.position.y = -lowerLegLength * 0.46;
    leftShinPivot.add(shin);
    rightShinPivot.add(shin.clone());

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.26, bootHeight, totalDepth * 0.62),
      boots
    );
    boot.position.set(0, -lowerLegLength * 0.95, totalDepth * 0.11);
    leftShinPivot.add(boot);
    rightShinPivot.add(boot.clone());

    const bootToe = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth * 0.24, bootHeight * 0.6, totalDepth * 0.22),
      detail
    );
    bootToe.position.set(0, -lowerLegLength * 0.95, totalDepth * 0.34);
    leftShinPivot.add(bootToe);
    rightShinPivot.add(bootToe.clone());

    return group;
  }
}
