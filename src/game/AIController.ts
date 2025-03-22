import * as THREE from 'three';
import { Character } from '../entities/Character.js';

export class AIController {
  // Updates enemy behavior.
  public update(player: Character, characters: Character[]): void {
    characters.forEach((character) => {
      if (character !== player && character.name === 'Bear') {
        const chaseDirection = new THREE.Vector3().subVectors(
          player.mesh.position,
          character.mesh.position
        );
        chaseDirection.y = 0;
        if (chaseDirection.length() > 0) {
          chaseDirection.normalize();
          const chaseSpeed = 2; // Reduced chase speed.
          character.body.velocity.x = chaseDirection.x * chaseSpeed;
          character.body.velocity.z = chaseDirection.z * chaseSpeed;
        }
      }
    });
  }
}
