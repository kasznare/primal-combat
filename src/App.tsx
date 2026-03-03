import { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { AVAILABLE_CHARACTERS } from "./game/CharacterSetup";
import type { SceneType } from "./scene/SceneSelector";
import type { QualityLevel } from "./types/Quality";

const SCENES: SceneType[] = ["Forest", "City", "Moon"];
const QUALITY_LEVELS: QualityLevel[] = ["low", "medium", "high"];
const STORAGE_KEY = "primal-combat-settings-v1";

type StoredSettings = {
  scene: SceneType;
  quality: QualityLevel;
  autoQuality: boolean;
};

function loadStoredSettings(): StoredSettings {
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

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const initialSettings = loadStoredSettings();

  const [player, setPlayer] = useState("Human");
  const [opponent, setOpponent] = useState("Bear");
  const [scene, setScene] = useState<SceneType>(initialSettings.scene);
  const [quality, setQuality] = useState<QualityLevel>(initialSettings.quality);
  const [autoQuality, setAutoQuality] = useState(initialSettings.autoQuality);
  const [showPerf, setShowPerf] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Game(containerRef.current, {
      onQualityChanged: (nextQuality) => setQuality(nextQuality),
    });
    gameRef.current.setQuality(quality);
    gameRef.current.setAutoQuality(autoQuality);
    gameRef.current.setScene(scene);
    gameRef.current.setDebug(showPerf);
  }, [autoQuality, quality, scene, showPerf]);

  useEffect(() => {
    const payload: StoredSettings = {
      scene,
      quality,
      autoQuality,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [autoQuality, quality, scene]);

  const onStartBattle = () => {
    if (!gameRef.current) {
      return;
    }
    gameRef.current.startBattle(player, opponent);
  };

  const onSceneChange = (nextScene: SceneType) => {
    setScene(nextScene);
    if (!gameRef.current) {
      return;
    }
    gameRef.current.setScene(nextScene);
  };

  const onQualityChange = (nextQuality: QualityLevel) => {
    setQuality(nextQuality);
    if (!gameRef.current) {
      return;
    }
    gameRef.current.setQuality(nextQuality);
  };

  const onPerfToggle = () => {
    const nextValue = !showPerf;
    setShowPerf(nextValue);
    if (!gameRef.current) {
      return;
    }
    gameRef.current.setDebug(nextValue);
  };

  const onAutoQualityToggle = () => {
    const nextValue = !autoQuality;
    setAutoQuality(nextValue);
    if (!gameRef.current) {
      return;
    }
    gameRef.current.setAutoQuality(nextValue);
  };

  return (
    <div className="app-root">
      <div className="atmosphere-layer atmosphere-layer--one" />
      <div className="atmosphere-layer atmosphere-layer--two" />
      <div ref={containerRef} className="game-canvas" />

      <div className="ui-panel">
        <p className="eyebrow">Arena Control</p>
        <h1>Primal Combat</h1>
        <p className="subtitle">Asymmetric fighters, procedural arenas, single-round chaos.</p>

        <label htmlFor="player-select">Player</label>
        <select id="player-select" value={player} onChange={(event) => setPlayer(event.target.value)}>
          {AVAILABLE_CHARACTERS.map((character) => (
            <option key={`player-${character.key}`} value={character.key}>
              {character.label}
            </option>
          ))}
        </select>

        <label htmlFor="opponent-select">Opponent</label>
        <select id="opponent-select" value={opponent} onChange={(event) => setOpponent(event.target.value)}>
          {AVAILABLE_CHARACTERS.map((character) => (
            <option key={`opponent-${character.key}`} value={character.key}>
              {character.label}
            </option>
          ))}
        </select>

        <label htmlFor="scene-select">Arena</label>
        <select
          id="scene-select"
          value={scene}
          onChange={(event) => onSceneChange(event.target.value as SceneType)}
        >
          {SCENES.map((sceneType) => (
            <option key={sceneType} value={sceneType}>
              {sceneType}
            </option>
          ))}
        </select>

        <label htmlFor="quality-select">Quality</label>
        <select
          id="quality-select"
          value={quality}
          onChange={(event) => onQualityChange(event.target.value as QualityLevel)}
        >
          {QUALITY_LEVELS.map((qualityLevel) => (
            <option key={qualityLevel} value={qualityLevel}>
              {qualityLevel[0].toUpperCase() + qualityLevel.slice(1)}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-btn" onClick={onAutoQualityToggle}>
          Auto Quality: {autoQuality ? "On" : "Off"}
        </button>

        <button type="button" onClick={onStartBattle}>
          Start Battle
        </button>
        <button type="button" className="secondary-btn" onClick={onPerfToggle}>
          {showPerf ? "Hide Performance" : "Show Performance"}
        </button>

        <div className="control-grid">
          <span>Move: WASD / Arrows</span>
          <span>Jump: Space</span>
          <span>Pause: Escape</span>
        </div>
      </div>
    </div>
  );
}
