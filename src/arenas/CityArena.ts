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
    // Generate city-specific objects (buildings, etc.) on top of the arena ground.
    ProceduralScene.generateCity(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
