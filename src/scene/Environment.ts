// src/scene/Environment.ts
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export function setupEnvironment(scene: THREE.Scene) {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  
  // Increase the resolution to get less blocky shadows:
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
  // scene.add(helper);

  // HDR Environment
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load("/golden_gate_hills_8k.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  });
}
