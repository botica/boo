import { AnimatedEntity, AnimationState } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';

/**
 * Moon entity class - decorative animated background element
 */
export class Moon {
  constructor(assetManager, x = 0, y = 0) {
    this.assetManager = assetManager;
    
    // Position and size
    this.x = x;
    this.y = y;
    this.width = Constants.MOON.WIDTH;
    this.height = Constants.MOON.HEIGHT;
    
    // Initialize animation
    this.setupAnimation();
  }

  setupAnimation() {
    const moonSprites = this.assetManager.getMoonSprites();
    const states = [
      new AnimationState('default', moonSprites.default, Constants.ANIMATION.DEFAULT_FRAME_INTERVAL, true)
    ];
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update the moon animation
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.animator.update(dt);
  }

  /**
   * Render the moon
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    const currentFrame = this.animator.getCurrentFrame();
    if (currentFrame) {
      ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
    }
  }

  /**
   * Get the current bounds of the moon (for collision detection if needed)
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