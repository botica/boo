/**
 * UIManager handles UI elements, progress bars, and visual feedback
 */
import { GameConfig } from '../config/GameConfig.js';

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    
    this.arrowArea = document.getElementById('arrow-area');
    this.arrows = document.getElementById('arrows');
    this.comboUI = document.getElementById('combo-ui');
    this.progressBar = document.getElementById('progress-bar');
    this.arrow1 = document.getElementById('arrow-1');
    this.arrow2 = document.getElementById('arrow-2');
    
    // Initialize tile images from GameConfig
    this.initializeTileImages();
    // Initialize progress bar from GameConfig
    this.initializeProgressBar();
  }

  /**
   * Initialize tile images with paths from GameConfig
   */
  initializeTileImages() {
    const tiles = {
      'tile-up': 'ArrowUp',
      'tile-left': 'ArrowLeft',
      'tile-down': 'ArrowDown',
      'tile-right': 'ArrowRight'
    };
    
    for (const [tileId, arrowKey] of Object.entries(tiles)) {
      const tileEl = document.getElementById(tileId);
      if (tileEl && GameConfig.arrowImages.small[arrowKey]) {
        tileEl.src = GameConfig.arrowImages.small[arrowKey];
      }
    }
  }

  /**
   * Initialize progress bar with initial image from GameConfig
   */
  initializeProgressBar() {
    if (this.progressBar && GameConfig.progressBarImages[0]) {
      this.progressBar.src = GameConfig.progressBarImages[0];
    }
  }

  showComboUI(show) {
    const display = show ? 'flex' : 'none';
    if (this.comboUI) this.comboUI.style.display = display;
    if (this.arrows) this.arrows.style.display = display;
    if (this.arrowArea) this.arrowArea.style.display = display;
    if (this.progressBar) this.progressBar.style.display = display;
  }

  updateComboDisplay(combo, symbols) {
    if (!combo) {
      if (this.arrows) this.arrows.style.display = 'none';
      if (this.arrow1) this.arrow1.style.display = 'none';
      if (this.arrow2) this.arrow2.style.display = 'none';
      return;
    }

    if (this.arrows) this.arrows.style.display = 'flex';
    if (this.progressBar) this.progressBar.style.display = 'flex';
    
    if (this.arrow1 && combo[0]) {
      this.arrow1.style.display = 'block';
      this.setArrowImage(this.arrow1, combo[0], 'large');
      this.setArrowStyle(this.arrow1, false);
    }
    
    if (this.arrow2 && combo[1]) {
      this.arrow2.style.display = 'block';
      this.setArrowImage(this.arrow2, combo[1], 'large');
      this.setArrowStyle(this.arrow2, false);
    }
  }

  setArrowImage(el, arrowKey, size = 'large') {
    if (!el || !arrowKey) return;
    
    const imagePath = GameConfig.arrowImages[size] && GameConfig.arrowImages[size][arrowKey];
    if (imagePath) {
      el.src = imagePath;
      el.alt = `${arrowKey} arrow`;
    }
  }

  setArrowStyle(el, pressed) {
    if (!el) return;
    if (pressed) {
      el.classList.add('pressed');
    } else {
      el.classList.remove('pressed');
    }
  }

  highlightSuccessfulCombo() {
    this.setArrowStyle(this.arrow1, true);
    this.setArrowStyle(this.arrow2, true);
  }

  hideComboArrowsAndProgress() {
    if (this.arrows) this.arrows.style.display = 'none';
    if (this.progressBar) this.progressBar.style.display = 'none';
  }

  updateProgress(percentage) {
    if (this.progressBar) {
      const frame = Math.floor(percentage * 5);
      const clampedFrame = Math.max(0, Math.min(5, frame));
      if (GameConfig.progressBarImages[clampedFrame]) {
        this.progressBar.src = GameConfig.progressBarImages[clampedFrame];
      }
    }
  }

  resetProgress() {
    if (this.progressBar && GameConfig.progressBarImages[5]) {
      this.progressBar.src = GameConfig.progressBarImages[5];
    }
  }

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