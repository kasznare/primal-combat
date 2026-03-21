import * as THREE from "three";
import { Character, ICharacterOptions, MovementType } from "./Character";

export class Dragon extends Character {
  constructor(
    options: Partial<ICharacterOptions> | undefined,
    physicsEngine: { characterMaterial: THREE.Material }
  ) {
    const defaults: ICharacterOptions = {
      name: "Dragon",
      color: 0x7a2f22,
      weight: 2000,
      dimensions: { width: 10.0, height: 10.0, depth: 8.0 },
      maxVelocity: 30,
      maxAcceleration: 5,
      movementType: MovementType.Flying,
      health: 600,
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

    const bodyMat = new THREE.MeshLambertMaterial({ color: this.color });
    const wingMat = new THREE.MeshLambertMaterial({
      color: 0xaa5b3a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.86,
    });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.6, 6, 12), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 1.9, 0);
    group.add(body);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.25, 10), bodyMat);
    neck.rotation.z = Math.PI / 4;
    neck.position.set(1.75, 2.35, 0);
    group.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.48), bodyMat);
    head.position.set(2.25, 2.62, 0);
    group.add(head);

    const hornGeometry = new THREE.ConeGeometry(0.08, 0.35, 8);
    const leftHorn = new THREE.Mesh(hornGeometry, bodyMat);
    leftHorn.rotation.z = Math.PI * 0.35;
    leftHorn.position.set(2.35, 2.92, -0.14);
    group.add(leftHorn);
    const rightHorn = leftHorn.clone();
    rightHorn.position.z = 0.14;
    group.add(rightHorn);

    const wingGeometry = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      0, 0, 0,
      2.9, 0.18, 0,
      1.2, -1.35, 0,
    ]);
    wingGeometry.setAttribute("position", new THREE.BufferAttribute(wingVertices, 3));
    wingGeometry.computeVertexNormals();

    const leftWing = new THREE.Mesh(wingGeometry, wingMat);
    leftWing.position.set(0.2, 2.05, -0.85);
    group.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.scale.z = -1;
    rightWing.position.z = 0.85;
    group.add(rightWing);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 2.8, 8), bodyMat);
    tail.rotation.z = -Math.PI / 3;
    tail.position.set(-2.05, 1.58, 0);
    group.add(tail);

    return group;
  }
}
