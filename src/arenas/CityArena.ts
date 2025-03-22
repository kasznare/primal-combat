import { ProceduralScene } from '../scene/proceduralScene';
import { Arena, IArenaOptions } from './Arena';
import * as CANNON from 'cannon-es';

export class CityArena extends Arena {
  constructor(options: IArenaOptions & { physicsWorld: CANNON.World, staticMaterial: CANNON.Material }, scene: THREE.Scene) {
    super(options, scene);
    // Generate city-specific objects (buildings, etc.) on top of the arena ground.
    ProceduralScene.generateCity(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
