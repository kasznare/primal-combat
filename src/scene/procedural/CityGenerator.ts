import * as THREE from "three";
import * as CANNON from "cannon-es";
import { addPhysicsForObject, random, scaledCount } from "./ProceduralShared";

function createStreetLight(): THREE.Group {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x505760, roughness: 0.8, metalness: 0.35 })
  );
  pole.position.y = 2.4;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x5d6670, roughness: 0.8, metalness: 0.35 })
  );
  arm.position.set(0, 4.45, 0.5);
  group.add(arm);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.18, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xf6d38b, emissive: 0xf0b24a, emissiveIntensity: 0.8 })
  );
  lamp.position.set(0, 4.25, 1.02);
  group.add(lamp);

  group.userData.generated = true;
  return group;
}

function createBillboard(): THREE.Group {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 5.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x505861, roughness: 0.75, metalness: 0.28 })
  );
  pole.position.y = 2.8;
  pole.castShadow = true;
  group.add(pole);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 2.2, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x244f7c, emissive: 0x16304a, emissiveIntensity: 0.35, roughness: 0.5 })
  );
  board.position.y = 5.1;
  board.castShadow = true;
  group.add(board);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 2.5, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xced5de, roughness: 0.55, metalness: 0.35 })
  );
  trim.position.set(0, 5.1, -0.08);
  group.add(trim);
  group.userData.generated = true;
  return group;
}

export function generateCity(
  scene: THREE.Scene,
  physicsWorld: CANNON.World,
  areaSize: number,
  staticMaterial: CANNON.Material
): void {
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

    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(areaSize, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xd7d8dc, roughness: 0.75 })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.016, i * 14);
    stripe.userData.generated = true;
    scene.add(stripe);
  }

  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(areaSize * 0.92, 0.4, areaSize * 0.92),
    new THREE.MeshStandardMaterial({ color: 0x707682, roughness: 0.92, metalness: 0.08 })
  );
  sidewalk.position.y = -0.18;
  sidewalk.userData.generated = true;
  scene.add(sidewalk);

  const numBuildings = scaledCount(14, 12);
  for (let i = 0; i < numBuildings; i++) {
    const width = random(3.5, 8.5);
    const height = random(8, 34);
    const depth = random(3.5, 8.5);

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
      new THREE.BoxGeometry(width * 0.72, random(0.4, 1.3), depth * 0.72),
      new THREE.MeshStandardMaterial({ color: 0x2f3844, roughness: 0.65, metalness: 0.34 })
    );
    roof.position.y = height + roof.geometry.parameters.height * 0.5;
    roof.castShadow = true;
    building.add(roof);

    if (Math.random() > 0.35) {
      const windowBand = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.01, random(0.35, 0.8), depth * 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xf6d38b,
          emissive: 0xe4ae52,
          emissiveIntensity: 0.8,
          roughness: 0.4,
          metalness: 0.35,
        })
      );
      windowBand.position.set(0, random(height * 0.25, height * 0.8), depth * 0.5);
      building.add(windowBand);
    }

    building.position.x = (Math.random() - 0.5) * areaSize;
    building.position.z = (Math.random() - 0.5) * areaSize;
    building.userData.generated = true;
    scene.add(building);
    addPhysicsForObject(building, physicsWorld, staticMaterial);
  }

  const lightCount = scaledCount(10, 4);
  for (let i = 0; i < lightCount; i++) {
    const light = createStreetLight();
    light.position.set((Math.random() - 0.5) * areaSize * 0.9, 0, (Math.random() - 0.5) * areaSize * 0.9);
    light.rotation.y = Math.round(Math.random()) * Math.PI * 0.5;
    scene.add(light);
  }

  const billboardCount = scaledCount(3, 2);
  for (let i = 0; i < billboardCount; i++) {
    const billboard = createBillboard();
    const radius = areaSize * random(0.32, 0.42);
    const angle = Math.random() * Math.PI * 2;
    billboard.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    billboard.rotation.y = -angle + Math.PI;
    scene.add(billboard);
  }
}
