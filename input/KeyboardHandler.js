/**
 * Keyboard input handler
 */
export class KeyboardHandler {
  constructor() {
    this.keys = {};
    this.keyReleasedSinceComboStart = {};
  }

  /**
   * Initialize keyboard tracking for specific keys
   * @param {string[]} keyList - List of keys to track
   */
  initKeys(keyList) {
    keyList.forEach(k => {
      this.keys[k] = false;
      this.keyReleasedSinceComboStart[k] = true;
    });
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Normalized key name
   */
  handleKeyDown(e) {
    const raw = e.key || '';
    const k = (raw.length === 1) ? raw.toLowerCase() : raw;
    
    if (k in this.keys) {
      // Only register the keydown if the key was released since combo started
      if (this.keyReleasedSinceComboStart[k]) {
        this.keys[k] = true;
      }
    }
    
    return k;
  }

  /**
   * Handle keyup event
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Normalized key name
   */
  handleKeyUp(e) {
    const raw = e.key || '';
    const k = (raw.length === 1) ? raw.toLowerCase() : raw;
    
    if (k in this.keys) {
      this.keys[k] = false;
      if (k in this.keyReleasedSinceComboStart) {
        this.keyReleasedSinceComboStart[k] = true;
      }
    }
    
    return k;
  }

  /**
   * Check if a key is currently pressed
   * @param {string} key - Key to check
   * @returns {boolean} True if pressed
   */
  isKeyPressed(key) {
    return this.keys[key] || false;
  }

  /**
   * Reset all key states
   */
  resetKeys() {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
  }

  /**
   * Mark combo tracking as started (keys need to be released before counting)
   * @param {string[]} keyList - List of keys to track
   */
  startComboTracking(keyList) {
    for (const k of keyList) {
      // If key is currently pressed, mark as not released and clear the key state
      // so it won't be counted until released and pressed again
      if (this.keys[k]) {
        this.keyReleasedSinceComboStart[k] = false;
        this.keys[k] = false; // Clear the pressed state
      } else {
        this.keyReleasedSinceComboStart[k] = true;
      }
    }
  }

  /**
   * Programmatically set key state
   * @param {string} key - Key to set
   * @param {boolean} pressed - Whether key is pressed
   */
  setKeyState(key, pressed) {
    if (!(key in this.keys)) {
      this.keys[key] = false;
    }
    
    // Only set to pressed if the key was released since combo started
    if (pressed) {
      if (this.keyReleasedSinceComboStart[key]) {
        this.keys[key] = true;
      }
    } else {
      this.keys[key] = false;
      if (key in this.keyReleasedSinceComboStart) {
        this.keyReleasedSinceComboStart[key] = true;
      }
    }
  }
}
