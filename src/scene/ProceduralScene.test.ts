import * as THREE from "three";
import * as CANNON from "cannon-es";
import { describe, expect, it } from "vitest";
import { ProceduralScene } from "./ProceduralScene";

describe("ProceduralScene.clearGenerated", () => {
  it("removes generated meshes and their static physics bodies", () => {
    const scene = new THREE.Scene();
    const world = new CANNON.World();
    const staticMaterial = new CANNON.Material("static");

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mesh.userData.generated = true;
    scene.add(mesh);

    ProceduralScene.addPhysicsForObject(mesh, world, staticMaterial);

    expect(scene.children.length).toBe(1);
    expect(world.bodies.length).toBe(1);

    ProceduralScene.clearGenerated(scene, world);

    expect(scene.children.length).toBe(0);
    expect(world.bodies.length).toBe(0);
  });
});
