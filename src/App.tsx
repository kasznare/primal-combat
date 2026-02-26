import { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { AVAILABLE_CHARACTERS } from "./game/CharacterSetup";
import type { SceneType } from "./scene/SceneSelector";

const SCENES: SceneType[] = ["Forest", "City", "Moon"];

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);

  const [player, setPlayer] = useState("Human");
  const [opponent, setOpponent] = useState("Bear");
  const [scene, setScene] = useState<SceneType>("Forest");

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Game(containerRef.current);
    gameRef.current.setScene(scene);
  }, [scene]);

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

  return (
    <div className="app-root">
      <div ref={containerRef} className="game-canvas" />

      <div className="ui-panel">
        <h1>Primal Combat</h1>

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

        <button type="button" onClick={onStartBattle}>
          Start Battle
        </button>

        <p className="help">Move: WASD or Arrows, Jump: Space, Pause: Escape</p>
      </div>
    </div>
  );
}
