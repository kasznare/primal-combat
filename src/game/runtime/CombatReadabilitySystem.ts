import * as THREE from "three";
import type { Character } from "../../entities/Character";

export class CombatReadabilitySystem {
  private playerMarker: THREE.Mesh | null = null;
  private opponentMarker: THREE.Mesh | null = null;
  private playerRimLight: THREE.PointLight | null = null;
  private opponentRimLight: THREE.PointLight | null = null;

  public setup(scene: THREE.Scene, player: Character | null, opponent: Character | null): void {
    this.clear(scene);
    if (!player || !opponent) {
      return;
    }

    this.playerMarker = this.createGroundMarker(0x59afff);
    this.opponentMarker = this.createGroundMarker(0xff6f5d);
    scene.add(this.playerMarker);
    scene.add(this.opponentMarker);

    this.playerRimLight = this.createRimLight(0x75bcff);
    this.opponentRimLight = this.createRimLight(0xff7f6b);
    scene.add(this.playerRimLight);
    scene.add(this.opponentRimLight);
  }

  public clear(scene: THREE.Scene): void {
    [this.playerMarker, this.opponentMarker, this.playerRimLight, this.opponentRimLight].forEach(
      (object) => {
        if (object) {
          scene.remove(object);
        }
      }
    );
    this.playerMarker = null;
    this.opponentMarker = null;
    this.playerRimLight = null;
    this.opponentRimLight = null;
  }

  public update(player: Character | null, opponent: Character | null): void {
    if (!player || !opponent) {
      return;
    }

    if (this.playerMarker) {
      this.playerMarker.position.set(player.mesh.position.x, 0.05, player.mesh.position.z);
      this.playerMarker.scale.setScalar(player.isHitFlashing() ? 1.22 : 1);
      (this.playerMarker.material as THREE.MeshBasicMaterial).opacity = player.isHitFlashing()
        ? 0.96
        : 0.72;
    }

    if (this.opponentMarker) {
      this.opponentMarker.position.set(opponent.mesh.position.x, 0.05, opponent.mesh.position.z);
      this.opponentMarker.scale.setScalar(opponent.isHitFlashing() ? 1.22 : 1);
      (this.opponentMarker.material as THREE.MeshBasicMaterial).opacity = opponent.isHitFlashing()
        ? 0.96
        : 0.72;
    }

    if (this.playerRimLight) {
      this.playerRimLight.position.set(
        player.mesh.position.x,
        player.dimensions.height + 0.6,
        player.mesh.position.z
      );
      this.playerRimLight.intensity = player.isHitFlashing() ? 1.2 : 0.65;
    }

    if (this.opponentRimLight) {
      this.opponentRimLight.position.set(
        opponent.mesh.position.x,
        opponent.dimensions.height + 0.6,
        opponent.mesh.position.z
      );
      this.opponentRimLight.intensity = opponent.isHitFlashing() ? 1.2 : 0.65;
    }
  }

  private createGroundMarker(color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.22, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
  }

  private createRimLight(color: number): THREE.PointLight {
    const light = new THREE.PointLight(color, 0.65, 8, 2.1);
    light.castShadow = false;
    return light;
  }
}
