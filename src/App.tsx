import { useEffect, useRef, useState } from "react";
import { loadStoredSettings, saveStoredSettings, type StoredSettings } from "./app/settingsStorage";
import { AssetLab } from "./asset-lab/AssetLab";
import type { AssetLabPose, StudioPreset } from "./asset-lab/types";
import { Game } from "./game/Game";
import { AVAILABLE_CHARACTERS } from "./game/CharacterSetup";
import type { HudState } from "./game/types/HudState";
import type { RoundState } from "./game/types/RoundState";
import type { SceneType } from "./scene/SceneSelector";
import type { QualityLevel } from "./types/Quality";
import { AssetLabPanel } from "./ui/AssetLabPanel";
import { HUD } from "./ui/HUD";

type SurfaceMode = "battle" | "asset-lab";

const SCENES: SceneType[] = ["Forest", "City", "Moon"];
const QUALITY_LEVELS: QualityLevel[] = ["low", "medium", "high"];

const EMPTY_ROUND_STATE: RoundState = {
  phase: "menu",
  outcome: null,
  message: null,
  countdownEndAt: null,
  roundEndsAt: null,
  roundDurationMs: 75_000,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const assetLabRef = useRef<AssetLab | null>(null);
  const [initialSettings] = useState<StoredSettings>(() => loadStoredSettings());

  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("battle");
  const [player, setPlayer] = useState("Human");
  const [opponent, setOpponent] = useState("Bear");
  const [scene, setScene] = useState<SceneType>(initialSettings.scene);
  const [quality, setQuality] = useState<QualityLevel>(initialSettings.quality);
  const [autoQuality, setAutoQuality] = useState(initialSettings.autoQuality);
  const [showPerf, setShowPerf] = useState(false);
  const [qualityToast, setQualityToast] = useState<string | null>(null);
  const [roundState, setRoundState] = useState<RoundState>(EMPTY_ROUND_STATE);
  const [hudState, setHudState] = useState<HudState | null>(null);
  const [assetKey, setAssetKey] = useState("Human");
  const [assetPose, setAssetPose] = useState<AssetLabPose>("idle");
  const [studioPreset, setStudioPreset] = useState<StudioPreset>("studio");
  const [turntable, setTurntable] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [hitboxes, setHitboxes] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.replaceChildren();
    gameRef.current?.destroy();
    gameRef.current = null;
    assetLabRef.current?.destroy();
    assetLabRef.current = null;

    if (surfaceMode === "battle") {
      const game = new Game(container, {
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
      gameRef.current = game;
      game.setQuality(quality);
      game.setScene(scene);
      game.setAutoQuality(autoQuality);
      game.setDebug(showPerf);
      return () => {
        game.destroy();
        if (gameRef.current === game) {
          gameRef.current = null;
        }
      };
    }

    setRoundState(EMPTY_ROUND_STATE);
    setHudState(null);
    const assetLab = new AssetLab(container);
    assetLabRef.current = assetLab;
    assetLab.setQuality(quality);
    assetLab.setDebug(showPerf);
    assetLab.setStudioPreset(studioPreset);
    assetLab.setAsset(assetKey);
    assetLab.setPose(assetPose);
    assetLab.setTurntable(turntable);
    assetLab.setWireframe(wireframe);
    assetLab.setHitboxes(hitboxes);

    return () => {
      assetLab.destroy();
      if (assetLabRef.current === assetLab) {
        assetLabRef.current = null;
      }
    };
  }, [surfaceMode]);

  useEffect(() => {
    saveStoredSettings({ scene, quality, autoQuality });
  }, [scene, quality, autoQuality]);

  useEffect(() => {
    if (surfaceMode === "battle") {
      gameRef.current?.setScene(scene);
    }
  }, [scene, surfaceMode]);

  useEffect(() => {
    gameRef.current?.setQuality(quality);
    assetLabRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    if (surfaceMode === "battle") {
      gameRef.current?.setAutoQuality(autoQuality);
    }
  }, [autoQuality, surfaceMode]);

  useEffect(() => {
    gameRef.current?.setDebug(showPerf);
    assetLabRef.current?.setDebug(showPerf);
  }, [showPerf]);

  useEffect(() => {
    assetLabRef.current?.setAsset(assetKey);
  }, [assetKey]);

  useEffect(() => {
    assetLabRef.current?.setPose(assetPose);
  }, [assetPose]);

  useEffect(() => {
    assetLabRef.current?.setStudioPreset(studioPreset);
  }, [studioPreset]);

  useEffect(() => {
    assetLabRef.current?.setTurntable(turntable);
  }, [turntable]);

  useEffect(() => {
    assetLabRef.current?.setWireframe(wireframe);
  }, [wireframe]);

  useEffect(() => {
    assetLabRef.current?.setHitboxes(hitboxes);
  }, [hitboxes]);

  const focusSurface = () => {
    const transferFocus = () => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      if (surfaceMode === "battle") {
        gameRef.current?.focusSurface();
      } else {
        assetLabRef.current?.focusSurface();
      }
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
    focusSurface();
  };

  const onSceneChange = (nextScene: SceneType) => {
    setScene(nextScene);
    void gameRef.current?.unlockAudio();
    focusSurface();
  };

  const onQualityChange = (nextQuality: QualityLevel) => {
    setQuality(nextQuality);
    focusSurface();
  };

  const onPerfToggle = () => {
    setShowPerf((current) => !current);
    focusSurface();
  };

  const onAutoQualityToggle = () => {
    setAutoQuality((current) => !current);
    focusSurface();
  };

  const onPauseToggle = () => {
    gameRef.current?.togglePause();
    focusSurface();
  };

  const onSurfaceModeChange = (nextMode: SurfaceMode) => {
    setSurfaceMode(nextMode);
    window.setTimeout(focusSurface, 0);
  };

  return (
    <div className="app-root">
      <div className="atmosphere-layer atmosphere-layer--one" />
      <div className="atmosphere-layer atmosphere-layer--two" />
      <div
        ref={containerRef}
        className="game-canvas"
        tabIndex={-1}
        onMouseDown={focusSurface}
      />

      {surfaceMode === "battle" ? <HUD hudState={hudState} roundState={roundState} onRematch={onStartBattle} /> : null}

      <div className="ui-panel">
        <div className="mode-switch" role="tablist" aria-label="Viewport mode">
          <button
            type="button"
            className={surfaceMode === "battle" ? "mode-switch__tab mode-switch__tab--active" : "mode-switch__tab"}
            onClick={() => onSurfaceModeChange("battle")}
          >
            Battle
          </button>
          <button
            type="button"
            className={surfaceMode === "asset-lab" ? "mode-switch__tab mode-switch__tab--active" : "mode-switch__tab"}
            onClick={() => onSurfaceModeChange("asset-lab")}
          >
            Asset Lab
          </button>
        </div>

        {surfaceMode === "battle" ? (
          <>
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
          </>
        ) : (
          <AssetLabPanel
            assetKey={assetKey}
            pose={assetPose}
            studioPreset={studioPreset}
            turntable={turntable}
            wireframe={wireframe}
            hitboxes={hitboxes}
            onAssetChange={(key) => {
              setAssetKey(key);
              focusSurface();
            }}
            onPoseChange={(nextPose) => {
              setAssetPose(nextPose);
              focusSurface();
            }}
            onStudioPresetChange={(nextPreset) => {
              setStudioPreset(nextPreset);
              focusSurface();
            }}
            onTurntableToggle={() => {
              setTurntable((current) => !current);
              focusSurface();
            }}
            onWireframeToggle={() => {
              setWireframe((current) => !current);
              focusSurface();
            }}
            onHitboxesToggle={() => {
              setHitboxes((current) => !current);
              focusSurface();
            }}
          />
        )}

        <label htmlFor="quality-select">Quality</label>
        <select id="quality-select" value={quality} onChange={(event) => onQualityChange(event.target.value as QualityLevel)}>
          {QUALITY_LEVELS.map((qualityLevel) => (
            <option key={qualityLevel} value={qualityLevel}>
              {qualityLevel[0].toUpperCase() + qualityLevel.slice(1)}
            </option>
          ))}
        </select>
        {surfaceMode === "battle" ? (
          <button type="button" className="secondary-btn" onClick={onAutoQualityToggle}>
            Auto Quality: {autoQuality ? "On" : "Off"}
          </button>
        ) : null}

        {surfaceMode === "battle" ? (
          <>
            <button type="button" onClick={onStartBattle}>
              {roundState.phase === "roundOver" ? "Rematch" : "Start Battle"}
            </button>
            {roundState.phase !== "menu" ? (
              <button type="button" className="secondary-btn" onClick={onPauseToggle}>
                {roundState.phase === "paused" ? "Resume Match" : "Pause Match"}
              </button>
            ) : null}
          </>
        ) : null}
        <button type="button" className="secondary-btn" onClick={onPerfToggle}>
          {showPerf ? "Hide Performance" : "Show Performance"}
        </button>

        <div className="control-grid">
          {surfaceMode === "battle" ? (
            <>
              <span>Move: WASD / Arrows</span>
              <span>Attack: F</span>
              <span>Special: R</span>
              <span>Block: Q</span>
              <span>Dodge: E</span>
              <span>Jump / Ascend: Space</span>
              <span>Descend: Left Shift</span>
              <span>Pause: Escape</span>
            </>
          ) : (
            <>
              <span>Use Asset Lab before gameplay tuning</span>
              <span>Validate silhouette under 3 lighting rigs</span>
              <span>Check hit space against the visual model</span>
              <span>Wireframe exposes overly flat shapes fast</span>
            </>
          )}
        </div>
      </div>

      {qualityToast ? <div className="quality-toast">{qualityToast}</div> : null}
    </div>
  );
}
