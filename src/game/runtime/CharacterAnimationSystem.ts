import * as THREE from "three";
import type { Character } from "../../entities/Character";
import type { FighterCombatState, FighterPhase } from "../combat/types";
import type { CharacterConfig } from "../roster/types";

type TransformSnapshot = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

type CharacterRig = {
  profile: "generic" | "human" | "bear" | "humanoid" | "quadruped" | "winged" | "vehicle" | "colossus" | "tiny";
  rootScale: THREE.Vector3;
  nodes: Record<string, THREE.Object3D>;
  transforms: Record<string, TransformSnapshot>;
};

export class CharacterAnimationSystem {
  private rigs = new WeakMap<Character, CharacterRig>();

  public update(
    character: Character,
    config: CharacterConfig,
    combatState: FighterCombatState,
    timestamp: number
  ): void {
    const rig = this.getRig(character, config.animation.rigProfile ?? "generic");
    const phase = combatState.phase;
    const speed = Math.hypot(character.body.velocity.x, character.body.velocity.z);
    const locomotion = THREE.MathUtils.clamp(speed / Math.max(0.001, config.stats.maxVelocity), 0, 1);
    const t = timestamp / 1000;

    const idleBob =
      Math.sin(t * Math.PI * 2 * config.animation.idleBobSpeed) *
      config.animation.idleBobAmplitude *
      (locomotion > 0.1 ? 0.35 : 1);
    const moveBob =
      Math.sin(t * Math.PI * 2 * (config.animation.idleBobSpeed + locomotion * 4.5)) *
      config.animation.moveBobAmplitude *
      locomotion;

    character.mesh.position.y += idleBob + moveBob;
    character.mesh.rotation.z = THREE.MathUtils.lerp(
      character.mesh.rotation.z,
      this.getTargetTilt(character, config, phase, locomotion),
      0.18
    );
    character.mesh.rotation.x = THREE.MathUtils.lerp(
      character.mesh.rotation.x,
      this.getTargetPitch(phase, config),
      0.18
    );

    const targetScale = this.getTargetScale(rig.rootScale, phase);
    character.mesh.scale.lerp(targetScale, 0.18);

    this.restoreRig(rig);
    if (rig.profile === "human") {
      this.animateHumanRig(rig, config, combatState, timestamp, locomotion, t);
      return;
    }
    if (rig.profile === "bear") {
      this.animateBearRig(rig, config, combatState, timestamp, locomotion, t);
    }
  }

  public reset(character: Character): void {
    const rig = this.getRig(character);
    character.mesh.scale.copy(rig.rootScale);
    character.mesh.rotation.x = 0;
    character.mesh.rotation.z = 0;
    this.restoreRig(rig);
  }

  private getRig(
    character: Character,
    requestedProfile: CharacterRig["profile"]
  ): CharacterRig {
    const existing = this.rigs.get(character);
    if (existing) {
      existing.profile = requestedProfile;
      return existing;
    }

    const nodes: Record<string, THREE.Object3D> = {};
    const transforms: Record<string, TransformSnapshot> = {};

    character.mesh.traverse((node) => {
      if (!node.name.startsWith("rig:")) {
        return;
      }
      const key = node.name.slice(4);
      nodes[key] = node;
      transforms[key] = {
        position: node.position.clone(),
        rotation: node.rotation.clone(),
        scale: node.scale.clone(),
      };
    });

    const created: CharacterRig = {
      profile: requestedProfile,
      rootScale: character.mesh.scale.clone(),
      nodes,
      transforms,
    };
    this.rigs.set(character, created);
    return created;
  }

  private restoreRig(rig: CharacterRig): void {
    Object.entries(rig.transforms).forEach(([key, snapshot]) => {
      const node = rig.nodes[key];
      if (!node) {
        return;
      }
      node.position.copy(snapshot.position);
      node.rotation.copy(snapshot.rotation);
      node.scale.copy(snapshot.scale);
    });
  }

  private animateHumanRig(
    rig: CharacterRig,
    config: CharacterConfig,
    combatState: FighterCombatState,
    timestamp: number,
    locomotion: number,
    t: number
  ): void {
    const swing = Math.sin(t * (6 + locomotion * 9)) * locomotion;
    const torso = rig.nodes.torso;
    const head = rig.nodes.head;
    const leftArm = rig.nodes.leftArm;
    const rightArm = rig.nodes.rightArm;
    const leftForearm = rig.nodes.leftForearm;
    const rightForearm = rig.nodes.rightForearm;
    const leftLeg = rig.nodes.leftLeg;
    const rightLeg = rig.nodes.rightLeg;
    const leftShin = rig.nodes.leftShin;
    const rightShin = rig.nodes.rightShin;

    if (torso) {
      torso.rotation.y += swing * 0.08;
    }
    if (head) {
      head.rotation.y -= swing * 0.06;
      head.rotation.x += Math.sin(t * 2.2) * 0.025;
    }
    if (leftArm) {
      leftArm.rotation.x += swing * 0.5;
    }
    if (rightArm) {
      rightArm.rotation.x -= swing * 0.5;
    }
    if (leftForearm) {
      leftForearm.rotation.x += Math.max(0, -swing) * 0.28;
    }
    if (rightForearm) {
      rightForearm.rotation.x += Math.max(0, swing) * 0.28;
    }
    if (leftLeg) {
      leftLeg.rotation.x -= swing * 0.78;
    }
    if (rightLeg) {
      rightLeg.rotation.x += swing * 0.78;
    }
    if (leftShin) {
      leftShin.rotation.x += Math.max(0, swing) * 0.42;
    }
    if (rightShin) {
      rightShin.rotation.x += Math.max(0, -swing) * 0.42;
    }

    const attackVariant = this.getAttackVariant(combatState, config);
    const attack = this.getAttackEnvelope(combatState, timestamp, config);
    if (combatState.phase === "blocking") {
      if (leftArm) {
        leftArm.rotation.z -= 0.9;
        leftArm.rotation.x -= 0.25;
      }
      if (rightArm) {
        rightArm.rotation.z += 0.95;
        rightArm.rotation.x -= 0.32;
      }
      if (leftForearm) {
        leftForearm.rotation.x -= 0.42;
      }
      if (rightForearm) {
        rightForearm.rotation.x -= 0.42;
      }
    }

    if (attackVariant === 0 && attack > 0) {
      if (torso) {
        torso.rotation.y -= attack * 0.42;
      }
      if (rightArm) {
        rightArm.rotation.x -= attack * 2.2;
        rightArm.rotation.z += attack * 0.15;
      }
      if (rightForearm) {
        rightForearm.rotation.x -= attack * 0.55;
      }
      if (leftArm) {
        leftArm.rotation.x += attack * 0.45;
      }
    }

    if (attackVariant === 1 && attack > 0) {
      if (torso) {
        torso.rotation.x += attack * 0.18;
      }
      if (leftArm) {
        leftArm.rotation.x += attack * 0.68;
      }
      if (rightArm) {
        rightArm.rotation.x += attack * 0.22;
      }
      if (rightLeg) {
        rightLeg.rotation.x -= attack * 1.45;
      }
      if (rightShin) {
        rightShin.rotation.x += attack * 0.64;
      }
      if (leftLeg) {
        leftLeg.rotation.x += attack * 0.3;
      }
    }
  }

  private animateBearRig(
    rig: CharacterRig,
    config: CharacterConfig,
    combatState: FighterCombatState,
    timestamp: number,
    locomotion: number,
    t: number
  ): void {
    const gait = Math.sin(t * (4.2 + locomotion * 6.2)) * locomotion;
    const torso = rig.nodes.torso;
    const head = rig.nodes.head;
    const jaw = rig.nodes.jaw;
    const frontLeftLeg = rig.nodes.frontLeftLeg;
    const frontRightLeg = rig.nodes.frontRightLeg;
    const rearLeftLeg = rig.nodes.rearLeftLeg;
    const rearRightLeg = rig.nodes.rearRightLeg;

    if (torso) {
      torso.rotation.z += gait * 0.06;
    }
    if (frontLeftLeg) {
      frontLeftLeg.rotation.x += gait * 0.62;
    }
    if (frontRightLeg) {
      frontRightLeg.rotation.x -= gait * 0.62;
    }
    if (rearLeftLeg) {
      rearLeftLeg.rotation.x -= gait * 0.45;
    }
    if (rearRightLeg) {
      rearRightLeg.rotation.x += gait * 0.45;
    }
    if (head) {
      head.rotation.x += Math.sin(t * 2) * 0.03;
    }

    const attackVariant = this.getAttackVariant(combatState, config);
    const attack = this.getAttackEnvelope(combatState, timestamp, config);
    if (combatState.phase === "blocking") {
      if (head) {
        head.rotation.x -= 0.18;
      }
      if (frontLeftLeg) {
        frontLeftLeg.rotation.x -= 0.18;
      }
      if (frontRightLeg) {
        frontRightLeg.rotation.x -= 0.18;
      }
    }

    if (attackVariant === 0 && attack > 0) {
      if (torso) {
        torso.rotation.x -= attack * 0.16;
      }
      if (frontRightLeg) {
        frontRightLeg.rotation.x -= attack * 1.12;
      }
      if (head) {
        head.rotation.y -= attack * 0.18;
      }
    }

    if (attackVariant === 1 && attack > 0) {
      if (torso) {
        torso.rotation.x -= attack * 0.2;
      }
      if (head) {
        head.rotation.x -= attack * 0.72;
      }
      if (jaw) {
        jaw.rotation.x += attack * 0.58;
      }
      if (frontLeftLeg) {
        frontLeftLeg.rotation.x += attack * 0.22;
      }
      if (frontRightLeg) {
        frontRightLeg.rotation.x += attack * 0.22;
      }
    }
  }

  private getAttackVariant(combatState: FighterCombatState, config: CharacterConfig): number {
    if (!Number.isFinite(combatState.lastAttackAt)) {
      return 0;
    }
    return Math.floor(combatState.lastAttackAt / Math.max(1, config.attack.cooldownMs * 0.5)) % 2;
  }

  private getAttackEnvelope(
    combatState: FighterCombatState,
    timestamp: number,
    config: CharacterConfig
  ): number {
    if (
      combatState.phase !== "attackStartup" &&
      combatState.phase !== "attackActive" &&
      combatState.phase !== "attackRecovery"
    ) {
      return 0;
    }

    const elapsed = Math.max(0, timestamp - combatState.lastAttackAt);
    const attack =
      (combatState.attackId && config.attacks.find((entry) => entry.id === combatState.attackId)) || config.attack;
    const startup = attack.startupMs;
    const active = attack.activeMs;
    const recovery = attack.recoveryMs;

    if (combatState.phase === "attackStartup") {
      return THREE.MathUtils.clamp(elapsed / Math.max(1, startup), 0, 1) * 0.7;
    }
    if (combatState.phase === "attackActive") {
      return 0.7 + THREE.MathUtils.clamp((elapsed - startup) / Math.max(1, active), 0, 1) * 0.3;
    }
    return 1 - THREE.MathUtils.clamp((elapsed - startup - active) / Math.max(1, recovery), 0, 1) * 0.6;
  }

  private getTargetTilt(
    character: Character,
    config: CharacterConfig,
    phase: FighterPhase,
    locomotion: number
  ): number {
    if (phase === "dodging") {
      return config.animation.dodgeTilt;
    }
    if (phase === "stunned") {
      return -config.animation.hitTilt;
    }
    const direction = Math.sign(character.body.velocity.x || 1);
    return direction * config.animation.leanAmount * locomotion;
  }

  private getTargetPitch(phase: FighterPhase, config: CharacterConfig): number {
    if (phase === "attackStartup" || phase === "attackActive") {
      return -config.animation.attackLunge;
    }
    if (phase === "attackRecovery") {
      return config.animation.attackLunge * 0.2;
    }
    if (phase === "blocking") {
      return config.animation.attackLunge * 0.08;
    }
    if (phase === "stunned") {
      return config.animation.hitTilt;
    }
    if (phase === "defeated") {
      return Math.PI / 2.4;
    }
    return 0;
  }

  private getTargetScale(baseScale: THREE.Vector3, phase: FighterPhase): THREE.Vector3 {
    if (phase === "attackActive") {
      return new THREE.Vector3(baseScale.x * 1.05, baseScale.y * 0.94, baseScale.z * 1.05);
    }
    if (phase === "stunned") {
      return new THREE.Vector3(baseScale.x * 1.02, baseScale.y * 0.96, baseScale.z * 1.02);
    }
    if (phase === "dodging") {
      return new THREE.Vector3(baseScale.x * 1.08, baseScale.y * 0.92, baseScale.z * 1.08);
    }
    if (phase === "blocking") {
      return new THREE.Vector3(baseScale.x * 1.01, baseScale.y * 0.98, baseScale.z * 1.01);
    }
    return baseScale.clone();
  }
}
