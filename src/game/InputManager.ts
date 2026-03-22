import * as THREE from 'three';

export class InputManager {
  private keyStates: { [key: string]: boolean } = {};
  private bufferedPresses: { [key: string]: number } = {};
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (this.shouldIgnoreEventTarget(event.target, event.code)) {
      return;
    }
    if (!event.repeat) {
      this.bufferedPresses[event.code] = performance.now();
    }
    this.keyStates[event.code] = true;
  };
  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (this.shouldIgnoreEventTarget(event.target, event.code)) {
      return;
    }
    this.keyStates[event.code] = false;
  };

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
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

  public consumeKey(key: string): boolean {
    if (!this.isKeyPressed(key)) {
      return false;
    }
    this.resetKey(key);
    return true;
  }

  public anyKeyPressed(exclude: string[] = []): boolean {
    for (const key in this.keyStates) {
      if (!exclude.includes(key) && this.keyStates[key]) {
        return true;
      }
    }
    return false;
  }

  public hasBufferedPress(key: string, timestamp: number, bufferMs: number): boolean {
    const pressedAt = this.bufferedPresses[key];
    return Number.isFinite(pressedAt) && timestamp - pressedAt <= bufferMs;
  }

  public consumeBufferedPress(key: string, timestamp: number, bufferMs: number): boolean {
    if (!this.hasBufferedPress(key, timestamp, bufferMs)) {
      return false;
    }
    delete this.bufferedPresses[key];
    return true;
  }

  public clearBufferedPress(key: string): void {
    delete this.bufferedPresses[key];
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  private shouldIgnoreEventTarget(target: EventTarget | null, code: string): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const interactiveTarget = target.closest("button, input, select, textarea, [contenteditable='true']");
    if (!interactiveTarget) {
      return false;
    }

    if (interactiveTarget instanceof HTMLButtonElement) {
      return ["Space", "Enter", "NumpadEnter"].includes(code);
    }

    return (
      interactiveTarget instanceof HTMLInputElement ||
      interactiveTarget instanceof HTMLSelectElement ||
      interactiveTarget instanceof HTMLTextAreaElement ||
      interactiveTarget instanceof HTMLElement && interactiveTarget.isContentEditable
    );
  }
}
