import type { PerspectiveCamera, Vector3 } from "three";
import type { Character } from "../../entities/Character";
import type { InputManager } from "../InputManager";
import type { ArenaRuntimeModifiers } from "../arena/ArenaRules";
import {
  applyDesiredHorizontalVelocity,
  rotateTowardDirection,
} from "../movement/MovementDynamics";
import type { CharacterConfig } from "../roster/types";

type PlayerMovementState = {
  lastGroundedAt: number;
};

const JUMP_BUFFER_MS = 150;
const COYOTE_TIME_MS = 120;

export class PlayerMovementController {
  private states = new WeakMap<Character, PlayerMovementState>();

  public update(
    playerCharacter: Character,
    inputManager: InputManager,
    camera: PerspectiveCamera,
    config: CharacterConfig,
    movementScale: number,
    arenaModifiers: ArenaRuntimeModifiers,
    deltaSeconds: number,
    timestamp: number
  ): void {
    const moveDirection = inputManager.getMovementVector(camera);
    const verticalInput =
      (inputManager.isKeyPressed("Space") ? 1 : 0) - (inputManager.isKeyPressed("ShiftLeft") ? 1 : 0);
    this.updateFromDirection(
      playerCharacter,
      moveDirection,
      config,
      movementScale,
      arenaModifiers,
      deltaSeconds,
      timestamp,
      verticalInput,
      inputManager
    );
  }

  public updateFromDirection(
    playerCharacter: Character,
    moveDirection: Vector3,
    config: CharacterConfig,
    movementScale: number,
    arenaModifiers: ArenaRuntimeModifiers,
    deltaSeconds: number,
    timestamp: number,
    verticalInput = 0,
    inputManager?: InputManager
  ): void {
    const moveSpeed =
      config.stats.maxVelocity *
      config.movement.speedMultiplier *
      movementScale *
      arenaModifiers.movementSpeedMultiplier;
    const state = this.getState(playerCharacter);

    if (config.movement.archetype === "flying") {
      applyDesiredHorizontalVelocity(
        playerCharacter,
        config,
        moveDirection,
        moveSpeed,
        deltaSeconds
      );
      playerCharacter.body.velocity.y = verticalInput * Math.max(2.5, moveSpeed * 0.35);
      const hoverHeight = config.movement.hoverHeight ?? playerCharacter.dimensions.height + 1.5;
      if (Math.abs(verticalInput) < 0.1) {
        const hoverDelta = hoverHeight - playerCharacter.body.position.y;
        playerCharacter.body.velocity.y = hoverDelta * 2;
      }
      rotateTowardDirection(playerCharacter, moveDirection, config.movement.turnSpeed, deltaSeconds);
      return;
    }

    const groundLevel = playerCharacter.dimensions.height;
    const isGrounded = playerCharacter.body.position.y <= groundLevel + 0.1;
    if (isGrounded) {
      state.lastGroundedAt = timestamp;
    }

    const movementDirection = moveDirection.lengthSq() > 0 ? moveDirection.normalize() : moveDirection;
    const airControlMultiplier = isGrounded ? 1 : 0.58;
    applyDesiredHorizontalVelocity(
      playerCharacter,
      config,
      movementDirection,
      moveSpeed * airControlMultiplier,
      deltaSeconds
    );

    if (movementDirection.lengthSq() > 0) {
      rotateTowardDirection(
        playerCharacter,
        movementDirection,
        config.movement.turnSpeed * (isGrounded ? 1 : 0.78),
        deltaSeconds
      );
    }

    const canJump =
      config.movement.jumpStrength > 0 &&
      (isGrounded || timestamp - state.lastGroundedAt <= COYOTE_TIME_MS);
    if (canJump && inputManager?.consumeBufferedPress("Space", timestamp, JUMP_BUFFER_MS)) {
      playerCharacter.body.velocity.y = config.movement.jumpStrength * arenaModifiers.jumpMultiplier;
      state.lastGroundedAt = Number.NEGATIVE_INFINITY;
    }
  }

  private getState(character: Character): PlayerMovementState {
    const existing = this.states.get(character);
    if (existing) {
      return existing;
    }

    const created = { lastGroundedAt: Number.NEGATIVE_INFINITY };
    this.states.set(character, created);
    return created;
  }
}
