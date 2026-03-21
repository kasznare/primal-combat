import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoredSettings, saveStoredSettings, STORAGE_KEY } from "./settingsStorage";

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("settingsStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("returns defaults when storage is empty", () => {
    expect(loadStoredSettings()).toEqual({
      scene: "Forest",
      quality: "medium",
      autoQuality: true,
    });
  });

  it("persists and reloads settings", () => {
    saveStoredSettings({ scene: "Moon", quality: "high", autoQuality: false });
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toContain("Moon");
    expect(loadStoredSettings()).toEqual({
      scene: "Moon",
      quality: "high",
      autoQuality: false,
    });
  });
});
