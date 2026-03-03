// src/scene/Environment.ts
import * as THREE from "three";
import type { QualityLevel } from "../types/Quality";

export type EnvironmentSceneType = "Forest" | "City" | "Moon";

type ScenePreset = {
  sky: number;
  fog: number;
  fogDensity: number;
  ambient: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  key: number;
  keyIntensity: number;
  rim: number;
  rimIntensity: number;
};

const PRESETS: Record<EnvironmentSceneType, ScenePreset> = {
  Forest: {
    sky: 0xb7d4f4,
    fog: 0xa9c7e7,
    fogDensity: 0.0028,
    ambient: 0xffffff,
    hemiSky: 0xd4ebff,
    hemiGround: 0x6f624d,
    hemiIntensity: 0.85,
    key: 0xfffbf2,
    keyIntensity: 1.5,
    rim: 0xb9d9ff,
    rimIntensity: 0.65,
  },
  City: {
    sky: 0x8ea0b7,
    fog: 0x7a8da7,
    fogDensity: 0.0035,
    ambient: 0xe2e7f0,
    hemiSky: 0xc0d4ef,
    hemiGround: 0x3e434d,
    hemiIntensity: 0.78,
    key: 0xfff0db,
    keyIntensity: 1.35,
    rim: 0xcbd9f8,
    rimIntensity: 0.58,
  },
  Moon: {
    sky: 0x1f2634,
    fog: 0x2a3446,
    fogDensity: 0.0018,
    ambient: 0xb8c6dd,
    hemiSky: 0x9fb4d6,
    hemiGround: 0x2d333e,
    hemiIntensity: 0.62,
    key: 0xd9e9ff,
    keyIntensity: 1.22,
    rim: 0x8fb2e8,
    rimIntensity: 0.75,
  },
};

export function setupEnvironment(
  scene: THREE.Scene,
  quality: QualityLevel = "medium",
  sceneType: EnvironmentSceneType = "Forest"
) {
  const preset = PRESETS[sceneType];
  scene.background = new THREE.Color(preset.sky);
  scene.environment = null;
  scene.fog = new THREE.FogExp2(preset.fog, preset.fogDensity);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(preset.ambient, 0.8);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(
    preset.hemiSky,
    preset.hemiGround,
    preset.hemiIntensity
  );
  scene.add(hemiLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(preset.key, preset.keyIntensity);
  directionalLight.position.set(42, 52, 35);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.bias = -0.00005;
  
  // Increase the resolution to get less blocky shadows:
  if (quality === "low") {
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
  } else if (quality === "high") {
    directionalLight.shadow.mapSize.width = 1536;
    directionalLight.shadow.mapSize.height = 1536;
  } else {
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
  }
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight(preset.rim, preset.rimIntensity);
  rimLight.position.set(-35, 25, -55);
  scene.add(rimLight);
}
