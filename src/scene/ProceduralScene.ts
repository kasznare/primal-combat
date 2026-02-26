import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { QualityLevel } from "../types/Quality";

export class ProceduralScene {
  private static readonly PROCEDURAL_BODY_FLAG = "__proceduralStaticBody";
  private static qualityMultiplier = 1;

  static setQuality(level: QualityLevel): void {
    if (level === "low") {
      ProceduralScene.qualityMultiplier = 0.6;
      return;
    }
    if (level === "high") {
      ProceduralScene.qualityMultiplier = 1.25;
      return;
    }
    ProceduralScene.qualityMultiplier = 1;
  }

  private static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private static scaledCount(base: number, spread: number): number {
    return Math.max(
      1,
      Math.floor((Math.random() * spread + base) * ProceduralScene.qualityMultiplier)
    );
  }

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
    (body as unknown as Record<string, boolean>)[ProceduralScene.PROCEDURAL_BODY_FLAG] = true;


    // Save a reference to the physics body for future updates if needed.
    object.userData.physicsBody = body;
    physicsWorld.addBody(body);
  }

  static clearGenerated(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    const toRemove = scene.children.filter((child) => child.userData.generated);
    toRemove.forEach((child) => {
      scene.remove(child);
      if (child.userData.physicsBody) {
        physicsWorld.removeBody(child.userData.physicsBody);
      }
    });

    const proceduralBodies = [...physicsWorld.bodies].filter((body) => {
      return Boolean(
        (body as unknown as Record<string, boolean>)[ProceduralScene.PROCEDURAL_BODY_FLAG]
      );
    });
    proceduralBodies.forEach((body) => physicsWorld.removeBody(body));
  }

  /**
   * Removes previously generated objects (and their physics bodies)
   * and then generates a new scene based on the sceneType.
   */
  static generateScene(scene: THREE.Scene, physicsWorld: CANNON.World, sceneType: string, areaSize: number = 100, staticMaterial: CANNON.Material): void {
    ProceduralScene.clearGenerated(scene, physicsWorld);

    if (sceneType === 'Forest') {
      ProceduralScene.generateForest(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === 'City') {
      ProceduralScene.generateCity(scene, physicsWorld, areaSize, staticMaterial);
    } else if (sceneType === 'Moon') {
      ProceduralScene.generateMoon(scene, physicsWorld, areaSize, staticMaterial);
    }
  }

  static generateForest(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    const numTrees = ProceduralScene.scaledCount(24, 18);
    for (let i = 0; i < numTrees; i++) {
      const tree = ProceduralScene.createTree();
      tree.position.x = (Math.random() - 0.5) * areaSize;
      tree.position.z = (Math.random() - 0.5) * areaSize;
      tree.position.y = 0;
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.userData.generated = true;
      scene.add(tree);
      ProceduralScene.addPhysicsForObject(tree, physicsWorld, staticMaterial);
    }

    const numStones = ProceduralScene.scaledCount(10, 10);
    for (let i = 0; i < numStones; i++) {
      const stone = ProceduralScene.createStone();
      stone.position.x = (Math.random() - 0.5) * areaSize;
      stone.position.z = (Math.random() - 0.5) * areaSize;
      stone.position.y = (stone.userData.radius as number) * 0.85;
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      stone.userData.generated = true;
      stone.castShadow = true;
      scene.add(stone);
      ProceduralScene.addPhysicsForObject(stone, physicsWorld, staticMaterial);
    }

    const numShrubs = ProceduralScene.scaledCount(24, 30);
    for (let i = 0; i < numShrubs; i++) {
      const shrub = new THREE.Mesh(
        new THREE.SphereGeometry(ProceduralScene.random(0.14, 0.44), 8, 8),
        new THREE.MeshStandardMaterial({
          color: Math.random() > 0.4 ? 0x355e2f : 0x466f32,
          roughness: 1,
          metalness: 0,
        })
      );
      shrub.position.set(
        (Math.random() - 0.5) * areaSize,
        ProceduralScene.random(0.09, 0.22),
        (Math.random() - 0.5) * areaSize
      );
      shrub.userData.generated = true;
      scene.add(shrub);
    }
  }

  static createTree(): THREE.Group {
    const tree = new THREE.Group();

    const trunkHeight = ProceduralScene.random(1.4, 3.4);
    const trunkRadiusTop = ProceduralScene.random(0.14, 0.24);
    const trunkRadiusBottom = trunkRadiusTop * ProceduralScene.random(1.15, 1.45);
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4023,
      roughness: 0.94,
      metalness: 0.02,
    });
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunkMesh.position.y = trunkHeight / 2;
    trunkMesh.castShadow = true;
    tree.add(trunkMesh);

    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.45 ? 0x2d5e2f : 0x3f7a34,
      roughness: 0.95,
      metalness: 0,
    });

    const canopyCount = Math.floor(ProceduralScene.random(2, 4));
    for (let i = 0; i < canopyCount; i++) {
      const radius = ProceduralScene.random(0.8, 1.8);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), foliageMaterial);
      canopy.position.set(
        ProceduralScene.random(-0.22, 0.22),
        trunkHeight + i * ProceduralScene.random(0.5, 0.9),
        ProceduralScene.random(-0.22, 0.22)
      );
      canopy.scale.y = ProceduralScene.random(0.8, 1.1);
      canopy.castShadow = Math.random() > 0.55;
      tree.add(canopy);
    }

    return tree;
  }

  static createStone(): THREE.Mesh {
    const radius = ProceduralScene.random(0.22, 0.8);
    const geometry = new THREE.DodecahedronGeometry(radius, 0);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x72777c : 0x8a8f93,
      roughness: 1,
      metalness: 0.02,
    });
    const stone = new THREE.Mesh(geometry, material);
    stone.userData.radius = radius;
    stone.userData.generated = true;
    return stone;
  }

  static generateCity(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    for (let i = -2; i <= 2; i++) {
      const roadX = new THREE.Mesh(
        new THREE.PlaneGeometry(areaSize, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x1e2127, roughness: 0.9, metalness: 0.15 })
      );
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.01, i * 14);
      roadX.userData.generated = true;
      scene.add(roadX);

      const roadZ = roadX.clone();
      roadZ.rotation.z = Math.PI / 2;
      roadZ.position.set(i * 14, 0.012, 0);
      scene.add(roadZ);
    }

    const numBuildings = ProceduralScene.scaledCount(14, 12);
    for (let i = 0; i < numBuildings; i++) {
      const width = ProceduralScene.random(3.5, 8.5);
      const height = ProceduralScene.random(8, 34);
      const depth = ProceduralScene.random(3.5, 8.5);

      const building = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x4f5660 : 0x6a7079,
        roughness: 0.72,
        metalness: 0.24,
      });
      const core = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      core.position.y = height / 2;
      core.castShadow = true;
      core.receiveShadow = true;
      building.add(core);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.72, ProceduralScene.random(0.4, 1.3), depth * 0.72),
        new THREE.MeshStandardMaterial({ color: 0x2f3844, roughness: 0.65, metalness: 0.34 })
      );
      roof.position.y = height + roof.geometry.parameters.height * 0.5;
      roof.castShadow = true;
      building.add(roof);

      if (Math.random() > 0.35) {
        const windowBand = new THREE.Mesh(
          new THREE.BoxGeometry(width * 1.01, ProceduralScene.random(0.35, 0.8), depth * 0.18),
          new THREE.MeshStandardMaterial({
            color: 0xf6d38b,
            emissive: 0xe4ae52,
            emissiveIntensity: 0.8,
            roughness: 0.4,
            metalness: 0.35,
          })
        );
        windowBand.position.set(0, ProceduralScene.random(height * 0.25, height * 0.8), depth * 0.5);
        building.add(windowBand);
      }

      building.position.x = (Math.random() - 0.5) * areaSize;
      building.position.z = (Math.random() - 0.5) * areaSize;
      building.userData.generated = true;
      scene.add(building);
      ProceduralScene.addPhysicsForObject(building, physicsWorld, staticMaterial);
    }
  }

  static generateMoon(scene: THREE.Scene, physicsWorld: CANNON.World, areaSize: number, staticMaterial: CANNON.Material): void {
    const craterCount = ProceduralScene.scaledCount(7, 8);
    for (let i = 0; i < craterCount; i++) {
      const radius = ProceduralScene.random(1.4, 4.8);
      const crater = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.55, radius, 32),
        new THREE.MeshStandardMaterial({
          color: 0x565c68,
          roughness: 1,
          metalness: 0,
          transparent: true,
          opacity: 0.75,
        })
      );
      crater.rotation.x = -Math.PI / 2;
      crater.position.set(
        (Math.random() - 0.5) * areaSize,
        0.03,
        (Math.random() - 0.5) * areaSize
      );
      crater.userData.generated = true;
      scene.add(crater);
    }

    const numRocks = ProceduralScene.scaledCount(18, 18);
    for (let i = 0; i < numRocks; i++) {
      const radius = ProceduralScene.random(0.45, 1.6);
      const geometry = new THREE.IcosahedronGeometry(radius, 0);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x8e939c : 0x727781,
        roughness: 1,
        metalness: 0,
      });
      const rock = new THREE.Mesh(geometry, material);
      rock.position.x = (Math.random() - 0.5) * areaSize;
      rock.position.z = (Math.random() - 0.5) * areaSize;
      rock.position.y = radius * 0.8;
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.userData.generated = true;
      rock.castShadow = true;
      scene.add(rock);
      ProceduralScene.addPhysicsForObject(rock, physicsWorld, staticMaterial);
    }
  }
}
