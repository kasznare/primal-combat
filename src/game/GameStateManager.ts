import type { RoundOutcome, RoundPhase, RoundState } from "./types/RoundState";

export class GameStateManager {
  private state: RoundState = {
    phase: "menu",
    outcome: null,
    message: null,
    countdownEndAt: null,
    roundEndsAt: null,
    roundDurationMs: 90_000,
  };

  private pauseStartedAt: number | null = null;
  private pausedFrom: RoundPhase | null = null;

  public getState(): RoundState {
    return { ...this.state };
  }

  public getPhase(): RoundPhase {
    return this.state.phase;
  }

  public isPaused(): boolean {
    return this.state.phase === "paused";
  }

  public isCountdown(): boolean {
    return this.state.phase === "countdown";
  }

  public isRoundOver(): boolean {
    return this.state.phase === "roundOver";
  }

  public setMenu(): RoundState {
    this.pauseStartedAt = null;
    this.pausedFrom = null;
    this.state = {
      phase: "menu",
      outcome: null,
      message: null,
      countdownEndAt: null,
      roundEndsAt: null,
      roundDurationMs: this.state.roundDurationMs,
    };
    return this.getState();
  }

  public startCountdown(now: number, countdownMs: number, roundDurationMs: number): RoundState {
    this.pauseStartedAt = null;
    this.pausedFrom = null;
    this.state = {
      phase: "countdown",
      outcome: null,
      message: "Get Ready",
      countdownEndAt: now + countdownMs,
      roundEndsAt: null,
      roundDurationMs,
    };
    return this.getState();
  }

  public update(now: number): boolean {
    if (this.state.phase === "countdown" && this.state.countdownEndAt !== null && now >= this.state.countdownEndAt) {
      this.state = {
        phase: "playing",
        outcome: null,
        message: null,
        countdownEndAt: null,
        roundEndsAt: now + this.state.roundDurationMs,
        roundDurationMs: this.state.roundDurationMs,
      };
      return true;
    }

    return false;
  }

  public setPaused(paused: boolean, now: number): RoundState {
    if (this.state.phase === "roundOver" || this.state.phase === "menu") {
      return this.getState();
    }

    if (paused && this.state.phase !== "paused") {
      this.pauseStartedAt = now;
      this.pausedFrom = this.state.phase;
      this.state = {
        ...this.state,
        phase: "paused",
        message: "Paused",
      };
      return this.getState();
    }

    if (!paused && this.state.phase === "paused") {
      const pauseDelta = this.pauseStartedAt === null ? 0 : now - this.pauseStartedAt;
      this.pauseStartedAt = null;
      const resumePhase = this.pausedFrom ?? "playing";
      this.pausedFrom = null;
      this.state = {
        ...this.state,
        phase: resumePhase,
        message: resumePhase === "countdown" ? "Get Ready" : null,
        countdownEndAt:
          this.state.countdownEndAt === null ? null : this.state.countdownEndAt + pauseDelta,
        roundEndsAt: this.state.roundEndsAt === null ? null : this.state.roundEndsAt + pauseDelta,
      };
    }

    return this.getState();
  }

  public getRemainingMs(now: number): number {
    if (this.state.phase === "playing" && this.state.roundEndsAt !== null) {
      return Math.max(0, this.state.roundEndsAt - now);
    }
    if (this.state.phase === "countdown" && this.state.countdownEndAt !== null) {
      return Math.max(0, this.state.countdownEndAt - now);
    }
    return 0;
  }

  public finishRound(outcome: RoundOutcome, message: string): RoundState {
    this.pauseStartedAt = null;
    this.pausedFrom = null;
    this.state = {
      phase: "roundOver",
      outcome,
      message,
      countdownEndAt: null,
      roundEndsAt: null,
      roundDurationMs: this.state.roundDurationMs,
    };
    return this.getState();
  }
}
