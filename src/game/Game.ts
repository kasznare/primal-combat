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
import { getBattleOutcome } from "./BattleRules.js";
import type { QualityLevel } from "../types/Quality.js";

type GameOptions = {
  onQualityChanged?: (quality: QualityLevel) => void;
};

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
  private currentScene: SceneType = "Forest";
  private currentQuality: QualityLevel = "medium";
  private autoQualityEnabled = true;
  private options?: GameOptions;
  private debugEnabled = false;
  private debugOverlay: HTMLDivElement;
  private debugAccumulatorMs = 0;
  private debugFrameCount = 0;
  private lastDebugSampleTs = 0;
  private playerMarker: THREE.Mesh | null = null;
  private opponentMarker: THREE.Mesh | null = null;
  private playerRimLight: THREE.PointLight | null = null;
  private opponentRimLight: THREE.PointLight | null = null;
  private perfWindowMs = 0;
  private perfWindowFrames = 0;
  private perfWindowStartTs = 0;

  constructor(container: HTMLElement, options?: GameOptions) {
    this.options = options;
    // 1) Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(this.getPixelRatioCap(this.currentQuality));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);
    this.debugOverlay = document.createElement("div");
    this.debugOverlay.className = "perf-overlay";
    this.debugOverlay.style.display = "none";
    container.appendChild(this.debugOverlay);

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
    this.sceneSelector.setQuality(this.currentQuality);
    this.sceneSelector.select(this.currentScene);

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
    this.setupCombatReadability();

    if (!this.hasStartedAnimation) {
      this.hasStartedAnimation = true;
      this.animate(0);
    }
  }

  public setScene(sceneType: SceneType): void {
    this.clearCharacters();
    this.currentScene = sceneType;
    this.sceneSelector.select(sceneType);
  }

  public setQuality(quality: QualityLevel): void {
    this.clearCharacters();
    this.currentQuality = quality;
    this.renderer.setPixelRatio(this.getPixelRatioCap(quality));
    this.renderer.shadowMap.enabled = quality !== "low";
    this.sceneSelector.setQuality(quality);
    this.sceneSelector.select(this.currentScene);
    this.options?.onQualityChanged?.(quality);
  }

  public setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.debugOverlay.style.display = enabled ? "block" : "none";
  }

  public setAutoQuality(enabled: boolean): void {
    this.autoQualityEnabled = enabled;
  }

  private clearCharacters(): void {
    this.clearCombatReadability();
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
    this.renderer.setPixelRatio(this.getPixelRatioCap(this.currentQuality));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  private getPixelRatioCap(quality: QualityLevel): number {
    const device = window.devicePixelRatio || 1;
    if (quality === "low") {
      return Math.min(device, 1);
    }
    if (quality === "high") {
      return Math.min(device, 2);
    }
    return Math.min(device, 1.5);
  }

  animate = (timestamp: number) => {
    if (this.gameStateManager.isGameOver()) return;
    requestAnimationFrame(this.animate);
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < 1000 / 60) {
      return;
    }

    // Update lastFrameTime.
    this.lastFrameTime = timestamp;
    this.updateDebugOverlay(elapsed, timestamp);
    this.updateAdaptiveQuality(elapsed, timestamp);

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
    this.updateCombatReadability();

    const outcome = getBattleOutcome(
      this.playerCharacter?.health,
      this.opponentCharacter?.health
    );
    if (outcome === "player_defeated") {
      this.handleBattleEnd("Game Over: You Lose!");
      return;
    }
    if (outcome === "opponent_defeated") {
      this.handleBattleEnd("Game Over: You Win!");
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

  private handleBattleEnd(message: string): void {
    this.gameStateManager.setGameOver();
    this.gameStateManager.setPaused(true);
    alert(message);
    this.clearCharacters();
    this.gameStateManager.reset();
  }

  private updateDebugOverlay(frameMs: number, timestamp: number): void {
    if (!this.debugEnabled) {
      return;
    }

    this.debugAccumulatorMs += frameMs;
    this.debugFrameCount += 1;

    if (timestamp - this.lastDebugSampleTs < 350) {
      return;
    }

    const avgFrameMs = this.debugAccumulatorMs / Math.max(1, this.debugFrameCount);
    const fps = 1000 / Math.max(1, avgFrameMs);
    this.debugOverlay.textContent =
      `FPS ${fps.toFixed(1)}\n` +
      `Frame ${avgFrameMs.toFixed(2)} ms\n` +
      `Quality ${this.currentQuality}\n` +
      `Draws ${this.renderer.info.render.calls}\n` +
      `Tris ${this.renderer.info.render.triangles}`;

    this.lastDebugSampleTs = timestamp;
    this.debugAccumulatorMs = 0;
    this.debugFrameCount = 0;
  }

  private updateAdaptiveQuality(frameMs: number, timestamp: number): void {
    if (!this.autoQualityEnabled) {
      return;
    }

    if (!this.perfWindowStartTs) {
      this.perfWindowStartTs = timestamp;
    }

    this.perfWindowMs += frameMs;
    this.perfWindowFrames += 1;

    if (timestamp - this.perfWindowStartTs < 2600) {
      return;
    }

    const avgFrameMs = this.perfWindowMs / Math.max(1, this.perfWindowFrames);
    const fps = 1000 / Math.max(1, avgFrameMs);

    if (this.currentQuality === "high" && fps < 50) {
      this.setQuality("medium");
    } else if (this.currentQuality === "medium" && fps < 42) {
      this.setQuality("low");
    }

    this.perfWindowStartTs = timestamp;
    this.perfWindowMs = 0;
    this.perfWindowFrames = 0;
  }

  private setupCombatReadability(): void {
    this.clearCombatReadability();
    if (!this.playerCharacter || !this.opponentCharacter) {
      return;
    }

    this.playerMarker = this.createGroundMarker(0x59afff);
    this.opponentMarker = this.createGroundMarker(0xff6f5d);
    this.scene.add(this.playerMarker);
    this.scene.add(this.opponentMarker);

    this.playerRimLight = this.createRimLight(0x75bcff);
    this.opponentRimLight = this.createRimLight(0xff7f6b);
    this.scene.add(this.playerRimLight);
    this.scene.add(this.opponentRimLight);
  }

  private clearCombatReadability(): void {
    [this.playerMarker, this.opponentMarker, this.playerRimLight, this.opponentRimLight].forEach(
      (object) => {
        if (object) {
          this.scene.remove(object);
        }
      }
    );
    this.playerMarker = null;
    this.opponentMarker = null;
    this.playerRimLight = null;
    this.opponentRimLight = null;
  }

  private updateCombatReadability(): void {
    if (!this.playerCharacter || !this.opponentCharacter) {
      return;
    }

    if (this.playerMarker) {
      this.playerMarker.position.set(
        this.playerCharacter.mesh.position.x,
        0.05,
        this.playerCharacter.mesh.position.z
      );
      this.playerMarker.scale.setScalar(this.playerCharacter.isHitFlashing() ? 1.22 : 1);
      (this.playerMarker.material as THREE.MeshBasicMaterial).opacity = this.playerCharacter.isHitFlashing()
        ? 0.96
        : 0.72;
    }
    if (this.opponentMarker) {
      this.opponentMarker.position.set(
        this.opponentCharacter.mesh.position.x,
        0.05,
        this.opponentCharacter.mesh.position.z
      );
      this.opponentMarker.scale.setScalar(this.opponentCharacter.isHitFlashing() ? 1.22 : 1);
      (this.opponentMarker.material as THREE.MeshBasicMaterial).opacity = this.opponentCharacter.isHitFlashing()
        ? 0.96
        : 0.72;
    }
    if (this.playerRimLight) {
      this.playerRimLight.position.set(
        this.playerCharacter.mesh.position.x,
        this.playerCharacter.dimensions.height + 0.6,
        this.playerCharacter.mesh.position.z
      );
      this.playerRimLight.intensity = this.playerCharacter.isHitFlashing() ? 1.2 : 0.65;
    }
    if (this.opponentRimLight) {
      this.opponentRimLight.position.set(
        this.opponentCharacter.mesh.position.x,
        this.opponentCharacter.dimensions.height + 0.6,
        this.opponentCharacter.mesh.position.z
      );
      this.opponentRimLight.intensity = this.opponentCharacter.isHitFlashing() ? 1.2 : 0.65;
    }
  }

  private createGroundMarker(color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.22, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
  }

  private createRimLight(color: number): THREE.PointLight {
    const light = new THREE.PointLight(color, 0.65, 8, 2.1);
    light.castShadow = false;
    return light;
  }
}
