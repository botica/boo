import { AnimatedEntity, AnimationState } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';

/**
 * Base class for non-interactive decorative entities (Moon, Tree, City)
 * Handles common animation and rendering logic
 */
export class DecorativeEntity {
  constructor(assetManager, x, y, width, height) {
    this.assetManager = assetManager;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.animator = null;
  }

  /**
   * Set up animation from sprite data
   * @param {Object} sprites - Sprite data with 'default' property
   */
  setupAnimation(sprites) {
    const states = [
      new AnimationState('default', sprites.default, Constants.ANIMATION.DEFAULT_FRAME_INTERVAL, true)
    ];
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update the entity animation
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.animator) {
      this.animator.update(dt);
    }
  }

  /**
   * Render the entity
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    const currentFrame = this.animator?.getCurrentFrame();
    if (currentFrame) {
      // Ensure crisp pixel rendering (no smoothing/blurring)
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
    }
  }

  /**
   * Get the current bounds of the entity
   * @returns {Object} Bounding box with x, y, width, height
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
