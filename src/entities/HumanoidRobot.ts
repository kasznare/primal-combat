import * as THREE from "three";
import { Character, ICharacterOptions, MovementType } from "./Character";

export class HumanoidRobot extends Character {
  constructor(
    options: Partial<ICharacterOptions> | undefined,
    physicsEngine: { characterMaterial: THREE.Material }
  ) {
    const defaults: ICharacterOptions = {
      name: "Humanoid Robot",
      color: 0x7d8a9e,
      weight: 150,
      dimensions: { width: 2.0, height: 2.0, depth: 2.0 },
      maxVelocity: 10,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 220,
    };
    super(
      {
        ...defaults,
        ...options,
        dimensions: options?.dimensions ?? defaults.dimensions,
        health: options?.health ?? defaults.health,
      },
      physicsEngine
    );
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group();

    const metal = new THREE.MeshLambertMaterial({ color: this.color });
    const joint = new THREE.MeshLambertMaterial({ color: 0x3b4452 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.7), metal);
    torso.position.y = 1.35;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.52), metal);
    head.position.y = 2.25;
    group.add(head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.03),
      new THREE.MeshLambertMaterial({ color: 0x6ad7ff })
    );
    visor.position.set(0, 2.25, 0.27);
    group.add(visor);

    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.95, 8);
    const leftArm = new THREE.Mesh(armGeometry, metal);
    leftArm.position.set(-0.72, 1.35, 0);
    group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.72;
    group.add(rightArm);

    const legGeometry = new THREE.CylinderGeometry(0.14, 0.14, 1.05, 8);
    const leftLeg = new THREE.Mesh(legGeometry, joint);
    leftLeg.position.set(-0.28, 0.52, 0);
    group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.28;
    group.add(rightLeg);

    return group;
  }
}
