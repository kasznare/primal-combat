import * as THREE from "three";
import type { Character } from "../../entities/Character";
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

const MAX_POOLS = 52;
const POOL_LIFETIME_MS = 38_000;

export class BloodEffectsSystem {
  private activeBleeds = new WeakMap<Character, ActiveBleed>();
  private pools: PoolEntry[] = [];

  public clear(scene: THREE.Scene): void {
    this.pools.forEach((entry) => scene.remove(entry.mesh));
    this.pools = [];
    this.activeBleeds = new WeakMap<Character, ActiveBleed>();
  }

  public handleCombatEvent(scene: THREE.Scene, event: CombatEvent, timestamp: number): void {
    if (event.type !== "attack_hit" || !event.target) {
      return;
    }

    this.spawnImpactPool(scene, event.target, event.damage ?? 10, timestamp, 1);
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
    this.pools.push({ mesh: pool, expiresAt: timestamp + POOL_LIFETIME_MS });

    if (this.pools.length > MAX_POOLS) {
      const oldest = this.pools.shift();
      if (oldest) {
        scene.remove(oldest.mesh);
      }
    }
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
