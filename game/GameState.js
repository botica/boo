/**
 * GameState manages combo generation and interaction timing
 */
import { GameConfig } from '../config/GameConfig.js';

export class GameState {
  constructor() {
    // Current game state
    this.currentLevel = 1;
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
   * Set current level
   * @param {number} level - Level number
   */
  setCurrentLevel(level) {
    this.currentLevel = level;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
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
   * Process combo success (note: level advancement handled by GameStateManager)
   * @param {number} combosCompleted - Current combo count from GameStateManager
   * @returns {string} Result of combo completion ('continue', 'ready_for_level_advance')
   */
  processComboSuccess(combosCompleted) {
    this.comboAccepted = true;
    
    if (combosCompleted >= GameConfig.COMBOS_PER_LEVEL) {
      // Success: show angry animation, "BOO!" text, then laugh animation
      this.showBooText = true;
      this.booTextTimer = 0;
      this.animationInProgress = true;
      return 'ready_for_level_advance';
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
   * Reset game state to initial values
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
   * Check if player should be affected by wind
   * @returns {boolean} True if wind effects should be applied
   */
  hasWindEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasWind && !this.interactionActive && !this.animationInProgress;
  }

  /**
   * Check if player should be affected by gusts
   * @returns {boolean} True if gust effects should be applied
   */
  hasGustEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasGusts !== false && !this.interactionActive && !this.animationInProgress;
  }
}