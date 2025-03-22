import { Game } from './game/Game.js';

window.addEventListener('load', () => {
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error("Game container element not found");
  }
  const game = new Game(container);
});
