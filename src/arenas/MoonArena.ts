import { ProceduralScene } from '../scene/proceduralScene';
import { Arena, IArenaOptions } from './Arena';
import * as CANNON from 'cannon-es';

export class MoonArena extends Arena {
  constructor(options: IArenaOptions & { physicsWorld: CANNON.World, staticMaterial: CANNON.Material }, scene: THREE.Scene) {
    super(options, scene);
    // Generate moon-specific objects (rocks, etc.) on top of the arena ground.
    ProceduralScene.generateMoon(scene, options.physicsWorld, 100, options.staticMaterial);
  }
}
