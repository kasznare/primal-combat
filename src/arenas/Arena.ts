import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface IArenaOptions {
  name: string;
  groundColor: number;
  skyColor: number;
}

export class Arena {
  public name: string;
  public groundColor: number;
  public skyColor: number;
  public scene: THREE.Scene;
  public groundMesh: THREE.Mesh;

  constructor(options: IArenaOptions) {
    this.name = options.name;
    this.groundColor = options.groundColor;
    this.skyColor = options.skyColor;

    this.scene = new THREE.Scene();
    this.setupEnvironment();
  }

  private setupEnvironment() {
    // Create a sky sphere with inverted normals.
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    skyGeometry.scale(-1, 1, 1);
    const skyMaterial = new THREE.MeshBasicMaterial({ color: this.skyColor });
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);

    // Create a ground plane.
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: this.groundColor });
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  // Returns a static physics ground body corresponding to the visible ground.
  public getPhysicsGround(): CANNON.Body {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 }); // static
    groundBody.addShape(groundShape);
    // Rotate to match the Three.js ground plane orientation.
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    return groundBody;
  }
}
