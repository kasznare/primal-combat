import type { HudState } from "../game/types/HudState";
import type { RoundState } from "../game/types/RoundState";

function formatTimer(timerMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(timerMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type HUDProps = {
  hudState: HudState | null;
  roundState: RoundState;
  onRematch: () => void;
};

export function HUD({ hudState, roundState, onRematch }: HUDProps) {
  const player = hudState?.player;
  const opponent = hudState?.opponent;
  const showCombatHud = player && opponent;

  return (
    <>
      {showCombatHud ? (
        <div className="match-hud">
          <section className="combatant-panel combatant-panel--player">
            <div className="combatant-panel__header">
              <span>{player.label}</span>
              <span>{Math.ceil(player.health)}</span>
            </div>
            <div className="health-bar">
              <div
                className="health-bar__fill health-bar__fill--player"
                style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
              />
            </div>
            <div className="combatant-meta">
              <span>{player.phase}</span>
              <span>{player.blocking ? "Guarding" : player.dodgeReady ? "Dodge Ready" : "Recovering"}</span>
            </div>
            <div className="cooldown-bar">
              <div
                className="cooldown-bar__fill"
                style={{ width: `${player.cooldownProgress * 100}%` }}
              />
            </div>
          </section>

          <div className="match-core">
            <div className="match-timer">{formatTimer(hudState.timerMs)}</div>
            <div className="match-status">{hudState.phase.toUpperCase()}</div>
            <div className="arena-chip">
              <strong>{hudState.arena.title}</strong>
              <span>{hudState.arena.effect}</span>
              {hudState.arena.hazardActive ? <em>Hazard Active</em> : null}
            </div>
          </div>

          <section className="combatant-panel combatant-panel--opponent">
            <div className="combatant-panel__header">
              <span>{opponent.label}</span>
              <span>{Math.ceil(opponent.health)}</span>
            </div>
            <div className="health-bar health-bar--opponent">
              <div
                className="health-bar__fill health-bar__fill--opponent"
                style={{ width: `${Math.max(0, (opponent.health / opponent.maxHealth) * 100)}%` }}
              />
            </div>
            <div className="combatant-meta">
              <span>{opponent.phase}</span>
              <span>{opponent.blocking ? "Guarding" : opponent.dodgeReady ? "Dodge Ready" : "Recovering"}</span>
            </div>
            <div className="cooldown-bar">
              <div
                className="cooldown-bar__fill"
                style={{ width: `${opponent.cooldownProgress * 100}%` }}
              />
            </div>
          </section>
        </div>
      ) : null}

      {roundState.phase !== "menu" && roundState.phase !== "playing" ? (
        <div className="round-overlay">
          <div className="round-card">
            <p className="round-phase">{roundState.phase}</p>
            <h2>{roundState.message ?? "Battle Live"}</h2>
            {roundState.phase === "roundOver" ? (
              <button type="button" onClick={onRematch}>
                Fight Again
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
