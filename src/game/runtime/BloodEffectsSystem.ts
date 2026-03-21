import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { QualityLevel } from "../../types/Quality";
import type { CombatEvent } from "../combat/types";

type ActiveBleed = {
  endsAt: number;
  nextTickAt: number;
  nextPoolAt: number;
  tickDamage: number;
  tickMs: number;
};

type PoolEntry = {
  mesh: THREE.Mesh;
  expiresAt: number;
};

type SprayEntry = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  expiresAt: number;
  settled: boolean;
};

type QualityBudget = {
  maxPools: number;
  maxSprays: number;
  sprayBurstCount: number;
  poolLifetimeMs: number;
};

const BUDGETS: Record<QualityLevel, QualityBudget> = {
  low: { maxPools: 24, maxSprays: 40, sprayBurstCount: 4, poolLifetimeMs: 22_000 },
  medium: { maxPools: 42, maxSprays: 72, sprayBurstCount: 7, poolLifetimeMs: 30_000 },
  high: { maxPools: 56, maxSprays: 96, sprayBurstCount: 11, poolLifetimeMs: 38_000 },
};

export class BloodEffectsSystem {
  private activeBleeds = new WeakMap<Character, ActiveBleed>();
  private pools: PoolEntry[] = [];
  private sprays: SprayEntry[] = [];
  private budget: QualityBudget = BUDGETS.medium;
  private sprayGeometry = new THREE.IcosahedronGeometry(0.08, 0);

  public setQuality(level: QualityLevel): void {
    this.budget = BUDGETS[level];
  }

  public clear(scene: THREE.Scene): void {
    this.pools.forEach((entry) => scene.remove(entry.mesh));
    this.sprays.forEach((entry) => scene.remove(entry.mesh));
    this.pools = [];
    this.sprays = [];
    this.activeBleeds = new WeakMap<Character, ActiveBleed>();
  }

  public getStats(): { pools: number; sprays: number } {
    return {
      pools: this.pools.length,
      sprays: this.sprays.length,
    };
  }

  public handleCombatEvent(scene: THREE.Scene, event: CombatEvent, timestamp: number): void {
    if (event.type !== "attack_hit" || !event.target) {
      return;
    }

    this.spawnImpactPool(scene, event.target, event.damage ?? 10, timestamp, 1);
    this.spawnSprayBurst(scene, event, timestamp);
    if (!event.bleed || !event.bleed.applied) {
      return;
    }

    this.activeBleeds.set(event.target, {
      endsAt: timestamp + event.bleed.durationMs,
      nextTickAt: timestamp + event.bleed.tickMs,
      nextPoolAt: timestamp + Math.min(900, event.bleed.tickMs),
      tickDamage: event.bleed.tickDamage,
      tickMs: event.bleed.tickMs,
    });
  }

  public update(scene: THREE.Scene, characters: Character[], timestamp: number): void {
    this.pruneExpiredPools(scene, timestamp);
    this.updateSprays(scene, timestamp);

    characters.forEach((character) => {
      const bleed = this.activeBleeds.get(character);
      if (!bleed) {
        return;
      }
      if (character.health <= 0 || timestamp >= bleed.endsAt) {
        this.activeBleeds.delete(character);
        return;
      }

      if (timestamp >= bleed.nextTickAt) {
        character.applyDamage(bleed.tickDamage);
        bleed.nextTickAt += bleed.tickMs;
      }

      if (timestamp >= bleed.nextPoolAt) {
        this.spawnImpactPool(scene, character, bleed.tickDamage * 1.2, timestamp, 0.55);
        bleed.nextPoolAt += 520;
      }
    });
  }

  private spawnImpactPool(
    scene: THREE.Scene,
    character: Character,
    damage: number,
    timestamp: number,
    intensity: number
  ): void {
    const radius = THREE.MathUtils.clamp(0.18 + damage * 0.02 * intensity, 0.12, 0.95);
    const points = 18;
    const shape: THREE.Vector2[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const jitter = 0.78 + Math.random() * 0.45;
      shape.push(new THREE.Vector2(Math.cos(angle) * radius * jitter, Math.sin(angle) * radius * jitter));
    }

    const geometry = new THREE.ShapeGeometry(new THREE.Shape(shape));
    const material = new THREE.MeshBasicMaterial({
      color: 0x6e0c0c,
      transparent: true,
      opacity: THREE.MathUtils.clamp(0.3 + intensity * 0.42, 0.28, 0.7),
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const pool = new THREE.Mesh(geometry, material);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(
      character.body.position.x + (Math.random() - 0.5) * radius * 0.8,
      0.025,
      character.body.position.z + (Math.random() - 0.5) * radius * 0.8
    );

    scene.add(pool);
    this.pools.push({ mesh: pool, expiresAt: timestamp + this.budget.poolLifetimeMs });

    if (this.pools.length > this.budget.maxPools) {
      const oldest = this.pools.shift();
      if (oldest) {
        scene.remove(oldest.mesh);
      }
    }
  }

  private spawnSprayBurst(scene: THREE.Scene, event: CombatEvent, timestamp: number): void {
    const target = event.target;
    const attacker = event.attacker;
    if (!target || !attacker) {
      return;
    }

    const direction = new THREE.Vector3().subVectors(target.mesh.position, attacker.mesh.position).setY(0).normalize();
    const basePosition = target.mesh.position.clone().add(new THREE.Vector3(0, target.dimensions.height * 0.65, 0));
    const burstCount = this.budget.sprayBurstCount + Math.floor((event.damage ?? 0) / 10);

    for (let index = 0; index < burstCount; index++) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 3 === 0 ? 0x8b1010 : 0x641010,
        transparent: true,
        opacity: 0.68,
      });
      const droplet = new THREE.Mesh(this.sprayGeometry, material);
      const scale = THREE.MathUtils.clamp(0.45 + (event.damage ?? 10) * 0.012 + Math.random() * 0.3, 0.35, 0.95);
      droplet.scale.setScalar(scale);
      droplet.position.copy(basePosition).add(new THREE.Vector3((Math.random() - 0.5) * 0.35, Math.random() * 0.2, (Math.random() - 0.5) * 0.35));
      scene.add(droplet);

      const lateral = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar((Math.random() - 0.5) * 2.4);
      const velocity = direction.clone().multiplyScalar(2 + Math.random() * 2.8)
        .add(lateral)
        .add(new THREE.Vector3(0, 1.2 + Math.random() * 1.8, 0));

      this.sprays.push({
        mesh: droplet,
        velocity,
        expiresAt: timestamp + 650 + Math.random() * 450,
        settled: false,
      });
    }

    while (this.sprays.length > this.budget.maxSprays) {
      const oldest = this.sprays.shift();
      if (oldest) {
        scene.remove(oldest.mesh);
      }
    }
  }

  private updateSprays(scene: THREE.Scene, timestamp: number): void {
    const gravity = new THREE.Vector3(0, -0.15, 0);
    this.sprays = this.sprays.filter((entry) => {
      entry.velocity.add(gravity);
      entry.mesh.position.add(entry.velocity.clone().multiplyScalar(0.1));
      entry.mesh.rotation.x += entry.velocity.z * 0.08;
      entry.mesh.rotation.z += entry.velocity.x * 0.08;

      const material = entry.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.clamp((entry.expiresAt - timestamp) / 800, 0, 0.68);

      if (!entry.settled && entry.mesh.position.y <= 0.08) {
        entry.mesh.position.y = 0.08;
        entry.settled = true;
      }

      if (timestamp <= entry.expiresAt) {
        return true;
      }

      scene.remove(entry.mesh);
      return false;
    });
  }

  private pruneExpiredPools(scene: THREE.Scene, timestamp: number): void {
    this.pools = this.pools.filter((entry) => {
      if (timestamp <= entry.expiresAt) {
        return true;
      }
      scene.remove(entry.mesh);
      return false;
    });
  }
}
