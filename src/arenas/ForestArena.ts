import { ProceduralScene } from '../scene/proceduralScene';
import { Arena, IArenaOptions } from './Arena';
import * as CANNON from 'cannon-es';

export class ForestArena extends Arena {
  constructor(options: IArenaOptions & { physicsWorld: CANNON.World, staticMaterial: CANNON.Material }, scene: THREE.Scene) {
    super(options, scene);
    // Generate forest-specific objects (trees, stones, etc.) on top of the arena ground.
    ProceduralScene.generateForest(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
