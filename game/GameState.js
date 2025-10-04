/**
 * GameState manages all game state including levels, combos, and interaction timing
 * Combines previous GameState and GameStateManager for simplicity
 */
import { GameConfig } from '../config/GameConfig.js';
import { Constants } from '../config/Constants.js';

export class GameState {
  constructor() {
    // Level state
    this.currentLevel = 1;
    this.combosCompleted = 0;
    
    // Interaction state
    this.interactionActive = false;
    this.animationInProgress = false;
    
    // Combo state
    this.currentCombo = null;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
    this.comboTimeLeft = 0;
    this.comboAccepted = false;
    this.usedCombos = [];
    
    // Visual effects
    this.showBooText = false;
    this.booTextTimer = 0;
    
    // Arrow keys for combo generation
    this.arrowKeys = GameConfig.arrowKeys;
  }

  /**
   * Get current level configuration
   * @returns {Object} Current level config
   */
  getCurrentLevelConfig() {
    return GameConfig.levelConfig[this.currentLevel];
  }

  /**
   * Start interaction mode
   */
  startInteraction() {
    if (this.interactionActive) return;
    
    this.interactionActive = true;
    this.comboAccepted = false;
    this.usedCombos = [];
    
    this.startNextCombo();
  }

  /**
   * End interaction mode
   * @param {string} reason - Reason for ending interaction
   */
  endInteraction(reason) {
    this.interactionActive = false;
    this.currentCombo = null;
    this.comboTimeLeft = 0;
    console.log('Interaction ended:', reason || 'finished');
  }

  /**
   * Generate and start the next combo challenge
   */
  startNextCombo() {
    const config = this.getCurrentLevelConfig();
    this.comboDuration = config ? config.comboDuration : 5.0;
    
    // Generate all possible arrow key pairs (excluding same-key pairs)
    const all = [];
    for (const a of this.arrowKeys) {
      for (const b of this.arrowKeys) {
        if (a === b) continue;
        all.push(`${a}|${b}`);
      }
    }
    
    // Select a combo that hasn't been used recently
    let remaining = all.filter(k => !this.usedCombos.includes(k));
    if (remaining.length === 0) {
      this.usedCombos = [];
      remaining = all.slice();
    }
    
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    this.usedCombos.push(chosen);
    const parts = chosen.split('|');
    this.currentCombo = [parts[0], parts[1]];
    this.comboTimeLeft = this.comboDuration;
    this.comboAccepted = false;
  }

  /**
   * Process combo success and handle level progression
   * @returns {string} Result of combo completion ('continue', 'level_complete', 'game_complete')
   */
  processComboSuccess() {
    this.comboAccepted = true;
    this.combosCompleted++;
    
    if (this.combosCompleted >= GameConfig.COMBOS_PER_LEVEL) {
      // Level complete - check if advancing or game complete
      this.showBooText = true;
      this.booTextTimer = 0;
      this.animationInProgress = true;
      
      if (this.currentLevel < GameConfig.MAX_LEVELS) {
        console.log(`boo! you scared them! advancing to level ${this.currentLevel + 1}!`);
        this.currentLevel++;
        this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
        this.updateLevelTitle();
        return 'level_complete';
      } else {
        console.log('boo! you scared them! you beat the game!');
        // Don't reset level here - let the game handle the reset after animation
        // this.currentLevel = 1;
        // this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
        // this.updateLevelTitle();
        return 'game_complete';
      }
    } else {
      // Continue to next combo
      this.startNextCombo();
      return 'continue';
    }
  }

  /**
   * Process combo timeout/failure
   */
  processComboTimeout() {
    this.comboAccepted = true;
    this.animationInProgress = true;
    console.log('Try again?');
  }

  /**
   * Update game state
   * @param {number} dt - Delta time in seconds
   * @returns {Object} State changes that occurred
   */
  update(dt) {
    const changes = {};
    
    // Update "BOO!" text timer
    if (this.showBooText) {
      this.booTextTimer += dt;
      
      // Hide BOO text after duration (in seconds)
      if (this.booTextTimer >= Constants.ANIMATION.BOO_TEXT_DURATION / 1000) {
        this.showBooText = false;
      }
    }
    
    // Handle combo interaction
    if (this.interactionActive && this.currentCombo) {
      this.comboTimeLeft -= dt;
      const pct = Math.max(0, Math.min(1, this.comboTimeLeft / this.comboDuration));
      changes.progressPercentage = pct;

      if (this.comboTimeLeft <= 0 && !this.comboAccepted) {
        this.processComboTimeout();
        changes.timeout = true;
      }
    }
    
    return changes;
  }

  /**
   * Reset game state to initial values (keeps current level)
   */
  reset() {
    this.interactionActive = false;
    this.animationInProgress = false;
    this.currentCombo = null;
    this.comboTimeLeft = 0;
    this.comboAccepted = false;
    this.usedCombos = [];
    this.showBooText = false;
    this.booTextTimer = 0;
    this.combosCompleted = 0;
  }

  /**
   * Reset level to 1 (used after game completion)
   */
  resetToLevel1() {
    this.currentLevel = 1;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
    this.updateLevelTitle();
  }

  /**
   * Start success animation sequence
   */
  startSuccessAnimation() {
    this.showBooText = true;
    this.booTextTimer = 0;
    this.animationInProgress = true;
  }

  /**
   * End success animation sequence
   */
  endSuccessAnimation() {
    this.showBooText = false;
    this.animationInProgress = false;
  }

  /**
   * Start failure animation sequence
   */
  startFailureAnimation() {
    this.animationInProgress = true;
  }

  /**
   * End failure animation sequence
   */
  endFailureAnimation() {
    this.animationInProgress = false;
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
   * Check if player should be affected by wind
   * @returns {boolean} True if wind effects should be applied
   */
  hasWindEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasWind && !this.interactionActive && !this.animationInProgress;
  }

  /**
   * Check if player should be affected by floats
   * @returns {boolean} True if float effects should be applied
   */
  hasFloatEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasFloats !== false && !this.interactionActive && !this.animationInProgress;
  }
}