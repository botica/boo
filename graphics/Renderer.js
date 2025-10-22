/**
 * Renderer handles all canvas drawing and visual effects
 */
import { Constants } from '../config/Constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
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
      debug = false
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
      debug: false // Disable debug bounds
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
        flipX: person.facing === 'right' // Flip sprite if facing right
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
      { debug: false }
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
   * Draw the "BOO!" text effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} timer - Animation timer
   */
  drawBooText(x, y, timer) {
    // Flash white and black at regular intervals
    const flashInterval = Constants.ANIMATION.BOO_TEXT_FLASH_FRAMES * Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
    const flashPhase = Math.floor(timer / flashInterval) % 2;
    const fillStyle = flashPhase === 0 ? '#ffffff' : '#000000';

    this.drawText('boo', x, y, {
      font: `${Constants.BOO_TEXT.FONT_SIZE}px sans-serif`,
      fillStyle: fillStyle,
      textAlign: 'center',
      textBaseline: 'middle'
    });
  }

  /**
   * Draw the "he he" text effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} timer - Animation timer
   */
  drawHeheText(x, y, timer) {
    // Flash white and black at regular intervals
    const flashInterval = Constants.HEHE_TEXT.FLASH_FRAMES * Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
    const flashPhase = Math.floor(timer / flashInterval) % 2;
    const fillStyle = flashPhase === 0 ? '#ffffff' : '#000000';

    this.drawText('he he', x, y, {
      font: `${Constants.HEHE_TEXT.FONT_SIZE}px sans-serif`,
      fillStyle: fillStyle,
      textAlign: 'center',
      textBaseline: 'middle'
    });
  }

  /**
   * Draw scene text (intro/outro) with fade opacity
   * @param {string} text - Text to display
   * @param {number} opacity - Current opacity (0-1)
   */
  drawSceneText(text, opacity) {
    if (!text || opacity <= 0) return;

    // Calculate center position
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Split text into lines if it contains line breaks
    const lines = text.split('\n');
    const lineHeight = Constants.SCENE_TEXT.LINE_HEIGHT;
    
    // Calculate starting Y position for centered text
    const totalHeight = (lines.length - 1) * lineHeight;
    let currentY = centerY - totalHeight / 2;

    // Draw each line
    lines.forEach(line => {
      this.drawText(line, centerX, currentY, {
        font: `${Constants.SCENE_TEXT.FONT_SIZE}px sans-serif`,
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
   * Draw a circle
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Circle radius
   * @param {Object} style - Styling options
   */
  drawCircle(x, y, radius, style = {}) {
    const {
      fillStyle = null,
      strokeStyle = null,
      lineWidth = 1,
      alpha = 1
    } = style;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }

    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw visual effects (particles, flashes, etc.)
   * @param {Object} effect - Effect configuration
   */
  drawEffect(effect) {
    switch (effect.type) {
      case 'flash':
        this.drawFlashEffect(effect);
        break;
      case 'particle':
        this.drawParticleEffect(effect);
        break;
      default:
        console.warn('Unknown effect type:', effect.type);
    }
  }

  /**
   * Draw flash effect
   * @param {Object} effect - Flash effect configuration
   */
  drawFlashEffect(effect) {
    const { x, y, width, height, color = '#ffffff', alpha = 0.5 } = effect;
    
    this.drawRect(x, y, width, height, {
      fillStyle: color,
      alpha: alpha
    });
  }

  /**
   * Draw particle effect
   * @param {Object} effect - Particle effect configuration
   */
  drawParticleEffect(effect) {
    const { particles = [] } = effect;
    
    particles.forEach(particle => {
      this.drawCircle(particle.x, particle.y, particle.radius, {
        fillStyle: particle.color,
        alpha: particle.alpha
      });
    });
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
    
    // Draw loading text
    this.drawText('welcome to boo game', this.canvas.width / 2, this.canvas.height / 2, {
      font: '24px sans-serif',
      fillStyle: '#ffffff'
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