/**
 * Validates combo input
 */
export class ComboValidator {
  constructor(keyboardHandler, arrowKeys) {
    this.keyboardHandler = keyboardHandler;
    this.arrowKeys = arrowKeys;
    this.requireKeyRelease = false;
  }

  /**
   * Check if combo is successfully input
   * @param {string[]} combo - Current combo keys
   * @returns {boolean} True if combo is correctly input
   */
  checkComboSuccess(combo) {
    if (!combo) return false;
    
    // Both required keys must be pressed
    if (!(this.keyboardHandler.isKeyPressed(combo[0]) && 
          this.keyboardHandler.isKeyPressed(combo[1]))) {
      return false;
    }
    
    // No other arrow keys may be pressed
    for (const k of this.arrowKeys) {
      if (k === combo[0] || k === combo[1]) continue;
      if (this.keyboardHandler.isKeyPressed(k)) return false;
    }

    // Keys must have been released after combo started (if required)
    if (this.requireKeyRelease) {
      const a = combo[0], b = combo[1];
      if (!this.keyboardHandler.keyReleasedSinceComboStart[a] || 
          !this.keyboardHandler.keyReleasedSinceComboStart[b]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Start combo input tracking
   */
  startComboTracking() {
    this.requireKeyRelease = true;
    this.keyboardHandler.startComboTracking(this.arrowKeys);
  }

  /**
   * Reset combo tracking
   */
  resetTracking() {
    this.requireKeyRelease = false;
  }
}
