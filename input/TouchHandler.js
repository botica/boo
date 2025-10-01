import { Constants } from '../config/Constants.js';

/**
 * Touch and click input handler
 */
export class TouchHandler {
  constructor(keyboardHandler) {
    this.keyboardHandler = keyboardHandler;
  }

  /**
   * Attach touch/click handlers to a tile element
   * @param {HTMLElement} tileEl - Tile element
   * @param {string} keyName - Associated key name
   * @param {Function} onPress - Callback for key press
   * @param {Function} onRelease - Callback for key release
   */
  attachTilePress(tileEl, keyName, onPress, onRelease) {
    if (!tileEl || !keyName) return;
    
    tileEl.tabIndex = tileEl.tabIndex || 0;
    tileEl.setAttribute('role', 'button');

    const pressKey = () => {
      this.keyboardHandler.setKeyState(keyName, true);
      onPress(keyName);
    };
    
    const releaseKey = () => {
      this.keyboardHandler.setKeyState(keyName, false);
      onRelease(keyName);
    };

    // Pointer events
    tileEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      pressKey();
      tileEl.setPointerCapture && tileEl.setPointerCapture(e.pointerId);
    });
    
    tileEl.addEventListener('pointerup', e => {
      releaseKey();
      tileEl.releasePointerCapture && tileEl.releasePointerCapture(e.pointerId);
    });
    
    tileEl.addEventListener('pointercancel', e => {
      releaseKey();
      tileEl.releasePointerCapture && tileEl.releasePointerCapture(e.pointerId);
    });

    // Click support
    tileEl.addEventListener('click', e => {
      pressKey();
      setTimeout(() => releaseKey(), Constants.TOUCH.CLICK_DURATION);
    });

    // Keyboard accessibility
    tileEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pressKey();
      }
    });
    
    tileEl.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        releaseKey();
      }
    });
  }

  /**
   * Attach handlers to combo arrow elements
   * @param {HTMLElement} el - Arrow element
   * @param {Function} getKey - Function to get the current key for this arrow
   * @param {Function} onPress - Callback for key press
   * @param {Function} onRelease - Callback for key release
   */
  attachComboArrow(el, getKey, onPress, onRelease) {
    if (!el) return;
    
    el.tabIndex = el.tabIndex || 0;
    el.setAttribute('role', 'button');

    const pressKey = () => {
      const k = getKey();
      if (k) {
        this.keyboardHandler.setKeyState(k, true);
        onPress(k);
      }
    };
    
    const releaseKey = () => {
      const k = getKey();
      if (k) {
        this.keyboardHandler.setKeyState(k, false);
        onRelease(k);
      }
    };

    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      pressKey();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    });
    
    el.addEventListener('pointerup', e => {
      releaseKey();
      el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
    });
    
    el.addEventListener('click', e => {
      pressKey();
      setTimeout(releaseKey, Constants.TOUCH.CLICK_DURATION);
    });
    
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pressKey();
      }
    });
    
    el.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        releaseKey();
      }
    });
  }
}
