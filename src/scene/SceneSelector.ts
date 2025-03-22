import { setupEnvironment } from './Environment.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ForestArena } from '../arenas/ForestArena.js';
import { CityArena } from '../arenas/CityArena.js';
import { MoonArena } from '../arenas/MoonArena.js';

export class SceneSelector {
  currentArena: any = null;
  constructor(private scene: THREE.Scene, private physicsWorld: CANNON.World, private staticMaterial: CANNON.Material) {
    // Initial environment setup (lights, HDR background, etc.)
    setupEnvironment(this.scene);
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
      // Clear the scene before loading a new arena.
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
      // Reapply environment (lights, background, etc.)
      setupEnvironment(this.scene);

      const selected = select.value;
      if (selected === 'Forest') {
        this.currentArena = new ForestArena(
          {
            name: 'Forest Arena',
            groundColor: 0x228B22,
            skyColor: 0x87CEEB,
            physicsWorld: this.physicsWorld,
            staticMaterial: this.staticMaterial
          },
          this.scene
        );
      } else if (selected === 'City') {
        this.currentArena = new CityArena(
          {
            name: 'City Arena',
            groundColor: 0xAAAAAA,
            skyColor: 0x87CEEB,
            physicsWorld: this.physicsWorld,
            staticMaterial: this.staticMaterial
          },
          this.scene
        );
      } else if (selected === 'Moon') {
        this.currentArena = new MoonArena(
          {
            name: 'Moon Arena',
            groundColor: 0x888888,
            skyColor: 0x000000,
            physicsWorld: this.physicsWorld,
            staticMaterial: this.staticMaterial
          },
          this.scene
        );
      }
    });

    // Trigger the initial selection.
    const event = new Event('change');
    select.dispatchEvent(event);
  }
}
