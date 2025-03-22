// src/game/CharacterSetup.ts
import * as THREE from "three";
import { PhysicsEngine } from "../physics/PhysicsEngine";
import { Character, MovementType } from "../entities/Character";

interface EntityProps {
  dimensions: { width: number; height: number; depth: number };
  weight: number;
  maxVelocity: number;
  maxAcceleration: number;
  health: number;
  color: number;
}

const entityPropsMap: Record<string, EntityProps> = {
  Human: {
    dimensions: { width: 0.5, height: 1.8, depth: 0.5 },
    weight: 70,
    maxVelocity: 10,
    maxAcceleration: 3,
    health: 100,
    color: 0xfad6a5,
  },
  Bear: {
    dimensions: { width: 1.2, height: 1.0, depth: 2.0 },
    weight: 350,
    maxVelocity: 15,
    maxAcceleration: 5,
    health: 200,
    color: 0x8b4513,
  },
  Cheetah: {
    dimensions: { width: 0.4, height: 1.0, depth: 0.8 },
    weight: 50,
    maxVelocity: 30,
    maxAcceleration: 9,
    health: 80,
    color: 0xc0c0c0,
  },
  Dragon: {
    dimensions: { width: 4, height: 8, depth: 6 },
    weight: 2000,
    maxVelocity: 30,
    maxAcceleration: 5,
    health: 500,
    color: 0xff0000,
  },
};

/**
 * Sets up and spawns both the player and opponent characters, then returns them.
 * 
 * @param scene Three.js Scene to which characters should be added
 * @param physicsEngine The physics engine handling their bodies
 */
export function setupCharacters(
  scene: THREE.Scene,
  physicsEngine: PhysicsEngine
): { playerCharacter: Character; opponentCharacter: Character } {
  // 1. Get user selection from DOM
  const charSelectElem = document.getElementById("character-select") as HTMLSelectElement;
  const selectedCharacter = charSelectElem?.value || "Human";
  const playerProps = entityPropsMap[selectedCharacter] ?? entityPropsMap["Human"];

  const oppSelectElem = document.getElementById("opponent-select") as HTMLSelectElement;
  const selectedOpponent = oppSelectElem?.value || "Bear";
  const opponentProps = entityPropsMap[selectedOpponent] ?? entityPropsMap["Bear"];

  // 2. Create the player's character
  const playerCharacter = new Character(
    {
      name: selectedCharacter,
      color: playerProps.color,
      weight: playerProps.weight,
      dimensions: playerProps.dimensions,
      maxVelocity: playerProps.maxVelocity,
      maxAcceleration: playerProps.maxAcceleration,
      movementType: MovementType.Grounded,
      health: playerProps.health,
    },
    physicsEngine
  );

  // 3. Create the opponent's character
  const opponentCharacter = new Character(
    {
      name: selectedOpponent,
      color: opponentProps.color,
      weight: opponentProps.weight,
      dimensions: opponentProps.dimensions,
      maxVelocity: opponentProps.maxVelocity,
      maxAcceleration: opponentProps.maxAcceleration,
      movementType: MovementType.Grounded,
      health: opponentProps.health,
    },
    physicsEngine
  );

  // 4. Position them
  playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
  opponentCharacter.body.position.set(20, opponentCharacter.dimensions.height, 0);

  // 5. Add to scene & physics
  scene.add(playerCharacter.mesh);
  scene.add(opponentCharacter.mesh);
  physicsEngine.world.addBody(playerCharacter.body);
  physicsEngine.world.addBody(opponentCharacter.body);

  return { playerCharacter, opponentCharacter };
}
