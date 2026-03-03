// src/game/GameStateManager.ts
export class GameStateManager {
  private gameOver: boolean = false;
  private paused: boolean = false;

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public setGameOver(): void {
    this.gameOver = true;
  }

  public restartGame(): void {
    this.reset();
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public reset(): void {
    this.gameOver = false;
    this.paused = false;
  }
}
