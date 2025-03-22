import { ProceduralScene } from './ProceduralScene.js';
import * as THREE from 'three';

export class SceneSelector {
  constructor(private scene: THREE.Scene) {
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
    // Style the dropdown.
    select.style.position = 'absolute';
    select.style.top = '10px';
    select.style.left = '10px';
    select.style.zIndex = '1000';
    document.body.appendChild(select);

    // When the selection changes, regenerate the scene details.
    select.addEventListener('change', () => {
      ProceduralScene.generateScene(select.value, this.scene);
    });

    // Optionally, generate an initial scene.
    ProceduralScene.generateScene(select.value, this.scene);
  }
}
