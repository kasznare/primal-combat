import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PhysicsEngine } from "../physics/PhysicsEngine.js";
import { Character } from "../entities/Character.js";
import * as CANNON from "cannon-es";
import { InputManager } from "./InputManager.js";
import { AIController } from "./AIController.js";
import { GameStateManager } from "./GameStateManager.js";
import { SceneSelector, SceneType } from "../scene/SceneSelector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { setupPostProcessing } from "../scene/PostProcessing.js";
import { setupCharacters } from "./CharacterSetup.js";

export class Game {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public composer: EffectComposer;

  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public physicsEngine: PhysicsEngine;
  public clock: THREE.Clock;
  public characters: Character[] = [];
  public playerCharacter: Character | null = null;
  public opponentCharacter: Character | null = null;

  private inputManager: InputManager;
  private aiController: AIController;
  private gameStateManager: GameStateManager;
  private sceneSelector: SceneSelector;
  private hasStartedAnimation = false;

  constructor(container: HTMLElement) {
    // 1) Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // 2) Create Scene
    this.scene = new THREE.Scene();

    // 3) Create Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 30);

    // 4) Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Remap mouse buttons: disable left-click (set to -1) and use right-click for rotation.
    this.controls.mouseButtons = {
      LEFT: -1, // disable left-click camera controls
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // Disable the default context menu on right-click.
    this.renderer.domElement.addEventListener("contextmenu", (event) =>
      event.preventDefault()
    );

    // 6) Post Processing (moved to scene/PostProcessing.ts)
    this.composer = setupPostProcessing(this.renderer, this.scene, this.camera);

    // 7) Physics & Arena
    this.clock = new THREE.Clock();
    this.physicsEngine = new PhysicsEngine();

    this.sceneSelector = new SceneSelector(
      this.scene,
      this.physicsEngine.world,
      this.physicsEngine.staticMaterial
    );
    this.sceneSelector.select("Forest");

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.material = this.physicsEngine.groundMaterial;
    this.physicsEngine.world.addBody(groundBody);

    // Instantiate managers.
    this.inputManager = new InputManager();
    this.aiController = new AIController();
    this.gameStateManager = new GameStateManager();

    window.addEventListener("resize", this.onWindowResize);
  }

  private lastFrameTime: number = 0;

  public startBattle(playerKey: string, opponentKey: string): void {
    this.clearCharacters();
    const { playerCharacter, opponentCharacter } = setupCharacters(
      this.scene,
      this.physicsEngine,
      playerKey,
      opponentKey
    );
    this.characters = [playerCharacter, opponentCharacter];
    this.playerCharacter = playerCharacter;
    this.opponentCharacter = opponentCharacter;
    this.lastFrameTime = 0;

    if (!this.hasStartedAnimation) {
      this.hasStartedAnimation = true;
      this.animate(0);
    }
  }

  public setScene(sceneType: SceneType): void {
    this.clearCharacters();
    this.sceneSelector.select(sceneType);
  }

  private clearCharacters(): void {
    this.characters.forEach((character) => {
      this.scene.remove(character.mesh);
      this.physicsEngine.world.removeBody(character.body);
      if (character.healthBarContainer.parentElement) {
        character.healthBarContainer.parentElement.removeChild(character.healthBarContainer);
      }
    });
    this.characters = [];
    this.playerCharacter = null;
    this.opponentCharacter = null;
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  animate = (timestamp: number) => {
    if (this.gameStateManager.isGameOver()) return;
    requestAnimationFrame(this.animate);
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < 1000 / 30) {
      return;
    }

    // Update lastFrameTime.
    this.lastFrameTime = timestamp;

    // Check for pause toggle using Escape.
    if (this.inputManager.isKeyPressed("Escape")) {
      if (!this.gameStateManager.isPaused()) {
        this.gameStateManager.setPaused(true);
        console.log("Game paused");
      } else {
        // Optionally, you could let Escape itself resume.
        // this.gameStateManager.setPaused(false);
        // console.log("Game resumed");
      }
      this.inputManager.resetKey("Escape"); // Reset so it doesn't keep toggling.
    }

    // If the game is paused, check if any key (except Escape) is pressed to resume.
    if (this.gameStateManager.isPaused()) {
      if (this.inputManager.anyKeyPressed(["Escape"])) {
        this.gameStateManager.setPaused(false);
        console.log("Game resumed");
      }
      // Still update controls and render so the camera remains responsive.
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      return; // Skip physics, AI, and input processing.
    }

    // requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    // Process player input.
    if (this.playerCharacter) {
      const groundLevel = this.playerCharacter.dimensions.height;
      // Check if the character is grounded (with a small tolerance).
      const isGrounded =
        this.playerCharacter.body.position.y <= groundLevel + 0.1;

      if (isGrounded) {
        // Process directional input only when grounded.
        const moveDirection = this.inputManager.getMovementVector(this.camera);
        const moveSpeed = 5;
        if (moveDirection.length() > 0) {
          moveDirection.normalize();
          this.playerCharacter.body.velocity.x = moveDirection.x * moveSpeed;
          this.playerCharacter.body.velocity.z = moveDirection.z * moveSpeed;
        } else {
          // Apply damping if no directional input.
          this.playerCharacter.body.velocity.x *= 0.98;
          this.playerCharacter.body.velocity.z *= 0.98;
        }
      }

      // Handle jumping regardless of horizontal movement.
      if (this.inputManager.isKeyPressed("Space")) {
        if (isGrounded) {
          const jumpVelocity = 8;
          this.playerCharacter.body.velocity.y = jumpVelocity;
        }
        this.inputManager.resetKey("Space");
      }
    }

    // Update enemy AI.
    if (this.playerCharacter) {
      this.aiController.update(this.playerCharacter, this.characters);
    }

    // Update physics.
    this.physicsEngine.update(Math.min(delta, 1 / 60));

    // Update characters and health bars.
    this.characters.forEach((character) => {
      character.update();
      character.updateHealthBar(this.camera);
    });

    // Check win/lose conditions.
    if (this.playerCharacter && this.playerCharacter.health <= 0) {
      this.gameStateManager.setGameOver();
      alert("Game Over: You Lose!");
      this.gameStateManager.restartGame();
      return;
    }
    if (this.opponentCharacter && this.opponentCharacter.health <= 0) {
      this.gameStateManager.setGameOver();
      alert("Game Over: You Win!");
      this.gameStateManager.restartGame();
      return;
    }

    // Update OrbitControls target.
    if (this.playerCharacter) {
      this.controls.target.copy(this.playerCharacter.mesh.position);
    }
    this.controls.update();

    // Render the scene.
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  };
}
