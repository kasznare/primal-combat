import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import type { Character } from "../entities/Character.js";
import { PhysicsEngine } from "../physics/PhysicsEngine.js";
import { SceneSelector, type SceneType } from "../scene/SceneSelector.js";
import { setupPostProcessing } from "../scene/PostProcessing.js";
import { setupCharacters } from "./CharacterSetup.js";
import { AIController } from "./AIController.js";
import { InputManager } from "./InputManager.js";
import { GameStateManager } from "./GameStateManager.js";
import { getBattleOutcome } from "./BattleRules.js";
import { PlayerMovementController } from "./player/PlayerMovementController.js";
import { AdaptiveQualityController } from "./runtime/AdaptiveQualityController.js";
import { CombatReadabilitySystem } from "./runtime/CombatReadabilitySystem.js";
import { PerformanceMonitor } from "./runtime/PerformanceMonitor.js";
import { CharacterAnimationSystem } from "./runtime/CharacterAnimationSystem.js";
import { BloodEffectsSystem } from "./runtime/BloodEffectsSystem.js";
import { getPixelRatioCap } from "./runtime/QualityRuntime.js";
import { CombatSystem } from "./combat/CombatSystem.js";
import type { CombatEvent } from "./combat/types.js";
import { ArenaRules } from "./arena/ArenaRules.js";
import type { CharacterConfig } from "./roster/types.js";
import type { GameOptions, QualityChangeSource } from "./types/GameOptions.js";
import type { QualityLevel } from "../types/Quality.js";
import { GameCameraController } from "./camera/GameCameraController.js";
import { AudioSystem } from "./audio/AudioSystem.js";

const ROUND_COUNTDOWN_MS = 1_200;
const ROUND_DURATION_MS = 75_000;
const HUD_EMIT_INTERVAL_MS = 100;

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
  private playerMovementController: PlayerMovementController;
  private combatReadabilitySystem: CombatReadabilitySystem;
  private adaptiveQualityController: AdaptiveQualityController;
  private performanceMonitor: PerformanceMonitor;
  private combatSystem: CombatSystem;
  private arenaRules: ArenaRules;
  private cameraController: GameCameraController;
  private animationSystem: CharacterAnimationSystem;
  private bloodEffectsSystem: BloodEffectsSystem;
  private audioSystem: AudioSystem;

  private playerConfig: CharacterConfig | null = null;
  private opponentConfig: CharacterConfig | null = null;
  private hasStartedAnimation = false;
  private currentScene: SceneType = "Forest";
  private currentQuality: QualityLevel = "medium";
  private options?: GameOptions;
  private container: HTMLElement;
  private lastFrameTime = 0;
  private hitstopUntil = 0;
  private lastHudEmitAt = 0;
  private animationFrameId: number | null = null;
  private destroyed = false;

  constructor(container: HTMLElement, options?: GameOptions) {
    this.container = container;
    this.options = options;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(getPixelRatioCap(this.currentQuality));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute("aria-label", "Game viewport");
    container.appendChild(this.renderer.domElement);

    this.performanceMonitor = new PerformanceMonitor(container);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 20, 30);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.mouseButtons = {
      LEFT: -1,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.renderer.domElement.addEventListener("contextmenu", (event) => event.preventDefault());

    this.composer = setupPostProcessing(this.renderer, this.scene, this.camera);
    this.clock = new THREE.Clock();
    this.physicsEngine = new PhysicsEngine();
    this.sceneSelector = new SceneSelector(
      this.scene,
      this.physicsEngine.world,
      this.physicsEngine.staticMaterial
    );
    this.sceneSelector.setQuality(this.currentQuality);
    this.sceneSelector.select(this.currentScene);

    this.addPhysicsGround();

    this.inputManager = new InputManager();
    this.aiController = new AIController();
    this.gameStateManager = new GameStateManager();
    this.playerMovementController = new PlayerMovementController();
    this.combatReadabilitySystem = new CombatReadabilitySystem();
    this.adaptiveQualityController = new AdaptiveQualityController();
    this.combatSystem = new CombatSystem();
    this.arenaRules = new ArenaRules();
    this.cameraController = new GameCameraController();
    this.animationSystem = new CharacterAnimationSystem();
    this.bloodEffectsSystem = new BloodEffectsSystem();
    this.bloodEffectsSystem.setQuality(this.currentQuality);
    this.audioSystem = new AudioSystem();

    this.cameraController.frameMenu(this.camera, this.currentScene);
    window.addEventListener("resize", this.onWindowResize);
    this.emitRoundState();
    this.emitHudState(performance.now(), true);
  }

  public focusSurface(): void {
    this.renderer.domElement.focus({ preventScroll: true });
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener("resize", this.onWindowResize);
    this.controls.dispose();
    this.inputManager.destroy();
    this.performanceMonitor.destroy();
    this.clearCharacters();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public async unlockAudio(): Promise<void> {
    await this.audioSystem.unlock();
    this.audioSystem.setAmbience(this.currentScene);
  }

  public startBattle(playerKey: string, opponentKey: string): void {
    this.clearCharacters();
    const { playerCharacter, opponentCharacter, playerConfig, opponentConfig } = setupCharacters(
      this.scene,
      this.physicsEngine,
      playerKey,
      opponentKey
    );

    this.characters = [playerCharacter, opponentCharacter];
    this.playerCharacter = playerCharacter;
    this.opponentCharacter = opponentCharacter;
    this.playerConfig = playerConfig;
    this.opponentConfig = opponentConfig;
    this.characters.forEach((character) => {
      character.healToFull();
      character.setHealthBarVisible(false);
      this.combatSystem.resetCharacter(character);
      this.animationSystem.reset(character);
    });

    this.applySpawnPositions();
    this.lastFrameTime = 0;
    this.hitstopUntil = 0;

    this.combatReadabilitySystem.setup(this.scene, this.playerCharacter, this.opponentCharacter);
    this.bloodEffectsSystem.clear(this.scene);
    this.gameStateManager.startCountdown(performance.now(), ROUND_COUNTDOWN_MS, ROUND_DURATION_MS);
    this.audioSystem.playUiConfirm();
    this.emitRoundState();
    this.emitHudState(performance.now(), true);

    if (!this.hasStartedAnimation) {
      this.hasStartedAnimation = true;
      this.animate(0);
    }
  }

  public setScene(sceneType: SceneType): void {
    this.clearCharacters();
    this.currentScene = sceneType;
    this.sceneSelector.select(sceneType);
    this.cameraController.frameMenu(this.camera, sceneType);
    this.gameStateManager.setMenu();
    this.audioSystem.setAmbience(sceneType);
    this.emitRoundState();
    this.emitHudState(performance.now(), true);
  }

  public setQuality(quality: QualityLevel, source: QualityChangeSource = "manual"): void {
    this.clearCharacters();
    this.currentQuality = quality;
    this.renderer.setPixelRatio(getPixelRatioCap(quality));
    this.renderer.shadowMap.enabled = quality !== "low";
    this.sceneSelector.setQuality(quality);
    this.bloodEffectsSystem.setQuality(quality);
    this.sceneSelector.select(this.currentScene);
    this.cameraController.frameMenu(this.camera, this.currentScene);
    this.gameStateManager.setMenu();
    this.emitRoundState();
    this.emitHudState(performance.now(), true);
    this.options?.onQualityChanged?.(quality, source);
  }

  public setDebug(enabled: boolean): void {
    this.performanceMonitor.setEnabled(enabled);
  }

  public setAutoQuality(enabled: boolean): void {
    this.adaptiveQualityController.setEnabled(enabled);
  }

  public togglePause(): void {
    const now = performance.now();
    if (this.gameStateManager.getPhase() === "playing" || this.gameStateManager.getPhase() === "countdown") {
      this.gameStateManager.setPaused(true, now);
      this.emitRoundState();
      this.emitHudState(now, true);
      return;
    }

    if (this.gameStateManager.getPhase() === "paused") {
      this.gameStateManager.setPaused(false, now);
      this.emitRoundState();
      this.emitHudState(now, true);
    }
  }

  animate = (timestamp: number) => {
    if (this.destroyed) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < 1000 / 60) {
      return;
    }

    this.lastFrameTime = timestamp;
    this.performanceMonitor.update(elapsed, timestamp, this.renderer, this.currentQuality);
    this.adaptiveQualityController.update(elapsed, timestamp, this.currentQuality, (nextQuality) =>
      this.setQuality(nextQuality, "adaptive")
    );

    this.handlePauseToggle(timestamp);
    if (this.gameStateManager.update(timestamp)) {
      this.emitRoundState();
    }

    const deltaSeconds = Math.min(this.clock.getDelta(), 1 / 30);
    const arenaModifiers = this.arenaRules.getRuntimeModifiers(this.currentScene, timestamp);
    this.physicsEngine.world.gravity.set(0, -9.82 * arenaModifiers.gravityScale, 0);

    if (this.gameStateManager.getPhase() === "playing") {
      this.updatePlaying(timestamp, deltaSeconds, arenaModifiers.knockbackMultiplier, arenaModifiers);
    } else {
      this.dampCharacters();
    }

    this.updateCharacters(timestamp);
    this.bloodEffectsSystem.update(this.scene, this.characters, timestamp);
    this.updateCamera(deltaSeconds);

    this.controls.enabled = this.gameStateManager.getPhase() === "menu";
    if (this.controls.enabled) {
      this.controls.update();
    }
    this.composer.render();
    this.emitHudState(timestamp);
  };

  private updatePlaying(
    timestamp: number,
    deltaSeconds: number,
    knockbackScale: number,
    arenaModifiers: ReturnType<ArenaRules["getRuntimeModifiers"]>
  ): void {
    if (this.playerCharacter && this.playerConfig && this.opponentCharacter) {
      const blockEvent = this.combatSystem.setBlocking(
        this.playerCharacter,
        this.playerConfig,
        this.inputManager.isKeyPressed("KeyQ"),
        timestamp
      );
      this.processCombatEvent(blockEvent);

      if (this.inputManager.hasBufferedPress("KeyE", timestamp, 180)) {
        const dodgeEvent = this.combatSystem.tryDodge(
          this.playerCharacter,
          this.playerConfig,
          this.inputManager.getMovementVector(this.camera),
          timestamp
        );
        if (dodgeEvent) {
          this.inputManager.clearBufferedPress("KeyE");
        }
        this.processCombatEvent(dodgeEvent);
      }

      if (this.inputManager.hasBufferedPress("KeyF", timestamp, 180)) {
        const attackEvent = this.combatSystem.startAttack(
          this.playerCharacter,
          this.opponentCharacter,
          this.playerConfig,
          timestamp,
          this.playerConfig.attack.id
        );
        if (attackEvent) {
          this.inputManager.clearBufferedPress("KeyF");
        }
        this.processCombatEvent(attackEvent);
      }

      const secondaryAttack = this.playerConfig.attacks[1];
      if (secondaryAttack && this.inputManager.hasBufferedPress("KeyR", timestamp, 220)) {
        const attackEvent = this.combatSystem.startAttack(
          this.playerCharacter,
          this.opponentCharacter,
          this.playerConfig,
          timestamp,
          secondaryAttack.id
        );
        if (attackEvent) {
          this.inputManager.clearBufferedPress("KeyR");
        }
        this.processCombatEvent(attackEvent);
      }

      if (this.combatSystem.canMove(this.playerCharacter)) {
        this.playerMovementController.update(
          this.playerCharacter,
          this.inputManager,
          this.camera,
          this.playerConfig,
          this.combatSystem.getMovementScale(this.playerCharacter),
          arenaModifiers,
          deltaSeconds,
          timestamp
        );
      } else {
        this.playerCharacter.body.velocity.x *= 0.92;
        this.playerCharacter.body.velocity.z *= 0.92;
      }
    }

    if (
      this.playerCharacter &&
      this.opponentCharacter &&
      this.playerConfig &&
      this.opponentConfig
    ) {
      const aiEvents = this.aiController.update(
        this.playerCharacter,
        this.opponentCharacter,
        this.opponentConfig,
        this.playerConfig,
        this.combatSystem,
        timestamp,
        arenaModifiers,
        deltaSeconds
      );
      aiEvents.forEach((event) => this.processCombatEvent(event));

      const playerCombatEvents = this.combatSystem.updateFighter(
        this.playerCharacter,
        this.opponentCharacter,
        this.playerConfig,
        this.opponentConfig,
        timestamp,
        knockbackScale
      );
      playerCombatEvents.forEach((event) => this.processCombatEvent(event));

      const opponentCombatEvents = this.combatSystem.updateFighter(
        this.opponentCharacter,
        this.playerCharacter,
        this.opponentConfig,
        this.playerConfig,
        timestamp,
        knockbackScale
      );
      opponentCombatEvents.forEach((event) => this.processCombatEvent(event));
    }

    if (timestamp >= this.hitstopUntil) {
      this.physicsEngine.update(deltaSeconds);
    }

    this.enforceArenaRules(deltaSeconds, timestamp);
    this.combatReadabilitySystem.update(this.playerCharacter, this.opponentCharacter);
    this.handleBattleOutcome(timestamp);
  }

  private updateCharacters(timestamp: number): void {
    this.characters.forEach((character) => {
      character.update();
      character.updateHealthBar(this.camera);
      const config = this.getConfigForCharacter(character);
      if (config) {
        this.animationSystem.update(
          character,
          config,
          this.combatSystem.getState(character),
          timestamp
        );
      }
    });
  }

  private updateCamera(deltaSeconds: number): void {
    if (this.playerCharacter && this.opponentCharacter) {
      this.cameraController.update(
        this.camera,
        this.playerCharacter,
        this.opponentCharacter,
        this.currentScene,
        this.arenaRules.getDefinition(this.currentScene).radius,
        deltaSeconds
      );
      return;
    }
    this.cameraController.frameMenu(this.camera, this.currentScene);
  }

  private dampCharacters(): void {
    this.characters.forEach((character) => {
      character.body.velocity.x *= 0.88;
      character.body.velocity.z *= 0.88;
    });
  }

  private addPhysicsGround(): void {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.material = this.physicsEngine.groundMaterial;
    this.physicsEngine.world.addBody(groundBody);
  }

  private applySpawnPositions(): void {
    if (!this.playerCharacter || !this.opponentCharacter) {
      return;
    }
    const arena = this.arenaRules.getDefinition(this.currentScene);
    this.playerCharacter.body.position.set(
      arena.playerSpawn.x,
      this.playerCharacter.dimensions.height,
      arena.playerSpawn.z
    );
    this.playerCharacter.body.velocity.set(0, 0, 0);
    this.opponentCharacter.body.position.set(
      arena.opponentSpawn.x,
      this.opponentCharacter.dimensions.height,
      arena.opponentSpawn.z
    );
    this.opponentCharacter.body.velocity.set(0, 0, 0);
  }

  private handlePauseToggle(timestamp: number): void {
    if (!this.inputManager.consumeKey("Escape")) {
      return;
    }
    void timestamp;
    this.togglePause();
  }

  private enforceArenaRules(deltaSeconds: number, timestamp: number): void {
    this.characters.forEach((character) => {
      this.arenaRules.enforceBounds(character, this.currentScene, deltaSeconds);
      this.arenaRules.applySceneEffects(character, this.currentScene, deltaSeconds, timestamp);
    });
  }

  private handleBattleOutcome(timestamp: number): boolean {
    const outcome = getBattleOutcome(this.playerCharacter?.health, this.opponentCharacter?.health);
    if (outcome === "player_defeated") {
      this.gameStateManager.finishRound("opponent", "You Lose");
      this.emitRoundState();
      return true;
    }
    if (outcome === "opponent_defeated") {
      this.gameStateManager.finishRound("player", "You Win");
      this.emitRoundState();
      return true;
    }

    if (this.gameStateManager.getPhase() === "playing" && this.gameStateManager.getRemainingMs(timestamp) <= 0) {
      const playerHealth = this.playerCharacter?.health ?? 0;
      const opponentHealth = this.opponentCharacter?.health ?? 0;
      if (playerHealth > opponentHealth) {
        this.gameStateManager.finishRound("player", "Time Up: You Win");
      } else if (opponentHealth > playerHealth) {
        this.gameStateManager.finishRound("opponent", "Time Up: You Lose");
      } else {
        this.gameStateManager.finishRound("draw", "Time Up: Draw");
      }
      this.emitRoundState();
      return true;
    }

    return false;
  }

  private processCombatEvent(event: CombatEvent | null): void {
    if (!event) {
      return;
    }

    if (event.hitstopMs) {
      this.hitstopUntil = Math.max(this.hitstopUntil, this.lastFrameTime + event.hitstopMs);
    }

    if (event.type === "attack_start" && event.attacker) {
      const config = this.getConfigForCharacter(event.attacker);
      if (config) {
        this.audioSystem.playAttack(config);
      }
      return;
    }

    if (event.type === "attack_hit" && event.attacker) {
      const config = this.getConfigForCharacter(event.attacker);
      if (config) {
        this.audioSystem.playHit(config);
      }
      this.bloodEffectsSystem.handleCombatEvent(this.scene, event, this.lastFrameTime);
      return;
    }

    if (event.type === "attack_blocked" && event.target) {
      const config = this.getConfigForCharacter(event.target);
      if (config) {
        this.audioSystem.playBlock(config);
      }
      return;
    }

    if (event.type === "dodge" && event.target) {
      const config = this.getConfigForCharacter(event.target);
      if (config) {
        this.audioSystem.playDodge(config);
      }
    }
  }

  private getConfigForCharacter(character: Character | undefined): CharacterConfig | null {
    if (!character) {
      return null;
    }
    if (character === this.playerCharacter) {
      return this.playerConfig;
    }
    if (character === this.opponentCharacter) {
      return this.opponentConfig;
    }
    return null;
  }

  private clearCharacters(): void {
    this.combatReadabilitySystem.clear(this.scene);
    this.bloodEffectsSystem.clear(this.scene);
    this.characters.forEach((character) => {
      this.scene.remove(character.mesh);
      this.physicsEngine.world.removeBody(character.body);
      character.destroy();
    });

    this.characters = [];
    this.playerCharacter = null;
    this.opponentCharacter = null;
    this.playerConfig = null;
    this.opponentConfig = null;
  }

  private emitRoundState(): void {
    this.options?.onRoundStateChanged?.(this.gameStateManager.getState());
  }

  private emitHudState(timestamp: number, force = false): void {
    if (!this.options?.onHudStateChanged) {
      return;
    }
    if (!force && timestamp - this.lastHudEmitAt < HUD_EMIT_INTERVAL_MS) {
      return;
    }

    const arena = this.arenaRules.getRuntimeModifiers(this.currentScene, timestamp);
    const hudState = {
      phase: this.gameStateManager.getPhase(),
      quality: this.currentQuality,
      timerMs: this.gameStateManager.getRemainingMs(timestamp),
      player: this.playerCharacter && this.playerConfig
        ? {
            key: this.playerConfig.key,
            label: this.playerConfig.label,
            health: this.playerCharacter.health,
            maxHealth: this.playerCharacter.maxHealth,
          cooldownProgress: this.combatSystem.getCooldownProgress(
            this.playerCharacter,
            this.playerConfig,
            timestamp
          ),
            secondaryCooldownProgress: this.playerConfig.attacks[1]
              ? this.combatSystem.getCooldownProgress(
                  this.playerCharacter,
                  this.playerConfig,
                  timestamp,
                  this.playerConfig.attacks[1].id
                )
              : 1,
            dodgeReady: this.combatSystem.isDodgeReady(this.playerCharacter, timestamp),
            phase: this.combatSystem.getPhase(this.playerCharacter),
            blocking: this.combatSystem.getPhase(this.playerCharacter) === "blocking",
            bleeding: this.combatSystem.isBleeding(this.playerCharacter, timestamp),
            primaryMoveLabel: this.playerConfig.attack.label,
            secondaryMoveLabel: this.playerConfig.attacks[1]?.label ?? null,
          }
        : null,
      opponent: this.opponentCharacter && this.opponentConfig
        ? {
            key: this.opponentConfig.key,
            label: this.opponentConfig.label,
            health: this.opponentCharacter.health,
            maxHealth: this.opponentCharacter.maxHealth,
          cooldownProgress: this.combatSystem.getCooldownProgress(
            this.opponentCharacter,
            this.opponentConfig,
            timestamp
          ),
            secondaryCooldownProgress: this.opponentConfig.attacks[1]
              ? this.combatSystem.getCooldownProgress(
                  this.opponentCharacter,
                  this.opponentConfig,
                  timestamp,
                  this.opponentConfig.attacks[1].id
                )
              : 1,
            dodgeReady: this.combatSystem.isDodgeReady(this.opponentCharacter, timestamp),
            phase: this.combatSystem.getPhase(this.opponentCharacter),
            blocking: this.combatSystem.getPhase(this.opponentCharacter) === "blocking",
            bleeding: this.combatSystem.isBleeding(this.opponentCharacter, timestamp),
            primaryMoveLabel: this.opponentConfig.attack.label,
            secondaryMoveLabel: this.opponentConfig.attacks[1]?.label ?? null,
          }
        : null,
      arena: {
        scene: this.currentScene,
        title: arena.title,
        effect: arena.effectDescription,
        hazardActive: arena.hazardActive,
      },
    };
    this.options.onHudStateChanged(hudState);
    if (import.meta.env.DEV) {
      (
        window as Window & {
          __PRIMAL_DEBUG__?: {
            hudState: typeof hudState;
            playerPosition: { x: number; y: number; z: number } | null;
            opponentPosition: { x: number; y: number; z: number } | null;
            blood: { pools: number; sprays: number };
          };
          __PRIMAL_DEBUG_API__?: {
            forceRoundOver: (outcome: "player" | "opponent" | "draw", message: string) => void;
          };
        }
      ).__PRIMAL_DEBUG__ = {
        hudState,
        playerPosition: this.playerCharacter
          ? {
              x: this.playerCharacter.body.position.x,
              y: this.playerCharacter.body.position.y,
              z: this.playerCharacter.body.position.z,
            }
          : null,
        opponentPosition: this.opponentCharacter
          ? {
              x: this.opponentCharacter.body.position.x,
              y: this.opponentCharacter.body.position.y,
              z: this.opponentCharacter.body.position.z,
            }
          : null,
        blood: this.bloodEffectsSystem.getStats(),
      };
      (
        window as Window & {
          __PRIMAL_DEBUG_API__?: {
            forceRoundOver: (outcome: "player" | "opponent" | "draw", message: string) => void;
            restartBattle: () => void;
            setPositions: (
              player: { x: number; z: number },
              opponent: { x: number; z: number }
            ) => void;
            triggerPlayerAttack: (move: "primary" | "secondary") => void;
            simulatePlayerMovement: (direction: "forward" | "back" | "left" | "right", steps?: number) => void;
            debugStrikeOpponent: (move: "primary" | "secondary") => void;
          };
        }
      ).__PRIMAL_DEBUG_API__ = {
        forceRoundOver: (outcome, message) => {
          this.gameStateManager.finishRound(outcome, message);
          this.emitRoundState();
          this.emitHudState(performance.now(), true);
        },
        restartBattle: () => {
          if (!this.playerConfig || !this.opponentConfig) {
            return;
          }
          this.startBattle(this.playerConfig.key, this.opponentConfig.key);
        },
        setPositions: (player, opponent) => {
          if (this.playerCharacter) {
            this.playerCharacter.body.position.x = player.x;
            this.playerCharacter.body.position.z = player.z;
            this.playerCharacter.body.velocity.set(0, this.playerCharacter.body.velocity.y, 0);
            this.playerCharacter.mesh.position.x = player.x;
            this.playerCharacter.mesh.position.z = player.z;
          }
          if (this.opponentCharacter) {
            this.opponentCharacter.body.position.x = opponent.x;
            this.opponentCharacter.body.position.z = opponent.z;
            this.opponentCharacter.body.velocity.set(0, this.opponentCharacter.body.velocity.y, 0);
            this.opponentCharacter.mesh.position.x = opponent.x;
            this.opponentCharacter.mesh.position.z = opponent.z;
          }
          this.emitHudState(performance.now(), true);
        },
        triggerPlayerAttack: (move) => {
          if (!this.playerCharacter || !this.opponentCharacter || !this.playerConfig || !this.opponentConfig) {
            return;
          }
          const selectedMove = move === "secondary" ? this.playerConfig.attacks[1] ?? this.playerConfig.attack : this.playerConfig.attack;
          this.opponentCharacter.applyDamage(selectedMove.damage);
          this.processCombatEvent({
            type: "attack_hit",
            attacker: this.playerCharacter,
            target: this.opponentCharacter,
            damage: selectedMove.damage,
            hitstopMs: selectedMove.hitstopMs,
            moveId: selectedMove.id,
            moveLabel: selectedMove.label,
            phase: "stunned",
            bleed: {
              applied: true,
              chance: selectedMove.bleedChance,
              durationMs: selectedMove.bleedDurationMs,
              tickDamage: selectedMove.bleedTickDamage,
              tickMs: selectedMove.bleedTickMs,
            },
          });
          this.emitHudState(performance.now(), true);
        },
        simulatePlayerMovement: (direction, steps = 18) => {
          if (!this.playerCharacter) {
            return;
          }
          const forward = new THREE.Vector3();
          this.camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
          const moveDirection = new THREE.Vector3();
          if (direction === "forward") {
            moveDirection.copy(forward);
          } else if (direction === "back") {
            moveDirection.copy(forward).multiplyScalar(-1);
          } else if (direction === "right") {
            moveDirection.copy(right);
          } else {
            moveDirection.copy(right).multiplyScalar(-1);
          }

          const distance = (steps / 18) * 0.8;
          this.playerCharacter.body.position.x += moveDirection.x * distance;
          this.playerCharacter.body.position.z += moveDirection.z * distance;
          this.playerCharacter.mesh.position.x = this.playerCharacter.body.position.x;
          this.playerCharacter.mesh.position.z = this.playerCharacter.body.position.z;
          this.emitHudState(performance.now(), true);
        },
        debugStrikeOpponent: (move) => {
          if (!this.playerCharacter || !this.opponentCharacter || !this.playerConfig) {
            return;
          }
          const selectedMove = move === "secondary" ? this.playerConfig.attacks[1] ?? this.playerConfig.attack : this.playerConfig.attack;
          this.opponentCharacter.applyDamage(selectedMove.damage);
          this.processCombatEvent({
            type: "attack_hit",
            attacker: this.playerCharacter,
            target: this.opponentCharacter,
            damage: selectedMove.damage,
            hitstopMs: selectedMove.hitstopMs,
            moveId: selectedMove.id,
            moveLabel: selectedMove.label,
            phase: "stunned",
            bleed: {
              applied: true,
              chance: selectedMove.bleedChance,
              durationMs: selectedMove.bleedDurationMs,
              tickDamage: selectedMove.bleedTickDamage,
              tickMs: selectedMove.bleedTickMs,
            },
          });
          this.emitHudState(performance.now(), true);
        },
      };
    }
    this.lastHudEmitAt = timestamp;
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(getPixelRatioCap(this.currentQuality));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };
}
