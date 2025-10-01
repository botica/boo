/**
 * UIManager handles all UI elements, progress bars, and visual feedback
 */
import { Constants } from '../config/Constants.js';

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    
    // UI element references
    this.elements = {
      arrowArea: document.getElementById('arrow-area'),
      arrows: document.getElementById('arrows'),
      comboUI: document.getElementById('combo-ui'),
      progressFill: document.getElementById('progress-fill'),
      progress: document.querySelector('.progress'),
      arrow1: document.getElementById('arrow-1'),
      arrow2: document.getElementById('arrow-2')
    };

    this.arrowEls = {
      0: this.elements.arrow1,
      1: this.elements.arrow2
    };
  }

  /**
   * Resize UI elements to fit the current canvas size
   */
  resizeElements() {
    const availableWidth = Math.max(
      Constants.UI.MIN_CANVAS_WIDTH, 
      window.innerWidth - Constants.UI.CANVAS_PADDING
    );
    const availableHeight = Math.max(
      Constants.UI.MIN_CANVAS_HEIGHT, 
      window.innerHeight - Constants.UI.CANVAS_PADDING
    );
    this.canvas.width = Math.floor(availableWidth);
    this.canvas.height = Math.floor(availableHeight);

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
    
    // Resize arrow elements
    if (this.elements.arrow1) { 
      this.elements.arrow1.style.width = `${bigSize}px`; 
      this.elements.arrow1.style.height = `${bigSize}px`; 
      this.elements.arrow1.style.fontSize = `${Math.floor(bigSize * Constants.UI.ARROW_FONT_SCALE)}px`; 
    }
    if (this.elements.arrow2) { 
      this.elements.arrow2.style.width = `${bigSize}px`; 
      this.elements.arrow2.style.height = `${bigSize}px`; 
      this.elements.arrow2.style.fontSize = `${Math.floor(bigSize * Constants.UI.ARROW_FONT_SCALE)}px`; 
    }

    // Resize progress bar
    if (this.elements.progress) {
      const desired = bigSize * 2 + Constants.UI.ARROW_GAP;
      const maxAllowed = this.canvas.width - Constants.UI.PROGRESS_MARGIN;
      const finalW = Math.max(Constants.UI.MIN_PROGRESS_WIDTH, Math.min(desired, maxAllowed));
      this.elements.progress.style.width = `${finalW}px`;
    }
  }

  /**
   * Show or hide combo UI elements
   * @param {boolean} show - Whether to show the UI
   */
  showComboUI(show) {
    if (this.elements.comboUI) {
      this.elements.comboUI.style.display = show ? 'flex' : 'none';
    }
    if (this.elements.arrows) {
      this.elements.arrows.style.display = show ? 'flex' : 'none';
    }
    if (this.elements.arrowArea) {
      this.elements.arrowArea.style.display = show ? 'flex' : 'none';
    }
    if (this.elements.progress) {
      this.elements.progress.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Update combo arrows display
   * @param {string[]} combo - Current combo keys
   * @param {string[]} symbols - Display symbols for the combo
   */
  updateComboDisplay(combo, symbols) {
    if (!combo || !symbols) {
      this.hideComboArrows();
      return;
    }

    // Show arrows container
    if (this.elements.arrows) {
      this.elements.arrows.style.display = 'flex';
    }

    // Update each arrow
    for (let i = 0; i < 2; i++) {
      const arrowEl = this.arrowEls[i];
      if (arrowEl && i < symbols.length) {
        arrowEl.style.display = '';
        arrowEl.textContent = symbols[i];
        this.resetArrowStyle(arrowEl);
      }
    }
  }

  /**
   * Hide combo arrows
   */
  hideComboArrows() {
    if (this.elements.arrows) {
      this.elements.arrows.style.display = 'none';
    }

    // Hide individual arrows
    for (let i = 0; i < 2; i++) {
      const arrowEl = this.arrowEls[i];
      if (arrowEl) {
        arrowEl.textContent = '';
        this.resetArrowStyle(arrowEl);
        arrowEl.style.display = 'none';
      }
    }
  }

  /**
   * Reset arrow visual style to default
   * @param {HTMLElement} arrowEl - Arrow element
   */
  resetArrowStyle(arrowEl) {
    if (arrowEl) {
      arrowEl.style.background = '#000';
      arrowEl.style.color = '#fff';
      arrowEl.style.border = '1px solid #fff';
    }
  }

  /**
   * Highlight successful combo arrows
   * @param {string[]} combo - Current combo keys
   */
  highlightSuccessfulCombo(combo) {
    for (let i = 0; i < 2; i++) {
      const arrowEl = this.arrowEls[i];
      if (arrowEl) {
        arrowEl.style.background = '#fff';
        arrowEl.style.color = '#000';
        arrowEl.style.border = '1px solid #000';
      }
    }
  }

  /**
   * Update progress bar
   * @param {number} percentage - Progress percentage (0-1)
   */
  updateProgress(percentage) {
    if (this.elements.progressFill) {
      this.elements.progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, percentage))})`;
    }
  }

  /**
   * Reset progress bar to full
   */
  resetProgress() {
    if (this.elements.progressFill) {
      this.elements.progressFill.style.transform = 'scaleX(1)';
    }
  }

  /**
   * Hide all UI elements
   */
  hideAll() {
    this.showComboUI(false);
    this.hideComboArrows();
    
    if (this.elements.arrowArea) {
      this.elements.arrowArea.style.display = 'none';
    }
  }

  /**
   * Reset all UI elements to default state
   */
  resetAll() {
    this.hideAll();
    this.resetProgress();
    
    // Reset all arrow styles
    for (let i = 0; i < 2; i++) {
      const arrowEl = this.arrowEls[i];
      if (arrowEl) {
        this.resetArrowStyle(arrowEl);
        arrowEl.style.display = 'none';
      }
    }
  }

  /**
   * Get combo arrow element by index
   * @param {number} index - Arrow index (0 or 1)
   * @returns {HTMLElement|null} Arrow element
   */
  getArrowElement(index) {
    return this.arrowEls[index] || null;
  }

  /**
   * Show game instructions or help text
   * @param {string} text - Text to display
   */
  showInstructions(text) {
    // This could be extended to show tutorial or help text
    console.log('Instructions:', text);
  }

  /**
   * Update UI for specific key press/release during combo
   * @param {string} key - Key that was pressed/released
   * @param {boolean} pressed - Whether key is pressed
   * @param {string[]} currentCombo - Current combo keys
   */
  updateComboKeyFeedback(key, pressed, currentCombo) {
    if (!currentCombo) return;

    for (let i = 0; i < 2; i++) {
      if (currentCombo[i] === key && this.arrowEls[i]) {
        if (pressed) {
          this.arrowEls[i].style.background = '#fff';
          this.arrowEls[i].style.color = '#000';
          this.arrowEls[i].style.border = '1px solid #000';
        } else {
          this.resetArrowStyle(this.arrowEls[i]);
        }
      }
    }
  }

  /**
   * Show loading state
   * @param {number} progress - Loading progress (0-100)
   */
  showLoading(progress) {
    // This could be extended to show asset loading progress
    console.log(`Loading: ${progress.toFixed(1)}%`);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    // Hide loading indicators
    console.log('Loading complete');
  }
}