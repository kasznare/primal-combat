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
  dimensions?: { width: number; height: number; depth: number };
  maxVelocity: number;
  maxAcceleration: number;
  movementType: MovementType;
  health?: number;
}

export abstract class Character {
  public name: string;
  public color: number;
  public weight: number;
  public dimensions: { width: number; height: number; depth: number };
  public maxVelocity: number;
  public maxAcceleration: number;
  public movementType: MovementType;
  public mesh: THREE.Group;
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
    this.dimensions = options.dimensions || { width: 2, height: 2, depth: 2 };
    this.maxVelocity = options.maxVelocity;
    this.maxAcceleration = options.maxAcceleration;
    this.movementType = options.movementType;
    this.maxHealth = options.health !== undefined ? options.health : 100;
    this.health = this.maxHealth;

    // Create a custom mesh from the subclass.
    this.mesh = this.createMesh();

    // Create a simple box collider based on the dimensions.
    const shape = new CANNON.Box(new CANNON.Vec3(
      this.dimensions.width / 2,
      this.dimensions.height / 2,
      this.dimensions.depth / 2
    ));
    this.body = new CANNON.Body({ mass: this.weight });
    this.body.addShape(shape);
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    this.body.material = physicsEngine.characterMaterial;

    // Set up the health bar.
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
    this.healthBar.style.width = '50px';
    this.healthBarContainer.appendChild(this.healthBar);

    // Handle collision events.
    this.body.addEventListener("collide", (event) => {
      const other = event.body;
      if (other.mass <= 0) return;
      const relVel = this.body.velocity.vsub(other.velocity).length();
      const damage = relVel * (other.mass / this.body.mass) * 2;
      this.health -= damage;
      console.log(`${this.name} took ${damage.toFixed(2)} damage. Health: ${this.health.toFixed(2)}`);
    });
  }

  // Each subclass implements its own mesh creation.
  protected abstract createMesh(): THREE.Group;

  update() {
    // Sync the mesh position with the physics body.
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
  
    // Calculate movement direction based on velocity.
    const velocity = this.body.velocity;
    // Only update if the character is moving above a small threshold.
    if (velocity.length() > 0.1) {
      // Compute target angle from the velocity vector (x and z components).
      const targetAngle = Math.atan2(velocity.x, velocity.z);
  
      // Get current y rotation.
      const currentAngle = this.mesh.rotation.y;
      // Compute smallest angular difference.
      let deltaAngle = targetAngle - currentAngle;
      deltaAngle = Math.atan2(Math.sin(deltaAngle), Math.cos(deltaAngle));
  
      // Apply interpolation for smooth rotation (adjust factor as needed).
      const smoothing = 0.1;
      this.mesh.rotation.y = currentAngle + deltaAngle * smoothing;
    }
  }
  
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
