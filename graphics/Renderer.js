/**
 * Renderer handles all canvas drawing and visual effects
 */
import { Constants } from '../config/Constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    
    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
    
    // Ensure crisp rendering
    this.ctx.imageSmoothingQuality = 'low';
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw a sprite with optional transformations
   * @param {HTMLImageElement} sprite - Image to draw
   * @param {number} x - X position (center)
   * @param {number} y - Y position (center)
   * @param {number} width - Sprite width
   * @param {number} height - Sprite height
   * @param {Object} options - Drawing options
   */
  drawSprite(sprite, x, y, width, height, options = {}) {
    if (!sprite) return;

    const {
      flipX = false,
      flipY = false,
      rotation = 0,
      alpha = 1,
      debug = false,
      debugOutline = null
    } = options;

    this.ctx.save();
    
    // Set alpha
    if (alpha !== 1) {
      this.ctx.globalAlpha = alpha;
    }

    // Move to sprite center for transformations
    this.ctx.translate(x, y);
    
    // Apply rotation
    if (rotation !== 0) {
      this.ctx.rotate(rotation);
    }
    
    // Apply scaling/flipping
    if (flipX || flipY) {
      this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }

    // Draw the sprite centered at origin
    this.ctx.drawImage(sprite, -width/2, -height/2, width, height);

    // Draw debug bounds if requested
    if (debug) {
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(-width/2, -height/2, width, height);
    }
    // Draw custom debug outline if requested
    if (debugOutline) {
      this.ctx.save();
      this.ctx.strokeStyle = debugOutline.color || 'yellow';
      this.ctx.lineWidth = debugOutline.width || 2;
      this.ctx.setLineDash(debugOutline.dash || []);
      this.ctx.strokeRect(-width/2, -height/2, width, height);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  /**
   * Draw the player entity
   * @param {Object} player - Player entity
   */
  drawPlayer(player) {
    const currentSprite = player.getCurrentFrame();
    if (!currentSprite) return;

    const options = {
      flipX: player.facing === 'left',
      debug: false,
      debugOutline: Constants.DEBUG ? { color: 'yellow', width: 2 } : null
    };
    this.drawSprite(
      currentSprite,
      player.x,
      player.getEffectiveY(),
      player.width,
      player.height,
      options
    );
  }

  /**
   * Draw the person entity
   * @param {Object} person - Person entity
   */
  drawPerson(person) {
    const currentSprite = person.getCurrentFrame();
    if (!currentSprite) return;

    this.drawSprite(
      currentSprite,
      person.x,
      person.y,
      person.width,
      person.height,
      {
        debug: false,
        flipX: person.facing === 'left',
        debugOutline: Constants.DEBUG ? { color: 'yellow', width: 2 } : null
      }
    );
  }

  /**
   * Draw cat entity
   */
  drawCat(cat) {
    if (!cat.sprite) return;

    this.drawSprite(
      cat.sprite,
      cat.x,
      cat.y,
      cat.width,
      cat.height,
      { debug: false, debugOutline: Constants.DEBUG ? { color: 'yellow', width: 2 } : null }
    );
  }

  /**
   * Draw text with styling
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} style - Text styling options
   */
  drawText(text, x, y, style = {}) {
    const {
      font = '48px sans-serif',
      fillStyle = '#ffffff',
      strokeStyle = null,
      strokeWidth = 2,
      textAlign = 'center',
      textBaseline = 'middle',
      alpha = 1
    } = style;

    this.ctx.save();
    
    this.ctx.font = font;
    this.ctx.fillStyle = fillStyle;
    this.ctx.textAlign = textAlign;
    this.ctx.textBaseline = textBaseline;
    this.ctx.globalAlpha = alpha;

    // Draw stroke first if specified
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeText(text, x, y);
    }

    // Draw fill
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  /**
   * Calculate fade-out opacity with blink effect
   * @param {number} frameIndex - Current animation frame index
   * @param {number} subFrameProgress - Progress within current frame (0-1)
   * @returns {number} Opacity value (0-1)
   */
  calculateFadeOutOpacity(frameIndex, subFrameProgress = 0) {
    // Frame 0-1: full opacity (1.0) - displayed for 2 frames
    // Frame 2: fade to 50% opacity (0.5) - displayed for 1 frame
    // Frame 3+: fade to dark (0.0) - displayed for 1 frame then done
    
    let baseOpacity;
    if (frameIndex <= 1) {
      baseOpacity = 1.0;
    } else if (frameIndex === 2) {
      baseOpacity = 0.5;
    } else {
      baseOpacity = 0;
    }
    
    // Apply blink effect between every frame: briefly go dark at the start of each frame
    // Use sub-frame progress to determine if we're in the blink period
    if (subFrameProgress !== undefined) {
      const blinkDuration = Constants.ANIMATION.TEXT_BLINK_DURATION;
      
      if (subFrameProgress < blinkDuration) {
        // Go completely dark during the blink
        return 0;
      }
    }
    
    return baseOpacity;
  }

  /**
   * Draw text with fade effect - unified method for scene text and boo text
   * @param {string} text - Text to display
   * @param {number} opacity - Current opacity (0-1)
   * @param {Object} options - Optional configuration
   * @param {string} options.font - Font family to use (default: monospace)
   * @param {boolean} options.wrap - Whether to wrap text across multiple lines (default: true)
   * @param {number} options.maxWidth - Max width as percentage of canvas (default: 0.9)
   * @param {number} options.lineHeight - Line height for multi-line text
   */
  drawFadeText(text, opacity, options = {}) {
    if (!text || opacity <= 0) return;

    const {
      font = `${Constants.TEXT.FONT_SIZE}px "Courier New", Courier, monospace`,
      wrap = true,
      maxWidth = 0.9,
      lineHeight = Constants.SCENE_TEXT.LINE_HEIGHT
    } = options;

    // Calculate center position
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    if (!wrap) {
      // Single line text (e.g., "BOO!")
      this.drawText(text, centerX, centerY, {
        font,
        fillStyle: `rgba(255, 255, 255, ${opacity})`,
        textAlign: 'center',
        textBaseline: 'middle'
      });
      return;
    }

    // Multi-line text with wrapping
    const words = text.split(' ');
    const lines = [];
    const maxWidthPixels = this.canvas.width * maxWidth;
    
    // Set up the font to measure text
    this.ctx.font = font;
    
    // Build lines by fitting words within maxWidth
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidthPixels && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate starting Y position for centered text
    const totalHeight = (lines.length - 1) * lineHeight;
    let currentY = centerY - totalHeight / 2;

    // Draw each line
    lines.forEach(line => {
      this.drawText(line, centerX, currentY, {
        font,
        fillStyle: `rgba(255, 255, 255, ${opacity})`,
        textAlign: 'center',
        textBaseline: 'middle'
      });
      currentY += lineHeight;
    });
  }

  /**
   * Draw a rectangle with styling
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {Object} style - Styling options
   */
  drawRect(x, y, width, height, style = {}) {
    const {
      fillStyle = null,
      strokeStyle = null,
      lineWidth = 1,
      alpha = 1
    } = style;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fillRect(x, y, width, height);
    }

    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeRect(x, y, width, height);
    }

    this.ctx.restore();
  }

  /**
   * Draw debug information
   * @param {Object} debugInfo - Debug information to display
   */
  drawDebugInfo(debugInfo) {
    const { fps, entities, level, combo } = debugInfo;
    
    let y = 20;
    const lineHeight = 20;
    
    if (fps !== undefined) {
      this.drawText(`FPS: ${fps.toFixed(1)}`, 10, y, {
        font: '16px monospace',
        fillStyle: '#00ff00',
        textAlign: 'left',
        textBaseline: 'top'
      });
      y += lineHeight;
    }
    
    if (level !== undefined) {
      this.drawText(`Level: ${level}`, 10, y, {
        font: '16px monospace',
        fillStyle: '#00ff00',
        textAlign: 'left',
        textBaseline: 'top'
      });
      y += lineHeight;
    }
    
    if (combo) {
      this.drawText(`Combo: ${combo.join(' + ')}`, 10, y, {
        font: '16px monospace',
        fillStyle: '#00ff00',
        textAlign: 'left',
        textBaseline: 'top'
      });
      y += lineHeight;
    }
  }

  /**
   * Draw loading screen
   * @param {number} progress - Loading progress (0-100)
   */
  drawLoadingScreen(progress) {
    // Clear screen
    this.clear();
    
    // Draw background
    this.drawRect(0, 0, this.canvas.width, this.canvas.height, {
      fillStyle: '#000000'
    });
  }

  /**
   * Get canvas dimensions
   * @returns {Object} Canvas width and height
   */
  getDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Resize the canvas
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}