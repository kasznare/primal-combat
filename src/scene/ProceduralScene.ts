import * as THREE from 'three';

export class ProceduralScene {
  /**
   * Removes previously generated objects (those with userData.generated = true)
   * and then creates new objects according to sceneType.
   */
  static generateScene(sceneType: string, scene: THREE.Scene, areaSize: number = 100): void {
    // Remove previously generated objects.
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.userData.generated) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((child) => scene.remove(child));

    if (sceneType === 'Forest') {
      ProceduralScene.generateForest(scene, areaSize);
    } else if (sceneType === 'City') {
      ProceduralScene.generateCity(scene, areaSize);
    } else if (sceneType === 'Moon') {
      ProceduralScene.generateMoon(scene, areaSize);
    }
  }

  static generateForest(scene: THREE.Scene, areaSize: number): void {
    const numTrees = Math.floor(Math.random() * 30) + 20; // 20-50 trees
    for (let i = 0; i < numTrees; i++) {
      const tree = ProceduralScene.createTree();
      tree.position.x = (Math.random() - 0.5) * areaSize;
      tree.position.z = (Math.random() - 0.5) * areaSize;
      tree.position.y = 0;
      tree.userData.generated = true;
      scene.add(tree);
    }
    const numStones = Math.floor(Math.random() * 10) + 10; // 10-20 stones
    for (let i = 0; i < numStones; i++) {
      const stone = ProceduralScene.createStone();
      stone.position.x = (Math.random() - 0.5) * areaSize;
      stone.position.z = (Math.random() - 0.5) * areaSize;
      stone.position.y = 0;
      stone.userData.generated = true;
      scene.add(stone);
    }
  }

  static createTree(): THREE.Group {
    const tree = new THREE.Group();
    // Create trunk.
    const trunkHeight = Math.random() * 4 + 3; // between 3 and 7
    const trunkRadiusTop = Math.random() * 0.1 + 0.2; // 0.2 to 0.3
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

  static generateCity(scene: THREE.Scene, areaSize: number): void {
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
    }
  }

  static generateMoon(scene: THREE.Scene, areaSize: number): void {
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
    }
  }
}
