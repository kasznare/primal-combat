import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { Character, MovementType } from '../entities/Character.js';
import { Arena } from '../arenas/Arena.js';
import { Menu } from '../ui/Menu.js';
import * as CANNON from 'cannon-es';
import { InputManager } from './InputManager.js';
import { AIController } from './AIController.js';
import { GameStateManager } from './GameStateManager.js';

export class Game {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
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

    // Add lighting.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // Initialize clock and physics engine.
    this.clock = new THREE.Clock();
    this.physicsEngine = new PhysicsEngine();

    // Setup arena.
    this.arena = new Arena({
      name: 'Forest',
      groundColor: 0x556B2F,
      skyColor: 0x87CEEB,
    });
    this.scene.add(this.arena.scene);
    this.physicsEngine.world.addBody(this.arena.getPhysicsGround());

    // Add grid helper.
    const gridSize = 100;
    const gridDivisions = gridSize;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Display UI menu.
    new Menu();

    // Instantiate managers.
    this.inputManager = new InputManager();
    this.aiController = new AIController();
    this.gameStateManager = new GameStateManager();

    // Setup characters based on the dropdown selections.
    this.setupCharacters();

    // Start the game loop.
    this.animate();
  }

  setupCharacters() {
    // Define properties for different entity types.
    const entityProps: { [key: string]: any } = {
      'Human':   { size: 2,   weight: 70,   maxVelocity: 10, maxAcceleration: 3, health: 100, color: 0xFAD6A5 },
      'Bear':    { size: 3,   weight: 350,  maxVelocity: 15, maxAcceleration: 5, health: 200, color: 0x8B4513 },
      'Cheetah': { size: 1.5, weight: 50,   maxVelocity: 30, maxAcceleration: 9, health: 80,  color: 0xC0C0C0 },
      'Dragon':  { size: 10,  weight: 2000, maxVelocity: 30, maxAcceleration: 5, health: 500, color: 0xFF0000 }
    };

    // Get selected character from the start menu.
    const charSelectElem = document.getElementById('character-select') as HTMLSelectElement;
    const selectedCharacter = charSelectElem ? charSelectElem.value : 'Human';
    console.log("Selected player entity:", charSelectElem.value);

    const playerProps = entityProps[selectedCharacter] || entityProps['Human'];

    // Create the player's character.
    const playerCharacter = new Character({
      name: selectedCharacter,
      color: playerProps.color,
      weight: playerProps.weight,
      size: playerProps.size,
      maxVelocity: playerProps.maxVelocity,
      maxAcceleration: playerProps.maxAcceleration,
      movementType: MovementType.Grounded,
      health: playerProps.health,
    });

    // Get selected opponent from the start menu.
    const oppSelectElem = document.getElementById('opponent-select') as HTMLSelectElement;
    const selectedOpponent = oppSelectElem ? oppSelectElem.value : 'Bear';
    console.log("Selected opponent entity:", oppSelectElem);

    const opponentProps = entityProps[selectedOpponent] || entityProps['Bear'];

    // Create the opponent character.
    const opponentCharacter = new Character({
      name: selectedOpponent,
      color: opponentProps.color,
      weight: opponentProps.weight,
      size: opponentProps.size,
      maxVelocity: opponentProps.maxVelocity,
      maxAcceleration: opponentProps.maxAcceleration,
      movementType: MovementType.Grounded,
      health: opponentProps.health,
    });

    // Position characters.
    playerCharacter.body.position.set(0, playerCharacter.size, 0);
    opponentCharacter.body.position.set(20, opponentCharacter.size, 0);

    // Add to scene.
    this.scene.add(playerCharacter.mesh);
    this.scene.add(opponentCharacter.mesh);

    // Add physics bodies.
    this.physicsEngine.world.addBody(playerCharacter.body);
    this.physicsEngine.world.addBody(opponentCharacter.body);

    this.characters.push(playerCharacter, opponentCharacter);
    this.playerCharacter = playerCharacter;
  }

  animate = () => {
    if (this.gameStateManager.isGameOver()) return;

    requestAnimationFrame(this.animate);
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
        this.playerCharacter.body.velocity.x *= 0.9;
        this.playerCharacter.body.velocity.z *= 0.9;
      }
      if (this.inputManager.isKeyPressed('Space')) {
        const groundLevel = this.playerCharacter.size;
        if (this.playerCharacter.body.position.y <= groundLevel + 0.1) {
          const jumpVelocity = 8;
          this.playerCharacter.body.velocity.y = jumpVelocity;
        }
        this.inputManager.resetKey('Space');
      }
    }

    // Update enemy AI.
    if (this.playerCharacter) {
      this.aiController.update(this.playerCharacter, this.characters);
    }

    // Update physics.
    this.physicsEngine.update(Math.min(delta, 1 / 60));

    // Update characters and health bars.
    this.characters.forEach(character => {
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
    const opponent = this.characters.find(ch => ch !== this.playerCharacter && ch.name === 'Bear');
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

    // Render.
    this.renderer.render(this.scene, this.camera);
  }
}
