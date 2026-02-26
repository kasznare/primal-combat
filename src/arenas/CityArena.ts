import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ProceduralScene } from "../scene/ProceduralScene";
import { Arena, IArenaOptions } from "./Arena";

export class CityArena extends Arena {
  constructor(
    options: IArenaOptions & {
      physicsWorld: CANNON.World;
      staticMaterial: CANNON.Material;
    },
    scene: THREE.Scene
  ) {
    super(options, scene);
    this.setGroundMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x2d323b,
        roughness: 0.88,
        metalness: 0.22,
      })
    );
    this.addGroundOverlay(42, 0x1b1f28, 0.55);
    this.addGroundOverlay(18, 0x3f4957, 0.3, 0.014);

    // Generate city-specific objects (buildings, etc.) on top of the arena ground.
    ProceduralScene.generateCity(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
