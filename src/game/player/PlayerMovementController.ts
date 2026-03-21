import type { PerspectiveCamera } from "three";
import type { Character } from "../../entities/Character";
import type { InputManager } from "../InputManager";
import type { ArenaRuntimeModifiers } from "../arena/ArenaRules";
import {
  applyDesiredHorizontalVelocity,
  rotateTowardDirection,
} from "../movement/MovementDynamics";
import type { CharacterConfig } from "../roster/types";

export class PlayerMovementController {
  public update(
    playerCharacter: Character,
    inputManager: InputManager,
    camera: PerspectiveCamera,
    config: CharacterConfig,
    movementScale: number,
    arenaModifiers: ArenaRuntimeModifiers,
    deltaSeconds: number
  ): void {
    const moveDirection = inputManager.getMovementVector(camera);
    const moveSpeed =
      config.stats.maxVelocity *
      config.movement.speedMultiplier *
      movementScale *
      arenaModifiers.movementSpeedMultiplier;

    if (config.movement.archetype === "flying") {
      const vertical =
        (inputManager.isKeyPressed("Space") ? 1 : 0) - (inputManager.isKeyPressed("ShiftLeft") ? 1 : 0);
      applyDesiredHorizontalVelocity(
        playerCharacter,
        config,
        moveDirection,
        moveSpeed,
        deltaSeconds
      );
      playerCharacter.body.velocity.y = vertical * Math.max(2.5, moveSpeed * 0.35);
      const hoverHeight = config.movement.hoverHeight ?? playerCharacter.dimensions.height + 1.5;
      if (Math.abs(vertical) < 0.1) {
        const hoverDelta = hoverHeight - playerCharacter.body.position.y;
        playerCharacter.body.velocity.y = hoverDelta * 2;
      }
      rotateTowardDirection(playerCharacter, moveDirection, config.movement.turnSpeed, deltaSeconds);
      return;
    }

    const groundLevel = playerCharacter.dimensions.height;
    const isGrounded = playerCharacter.body.position.y <= groundLevel + 0.1;

    if (isGrounded) {
      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        applyDesiredHorizontalVelocity(
          playerCharacter,
          config,
          moveDirection,
          moveSpeed,
          deltaSeconds
        );
        rotateTowardDirection(playerCharacter, moveDirection, config.movement.turnSpeed, deltaSeconds);
      } else {
        applyDesiredHorizontalVelocity(
          playerCharacter,
          config,
          moveDirection,
          0,
          deltaSeconds
        );
      }
    }

    if (inputManager.consumeKey("Space") && isGrounded && config.movement.jumpStrength > 0) {
      playerCharacter.body.velocity.y = config.movement.jumpStrength * arenaModifiers.jumpMultiplier;
    }
  }
}
