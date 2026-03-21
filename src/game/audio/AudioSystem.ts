import type { SceneType } from "../../scene/SceneSelector";
import type { CharacterConfig } from "../roster/types";

type CueType = OscillatorType;

const SCENE_AMBIENCE: Record<SceneType, { frequency: number; type: CueType }> = {
  Forest: { frequency: 164, type: "sine" },
  City: { frequency: 96, type: "square" },
  Moon: { frequency: 128, type: "triangle" },
};

export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceOscillator: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;

  public async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.12;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  public setAmbience(sceneType: SceneType): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const preset = SCENE_AMBIENCE[sceneType];

    if (!this.ambienceOscillator) {
      this.ambienceOscillator = this.context.createOscillator();
      this.ambienceGain = this.context.createGain();
      this.ambienceGain.gain.value = 0.02;
      this.ambienceOscillator.connect(this.ambienceGain);
      this.ambienceGain.connect(this.masterGain);
      this.ambienceOscillator.start();
    }

    this.ambienceOscillator.type = preset.type;
    this.ambienceOscillator.frequency.setTargetAtTime(preset.frequency, this.context.currentTime, 0.08);
  }

  public playAttack(config: CharacterConfig): void {
    this.playTone(config.audio.attackPitch, 0.08, "sawtooth", 0.05);
  }

  public playHit(config: CharacterConfig): void {
    this.playTone(config.audio.hitPitch, 0.12, "triangle", 0.06);
  }

  public playBlock(config: CharacterConfig): void {
    this.playTone(config.audio.blockPitch, 0.09, "square", 0.045);
  }

  public playDodge(config: CharacterConfig): void {
    this.playTone(config.audio.dodgePitch, 0.07, "triangle", 0.04);
  }

  public playUiConfirm(): void {
    this.playTone(420, 0.06, "sine", 0.045);
  }

  public dispose(): void {
    this.ambienceOscillator?.stop();
    this.ambienceOscillator?.disconnect();
    this.ambienceGain?.disconnect();
    this.masterGain?.disconnect();
    this.context?.close();
    this.context = null;
    this.masterGain = null;
    this.ambienceOscillator = null;
    this.ambienceGain = null;
  }

  private playTone(frequency: number, durationSeconds: number, type: CueType, volume: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + durationSeconds);
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start();
    oscillator.stop(this.context.currentTime + durationSeconds);
  }
}
