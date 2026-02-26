import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ProceduralScene } from "../scene/ProceduralScene";
import { Arena, IArenaOptions } from "./Arena";

export class ForestArena extends Arena {
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
        color: 0x315d2f,
        roughness: 0.98,
        metalness: 0.01,
      })
    );
    this.addGroundOverlay(42, 0x203f20, 0.4);
    this.addGroundOverlay(24, 0x3b7a2e, 0.24, 0.014);

    // Generate forest-specific objects (trees, stones, etc.) on top of the arena ground.
    ProceduralScene.generateForest(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
