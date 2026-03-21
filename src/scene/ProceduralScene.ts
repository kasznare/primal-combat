import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { QualityLevel } from "../types/Quality";
import {
  addPhysicsForObject,
  clearGenerated,
  setProceduralQuality,
} from "./procedural/ProceduralShared";
import { generateForest as generateForestBiome } from "./procedural/ForestGenerator";
import { generateCity as generateCityBiome } from "./procedural/CityGenerator";
import { generateMoon as generateMoonBiome } from "./procedural/MoonGenerator";

export class ProceduralScene {
  static setQuality(level: QualityLevel): void {
    setProceduralQuality(level);
  }

  static addPhysicsForObject(
    object: THREE.Object3D,
    physicsWorld: CANNON.World,
    staticMaterial: CANNON.Material
  ): void {
    addPhysicsForObject(object, physicsWorld, staticMaterial);
  }

  static clearGenerated(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    clearGenerated(scene, physicsWorld);
  }

  static generateScene(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    sceneType: string,
    areaSize = 100,
    staticMaterial: CANNON.Material
  ): void {
    clearGenerated(scene, physicsWorld);

    if (sceneType === "Forest") {
      generateForestBiome(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === "City") {
      generateCityBiome(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === "Moon") {
      generateMoonBiome(scene, physicsWorld, areaSize, staticMaterial);
    }
  }

  static generateForest(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    areaSize: number,
    staticMaterial: CANNON.Material
  ): void {
    generateForestBiome(scene, physicsWorld, areaSize, staticMaterial);
  }

  static generateCity(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    areaSize: number,
    staticMaterial: CANNON.Material
  ): void {
    generateCityBiome(scene, physicsWorld, areaSize, staticMaterial);
  }

  static generateMoon(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    areaSize: number,
    staticMaterial: CANNON.Material
  ): void {
    generateMoonBiome(scene, physicsWorld, areaSize, staticMaterial);
  }
}
