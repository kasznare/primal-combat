import * as THREE from "three";
import * as CANNON from "cannon-es";
import { addPhysicsForObject, random, scaledCount } from "./ProceduralShared";

function createLander(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xc3c7ce, roughness: 0.7, metalness: 0.4 })
  );
  body.position.y = 1.5;
  body.castShadow = true;
  group.add(body);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x9ea7b6, roughness: 0.72, metalness: 0.35 })
    );
    const angle = (Math.PI * 2 * i) / 4;
    leg.position.set(Math.cos(angle) * 0.95, 0.55, Math.sin(angle) * 0.95);
    leg.rotation.z = Math.PI / 6;
    leg.castShadow = true;
    group.add(leg);
  }

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6),
    new THREE.MeshStandardMaterial({ color: 0xd8dde5, roughness: 0.55, metalness: 0.42 })
  );
  antenna.position.set(0.2, 3.15, 0);
  group.add(antenna);

  group.userData.generated = true;
  return group;
}

function createFlag(): THREE.Group {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 2.8, 6),
    new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.65, metalness: 0.25 })
  );
  pole.position.y = 1.4;
  group.add(pole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.48, 4, 2),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95, side: THREE.DoubleSide })
  );
  flag.position.set(0.46, 2.2, 0);
  flag.rotation.y = Math.PI / 2;
  group.add(flag);
  group.userData.generated = true;
  return group;
}

function createBeacon(): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.5, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x828791, roughness: 0.96, metalness: 0.08 })
  );
  base.position.y = 0.25;
  group.add(base);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 3.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xcbd3de, roughness: 0.6, metalness: 0.3 })
  );
  mast.position.y = 2;
  group.add(mast);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x8fd6ff, emissive: 0x5db8ff, emissiveIntensity: 1.2, roughness: 0.25 })
  );
  beacon.position.y = 3.72;
  group.add(beacon);
  group.userData.generated = true;
  return group;
}

export function generateMoon(
  scene: THREE.Scene,
  physicsWorld: CANNON.World,
  areaSize: number,
  staticMaterial: CANNON.Material
): void {
  const beacon = createBeacon();
  scene.add(beacon);

  const craterCount = scaledCount(7, 8);
  for (let i = 0; i < craterCount; i++) {
    const radius = random(1.4, 4.8);
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
    crater.position.set((Math.random() - 0.5) * areaSize, 0.03, (Math.random() - 0.5) * areaSize);
    crater.userData.generated = true;
    scene.add(crater);
  }

  const numRocks = scaledCount(18, 18);
  for (let i = 0; i < numRocks; i++) {
    const radius = random(0.45, 1.6);
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
    addPhysicsForObject(rock, physicsWorld, staticMaterial);
  }

  const ridgeCount = scaledCount(10, 4);
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(random(2.8, 6.2), random(0.8, 1.6), random(1.4, 2.8)),
      new THREE.MeshStandardMaterial({ color: 0x767b85, roughness: 1, metalness: 0 })
    );
    const angle = (Math.PI * 2 * i) / ridgeCount + random(-0.24, 0.24);
    const radius = areaSize * random(0.3, 0.46);
    ridge.position.set(Math.cos(angle) * radius, ridge.geometry.parameters.height * 0.5, Math.sin(angle) * radius);
    ridge.rotation.y = Math.random() * Math.PI * 2;
    ridge.userData.generated = true;
    ridge.castShadow = true;
    scene.add(ridge);
    addPhysicsForObject(ridge, physicsWorld, staticMaterial);
  }

  const lander = createLander();
  lander.position.set(areaSize * 0.24, 0, -areaSize * 0.18);
  scene.add(lander);
  addPhysicsForObject(lander, physicsWorld, staticMaterial);

  const flag = createFlag();
  flag.position.set(-areaSize * 0.18, 0, areaSize * 0.12);
  scene.add(flag);

  const centerRing = new THREE.Mesh(
    new THREE.RingGeometry(5.4, 6.3, 48),
    new THREE.MeshStandardMaterial({
      color: 0x93a0b4,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    })
  );
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.y = 0.025;
  centerRing.userData.generated = true;
  scene.add(centerRing);
}
