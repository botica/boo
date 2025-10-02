/**
 * UIManager handles UI elements, progress bars, and visual feedback
 */
import { Constants } from '../config/Constants.js';

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Cache UI element references
    this.arrowArea = document.getElementById('arrow-area');
    this.arrows = document.getElementById('arrows');
    this.comboUI = document.getElementById('combo-ui');
    this.progressFill = document.getElementById('progress-fill');
    this.progress = document.querySelector('.progress');
    this.arrow1 = document.getElementById('arrow-1');
    this.arrow2 = document.getElementById('arrow-2');
  }

  /**
   * Resize UI elements based on current canvas dimensions
   */
  resizeElements() {
    // Canvas dimensions are now handled by the Game class
    // This method only updates UI element sizes based on current canvas size
    
    const bigSize = Math.max(
      Constants.UI.MIN_ARROW_SIZE, 
      Math.min(
        Constants.UI.MAX_ARROW_SIZE, 
        Math.floor(Math.min(
          this.canvas.width * Constants.UI.ARROW_SIZE_FACTOR_WIDTH, 
          this.canvas.height * Constants.UI.ARROW_SIZE_FACTOR_HEIGHT
        ))
      )
    );
    
    // Resize arrows
    const arrowStyle = `width:${bigSize}px; height:${bigSize}px; font-size:${Math.floor(bigSize * Constants.UI.ARROW_FONT_SCALE)}px`;
    if (this.arrow1) this.arrow1.style.cssText += arrowStyle;
    if (this.arrow2) this.arrow2.style.cssText += arrowStyle;

    // Resize progress bar
    if (this.progress) {
      const desired = bigSize * 2 + Constants.UI.ARROW_GAP;
      const maxAllowed = this.canvas.width - Constants.UI.PROGRESS_MARGIN;
      const finalW = Math.max(Constants.UI.MIN_PROGRESS_WIDTH, Math.min(desired, maxAllowed));
      this.progress.style.width = `${finalW}px`;
    }
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
    if (this.progress) this.progress.style.display = display;
  }

  /**
   * Update combo arrows display
   * @param {string[]} combo - Current combo keys
   * @param {string[]} symbols - Display symbols for the combo
   */
  updateComboDisplay(combo, symbols) {
    if (!combo || !symbols) {
      if (this.arrows) this.arrows.style.display = 'none';
      if (this.arrow1) this.arrow1.style.display = 'none';
      if (this.arrow2) this.arrow2.style.display = 'none';
      return;
    }

    if (this.arrows) this.arrows.style.display = 'flex';
    
    // Update arrow 1
    if (this.arrow1 && symbols[0]) {
      this.arrow1.style.display = '';
      this.arrow1.textContent = symbols[0];
      this.setArrowStyle(this.arrow1, false);
    }
    
    // Update arrow 2
    if (this.arrow2 && symbols[1]) {
      this.arrow2.style.display = '';
      this.arrow2.textContent = symbols[1];
      this.setArrowStyle(this.arrow2, false);
    }
  }

  /**
   * Set arrow style (pressed or default)
   * @param {HTMLElement} el - Arrow element
   * @param {boolean} pressed - Whether pressed
   */
  setArrowStyle(el, pressed) {
    if (!el) return;
    if (pressed) {
      el.style.background = '#fff';
      el.style.color = '#000';
      el.style.border = '1px solid #000';
    } else {
      el.style.background = '#000';
      el.style.color = '#fff';
      el.style.border = '1px solid #fff';
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
   * Update progress bar
   * @param {number} percentage - Progress percentage (0-1)
   */
  updateProgress(percentage) {
    if (this.progressFill) {
      this.progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, percentage))})`;
    }
  }

  /**
   * Reset progress bar to full
   */
  resetProgress() {
    if (this.progressFill) {
      this.progressFill.style.transform = 'scaleX(1)';
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