import { setupEnvironment } from "./Environment.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ForestArena } from "../arenas/ForestArena.js";
import { CityArena } from "../arenas/CityArena.js";
import { MoonArena } from "../arenas/MoonArena.js";

export type SceneType = "Forest" | "City" | "Moon";

export class SceneSelector {
  currentArena: ForestArena | CityArena | MoonArena | null = null;

  constructor(
    private scene: THREE.Scene,
    private physicsWorld: CANNON.World,
    private staticMaterial: CANNON.Material
  ) {}

  public select(sceneType: SceneType): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    setupEnvironment(this.scene);

    if (sceneType === "Forest") {
      this.currentArena = new ForestArena(
        {
          name: "Forest Arena",
          groundColor: 0x228b22,
          skyColor: 0x87ceeb,
          physicsWorld: this.physicsWorld,
          staticMaterial: this.staticMaterial,
        },
        this.scene
      );
      return;
    }

    if (sceneType === "City") {
      this.currentArena = new CityArena(
        {
          name: "City Arena",
          groundColor: 0xaaaaaa,
          skyColor: 0x87ceeb,
          physicsWorld: this.physicsWorld,
          staticMaterial: this.staticMaterial,
        },
        this.scene
      );
      return;
    }

    this.currentArena = new MoonArena(
      {
        name: "Moon Arena",
        groundColor: 0x888888,
        skyColor: 0x000000,
        physicsWorld: this.physicsWorld,
        staticMaterial: this.staticMaterial,
      },
      this.scene
    );
  }
}
