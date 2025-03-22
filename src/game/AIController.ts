import * as THREE from 'three';
import { Character } from '../entities/Character.js';

export class AIController {
  /**
   * Updates enemy behavior.
   * @param player The player character.
   * @param characters Array of all characters.
   * @param obstacles Array of THREE.Object3D obstacles.
   */
  public update(player: Character, characters: Character[], obstacles: THREE.Object3D[] = []): void {
    characters.forEach((character) => {
      if (character !== player && character.name === 'Bear') {
        const position = character.mesh.position;
        const targetPos = player.mesh.position;

        // Compute desired direction towards the player (ignoring vertical differences).
        let desiredDirection = new THREE.Vector3().subVectors(targetPos, position);
        desiredDirection.y = 0;
        if (desiredDirection.length() === 0) return;
        desiredDirection.normalize();

        const chaseSpeed = 2;
        let bestDirection = desiredDirection.clone();
        let bestScore = Number.NEGATIVE_INFINITY;

        // Try a range of candidate directions (in degrees) relative to desiredDirection.
        const angleIncrements = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90];
        for (let angleDeg of angleIncrements) {
          const angleRad = angleDeg * (Math.PI / 180);
          const candidate = desiredDirection.clone();
          candidate.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);

          // Use the character's size to determine how far to look ahead.
          const detectionRange = character.dimensions.width * 2;
          const raycaster = new THREE.Raycaster(position, candidate, 0, detectionRange);
          const intersections = raycaster.intersectObjects(obstacles, true);

          // Calculate a score: higher if there's no obstacle, or if the obstacle is far away.
          let score = intersections.length === 0 ? 100 : -intersections[0].distance;
          // Bonus for staying aligned with the desired direction.
          score += candidate.dot(desiredDirection);

          if (score > bestScore) {
            bestScore = score;
            bestDirection = candidate;
          }
        }

        // Apply the chosen direction.
        character.body.velocity.x = bestDirection.x * chaseSpeed;
        character.body.velocity.z = bestDirection.z * chaseSpeed;
      }
    });
  }
}
