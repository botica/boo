/**
 * UIManager handles UI elements, progress bars, and visual feedback
 */
import { Constants } from '../config/Constants.js';
import { GameConfig } from '../config/GameConfig.js';

export class UIManager {
  constructor(canvas, assetManager = null) {
    this.canvas = canvas;
    this.assetManager = assetManager;
    
    // Cache UI element references
    this.arrowArea = document.getElementById('arrow-area');
    this.arrows = document.getElementById('arrows');
    this.comboUI = document.getElementById('combo-ui');
    this.progressBar = document.getElementById('progress-bar');
    this.arrow1 = document.getElementById('arrow-1');
    this.arrow2 = document.getElementById('arrow-2');
  }

  /**
   * Resize UI elements based on current canvas dimensions
   */
  resizeElements() {
    // Canvas dimensions are now handled by the Game class
    // Arrow images now use their natural size (200px) - no dynamic resizing needed
    
    // Progress bar doesn't need resizing - it's a fixed-size image
  }

  /**
   * Show or hide combo UI
   * @param {boolean} show - Whether to show the UI
   */
  showComboUI(show) {
    const display = show ? 'flex' : 'none';
    if (this.comboUI) this.comboUI.style.display = display;
    if (this.arrows) this.arrows.style.display = display;
    if (this.arrowArea) this.arrowArea.style.display = display;
    if (this.progressBar) this.progressBar.style.display = display;
  }

  /**
   * Update combo arrows display
   * @param {string[]} combo - Current combo keys
   * @param {string[]} symbols - Display symbols for the combo (deprecated, kept for compatibility)
   */
  updateComboDisplay(combo, symbols) {
    if (!combo) {
      if (this.arrows) this.arrows.style.display = 'none';
      if (this.arrow1) this.arrow1.style.display = 'none';
      if (this.arrow2) this.arrow2.style.display = 'none';
      return;
    }

    if (this.arrows) this.arrows.style.display = 'flex';
    
    // Update arrow 1
    if (this.arrow1 && combo[0]) {
      this.arrow1.style.display = 'block';
      this.setArrowImage(this.arrow1, combo[0], 'large');
      this.setArrowStyle(this.arrow1, false);
    }
    
    // Update arrow 2
    if (this.arrow2 && combo[1]) {
      this.arrow2.style.display = 'block';
      this.setArrowImage(this.arrow2, combo[1], 'large');
      this.setArrowStyle(this.arrow2, false);
    }
  }

  /**
   * Set arrow image source
   * @param {HTMLElement} el - Arrow image element
   * @param {string} arrowKey - Arrow key (ArrowLeft, ArrowRight, etc.)
   * @param {string} size - Size variant ('large' or 'small')
   */
  setArrowImage(el, arrowKey, size = 'large') {
    if (!el || !arrowKey) return;
    
    const imagePath = GameConfig.arrowImages[size] && GameConfig.arrowImages[size][arrowKey];
    if (imagePath) {
      el.src = imagePath;
      el.alt = `${arrowKey} arrow`;
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
   * Set arrow style (pressed or default)
   * @param {HTMLElement} el - Arrow element
   * @param {boolean} pressed - Whether pressed
   */
  setArrowStyle(el, pressed) {
    if (!el) return;
    if (pressed) {
      el.classList.add('pressed');
    } else {
      el.classList.remove('pressed');
    }
  }

  /**
   * Highlight successful combo
   */
  highlightSuccessfulCombo() {
    this.setArrowStyle(this.arrow1, true);
    this.setArrowStyle(this.arrow2, true);
  }

  /**
   * Update progress bar with image frame
   * @param {number} percentage - Progress percentage (0-1)
   */
  updateProgress(percentage) {
    if (this.progressBar) {
      // Convert percentage to frame number (0-5)
      const frame = Math.floor(percentage * 5);
      const clampedFrame = Math.max(0, Math.min(5, frame));
      this.progressBar.src = `images/ui/prog-bar-${clampedFrame}-200px.png`;
    }
  }

  /**
   * Reset progress bar to full (frame 5)
   */
  resetProgress() {
    if (this.progressBar) {
      this.progressBar.src = 'images/ui/prog-bar-5-200px.png';
    }
  }

  /**
   * Reset all UI to default state
   */
  resetAll() {
    this.showComboUI(false);
    this.resetProgress();
    this.setArrowStyle(this.arrow1, false);
    this.setArrowStyle(this.arrow2, false);
    if (this.arrow1) this.arrow1.style.display = 'none';
    if (this.arrow2) this.arrow2.style.display = 'none';
    if (this.arrowArea) this.arrowArea.style.display = 'none';
  }
}