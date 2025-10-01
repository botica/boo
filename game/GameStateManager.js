/**
 * Manages level progression, scoring, and game flow
 */
import { GameConfig } from '../config/GameConfig.js';

export class GameStateManager {
  constructor() {
    this.currentLevel = 1;
    this.combosCompleted = 0;
  }

  /**
   * Get current level configuration
   * @returns {Object} Current level config
   */
  getCurrentLevelConfig() {
    return GameConfig.levelConfig[this.currentLevel];
  }

  /**
   * Process combo success and determine what happens next
   * @returns {string} Result of combo completion ('continue', 'level_complete', 'game_complete')
   */
  processComboSuccess() {
    this.combosCompleted++;
    
    if (this.combosCompleted >= GameConfig.COMBOS_PER_LEVEL) {
      if (this.currentLevel < GameConfig.MAX_LEVELS) {
        console.log(`boo! you scared them! advancing to level ${this.currentLevel + 1}!`);
        this.currentLevel++;
        this.updateLevelTitle();
        return 'level_complete';
      } else {
        console.log('boo! you scared them! you beat the game!');
        this.currentLevel = 1;
        this.updateLevelTitle();
        return 'game_complete';
      }
    } else {
      return 'continue';
    }
  }

  /**
   * Reset combos completed counter
   */
  resetCombos() {
    this.combosCompleted = 0;
  }

  /**
   * Update browser title with current level
   */
  updateLevelTitle() {
    document.title = `game - Level ${this.currentLevel}`;
  }

  /**
   * Get combo display symbols
   * @param {string[]} combo - Combo keys
   * @returns {string[]} Display symbols for combo
   */
  getComboDisplaySymbols(combo) {
    return combo.map(key => GameConfig.arrowSymbols[key] || key);
  }

  /**
   * Reset to initial state
   */
  reset() {
    // Keep current level, just reset combos
    this.combosCompleted = 0;
  }
}
