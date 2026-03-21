import entityData from "../../entities/source.json";
import { CONTENT_MANIFEST } from "../../content/contentManifest";
import { ENTITY_PRESENTATIONS } from "../../content/entityPresentations";
import { FIGHTER_TUNING } from "./fighterTuning";
import type { CharacterConfig } from "./types";

type SourceEntityRow = {
  name: string;
  weight_kg: number;
  width_m: number;
  height_m: number;
  depth_m: number;
  max_velocity_m_per_s: number;
  max_acceleration_m_per_s2: number;
};

const SOURCE_INDEX = new Map(
  (entityData as SourceEntityRow[]).map((row) => [row.name, row] as const)
);

function buildCharacterConfig(key: string): CharacterConfig {
  const tuning = FIGHTER_TUNING[key];
  if (!tuning) {
    throw new Error(`Missing fighter tuning for ${key}`);
  }

  const manifest = CONTENT_MANIFEST[key];
  if (!manifest) {
    throw new Error(`Missing content manifest for ${key}`);
  }

  const source = SOURCE_INDEX.get(manifest.dataName);
  if (!source) {
    throw new Error(`Missing entity source row for ${manifest.dataName}`);
  }

  const presentation = ENTITY_PRESENTATIONS[manifest.presentationId];
  if (!presentation) {
    throw new Error(`Missing entity presentation for ${manifest.presentationId}`);
  }

  return {
    key,
    label: manifest.label,
    classRef: presentation.classRef,
    dataName: manifest.dataName,
    stats: {
      name: manifest.label,
      color: tuning.color,
      weight: source.weight_kg,
      dimensions: {
        width: source.width_m,
        height: source.height_m,
        depth: source.depth_m,
      },
      maxVelocity: source.max_velocity_m_per_s,
      maxAcceleration: source.max_acceleration_m_per_s2,
      movementType: tuning.movementType,
      health: tuning.health,
    },
    movement: tuning.movement,
    attack: tuning.attack,
    attacks: tuning.attacks,
    defense: tuning.defense,
    ai: tuning.ai,
    animation: tuning.animation,
    audio: tuning.audio,
    content: {
      presentationId: manifest.presentationId,
      audioTheme: manifest.audioTheme,
      artStyle: manifest.artStyle,
      tags: manifest.tags,
      assetKey: manifest.assetKey,
    },
  };
}

const ORDERED_KEYS = Object.keys(FIGHTER_TUNING);

export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = Object.fromEntries(
  ORDERED_KEYS.map((key) => [key, buildCharacterConfig(key)])
) as Record<string, CharacterConfig>;

export const AVAILABLE_CHARACTERS = ORDERED_KEYS.map((key) => ({
  key,
  label: CONTENT_MANIFEST[key].label,
}));
