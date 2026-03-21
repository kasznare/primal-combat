import * as THREE from "three";
import * as CANNON from "cannon-es";
import { addPhysicsForObject, random, scaledCount } from "./ProceduralShared";

function createTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkHeight = random(1.4, 3.4);
  const trunkRadiusTop = random(0.14, 0.24);
  const trunkRadiusBottom = trunkRadiusTop * random(1.15, 1.45);
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadiusTop,
    trunkRadiusBottom,
    trunkHeight,
    8
  );
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

  const canopyCount = Math.floor(random(2, 4));
  for (let i = 0; i < canopyCount; i++) {
    const radius = random(0.8, 1.8);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), foliageMaterial);
    canopy.position.set(random(-0.22, 0.22), trunkHeight + i * random(0.5, 0.9), random(-0.22, 0.22));
    canopy.scale.y = random(0.8, 1.1);
    canopy.castShadow = Math.random() > 0.55;
    tree.add(canopy);
  }

  return tree;
}

function createAncientPine(): THREE.Group {
  const tree = new THREE.Group();
  const trunkHeight = random(6.5, 10.5);
  const trunkRadius = random(0.5, 0.8);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkRadius * 0.78, trunkRadius, trunkHeight, 10),
    new THREE.MeshStandardMaterial({ color: 0x5f3820, roughness: 0.96, metalness: 0 })
  );
  trunk.position.y = trunkHeight * 0.5;
  trunk.castShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 4; i++) {
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(random(1.8, 2.8), random(2.4, 3.6), 10),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x29592d : 0x346937, roughness: 0.95 })
    );
    canopy.position.y = trunkHeight - i * 1.5;
    canopy.castShadow = i < 2;
    tree.add(canopy);
  }

  return tree;
}

function createStone(): THREE.Mesh {
  const radius = random(0.22, 0.8);
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

function createLog(): THREE.Mesh {
  const length = random(2.8, 5.2);
  const radius = random(0.22, 0.42);
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.08, length, 10),
    new THREE.MeshStandardMaterial({ color: 0x744827, roughness: 0.92 })
  );
  log.rotation.z = Math.PI / 2;
  log.position.y = radius * 1.02;
  log.castShadow = true;
  log.userData.generated = true;
  return log;
}

function createGrassPatch(): THREE.Group {
  const patch = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x4d7f39, roughness: 1, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(random(0.16, 0.28), random(0.28, 0.5)), material);
    blade.position.set(random(-0.1, 0.1), blade.geometry.parameters.height * 0.5, random(-0.1, 0.1));
    blade.rotation.y = (Math.PI / 3) * i + random(-0.2, 0.2);
    patch.add(blade);
  }
  patch.userData.generated = true;
  return patch;
}

export function generateForest(
  scene: THREE.Scene,
  physicsWorld: CANNON.World,
  areaSize: number,
  staticMaterial: CANNON.Material
): void {
  const numTrees = scaledCount(24, 18);
  for (let i = 0; i < numTrees; i++) {
    const tree = createTree();
    tree.position.x = (Math.random() - 0.5) * areaSize;
    tree.position.z = (Math.random() - 0.5) * areaSize;
    tree.position.y = 0;
    tree.rotation.y = Math.random() * Math.PI * 2;
    tree.userData.generated = true;
    scene.add(tree);
    addPhysicsForObject(tree, physicsWorld, staticMaterial);
  }

  const perimeterTrees = scaledCount(6, 2);
  for (let i = 0; i < perimeterTrees; i++) {
    const pine = createAncientPine();
    const angle = (Math.PI * 2 * i) / perimeterTrees + random(-0.18, 0.18);
    const radius = areaSize * random(0.38, 0.47);
    pine.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    pine.rotation.y = -angle + Math.PI * 0.5;
    pine.userData.generated = true;
    scene.add(pine);
  }

  const numStones = scaledCount(10, 10);
  for (let i = 0; i < numStones; i++) {
    const stone = createStone();
    stone.position.x = (Math.random() - 0.5) * areaSize;
    stone.position.z = (Math.random() - 0.5) * areaSize;
    stone.position.y = (stone.userData.radius as number) * 0.85;
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    stone.userData.generated = true;
    stone.castShadow = true;
    scene.add(stone);
    addPhysicsForObject(stone, physicsWorld, staticMaterial);
  }

  const logCount = scaledCount(5, 3);
  for (let i = 0; i < logCount; i++) {
    const log = createLog();
    log.position.set((Math.random() - 0.5) * areaSize * 0.8, log.position.y, (Math.random() - 0.5) * areaSize * 0.8);
    log.rotation.y = Math.random() * Math.PI * 2;
    scene.add(log);
    addPhysicsForObject(log, physicsWorld, staticMaterial);
  }

  const numShrubs = scaledCount(24, 30);
  for (let i = 0; i < numShrubs; i++) {
    const shrub = new THREE.Mesh(
      new THREE.SphereGeometry(random(0.14, 0.44), 8, 8),
      new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? 0x355e2f : 0x466f32,
        roughness: 1,
        metalness: 0,
      })
    );
    shrub.position.set((Math.random() - 0.5) * areaSize, random(0.09, 0.22), (Math.random() - 0.5) * areaSize);
    shrub.userData.generated = true;
    scene.add(shrub);
  }

  const grassCount = scaledCount(36, 30);
  for (let i = 0; i < grassCount; i++) {
    const patch = createGrassPatch();
    patch.position.set((Math.random() - 0.5) * areaSize, 0, (Math.random() - 0.5) * areaSize);
    patch.rotation.y = Math.random() * Math.PI * 2;
    scene.add(patch);
  }
}
