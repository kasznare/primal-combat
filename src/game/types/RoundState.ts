export type RoundPhase = "menu" | "countdown" | "playing" | "paused" | "roundOver";

export type RoundOutcome = "player" | "opponent" | "draw" | null;

export type RoundState = {
  phase: RoundPhase;
  outcome: RoundOutcome;
  message: string | null;
  countdownEndAt: number | null;
  roundEndsAt: number | null;
  roundDurationMs: number;
};
