export class GameStateManager {
    private gameOver: boolean = false;
  
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
  }
  