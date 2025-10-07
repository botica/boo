/**
 * main entry point
 */

import { Game } from './Game.js';

// init the game
let game;

/**
 * Initialize the game when the page loads
 */
function initGame() {
  try {
    game = new Game();
    game.init();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

/**
 * Clean up when the page unloads
 */
function cleanupGame() {
  if (game) {
    game.destroy();
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanupGame);

// Export game instance for debugging (optional)
window.game = game;
