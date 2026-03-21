import { useEffect, useRef, useState } from "react";
import { loadStoredSettings, saveStoredSettings, type StoredSettings } from "./app/settingsStorage";
import { Game } from "./game/Game";
import { AVAILABLE_CHARACTERS } from "./game/CharacterSetup";
import type { HudState } from "./game/types/HudState";
import type { RoundState } from "./game/types/RoundState";
import type { SceneType } from "./scene/SceneSelector";
import type { QualityLevel } from "./types/Quality";
import { HUD } from "./ui/HUD";

const SCENES: SceneType[] = ["Forest", "City", "Moon"];
const QUALITY_LEVELS: QualityLevel[] = ["low", "medium", "high"];

const EMPTY_ROUND_STATE: RoundState = {
  phase: "menu",
  outcome: null,
  message: null,
  countdownEndAt: null,
  roundEndsAt: null,
  roundDurationMs: 90_000,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [initialSettings] = useState<StoredSettings>(() => loadStoredSettings());

  const [player, setPlayer] = useState("Human");
  const [opponent, setOpponent] = useState("Bear");
  const [scene, setScene] = useState<SceneType>(initialSettings.scene);
  const [quality, setQuality] = useState<QualityLevel>(initialSettings.quality);
  const [autoQuality, setAutoQuality] = useState(initialSettings.autoQuality);
  const [showPerf, setShowPerf] = useState(false);
  const [qualityToast, setQualityToast] = useState<string | null>(null);
  const [roundState, setRoundState] = useState<RoundState>(EMPTY_ROUND_STATE);
  const [hudState, setHudState] = useState<HudState | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Game(containerRef.current, {
      onQualityChanged: (nextQuality, source) => {
        setQuality(nextQuality);
        if (source === "adaptive") {
          setQualityToast(`Adaptive quality set to ${nextQuality.toUpperCase()}`);
          window.setTimeout(() => setQualityToast(null), 1800);
        }
      },
      onRoundStateChanged: (nextRoundState) => {
        setRoundState(nextRoundState);
      },
      onHudStateChanged: (nextHudState) => {
        setHudState(nextHudState);
      },
    });

    gameRef.current.setQuality(quality);
    gameRef.current.setScene(scene);
    gameRef.current.setAutoQuality(autoQuality);
    gameRef.current.setDebug(showPerf);
  }, []);

  useEffect(() => {
    saveStoredSettings({ scene, quality, autoQuality });
  }, [scene, quality, autoQuality]);

  useEffect(() => {
    gameRef.current?.setScene(scene);
  }, [scene]);

  useEffect(() => {
    gameRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    gameRef.current?.setAutoQuality(autoQuality);
  }, [autoQuality]);

  useEffect(() => {
    gameRef.current?.setDebug(showPerf);
  }, [showPerf]);

  const focusGameSurface = () => {
    const transferFocus = () => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      gameRef.current?.focusSurface();
      containerRef.current?.focus();
    };

    transferFocus();
    window.requestAnimationFrame(transferFocus);
  };

  const onStartBattle = () => {
    if (!gameRef.current) {
      return;
    }
    void gameRef.current.unlockAudio();
    gameRef.current.startBattle(player, opponent);
    focusGameSurface();
  };

  const onSceneChange = (nextScene: SceneType) => {
    setScene(nextScene);
    void gameRef.current?.unlockAudio();
    focusGameSurface();
  };

  const onQualityChange = (nextQuality: QualityLevel) => {
    setQuality(nextQuality);
    focusGameSurface();
  };

  const onPerfToggle = () => {
    setShowPerf((current) => !current);
    focusGameSurface();
  };

  const onAutoQualityToggle = () => {
    setAutoQuality((current) => !current);
    focusGameSurface();
  };

  const onPauseToggle = () => {
    gameRef.current?.togglePause();
    focusGameSurface();
  };

  return (
    <div className="app-root">
      <div className="atmosphere-layer atmosphere-layer--one" />
      <div className="atmosphere-layer atmosphere-layer--two" />
      <div
        ref={containerRef}
        className="game-canvas"
        tabIndex={-1}
        onMouseDown={focusGameSurface}
      />

      <HUD hudState={hudState} roundState={roundState} onRematch={onStartBattle} />

      <div className="ui-panel">
        <p className="eyebrow">Arena Control</p>
        <h1>Primal Combat</h1>
        <p className="subtitle">Asymmetric fighters, authored combat states, arena modifiers, live tuning.</p>

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
        <select id="scene-select" value={scene} onChange={(event) => onSceneChange(event.target.value as SceneType)}>
          {SCENES.map((sceneType) => (
            <option key={sceneType} value={sceneType}>
              {sceneType}
            </option>
          ))}
        </select>

        <label htmlFor="quality-select">Quality</label>
        <select id="quality-select" value={quality} onChange={(event) => onQualityChange(event.target.value as QualityLevel)}>
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
          {roundState.phase === "roundOver" ? "Rematch" : "Start Battle"}
        </button>
        {roundState.phase !== "menu" ? (
          <button type="button" className="secondary-btn" onClick={onPauseToggle}>
            {roundState.phase === "paused" ? "Resume Match" : "Pause Match"}
          </button>
        ) : null}
        <button type="button" className="secondary-btn" onClick={onPerfToggle}>
          {showPerf ? "Hide Performance" : "Show Performance"}
        </button>

        <div className="control-grid">
          <span>Move: WASD / Arrows</span>
          <span>Attack: F</span>
          <span>Block: Q</span>
          <span>Dodge: E</span>
          <span>Jump / Ascend: Space</span>
          <span>Descend: Left Shift</span>
          <span>Pause: Escape</span>
        </div>
      </div>

      {qualityToast ? <div className="quality-toast">{qualityToast}</div> : null}
    </div>
  );
}
