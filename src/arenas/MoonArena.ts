import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ProceduralScene } from "../scene/ProceduralScene";
import { Arena, IArenaOptions } from "./Arena";

export class MoonArena extends Arena {
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
        color: 0x6d727b,
        roughness: 1,
        metalness: 0,
      })
    );
    this.addGroundOverlay(44, 0x4f5460, 0.4);
    this.addGroundOverlay(20, 0x8d94a0, 0.18, 0.014);

    // Generate moon-specific objects (rocks, etc.) on top of the arena ground.
    ProceduralScene.generateMoon(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
