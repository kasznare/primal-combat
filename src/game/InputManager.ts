import * as THREE from 'three';

export class InputManager {
  private keyStates: { [key: string]: boolean } = {};

  constructor() {
    document.addEventListener('keydown', (event) => {
      this.keyStates[event.code] = true;
    });
    document.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
    });
  }

  // Returns a movement vector relative to the camera, using arrow keys or WASD.
  public getMovementVector(camera: THREE.Camera): THREE.Vector3 {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDirection = new THREE.Vector3();
    // Check for forward movement (ArrowUp or W).
    if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) {
      moveDirection.add(forward);
    }
    // Check for backward movement (ArrowDown or S).
    if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) {
      moveDirection.sub(forward);
    }
    // Check for right movement (ArrowRight or D).
    if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) {
      moveDirection.add(right);
    }
    // Check for left movement (ArrowLeft or A).
    if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) {
      moveDirection.sub(right);
    }
    return moveDirection;
  }

  public isKeyPressed(key: string): boolean {
    return !!this.keyStates[key];
  }

  public resetKey(key: string): void {
    this.keyStates[key] = false;
  }
}
