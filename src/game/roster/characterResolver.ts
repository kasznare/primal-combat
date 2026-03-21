import { CHARACTER_CONFIGS } from "./characterConfigs";

export function resolveCharacterKey(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return CHARACTER_CONFIGS[value] ? value : fallback;
}
