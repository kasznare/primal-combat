import { ProceduralScene } from './ProceduralScene.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class SceneSelector {
    constructor(private scene: THREE.Scene, private physicsWorld: CANNON.World, private staticMaterial: CANNON.Material) {
        this.createSceneSelector();
  }

  createSceneSelector() {
    const select = document.createElement('select');
    select.id = 'scene-select';
    ['Forest', 'City', 'Moon'].forEach((sceneType) => {
      const option = document.createElement('option');
      option.value = sceneType;
      option.innerText = sceneType;
      select.appendChild(option);
    });
    select.style.position = 'absolute';
    select.style.top = '10px';
    select.style.left = '10px';
    select.style.zIndex = '1000';
    document.body.appendChild(select);

    select.addEventListener('change', () => {
      ProceduralScene.generateScene(this.scene, this.physicsWorld, select.value, 100, this.staticMaterial);
    });

    // Optionally, generate an initial scene.
    ProceduralScene.generateScene(this.scene, this.physicsWorld, select.value, 100, this.staticMaterial);
  }
}
