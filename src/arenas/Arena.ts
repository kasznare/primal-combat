import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface IArenaOptions {
  name: string;
  groundColor: number;
  skyColor: number;
  // Optional physics properties for convenience.
  physicsWorld?: CANNON.World;
  staticMaterial?: CANNON.Material;
}

export class Arena {
  public name: string;
  public groundColor: number;
  public skyColor: number;
  public scene: THREE.Scene;
  public groundMesh: THREE.Mesh;

  constructor(options: IArenaOptions, scene: THREE.Scene) {
    this.name = options.name;
    this.groundColor = options.groundColor;
    this.skyColor = options.skyColor;
    this.scene = scene;
    this.setupEnvironment();
  }

  private setupEnvironment() {
    // Create a ground plane.
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: this.groundColor,
      roughness: 0.92,
      metalness: 0.04,
    });
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  protected setGroundMaterial(material: THREE.Material): void {
    this.groundMesh.material = material;
  }

  protected addGroundOverlay(
    radius: number,
    color: number,
    opacity: number,
    yOffset = 0.012
  ): void {
    const overlay = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 48),
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        roughness: 1,
        metalness: 0,
        depthWrite: false,
      })
    );
    overlay.rotation.x = -Math.PI / 2;
    overlay.position.y = yOffset;
    overlay.receiveShadow = true;
    overlay.userData.generated = true;
    this.scene.add(overlay);
  }

  // Returns a static physics ground body corresponding to the visible ground.
  public getPhysicsGround(physicsEngine: { groundMaterial: CANNON.Material }): CANNON.Body {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.material = physicsEngine.groundMaterial;
    return groundBody;
  }
}
