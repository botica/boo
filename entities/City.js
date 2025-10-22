import { AnimatedEntity, AnimationState } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';

/**
 * City entity class - cityscape background element for level 2
 */
export class City {
  constructor(assetManager, x = Constants.CITY.DEFAULT_X_OFFSET, y = Constants.CITY.DEFAULT_Y_OFFSET) {
    this.assetManager = assetManager;
    
    // Position and size
    this.x = x;
    this.y = y;
    this.width = Constants.CITY.WIDTH;
    this.height = Constants.CITY.HEIGHT;
    
    // Initialize animation
    this.setupAnimation();
  }

  setupAnimation() {
    const citySprites = this.assetManager.getCitySprites();
    const states = [
      new AnimationState('default', citySprites.default, Constants.ANIMATION.DEFAULT_FRAME_INTERVAL, true)
    ];
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update the city animation
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.animator.update(dt);
  }

  /**
   * Render the city
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    const currentFrame = this.animator.getCurrentFrame();
    if (currentFrame) {
      ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
    }
  }

  /**
   * Get the current bounds of the city
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
