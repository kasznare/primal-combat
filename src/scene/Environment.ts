// src/scene/Environment.ts
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export function setupEnvironment(scene: THREE.Scene) {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // HDR Environment
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load("/golden_gate_hills_8k.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  });
}
