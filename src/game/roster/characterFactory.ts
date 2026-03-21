import type * as THREE from "three";
import type { Character } from "../../entities/Character";
import { PhysicsEngine } from "../../physics/PhysicsEngine";
import { CHARACTER_CONFIGS } from "./characterConfigs";
import { resolveCharacterKey } from "./characterResolver";

function createCharacter(
  key: string,
  physicsEngine: PhysicsEngine
): { character: Character; config: (typeof CHARACTER_CONFIGS)[string] } {
  const config = CHARACTER_CONFIGS[key];
  const character = new config.classRef(config.stats, physicsEngine);
  return { character, config };
}

export function setupCharacters(
  scene: THREE.Scene,
  physicsEngine: PhysicsEngine,
  selectedPlayer?: string,
  selectedOpponent?: string
): {
  playerCharacter: Character;
  opponentCharacter: Character;
  playerConfig: (typeof CHARACTER_CONFIGS)[string];
  opponentConfig: (typeof CHARACTER_CONFIGS)[string];
} {
  const playerKey = resolveCharacterKey(selectedPlayer, "Human");
  const opponentKey = resolveCharacterKey(selectedOpponent, "Bear");
  const { character: playerCharacter, config: playerConfig } = createCharacter(playerKey, physicsEngine);
  const { character: opponentCharacter, config: opponentConfig } = createCharacter(
    opponentKey,
    physicsEngine
  );

  playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
  opponentCharacter.body.position.set(20, opponentCharacter.dimensions.height, 0);
  scene.add(playerCharacter.mesh);
  scene.add(opponentCharacter.mesh);
  physicsEngine.world.addBody(playerCharacter.body);
  physicsEngine.world.addBody(opponentCharacter.body);

  return { playerCharacter, opponentCharacter, playerConfig, opponentConfig };
}
