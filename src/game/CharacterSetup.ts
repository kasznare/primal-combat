
// Import Cheetah and Dragon similarly.
import * as THREE from 'three';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { MovementType } from '../entities/Character';
import { Bear } from '../entities/Bear';
import { Human } from '../entities/Human';

const entityClasses: Record<string, any> = {
  Human,
  Bear,
  // Cheetah, Dragon, etc.
};

export function setupCharacters(
  scene: THREE.Scene,
  physicsEngine: PhysicsEngine
): { playerCharacter: any; opponentCharacter: any } {
  const charSelectElem = document.getElementById("character-select") as HTMLSelectElement;
  const selectedCharacter = charSelectElem?.value || "Human";
  const OpponentSelectElem = document.getElementById("opponent-select") as HTMLSelectElement;
  const selectedOpponent = OpponentSelectElem?.value || "Bear";

  const PlayerClass = entityClasses[selectedCharacter] || Human;
  const OpponentClass = entityClasses[selectedOpponent] || Bear;

  const playerCharacter = new PlayerClass(
    {
      name: selectedCharacter,
      color: 0xfad6a5, // or pull from a map
      weight: 70,
      dimensions: { width: 0.5, height: 1.8, depth: 0.5 },
      maxVelocity: 10,
      maxAcceleration: 3,
      movementType: MovementType.Grounded,
      health: 100,
    },
    physicsEngine
  );

  const opponentCharacter = new OpponentClass(
    {
      name: selectedOpponent,
      color: 0x8b4513,
      weight: 350,
      dimensions: { width: 1.2, height: 1.0, depth: 2.0 },
      maxVelocity: 15,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 200,
    },
    physicsEngine
  );

  // Position, add to scene, etc.
  playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
  opponentCharacter.body.position.set(20, opponentCharacter.dimensions.height, 0);
  scene.add(playerCharacter.mesh);
  scene.add(opponentCharacter.mesh);
  physicsEngine.world.addBody(playerCharacter.body);
  physicsEngine.world.addBody(opponentCharacter.body);

  return { playerCharacter, opponentCharacter };
}
