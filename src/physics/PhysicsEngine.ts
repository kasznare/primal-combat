import * as CANNON from 'cannon-es';

export class PhysicsEngine {
  public world: CANNON.World;
  public groundMaterial: CANNON.Material;
  public characterMaterial: CANNON.Material;
  public staticMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();

    // Create materials.
    this.groundMaterial = new CANNON.Material('groundMaterial');
    this.characterMaterial = new CANNON.Material('characterMaterial');
    this.staticMaterial = new CANNON.Material('staticMaterial');

    // Create a contact material with low friction.
    const contactMaterial = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.characterMaterial,
      {
        friction: 0.1, // lower friction for smooth sliding
        restitution: 0.0,
      }
    );
    const contactMaterial1 = new CANNON.ContactMaterial(
      this.staticMaterial,
      this.characterMaterial,
      {
        friction: 0.1, // lower friction for smooth sliding
        restitution: 0.0,
      }
    );
     const contactMaterial2 = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.staticMaterial,
      {
        friction: 0.1, // lower friction for smooth sliding
        restitution: 0.0,
      }
    );
    this.world.addContactMaterial(contactMaterial2);
    this.world.addContactMaterial(contactMaterial1);

    this.world.addContactMaterial(contactMaterial);
  }
  update(delta: number) {
    this.world.step(delta);
  }
}
