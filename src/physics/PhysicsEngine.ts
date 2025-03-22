import * as CANNON from 'cannon-es';

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
