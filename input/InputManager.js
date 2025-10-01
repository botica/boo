/**
 * InputManager coordinates keyboard, touch, and combo input
 */
import { GameConfig } from '../config/GameConfig.js';
import { KeyboardHandler } from './KeyboardHandler.js';
import { TouchHandler } from './TouchHandler.js';
import { ComboValidator } from './ComboValidator.js';

export class InputManager {
  constructor() {
    // Arrow keys for movement and combos
    this.arrowKeys = GameConfig.arrowKeys;
    
    // Initialize sub-systems
    this.keyboardHandler = new KeyboardHandler();
    this.keyboardHandler.initKeys(this.arrowKeys);
    
    this.comboValidator = new ComboValidator(this.keyboardHandler, this.arrowKeys);
    this.touchHandler = new TouchHandler(this.keyboardHandler);
    
    // UI element references
    this.tileEls = {};
    this.arrowEls = {};
    
    // Current combo for visual feedback
    this.currentCombo = null;
    
    this.init();
  }

  /**
   * Initialize input system and bind event handlers
   */
  init() {
    this.bindKeyboardEvents();
    this.setupUIElements();
    this.bindTouchEvents();
  }

  /**
   * Bind keyboard event handlers
   */
  bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  /**
   * Set up UI element references
   */
  setupUIElements() {
    // Tile elements for visual feedback
    this.tileEls = {
      ArrowUp: document.getElementById('tile-up'),
      ArrowLeft: document.getElementById('tile-left'),
      ArrowDown: document.getElementById('tile-down'),
      ArrowRight: document.getElementById('tile-right'),
    };

    // Arrow elements for combo display
    this.arrowEls = {
      0: document.getElementById('arrow-1'),
      1: document.getElementById('arrow-2'),
    };
  }

  /**
   * Bind touch and click events to UI elements
   */
  bindTouchEvents() {
    // Attach handlers to tile elements
    for (const [key, element] of Object.entries(this.tileEls)) {
      if (element) {
        this.touchHandler.attachTilePress(
          element, 
          key,
          (k) => this.onKeyPress(k),
          (k) => this.onKeyRelease(k)
        );
      }
    }

    // Attach handlers to combo arrow elements
    this.touchHandler.attachComboArrow(
      this.arrowEls[0],
      () => this.currentCombo ? this.currentCombo[0] : null,
      (k) => this.onKeyPress(k),
      (k) => this.onKeyRelease(k)
    );
    this.touchHandler.attachComboArrow(
      this.arrowEls[1],
      () => this.currentCombo ? this.currentCombo[1] : null,
      (k) => this.onKeyPress(k),
      (k) => this.onKeyRelease(k)
    );
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    const k = this.keyboardHandler.handleKeyDown(e);
    this.updateTileVisual(k, true);
    this.updateComboVisual(k, true);
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyUp(e) {
    const k = this.keyboardHandler.handleKeyUp(e);
    this.updateTileVisual(k, false);
    this.updateComboVisual(k, false);
  }

  /**
   * Called when a key is pressed (from touch or keyboard)
   * @param {string} key - Key that was pressed
   */
  onKeyPress(key) {
    this.updateTileVisual(key, true);
    this.updateComboVisual(key, true);
    
    // Dispatch keyboard event for consistency
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Called when a key is released (from touch or keyboard)
   * @param {string} key - Key that was released
   */
  onKeyRelease(key) {
    this.updateTileVisual(key, false);
    this.updateComboVisual(key, false);
    
    try {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: key }));
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Update tile visual feedback
   * @param {string} key - Key name
   * @param {boolean} pressed - Whether key is pressed
   */
  updateTileVisual(key, pressed) {
    const element = this.tileEls[key];
    if (element) {
      if (pressed) {
        element.style.background = '#fff';
        element.style.color = '#000';
        element.style.border = '1px solid #000';
      } else {
        element.style.background = '#000';
        element.style.color = '#fff';
        element.style.border = '1px solid #fff';
      }
    }
  }

  /**
   * Update combo arrow visual feedback
   * @param {string} key - Key name
   * @param {boolean} pressed - Whether key is pressed
   */
  updateComboVisual(key, pressed) {
    if (!this.currentCombo) return;

    for (let i = 0; i < 2; i++) {
      if (this.currentCombo[i] === key && this.arrowEls[i]) {
        if (pressed) {
          this.arrowEls[i].style.background = '#fff';
          this.arrowEls[i].style.color = '#000';
          this.arrowEls[i].style.border = '1px solid #000';
        } else {
          this.arrowEls[i].style.background = '#000';
          this.arrowEls[i].style.color = '#fff';
          this.arrowEls[i].style.border = '1px solid #fff';
        }
      }
    }
  }

  /**
   * Set current combo for visual feedback
   * @param {string[]|null} combo - Current combo keys
   */
  setCurrentCombo(combo) {
    this.currentCombo = combo;
  }

  /**
   * Reset key states
   */
  resetKeys() {
    this.keyboardHandler.resetKeys();
    this.resetVisuals();
  }

  /**
   * Reset visual feedback
   */
  resetVisuals() {
    // Reset tile styling
    for (const k in this.tileEls) {
      const el = this.tileEls[k];
      if (el && el.style) {
        el.style.background = '#000';
        el.style.color = '#fff';
        el.style.border = '1px solid #fff';
      }
    }

    // Reset arrow styling
    for (let i = 0; i < 2; i++) {
      if (this.arrowEls[i]) {
        this.arrowEls[i].style.background = '#000';
        this.arrowEls[i].style.color = '#fff';
        this.arrowEls[i].style.border = '1px solid #fff';
      }
    }
  }

  /**
   * Check if combo is successfully input
   * @param {string[]} combo - Current combo keys
   * @returns {boolean} True if combo is correctly input
   */
  checkComboSuccess(combo) {
    return this.comboValidator.checkComboSuccess(combo);
  }

  /**
   * Start combo input tracking
   */
  startComboTracking() {
    this.comboValidator.startComboTracking();
  }

  /**
   * Expose keys for player movement
   */
  get keys() {
    return this.keyboardHandler.keys;
  }
}