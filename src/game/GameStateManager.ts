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
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }
}
