import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Character } from "../entities/Character";
import { PhysicsEngine } from "../physics/PhysicsEngine";
import { PerformanceMonitor } from "../game/runtime/PerformanceMonitor";
import { CharacterAnimationSystem } from "../game/runtime/CharacterAnimationSystem";
import { CHARACTER_CONFIGS } from "../game/roster/characterConfigs";
import type { FighterCombatState } from "../game/combat/types";
import type { CharacterConfig } from "../game/roster/types";
import type { QualityLevel } from "../types/Quality";
import type { AssetLabPose, StudioPreset } from "./types";

const BASE_FIGHTER_STATE: FighterCombatState = {
  phase: "idle",
  phaseEndsAt: null,
  attackTarget: null,
  attackId: null,
  attackResolved: false,
  blockHeld: false,
  invulnerableUntil: 0,
  dodgeCooldownUntil: 0,
  lastAttackAt: Number.NEGATIVE_INFINITY,
  lastHitAt: Number.NEGATIVE_INFINITY,
  moveCooldownUntil: {},
  bleedingUntil: 0,
};

type StudioPresetConfig = {
  background: number;
  fog: number;
  keyColor: number;
  keyIntensity: number;
  fillColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
  accentColor: number;
  accentOpacity: number;
  floorColor: number;
  platformColor: number;
  gridColor: number;
};

const STUDIO_PRESETS: Record<StudioPreset, StudioPresetConfig> = {
  studio: {
    background: 0xcad5e3,
    fog: 0xd6dee8,
    keyColor: 0xfffbf3,
    keyIntensity: 2.1,
    fillColor: 0xcfe2ff,
    fillIntensity: 1.2,
    rimColor: 0xaed3ff,
    rimIntensity: 1.05,
    accentColor: 0xffc16c,
    accentOpacity: 0.16,
    floorColor: 0x8f99aa,
    platformColor: 0x666f7e,
    gridColor: 0xaeb8c7,
  },
  warm: {
    background: 0xddd1c1,
    fog: 0xe7dbcd,
    keyColor: 0xfff0d8,
    keyIntensity: 2.18,
    fillColor: 0xf6d2a2,
    fillIntensity: 1.1,
    rimColor: 0xe88d4d,
    rimIntensity: 0.95,
    accentColor: 0xff9f56,
    accentOpacity: 0.2,
    floorColor: 0x8c745e,
    platformColor: 0x6d5645,
    gridColor: 0xc8b49e,
  },
  moonlit: {
    background: 0x283246,
    fog: 0x344157,
    keyColor: 0xd7e8ff,
    keyIntensity: 1.85,
    fillColor: 0x91b3f1,
    fillIntensity: 1.08,
    rimColor: 0x8fd5ff,
    rimIntensity: 1.28,
    accentColor: 0x77b7ff,
    accentOpacity: 0.22,
    floorColor: 0x5c6a86,
    platformColor: 0x404c63,
    gridColor: 0x90a1bf,
  },
};

function createTransparentMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export class AssetLab {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;

  private readonly container: HTMLElement;
  private readonly physicsEngine: PhysicsEngine;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly animationSystem: CharacterAnimationSystem;
  private readonly studioRoot = new THREE.Group();
  private readonly lightRoot = new THREE.Group();
  private readonly assetRoot = new THREE.Group();
  private readonly overlayRoot = new THREE.Group();
  private readonly neutralTarget = new THREE.Vector3(0, 1.35, 0);
  private currentCharacter: Character | null = null;
  private currentConfig: CharacterConfig | null = null;
  private currentPose: AssetLabPose = "idle";
  private currentPreset: StudioPreset = "studio";
  private currentQuality: QualityLevel = "high";
  private turntableEnabled = true;
  private wireframeEnabled = false;
  private hitboxesEnabled = true;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private destroyed = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.physicsEngine = new PhysicsEngine();
    this.performanceMonitor = new PerformanceMonitor(container);
    this.animationSystem = new CharacterAnimationSystem();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute("aria-label", "Asset lab viewport");
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.add(this.studioRoot, this.lightRoot, this.assetRoot);

    this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 2.6, 6.6);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 18;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.copy(this.neutralTarget);
    this.renderer.domElement.addEventListener("contextmenu", (event) => event.preventDefault());

    this.assetRoot.add(this.overlayRoot);

    this.applyQuality(this.currentQuality);
    this.buildStudio(this.currentPreset);
    this.onWindowResize();
    window.addEventListener("resize", this.onWindowResize);

    this.animate(0);
  }

  public focusSurface(): void {
    this.renderer.domElement.focus({ preventScroll: true });
  }

  public setDebug(enabled: boolean): void {
    this.performanceMonitor.setEnabled(enabled);
  }

  public setQuality(level: QualityLevel): void {
    this.currentQuality = level;
    this.applyQuality(level);
    this.buildStudio(this.currentPreset);
  }

  public setAsset(key: string): void {
    const config = CHARACTER_CONFIGS[key] ?? CHARACTER_CONFIGS.Human;
    this.clearCurrentAsset();
    this.assetRoot.rotation.set(0, 0, 0);

    const character = new config.classRef(config.stats, this.physicsEngine);
    character.setHealthBarVisible(false);
    character.body.position.set(0, character.dimensions.height, 0);
    character.mesh.position.copy(character.body.position as unknown as THREE.Vector3);

    this.assetRoot.add(character.mesh);
    this.currentCharacter = character;
    this.currentConfig = config;

    this.applyWireframe();
    this.syncOverlays();
    this.frameAsset();
  }

  public setPose(pose: AssetLabPose): void {
    this.currentPose = pose;
    this.syncOverlays();
  }

  public setStudioPreset(preset: StudioPreset): void {
    this.currentPreset = preset;
    this.buildStudio(preset);
  }

  public setTurntable(enabled: boolean): void {
    this.turntableEnabled = enabled;
  }

  public setWireframe(enabled: boolean): void {
    this.wireframeEnabled = enabled;
    this.applyWireframe();
  }

  public setHitboxes(enabled: boolean): void {
    this.hitboxesEnabled = enabled;
    this.syncOverlays();
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener("resize", this.onWindowResize);
    this.controls.dispose();
    this.performanceMonitor.destroy();
    this.clearCurrentAsset();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  private animate = (timestamp: number): void => {
    if (this.destroyed) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    const frameMs = Math.max(16, timestamp - this.lastFrameTime);
    this.lastFrameTime = timestamp;
    this.performanceMonitor.update(frameMs, timestamp, this.renderer, this.currentQuality);
    this.updatePreview(timestamp, frameMs / 1000);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private updatePreview(timestamp: number, deltaSeconds: number): void {
    if (!this.currentCharacter || !this.currentConfig) {
      return;
    }

    const character = this.currentCharacter;
    character.body.position.set(0, character.dimensions.height, 0);
    character.body.velocity.set(0, 0, 0);

    if (this.currentPose === "locomotion") {
      character.body.velocity.set(0.45, 0, this.currentConfig.stats.maxVelocity * 0.52);
    }

    const previewState = this.buildPreviewState(timestamp);
    character.update();
    this.animationSystem.update(character, this.currentConfig, previewState, timestamp);

    if (this.turntableEnabled) {
      this.assetRoot.rotation.y += deltaSeconds * 0.45;
    }

    this.overlayRoot.visible = this.hitboxesEnabled;
  }

  private buildPreviewState(timestamp: number): FighterCombatState {
    if (!this.currentConfig) {
      return BASE_FIGHTER_STATE;
    }

    if (this.currentPose === "block") {
      return { ...BASE_FIGHTER_STATE, phase: "blocking", blockHeld: true };
    }
    if (this.currentPose === "dodge") {
      return { ...BASE_FIGHTER_STATE, phase: "dodging", invulnerableUntil: timestamp + 120 };
    }
    if (this.currentPose === "stunned") {
      return { ...BASE_FIGHTER_STATE, phase: "stunned", lastHitAt: timestamp - 90 };
    }
    if (this.currentPose === "locomotion") {
      return { ...BASE_FIGHTER_STATE, phase: "moving" };
    }
    if (this.currentPose === "primary" || this.currentPose === "secondary") {
      const move = this.currentPose === "secondary" ? this.currentConfig.attacks[1] ?? this.currentConfig.attack : this.currentConfig.attack;
      const restMs = 260;
      const cycleMs = move.startupMs + move.activeMs + move.recoveryMs + restMs;
      const elapsed = timestamp % cycleMs;
      let phase: FighterCombatState["phase"] = "attackStartup";
      if (elapsed >= move.startupMs + move.activeMs) {
        phase = elapsed < move.startupMs + move.activeMs + move.recoveryMs ? "attackRecovery" : "idle";
      } else if (elapsed >= move.startupMs) {
        phase = "attackActive";
      }

      return {
        ...BASE_FIGHTER_STATE,
        phase,
        attackId: move.id,
        lastAttackAt: timestamp - Math.min(elapsed, move.startupMs + move.activeMs + move.recoveryMs),
      };
    }

    return BASE_FIGHTER_STATE;
  }

  private syncOverlays(): void {
    this.overlayRoot.clear();
    if (!this.hitboxesEnabled || !this.currentConfig) {
      return;
    }

    const hurtbox = this.currentConfig.defense.hurtbox;
    const hurtMaterial = createTransparentMaterial(0x5ab7ff, 0.18);
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(hurtbox.torsoRadius, hurtbox.torsoRadius, hurtbox.torsoHeight, 18, 1, true),
      hurtMaterial
    );
    torso.position.y = hurtbox.torsoHeight * 0.5;
    this.overlayRoot.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(hurtbox.headRadius, 18, 16),
      createTransparentMaterial(0x7fe0ff, 0.22)
    );
    head.position.y = hurtbox.headHeight;
    this.overlayRoot.add(head);

    const move = this.currentPose === "secondary" ? this.currentConfig.attacks[1] ?? this.currentConfig.attack : this.currentConfig.attack;
    const attackHitbox = new THREE.Mesh(
      new THREE.CapsuleGeometry(move.hitbox.radius, move.hitbox.length, 8, 16),
      createTransparentMaterial(0xffa24a, 0.22)
    );
    attackHitbox.rotation.x = Math.PI / 2;
    attackHitbox.position.set(move.hitbox.lateral ?? 0, move.hitbox.up, move.hitbox.forward + move.hitbox.length * 0.5);
    this.overlayRoot.add(attackHitbox);

    const attackDisc = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.05, move.idealRange - 0.12), move.idealRange + 0.12, 36),
      createTransparentMaterial(0xffd17c, 0.24)
    );
    attackDisc.rotation.x = -Math.PI / 2;
    attackDisc.position.y = 0.03;
    this.overlayRoot.add(attackDisc);
  }

  private applyWireframe(): void {
    if (!this.currentCharacter) {
      return;
    }

    this.currentCharacter.mesh.traverse((node) => {
      const mesh = node as THREE.Mesh;
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (!material) {
        return;
      }
      const apply = (entry: THREE.Material) => {
        const materialWithWireframe = entry as THREE.Material & { wireframe?: boolean };
        if (typeof materialWithWireframe.wireframe === "boolean") {
          materialWithWireframe.wireframe = this.wireframeEnabled;
        }
      };
      if (Array.isArray(material)) {
        material.forEach(apply);
        return;
      }
      apply(material);
    });
  }

  private frameAsset(): void {
    if (!this.currentCharacter) {
      this.controls.target.copy(this.neutralTarget);
      return;
    }

    const bounds = new THREE.Box3().setFromObject(this.currentCharacter.mesh);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z, 1);
    this.controls.target.copy(center.setY(Math.max(1.2, center.y * 0.88)));
    this.camera.position.set(radius * 1.05, Math.max(1.6, size.y * 0.72), radius * 2.45);
    this.camera.lookAt(this.controls.target);
  }

  private buildStudio(preset: StudioPreset): void {
    const config = STUDIO_PRESETS[preset];
    this.scene.background = new THREE.Color(config.background);
    this.scene.fog = new THREE.FogExp2(config.fog, preset === "moonlit" ? 0.016 : 0.012);

    this.studioRoot.clear();
    this.lightRoot.clear();

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 72),
      new THREE.MeshStandardMaterial({ color: config.floorColor, roughness: 0.94, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.studioRoot.add(floor);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.1, 0.42, 40),
      new THREE.MeshStandardMaterial({ color: config.platformColor, roughness: 0.88, metalness: 0.08 })
    );
    platform.position.y = 0.2;
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.studioRoot.add(platform);

    const backdrop = new THREE.Mesh(
      new THREE.CylinderGeometry(8.8, 8.8, 6.4, 42, 1, true, Math.PI * 0.18, Math.PI * 0.64),
      new THREE.MeshStandardMaterial({ color: 0xf1f1f1, roughness: 1, metalness: 0, side: THREE.BackSide })
    );
    backdrop.position.set(0, 3.12, -1.85);
    backdrop.rotation.y = Math.PI;
    this.studioRoot.add(backdrop);

    const accentDisc = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      createTransparentMaterial(config.accentColor, config.accentOpacity)
    );
    accentDisc.rotation.x = -Math.PI / 2;
    accentDisc.position.y = 0.021;
    this.studioRoot.add(accentDisc);

    const grid = new THREE.GridHelper(14, 28, config.gridColor, config.gridColor);
    (grid.material as THREE.Material).opacity = 0.38;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.022;
    this.studioRoot.add(grid);

    const guideMat = new THREE.MeshStandardMaterial({ color: 0xe4e7ec, roughness: 0.92, metalness: 0.02 });
    for (let index = 1; index <= 4; index += 1) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8), guideMat);
      marker.position.set(-3.15, index * 0.5, 0);
      this.studioRoot.add(marker);
    }

    const guidePole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.6, 0.05), guideMat);
    guidePole.position.set(-3.15, 1.3, 0);
    this.studioRoot.add(guidePole);

    const ambient = new THREE.AmbientLight(0xffffff, preset === "moonlit" ? 0.58 : 0.74);
    this.lightRoot.add(ambient);

    const hemi = new THREE.HemisphereLight(0xe5f0ff, 0x6b625c, preset === "moonlit" ? 0.68 : 0.9);
    this.lightRoot.add(hemi);

    const key = new THREE.DirectionalLight(config.keyColor, config.keyIntensity);
    key.position.set(5.5, 8, 6.5);
    key.castShadow = this.currentQuality !== "low";
    key.shadow.mapSize.width = this.currentQuality === "high" ? 1536 : this.currentQuality === "medium" ? 1024 : 512;
    key.shadow.mapSize.height = key.shadow.mapSize.width;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 26;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.00008;
    this.lightRoot.add(key);

    const fill = new THREE.DirectionalLight(config.fillColor, config.fillIntensity);
    fill.position.set(-6.5, 4.5, 3.5);
    this.lightRoot.add(fill);

    const rim = new THREE.DirectionalLight(config.rimColor, config.rimIntensity);
    rim.position.set(-3.5, 3.8, -8.5);
    this.lightRoot.add(rim);

    const topWash = new THREE.SpotLight(config.accentColor, preset === "moonlit" ? 1.8 : 2.4, 16, 0.68, 0.65);
    topWash.position.set(0, 5.2, -1.8);
    topWash.target.position.set(0, 1.8, 0.2);
    this.lightRoot.add(topWash.target);
    this.lightRoot.add(topWash);
  }

  private applyQuality(level: QualityLevel): void {
    const pixelRatio = level === "low" ? 1 : level === "medium" ? 1.4 : 1.8;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = level !== "low";
  }

  private clearCurrentAsset(): void {
    if (!this.currentCharacter) {
      return;
    }
    this.assetRoot.remove(this.currentCharacter.mesh);
    this.currentCharacter.destroy();
    this.currentCharacter = null;
    this.currentConfig = null;
    this.overlayRoot.clear();
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
