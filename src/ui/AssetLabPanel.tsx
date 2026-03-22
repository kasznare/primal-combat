import { AVAILABLE_CHARACTERS } from "../game/CharacterSetup";
import { CHARACTER_CONFIGS } from "../game/roster/characterConfigs";
import type { AssetLabPose, StudioPreset } from "../asset-lab/types";

const POSES: Array<{ value: AssetLabPose; label: string }> = [
  { value: "idle", label: "Idle" },
  { value: "locomotion", label: "Locomotion" },
  { value: "block", label: "Block" },
  { value: "dodge", label: "Dodge" },
  { value: "stunned", label: "Stunned" },
  { value: "primary", label: "Primary Attack" },
  { value: "secondary", label: "Secondary Attack" },
];

const STUDIO_PRESETS: Array<{ value: StudioPreset; label: string }> = [
  { value: "studio", label: "Neutral Studio" },
  { value: "warm", label: "Warm Key" },
  { value: "moonlit", label: "Moonlit Contrast" },
];

type AssetLabPanelProps = {
  assetKey: string;
  pose: AssetLabPose;
  studioPreset: StudioPreset;
  turntable: boolean;
  wireframe: boolean;
  hitboxes: boolean;
  onAssetChange: (key: string) => void;
  onPoseChange: (pose: AssetLabPose) => void;
  onStudioPresetChange: (preset: StudioPreset) => void;
  onTurntableToggle: () => void;
  onWireframeToggle: () => void;
  onHitboxesToggle: () => void;
};

export function AssetLabPanel({
  assetKey,
  pose,
  studioPreset,
  turntable,
  wireframe,
  hitboxes,
  onAssetChange,
  onPoseChange,
  onStudioPresetChange,
  onTurntableToggle,
  onWireframeToggle,
  onHitboxesToggle,
}: AssetLabPanelProps) {
  const config = CHARACTER_CONFIGS[assetKey] ?? CHARACTER_CONFIGS.Human;

  return (
    <>
      <p className="eyebrow">Asset Lab</p>
      <h1>Primal Combat Assets</h1>
      <p className="subtitle">Preview one fighter in isolation, inspect scale, lighting, rig response, and authored attack space.</p>

      <label htmlFor="asset-select">Asset</label>
      <select id="asset-select" value={assetKey} onChange={(event) => onAssetChange(event.target.value)}>
        {AVAILABLE_CHARACTERS.map((character) => (
          <option key={`asset-${character.key}`} value={character.key}>
            {character.label}
          </option>
        ))}
      </select>

      <label htmlFor="pose-select">Preview Pose</label>
      <select id="pose-select" value={pose} onChange={(event) => onPoseChange(event.target.value as AssetLabPose)}>
        {POSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="studio-select">Lighting Rig</label>
      <select
        id="studio-select"
        value={studioPreset}
        onChange={(event) => onStudioPresetChange(event.target.value as StudioPreset)}
      >
        {STUDIO_PRESETS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button type="button" className="secondary-btn" onClick={onTurntableToggle}>
        Turntable: {turntable ? "On" : "Off"}
      </button>
      <button type="button" className="secondary-btn" onClick={onWireframeToggle}>
        Wireframe: {wireframe ? "On" : "Off"}
      </button>
      <button type="button" className="secondary-btn" onClick={onHitboxesToggle}>
        Hitboxes: {hitboxes ? "On" : "Off"}
      </button>

      <div className="asset-summary">
        <div className="asset-summary__header">
          <strong>{config.label}</strong>
          <span>{config.content.artStyle}</span>
        </div>
        <div className="asset-summary__meta">
          <span>{config.content.tags.join(" • ")}</span>
          <span>{config.animation.rigProfile ?? "generic"} rig</span>
        </div>
        <div className="asset-summary__stats">
          <span>Size {config.stats.dimensions.height.toFixed(2)}m h</span>
          <span>Mass {config.stats.weight.toFixed(0)}kg</span>
          <span>Move {config.movement.archetype}</span>
          <span>Top speed {config.stats.maxVelocity.toFixed(1)}m/s</span>
        </div>
      </div>

      <div className="asset-move-list">
        {config.attacks.map((attack) => (
          <article key={attack.id} className="asset-move-card">
            <div className="asset-move-card__header">
              <strong>{attack.label}</strong>
              <span>{attack.input}</span>
            </div>
            <div className="asset-move-card__grid">
              <span>{attack.damage} dmg</span>
              <span>{attack.range.toFixed(2)}m range</span>
              <span>{Math.round(attack.bleedChance * 100)}% bleed</span>
              <span>{attack.startupMs}/{attack.activeMs}/{attack.recoveryMs} ms</span>
            </div>
          </article>
        ))}
      </div>

      <div className="control-grid control-grid--lab">
        <span>Orbit: Right Mouse</span>
        <span>Zoom: Mouse Wheel</span>
        <span>Stage markers: 0.5m increments</span>
        <span>Attack ring: ideal spacing</span>
      </div>
    </>
  );
}
