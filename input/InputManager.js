/**
 * InputManager coordinates keyboard, touch, and combo input
 */
import { GameConfig } from '../config/GameConfig.js';
import { KeyboardHandler } from './KeyboardHandler.js';
import { TouchHandler } from './TouchHandler.js';
import { ComboValidator } from './ComboValidator.js';

export class InputManager {
  constructor(assetManager = null) {
    // Arrow keys for movement and combos
    this.arrowKeys = GameConfig.arrowKeys;
    this.assetManager = assetManager;
    
    // Initialize sub-systems
    this.keyboardHandler = new KeyboardHandler();
    this.keyboardHandler.initKeys(this.arrowKeys);
    
    this.comboValidator = new ComboValidator(this.keyboardHandler, this.arrowKeys);
    this.touchHandler = new TouchHandler(this.keyboardHandler);
    
    // Cache UI element references
    this.tileEls = {};
    this.arrowEls = {};
    
    // Current combo for visual feedback
    this.currentCombo = null;
    
    this.init();
  }

  /**
   * Initialize input system
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
    this.tileEls = {
      ArrowUp: document.getElementById('tile-up'),
      ArrowLeft: document.getElementById('tile-left'),
      ArrowDown: document.getElementById('tile-down'),
      ArrowRight: document.getElementById('tile-right'),
    };

    this.arrowEls = {
      0: document.getElementById('arrow-1'),
      1: document.getElementById('arrow-2'),
    };

    // No need to initialize tile images - they're already set in HTML
  }

  /**
   * Initialize small arrow tile images
   */
  initializeTileImages() {
    for (const [key, element] of Object.entries(this.tileEls)) {
      if (element) {
        // Try to use preloaded images from AssetManager first
        if (this.assetManager) {
          const spriteKey = this.getArrowSpriteKey(key, 'small');
          const sprite = this.assetManager.getSprite(spriteKey);
          if (sprite) {
            element.style.backgroundImage = `url('${sprite.src}')`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
            element.textContent = ''; // Clear any text content
            continue;
          }
        }
        
        // Fallback to direct path
        if (GameConfig.arrowImages.small[key]) {
          const imagePath = GameConfig.arrowImages.small[key];
          element.style.backgroundImage = `url('${imagePath}')`;
          element.style.backgroundSize = 'contain';
          element.style.backgroundRepeat = 'no-repeat';
          element.style.backgroundPosition = 'center';
          element.textContent = ''; // Clear any text content
        }
      }
    }
  }

  /**
   * Get sprite key for arrow from AssetManager
   */
  getArrowSpriteKey(arrowKey, size) {
    const direction = arrowKey.replace('Arrow', '').toLowerCase();
    const sizeKey = size === 'large' ? 'Large' : 'Small';
    return `arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}${sizeKey}`;
  }

  /**
   * Bind touch and click events to UI elements
   */
  bindTouchEvents() {
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
    this.updateVisual(k, true);
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyUp(e) {
    const k = this.keyboardHandler.handleKeyUp(e);
    this.updateVisual(k, false);
  }

  /**
   * Called when a key is pressed (from touch or keyboard)
   * @param {string} key - Key that was pressed
   */
  onKeyPress(key) {
    this.updateVisual(key, true);
  }

  /**
   * Called when a key is released (from touch or keyboard)
   * @param {string} key - Key that was released
   */
  onKeyRelease(key) {
    this.updateVisual(key, false);
  }

  /**
   * Update visual feedback for key press/release
   * @param {string} key - Key name
   * @param {boolean} pressed - Whether key is pressed
   */
  updateVisual(key, pressed) {
    // Update tile visual
    const tileEl = this.tileEls[key];
    if (tileEl) {
      this.setElementStyle(tileEl, pressed);
    }

    // Update combo arrow visual
    if (this.currentCombo) {
      for (let i = 0; i < 2; i++) {
        if (this.currentCombo[i] === key && this.arrowEls[i]) {
          this.setElementStyle(this.arrowEls[i], pressed);
        }
      }
    }
  }

  /**
   * Set element style (pressed or default)
   * @param {HTMLElement} el - Element to style
   * @param {boolean} pressed - Whether pressed
   */
  setElementStyle(el, pressed) {
    if (!el) return;
    if (pressed) {
      el.classList.add('pressed');
    } else {
      el.classList.remove('pressed');
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
   * Reset key states and visuals
   */
  resetKeys() {
    this.keyboardHandler.resetKeys();
    
    // Reset tile styling
    for (const el of Object.values(this.tileEls)) {
      if (el) this.setElementStyle(el, false);
    }

    // Reset arrow styling
    for (const el of Object.values(this.arrowEls)) {
      if (el) this.setElementStyle(el, false);
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