import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { SceneType } from "../../scene/SceneSelector";

const SCENE_CAMERA_PRESETS: Record<SceneType, { height: number; distance: number; yawOffset: number }> = {
  Forest: { height: 10, distance: 16, yawOffset: -0.28 },
  City: { height: 9.5, distance: 15, yawOffset: 0.16 },
  Moon: { height: 11, distance: 18, yawOffset: -0.18 },
};

export class GameCameraController {
  private lookTarget = new THREE.Vector3();
  private desiredPosition = new THREE.Vector3();

  public update(
    camera: THREE.PerspectiveCamera,
    player: Character | null,
    opponent: Character | null,
    sceneType: SceneType,
    arenaRadius: number,
    deltaSeconds: number
  ): void {
    if (!player || !opponent) {
      return;
    }

    const preset = SCENE_CAMERA_PRESETS[sceneType];
    const midpoint = new THREE.Vector3()
      .copy(player.mesh.position)
      .add(opponent.mesh.position)
      .multiplyScalar(0.5);
    const separation = player.mesh.position.distanceTo(opponent.mesh.position);
    const zoomDistance = THREE.MathUtils.clamp(
      preset.distance + separation * 0.45,
      preset.distance,
      arenaRadius * 1.2
    );

    const baseDirection = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      preset.yawOffset
    );
    const offset = baseDirection.multiplyScalar(zoomDistance);
    offset.y = preset.height + separation * 0.08;

    this.desiredPosition.copy(midpoint).add(offset);
    this.desiredPosition.x = THREE.MathUtils.clamp(this.desiredPosition.x, -arenaRadius, arenaRadius);
    this.desiredPosition.z = THREE.MathUtils.clamp(this.desiredPosition.z, -arenaRadius, arenaRadius);
    camera.position.lerp(this.desiredPosition, 1 - Math.exp(-deltaSeconds * 5.5));

    this.lookTarget.copy(midpoint);
    this.lookTarget.y += Math.max(player.dimensions.height, opponent.dimensions.height) * 0.5 + 1.2;
    camera.lookAt(this.lookTarget);
  }

  public frameMenu(camera: THREE.PerspectiveCamera, sceneType: SceneType): void {
    const preset = SCENE_CAMERA_PRESETS[sceneType];
    camera.position.set(-9 + preset.yawOffset * 8, preset.height + 5, preset.distance + 10);
    camera.lookAt(0, 4, 0);
  }
}
