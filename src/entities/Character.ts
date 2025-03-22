import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsEngine } from '../physics/PhysicsEngine';

export enum MovementType {
  Grounded,
  Flying,
}

export interface ICharacterOptions {
  name: string;
  color: number;
  weight: number;
  // Replace single size with dimensions
  dimensions?: { width: number; height: number; depth: number };
  maxVelocity: number;
  maxAcceleration: number;
  movementType: MovementType;
  health?: number;
}

export class Character {
  public name: string;
  public color: number;
  public weight: number;
  public dimensions: { width: number; height: number; depth: number };
  public maxVelocity: number;
  public maxAcceleration: number;
  public movementType: MovementType;
  public mesh: THREE.Mesh;
  public body: CANNON.Body;
  public health: number;
  public maxHealth: number;

  // Health bar elements.
  public healthBarContainer: HTMLDivElement;
  public healthBar: HTMLDivElement;

  constructor(options: ICharacterOptions, physicsEngine: { characterMaterial: CANNON.Material }) {
    this.name = options.name;
    this.color = options.color;
    this.weight = options.weight;
    // Default to a cube if no dimensions provided.
    this.dimensions = options.dimensions || { width: options.weight ? 2 : 2, height: 2, depth: 2 };
    this.maxVelocity = options.maxVelocity;
    this.maxAcceleration = options.maxAcceleration;
    this.movementType = options.movementType;

    // Setup health.
    this.maxHealth = options.health !== undefined ? options.health : 100;
    this.health = this.maxHealth;

    // Create Three.js geometry using the dimensions.
    const geometry = new THREE.BoxGeometry(
      this.dimensions.width,
      this.dimensions.height,
      this.dimensions.depth
    );
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Create Cannon-es shape and body.
    const shape = new CANNON.Box(new CANNON.Vec3(
      this.dimensions.width / 2,
      this.dimensions.height / 2,
      this.dimensions.depth / 2
    ));
    this.body = new CANNON.Body({ mass: this.weight });
    this.body.addShape(shape);
    // Lock rotation so the body stays upright.
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    this.body.material = physicsEngine.characterMaterial;


    // Create a health bar container (red background) and inner green bar.
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.position = 'absolute';
    this.healthBarContainer.style.width = '50px';
    this.healthBarContainer.style.height = '6px';
    this.healthBarContainer.style.backgroundColor = 'red';
    this.healthBarContainer.style.border = '1px solid #000';
    document.body.appendChild(this.healthBarContainer);

    this.healthBar = document.createElement('div');
    this.healthBar.style.height = '100%';
    this.healthBar.style.backgroundColor = 'green';
    this.healthBar.style.width = '50px'; // Full width at start.
    this.healthBarContainer.appendChild(this.healthBar);

    // Collision handling: decrease health on impact.
    this.body.addEventListener("collide", (event) => {
      const other = event.body;
      // Ignore collisions with static objects.
      if (other.mass <= 0) return;
      // Simple approximation of relative velocity.
      const relVel = this.body.velocity.vsub(other.velocity).length();
      // Damage is proportional to relative velocity and mass ratio.
      const damage = relVel * (other.mass / this.body.mass) * 2;
      this.health -= damage;
      console.log(`${this.name} took ${damage.toFixed(2)} damage. Health: ${this.health.toFixed(2)}`);
    });
  }

  update() {
    // Sync Three.js mesh with Cannon body.
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  // Update the health bar's position and size.
  updateHealthBar(camera: THREE.Camera) {
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(this.mesh.matrixWorld);
    pos.project(camera);
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    this.healthBarContainer.style.left = `${x - 25}px`;
    this.healthBarContainer.style.top = `${y - 40}px`;
    const healthRatio = Math.max(0, this.health / this.maxHealth);
    this.healthBar.style.width = `${healthRatio * 50}px`;
  }

  move(direction: THREE.Vector3) {
    // Apply force instead of a full impulse.
    const force = new CANNON.Vec3(
      direction.x * this.maxAcceleration,
      direction.y * this.maxAcceleration,
      direction.z * this.maxAcceleration
    );
    this.body.applyForce(force, this.body.position);
  }
}
