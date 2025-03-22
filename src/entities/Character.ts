import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export enum MovementType {
  Grounded,
  Flying,
}

export interface ICharacterOptions {
  name: string;
  color: number;
  weight: number;
  size: number;
  maxVelocity: number;
  maxAcceleration: number;
  movementType: MovementType;
  health?: number;
}

export class Character {
  public name: string;
  public color: number;
  public weight: number;
  public size: number;
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

  constructor(options: ICharacterOptions) {
    this.name = options.name;
    this.color = options.color;
    this.weight = options.weight;
    this.size = options.size;
    this.maxVelocity = options.maxVelocity;
    this.maxAcceleration = options.maxAcceleration;
    this.movementType = options.movementType;

    // Set up health.
    this.maxHealth = options.health !== undefined ? options.health : 100;
    this.health = this.maxHealth;

    // Create Three.js mesh.
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshLambertMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);

    // Create Cannon body.
    const shape = new CANNON.Box(new CANNON.Vec3(this.size / 2, this.size / 2, this.size / 2));
    this.body = new CANNON.Body({ mass: this.weight });
    this.body.addShape(shape);

    // Create health bar container (red background).
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.position = 'absolute';
    this.healthBarContainer.style.width = '50px';
    this.healthBarContainer.style.height = '6px';
    this.healthBarContainer.style.backgroundColor = 'red';
    this.healthBarContainer.style.border = '1px solid #000';
    document.body.appendChild(this.healthBarContainer);

    // Create inner health bar (green part).
    this.healthBar = document.createElement('div');
    this.healthBar.style.height = '100%';
    this.healthBar.style.backgroundColor = 'green';
    // Start full width (50px) representing 100% health.
    this.healthBar.style.width = '50px';
    this.healthBarContainer.appendChild(this.healthBar);

    // Collision handling: decrease health based on impact.
    this.body.addEventListener("collide", (event) => {
      const other = event.body;
      // Ignore collisions with static objects.
      if (other.mass <= 0) return;
      // Compute a simple relative velocity measure.
      const relVel = this.body.velocity.vsub(other.velocity).length();
      // Damage proportional to relative velocity and mass ratio.
      const damage = relVel * (other.mass / this.body.mass) * 2;
      this.health -= damage;
      console.log(`${this.name} took ${damage.toFixed(2)} damage. Health: ${this.health.toFixed(2)}`);
    });
  }

  update() {
    // Synchronize the Three.js mesh with the Cannon body.
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  // Update the health bar position on screen and its inner green bar width.
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
    const force = new CANNON.Vec3(
      direction.x * this.maxAcceleration,
      direction.y * this.maxAcceleration,
      direction.z * this.maxAcceleration
    );
    this.body.applyForce(force, this.body.position);
  }
}
