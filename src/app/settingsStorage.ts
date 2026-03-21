import type { SceneType } from "../scene/SceneSelector";
import type { QualityLevel } from "../types/Quality";

export const STORAGE_KEY = "primal-combat-settings-v2";

export type StoredSettings = {
  scene: SceneType;
  quality: QualityLevel;
  autoQuality: boolean;
};

export function loadStoredSettings(): StoredSettings {
  const defaults: StoredSettings = {
    scene: "Forest",
    quality: "medium",
    autoQuality: true,
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      scene: parsed.scene ?? defaults.scene,
      quality: parsed.quality ?? defaults.quality,
      autoQuality: parsed.autoQuality ?? defaults.autoQuality,
    };
  } catch {
    return defaults;
  }
}

export function saveStoredSettings(settings: StoredSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
