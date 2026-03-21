import * as THREE from "three";
import { Character } from "./Character";

function bearSegment(radius: number, length: number, material: THREE.Material, radial = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, radial), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Bear extends Character {
  protected createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.userData.rigProfile = "bear";

    const fur = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.98, metalness: 0.02 });
    const darkFur = new THREE.MeshStandardMaterial({ color: 0x5a3420, roughness: 0.98 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.88, metalness: 0.06 });
    const toothMat = new THREE.MeshLambertMaterial({ color: 0xe8dec0 });

    const bodyLength = Math.max(this.dimensions.depth * 0.95, 2.1);
    const bodyHeight = Math.max(this.dimensions.height * 0.9, 1.1);
    const bodyWidth = Math.max(this.dimensions.width * 0.92, 1.1);
    const shoulderY = bodyHeight * 0.8;

    const torsoPivot = new THREE.Group();
    torsoPivot.name = "rig:torso";
    torsoPivot.position.y = shoulderY;
    group.add(torsoPivot);

    const hindMass = bearSegment(bodyWidth * 0.36, bodyLength * 0.62, fur, 12);
    hindMass.rotation.z = Math.PI / 2;
    hindMass.scale.set(1.08, 0.86, 1.16);
    hindMass.position.x = -bodyLength * 0.14;
    torsoPivot.add(hindMass);

    const shoulderMass = bearSegment(bodyWidth * 0.34, bodyLength * 0.5, fur, 12);
    shoulderMass.rotation.z = Math.PI / 2;
    shoulderMass.scale.set(1.02, 0.94, 1.08);
    shoulderMass.position.set(bodyLength * 0.2, bodyHeight * 0.05, 0);
    torsoPivot.add(shoulderMass);

    const hump = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.42, 14, 12), fur);
    hump.position.set(bodyLength * 0.06, bodyHeight * 0.34, 0);
    hump.scale.set(1.28, 0.86, 1);
    hump.castShadow = true;
    torsoPivot.add(hump);

    const ribShadow = new THREE.Mesh(
      new THREE.BoxGeometry(bodyLength * 0.44, bodyHeight * 0.22, bodyWidth * 0.94),
      darkFur
    );
    ribShadow.position.set(-bodyLength * 0.03, -bodyHeight * 0.02, 0);
    torsoPivot.add(ribShadow);

    const headPivot = new THREE.Group();
    headPivot.name = "rig:head";
    headPivot.position.set(bodyLength * 0.57, bodyHeight * 0.18, 0);
    torsoPivot.add(headPivot);

    const neck = bearSegment(bodyWidth * 0.18, bodyLength * 0.16, fur, 10);
    neck.rotation.z = Math.PI / 3.6;
    neck.position.set(-bodyWidth * 0.12, bodyHeight * 0.05, 0);
    headPivot.add(neck);

    const skull = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.86, bodyHeight * 0.54, bodyWidth * 0.62),
      fur
    );
    skull.position.set(0.1, 0.14, 0);
    skull.castShadow = true;
    headPivot.add(skull);

    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.54, bodyHeight * 0.28, bodyWidth * 0.4),
      darkFur
    );
    snout.position.set(bodyWidth * 0.52, -bodyHeight * 0.02, 0);
    snout.castShadow = true;
    headPivot.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.09, 10, 10), noseMat);
    nose.position.set(bodyWidth * 0.77, bodyHeight * 0.02, 0);
    headPivot.add(nose);

    const browLeft = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.18, bodyHeight * 0.06, bodyWidth * 0.12),
      darkFur
    );
    browLeft.position.set(bodyWidth * 0.18, bodyHeight * 0.18, -bodyWidth * 0.16);
    headPivot.add(browLeft);
    const browRight = browLeft.clone();
    browRight.position.z *= -1;
    headPivot.add(browRight);

    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.12, 10, 10), fur);
    leftEar.position.set(-bodyWidth * 0.1, bodyHeight * 0.3, -bodyWidth * 0.2);
    leftEar.scale.set(0.95, 1.2, 0.78);
    headPivot.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.z *= -1;
    headPivot.add(rightEar);

    const jawPivot = new THREE.Group();
    jawPivot.name = "rig:jaw";
    jawPivot.position.set(bodyWidth * 0.24, -bodyHeight * 0.12, 0);
    headPivot.add(jawPivot);

    const jaw = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.56, bodyHeight * 0.2, bodyWidth * 0.34),
      darkFur
    );
    jaw.position.set(bodyWidth * 0.22, -bodyHeight * 0.02, 0);
    jawPivot.add(jaw);

    const fang = new THREE.Mesh(new THREE.ConeGeometry(bodyWidth * 0.035, bodyHeight * 0.13, 6), toothMat);
    fang.rotation.z = Math.PI;
    fang.position.set(bodyWidth * 0.32, -bodyHeight * 0.08, -bodyWidth * 0.09);
    jawPivot.add(fang);
    const fang2 = fang.clone();
    fang2.position.z *= -1;
    jawPivot.add(fang2);

    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(bodyWidth * 0.05, bodyWidth * 0.08, bodyLength * 0.18, 8),
      fur
    );
    tail.rotation.z = -Math.PI / 3;
    tail.position.set(-bodyLength * 0.55, -bodyHeight * 0.06, 0);
    torsoPivot.add(tail);

    const frontLegX = bodyLength * 0.32;
    const rearLegX = -bodyLength * 0.32;
    const frontLegZ = bodyWidth * 0.3;
    const rearLegZ = bodyWidth * 0.28;
    const upperLegLength = bodyHeight * 0.46;
    const lowerLegLength = bodyHeight * 0.34;
    const pawHeight = bodyHeight * 0.12;

    const frontLeftLegPivot = new THREE.Group();
    frontLeftLegPivot.name = "rig:frontLeftLeg";
    frontLeftLegPivot.position.set(frontLegX, shoulderY - bodyHeight * 0.08, -frontLegZ);
    group.add(frontLeftLegPivot);

    const frontRightLegPivot = new THREE.Group();
    frontRightLegPivot.name = "rig:frontRightLeg";
    frontRightLegPivot.position.set(frontLegX, shoulderY - bodyHeight * 0.08, frontLegZ);
    group.add(frontRightLegPivot);

    const rearLeftLegPivot = new THREE.Group();
    rearLeftLegPivot.name = "rig:rearLeftLeg";
    rearLeftLegPivot.position.set(rearLegX, shoulderY - bodyHeight * 0.1, -rearLegZ);
    group.add(rearLeftLegPivot);

    const rearRightLegPivot = new THREE.Group();
    rearRightLegPivot.name = "rig:rearRightLeg";
    rearRightLegPivot.position.set(rearLegX, shoulderY - bodyHeight * 0.1, rearLegZ);
    group.add(rearRightLegPivot);

    const upperLeg = bearSegment(bodyWidth * 0.11, upperLegLength * 0.62, fur, 8);
    upperLeg.position.y = -upperLegLength * 0.4;
    frontLeftLegPivot.add(upperLeg);
    frontRightLegPivot.add(upperLeg.clone());
    rearLeftLegPivot.add(upperLeg.clone());
    rearRightLegPivot.add(upperLeg.clone());

    const lowerLeg = bearSegment(bodyWidth * 0.095, lowerLegLength * 0.46, darkFur, 8);
    lowerLeg.position.y = -(upperLegLength * 0.84);
    frontLeftLegPivot.add(lowerLeg);
    frontRightLegPivot.add(lowerLeg.clone());
    rearLeftLegPivot.add(lowerLeg.clone());
    rearRightLegPivot.add(lowerLeg.clone());

    const paw = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.24, pawHeight, bodyWidth * 0.2),
      darkFur
    );
    paw.position.set(0, -(upperLegLength + lowerLegLength * 0.52), bodyWidth * 0.02);
    paw.castShadow = true;
    frontLeftLegPivot.add(paw);
    frontRightLegPivot.add(paw.clone());
    rearLeftLegPivot.add(paw.clone());
    rearRightLegPivot.add(paw.clone());

    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.22, pawHeight * 0.15, bodyWidth * 0.05),
      toothMat
    );
    claw.position.set(0, -(upperLegLength + lowerLegLength * 0.54), bodyWidth * 0.12);
    frontLeftLegPivot.add(claw);
    frontRightLegPivot.add(claw.clone());
    rearLeftLegPivot.add(claw.clone());
    rearRightLegPivot.add(claw.clone());

    return group;
  }
}
