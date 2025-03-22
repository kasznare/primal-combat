import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class ProceduralScene {
  /**
   * Utility to add a static physics body to a generated object.
   * This function computes the bounding box of the object,
   * creates a Cannon box shape, and adds it to the provided physics world.
   */
  static addPhysicsForObject(object: THREE.Object3D, physicsWorld: CANNON.World, staticMaterial: CANNON.Material): void {
    // Compute object's bounding box.
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Create a static Cannon body using a box shape.
    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(center.x, center.y, center.z);

    body.material = staticMaterial;


    // Save a reference to the physics body for future updates if needed.
    object.userData.physicsBody = body;
    physicsWorld.addBody(body);
  }

  /**
   * Removes previously generated objects (and their physics bodies)
   * and then generates a new scene based on the sceneType.
   */
  static generateScene(scene: THREE.Scene, physicsWorld: CANNON.World, sceneType: string, areaSize: number = 100, staticMaterial: CANNON.Material): void {
    // Remove previously generated objects.
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.userData.generated) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((child) => {
      scene.remove(child);
      if (child.userData.physicsBody) {
        physicsWorld.removeBody(child.userData.physicsBody);
      }
    });

    if (sceneType === 'Forest') {
      ProceduralScene.generateForest(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === 'City') {
      ProceduralScene.generateCity(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === 'Moon') {
      ProceduralScene.generateMoon(scene, physicsWorld, areaSize, staticMaterial);
    }
  }

  static generateForest(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    const numTrees = Math.floor(Math.random() * 30) + 20; // 20-50 trees
    for (let i = 0; i < numTrees; i++) {
      const tree = ProceduralScene.createTree();
      tree.position.x = (Math.random() - 0.5) * areaSize;
      tree.position.z = (Math.random() - 0.5) * areaSize;
      tree.position.y = 0;
      tree.userData.generated = true;
      scene.add(tree);
      ProceduralScene.addPhysicsForObject(tree, physicsWorld, staticMaterial);
    }
    const numStones = Math.floor(Math.random() * 10) + 10; // 10-20 stones
    for (let i = 0; i < numStones; i++) {
      const stone = ProceduralScene.createStone();
      stone.position.x = (Math.random() - 0.5) * areaSize;
      stone.position.z = (Math.random() - 0.5) * areaSize;
      stone.position.y = 0;
      stone.userData.generated = true;
      scene.add(stone);
      ProceduralScene.addPhysicsForObject(stone, physicsWorld, staticMaterial);
    }
  }

  static createTree(): THREE.Group {
    const tree = new THREE.Group();
    // Create trunk.
    const trunkHeight = Math.random() * 4 + 3; // between 3 and 7
    const trunkRadiusTop = Math.random() * 0.1 + 0.2;
    const trunkRadiusBottom = trunkRadiusTop * (Math.random() * 0.3 + 1);
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunkMesh.position.y = trunkHeight / 2;
    trunkMesh.userData.generated = true;
    tree.add(trunkMesh);

    // Create foliage.
    const foliageHeight = Math.random() * 3 + 2; // 2 to 5
    const foliageRadius = trunkRadiusBottom * (Math.random() * 5 + 3);
    const foliageGeometry = new THREE.ConeGeometry(foliageRadius, foliageHeight, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const foliageMesh = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageMesh.position.y = trunkHeight + foliageHeight / 2 - 0.5;
    foliageMesh.userData.generated = true;
    tree.add(foliageMesh);

    return tree;
  }

  static createStone(): THREE.Mesh {
    const width = Math.random() * 0.5 + 0.2;
    const height = Math.random() * 0.3 + 0.1;
    const depth = Math.random() * 0.5 + 0.2;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const stone = new THREE.Mesh(geometry, material);
    stone.userData.generated = true;
    return stone;
  }

  static generateCity(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    const numBuildings = Math.floor(Math.random() * 20) + 10; // 10-30 buildings
    for (let i = 0; i < numBuildings; i++) {
      const width = Math.random() * 5 + 5;
      const height = Math.random() * 20 + 10;
      const depth = Math.random() * 5 + 5;
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
      const building = new THREE.Mesh(geometry, material);
      building.position.x = (Math.random() - 0.5) * areaSize;
      building.position.z = (Math.random() - 0.5) * areaSize;
      building.position.y = height / 2;
      building.userData.generated = true;
      scene.add(building);
      ProceduralScene.addPhysicsForObject(building, physicsWorld, staticMaterial);
    }
  }

  static generateMoon(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    const numRocks = Math.floor(Math.random() * 30) + 20; // 20-50 rocks
    for (let i = 0; i < numRocks; i++) {
      const radius = Math.random() * 1 + 0.5;
      const geometry = new THREE.SphereGeometry(radius, 8, 8);
      const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const rock = new THREE.Mesh(geometry, material);
      rock.position.x = (Math.random() - 0.5) * areaSize;
      rock.position.z = (Math.random() - 0.5) * areaSize;
      rock.position.y = 0;
      rock.userData.generated = true;
      scene.add(rock);
      ProceduralScene.addPhysicsForObject(rock, physicsWorld, staticMaterial);
    }
  }
}
