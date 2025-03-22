import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PhysicsEngine } from "../physics/PhysicsEngine.js";
import { Character, MovementType } from "../entities/Character.js";
import { Arena } from "../arenas/Arena.js";
import { Menu } from "../ui/Menu.js";
import * as CANNON from "cannon-es";
import { InputManager } from "./InputManager.js";
import { AIController } from "./AIController.js";
import { GameStateManager } from "./GameStateManager.js";
import { SceneSelector } from "../scene/SceneSelector.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class Game {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public composer: EffectComposer;

  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public physicsEngine: PhysicsEngine;
  public clock: THREE.Clock;
  public characters: Character[] = [];
  public arena: Arena;
  public playerCharacter: Character | null = null;

  private inputManager: InputManager;
  private aiController: AIController;
  private gameStateManager: GameStateManager;

  constructor(container: HTMLElement) {
    // Create renderer.
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Create camera.
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 30);

    // Initialize OrbitControls.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Create the scene.
    this.scene = new THREE.Scene();

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    // Adjust shadow map size for better quality.
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const rgbeLoader = new RGBELoader();
    // rgbeLoader.setDataType(THREE.UnsignedByteType); // For LDR-like behavior.
    rgbeLoader.load('/golden_gate_hills_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = texture; // Optional: also use it as the background.
    });
  // --- Post-Processing Setup ---
  this.composer = new EffectComposer(this.renderer);
  // Render pass: renders the scene.
  const renderPass = new RenderPass(this.scene, this.camera);
  this.composer.addPass(renderPass);
  // FXAA pass: smooths out jagged edges.
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.renderToScreen = false; // We'll chain bloom afterwards.
  this.composer.addPass(fxaaPass);
  // Bloom pass: adds a glow effect to bright areas.
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5, // strength
    0.4, // radius
    0.85 // threshold
  );
  bloomPass.renderToScreen = true;
  this.composer.addPass(bloomPass);

    // Initialize clock and physics engine.
    this.clock = new THREE.Clock();
    this.physicsEngine = new PhysicsEngine();

    // Setup arena.
    this.arena = new Arena({
      name: "Forest",
      groundColor: 0x556b2f,
      skyColor: 0x87ceeb,
    });
    this.scene.add(this.arena.scene);

    new SceneSelector(
      this.scene,
      this.physicsEngine.world,
      this.physicsEngine.staticMaterial
    );

    this.physicsEngine.world.addBody(
      this.arena.getPhysicsGround(this.physicsEngine)
    );

    // Add grid helper.
    const gridSize = 100;
    const gridDivisions = gridSize;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x888888,
      0x444444
    );
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Display UI menu.
    new Menu();

    // Instantiate managers.
    this.inputManager = new InputManager();
    this.aiController = new AIController();
    this.gameStateManager = new GameStateManager();

    document.addEventListener("startBattle", () => {
      this.setupCharacters(this.physicsEngine);
      this.animate(0);
    });
  }

  setupCharacters(physicsEngine: PhysicsEngine) {
    // Define properties for different entity types.
    const entityProps: { [key: string]: any } = {
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

    // Get selected values from dropdowns.
    const charSelectElem = document.getElementById(
      "character-select"
    ) as HTMLSelectElement;
    const selectedCharacter = charSelectElem ? charSelectElem.value : "Human";
    const playerProps = entityProps[selectedCharacter] || entityProps["Human"];

    const oppSelectElem = document.getElementById(
      "opponent-select"
    ) as HTMLSelectElement;
    const selectedOpponent = oppSelectElem ? oppSelectElem.value : "Bear";
    const opponentProps = entityProps[selectedOpponent] || entityProps["Bear"];

    // Create the player's character.
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

    // Create the opponent character.
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

    // Position characters.
    playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
    opponentCharacter.body.position.set(
      20,
      opponentCharacter.dimensions.height,
      0
    );

    // Add to scene.
    this.scene.add(playerCharacter.mesh);
    this.scene.add(opponentCharacter.mesh);
    this.physicsEngine.world.addBody(playerCharacter.body);
    this.physicsEngine.world.addBody(opponentCharacter.body);

    this.characters.push(playerCharacter, opponentCharacter);
    this.playerCharacter = playerCharacter;
  }
  private lastFrameTime: number = 0;

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

  //  console.log('animate')
  // Check for pause toggle using Escape.
  if (this.inputManager.isKeyPressed('Escape')) {
    if (!this.gameStateManager.isPaused()) {
      this.gameStateManager.setPaused(true);
      console.log("Game paused");
    } else {
      // Optionally, you could let Escape itself resume.
      // this.gameStateManager.setPaused(false);
      // console.log("Game resumed");
    }
    this.inputManager.resetKey('Escape'); // Reset so it doesn't keep toggling.
  }

  // If the game is paused, check if any key (except Escape) is pressed to resume.
  if (this.gameStateManager.isPaused()) {
    if (this.inputManager.anyKeyPressed(['Escape'])) {
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
    const moveDirection = this.inputManager.getMovementVector(this.camera);
    if (this.playerCharacter) {
      const moveSpeed = 5;
      if (moveDirection.length() > 0) {
        moveDirection.normalize();
        this.playerCharacter.body.velocity.x = moveDirection.x * moveSpeed;
        this.playerCharacter.body.velocity.z = moveDirection.z * moveSpeed;
      } else {
        this.playerCharacter.body.velocity.x *= 0.98;
        this.playerCharacter.body.velocity.z *= 0.98;
      }
      if (this.inputManager.isKeyPressed("Space")) {
        const groundLevel = this.playerCharacter.dimensions.height;
        if (this.playerCharacter.body.position.y <= groundLevel + 0.1) {
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
    const opponent = this.characters.find(
      (ch) => ch !== this.playerCharacter && ch.name === "Bear"
    );
    if (opponent && opponent.health <= 0) {
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
    this.renderer.render(this.scene, this.camera);
  };
}
