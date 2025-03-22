import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define all files with their relative paths and contents.
const files = [
  {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>3D Fighting Game V1</title>
  <style>
    body { margin: 0; }
    canvas { display: block; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>
`
  },
  {
    path: 'vite.config.ts',
    content: `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
});
`
  },
  {
    path: 'package.json',
    content: `{
  "name": "my-3d-fighting-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.152.2",
    "cannon-es": "^0.20.0"
  },
  "devDependencies": {
    "vite": "^4.0.0",
    "typescript": "^4.9.5"
  }
}
`
  },
  {
    path: 'src/index.ts',
    content: `import { Game } from './game/Game.js';

window.addEventListener('load', () => {
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error("Game container element not found");
  }
  const game = new Game(container);
});
`
  },
  {
    path: 'src/game/Game.ts',
    content: `import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { Character, MovementType } from '../entities/Character.js';
import { Arena } from '../arenas/Arena.js';

export class Game {
  constructor(container) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 20, 30);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // Clock & Physics
    this.clock = new THREE.Clock();
    this.physicsEngine = new PhysicsEngine();

    // Arena
    this.arena = new Arena({ name: "Forest", groundColor: 0x228B22, skyColor: 0x87CEEB });
    this.scene.add(this.arena.scene);

    // Characters setup
    this.setupCharacters();

    // Start game loop
    this.animate();
  }

  setupCharacters() {
    const human = new Character({
      name: "Human",
      color: 0xFAD6A5, // human skintone
      weight: 70,
      size: 2,
      maxVelocity: 10,
      maxAcceleration: 3,
      movementType: MovementType.Grounded
    });

    const bear = new Character({
      name: "Bear",
      color: 0x8B4513, // bear brown
      weight: 350,
      size: 3,
      maxVelocity: 15,
      maxAcceleration: 5,
      movementType: MovementType.Grounded
    });

    human.body.position.set(-5, human.size / 2, 0);
    bear.body.position.set(5, bear.size / 2, 0);

    this.scene.add(human.mesh);
    this.scene.add(bear.mesh);

    this.physicsEngine.world.addBody(human.body);
    this.physicsEngine.world.addBody(bear.body);

    this.characters = [human, bear];
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.physicsEngine.update(delta);
    this.characters.forEach(character => character.update());
    this.renderer.render(this.scene, this.camera);
  }
}
`
  },
  {
    path: 'src/game/StateManager.ts',
    content: `// TODO: Implement game state transitions (menu -> selection -> battle) in future iterations.
`
  },
  {
    path: 'src/entities/Character.ts',
    content: `import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const MovementType = {
  Grounded: 0,
  Flying: 1,
};

export class Character {
  constructor(options) {
    this.name = options.name;
    this.color = options.color;
    this.weight = options.weight;
    this.size = options.size;
    this.maxVelocity = options.maxVelocity;
    this.maxAcceleration = options.maxAcceleration;
    this.movementType = options.movementType;

    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);

    const shape = new CANNON.Box(new CANNON.Vec3(this.size / 2, this.size / 2, this.size / 2));
    this.body = new CANNON.Body({ mass: this.weight });
    this.body.addShape(shape);
  }

  update() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }

  move(direction) {
    const force = new CANNON.Vec3(
      direction.x * this.maxAcceleration,
      direction.y * this.maxAcceleration,
      direction.z * this.maxAcceleration
    );
    this.body.applyForce(force, this.body.position);
  }
}
`
  },
  {
    path: 'src/arenas/Arena.ts',
    content: `import * as THREE from 'three';

export class Arena {
  constructor(options) {
    this.name = options.name;
    this.groundColor = options.groundColor;
    this.skyColor = options.skyColor;

    this.scene = new THREE.Scene();
    this.setupEnvironment();
  }

  setupEnvironment() {
    this.scene.background = new THREE.Color(this.skyColor);
    
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: this.groundColor });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }
}
`
  },
  {
    path: 'src/arenas/ForestArena.ts',
    content: `// TODO: Extend Arena class for a Forest-themed arena.
`
  },
  {
    path: 'src/arenas/CityArena.ts',
    content: `// TODO: Extend Arena class for a City-themed arena.
`
  },
  {
    path: 'src/arenas/MoonArena.ts',
    content: `// TODO: Extend Arena class for a Moon-themed arena.
`
  },
  {
    path: 'src/physics/PhysicsEngine.ts',
    content: `import * as CANNON from 'cannon-es';

export class PhysicsEngine {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
  }

  update(delta) {
    this.world.step(delta);
  }
}
`
  },
  {
    path: 'src/ui/Menu.ts',
    content: `// TODO: Implement the character selection menu.
`
  },
  {
    path: 'src/ui/HUD.ts',
    content: `// TODO: Implement the in-game HUD elements.
`
  }
];

// Create files using the current working directory as the base.
function createFiles() {
  const baseDir = process.cwd();
  files.forEach(file => {
    const filePath = path.join(baseDir, file.path);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.content, 'utf8');
  });
}

createFiles();
