// src/scene/Environment.ts
import * as THREE from "three";
import type { QualityLevel } from "../types/Quality";

export function setupEnvironment(scene: THREE.Scene, quality: QualityLevel = "medium") {
  scene.background = new THREE.Color(0xb7d4f4);
  scene.environment = null;
  scene.fog = new THREE.FogExp2(0xa9c7e7, 0.0028);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xd4ebff, 0x6f624d, 0.85);
  scene.add(hemiLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(0xfffbf2, 1.5);
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

  const rimLight = new THREE.DirectionalLight(0xb9d9ff, 0.65);
  rimLight.position.set(-35, 25, -55);
  scene.add(rimLight);
}
