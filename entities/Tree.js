import { AnimatedEntity, AnimationState } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';

/**
 * Tree entity class - decorative animated background element
 */
export class Tree {
  constructor(assetManager, x = window.innerWidth / 2 + 50, y = window.innerHeight - 100) {
    this.assetManager = assetManager;
    
    // Position and size
    this.x = x;
    this.y = y;
    this.width = 100;   // 100px square
    this.height = 100;
    
    // Initialize animation
    this.setupAnimation();
  }

  setupAnimation() {
    const treeSprites = this.assetManager.getTreeSprites();
    const states = [
      new AnimationState('default', treeSprites.default, Constants.ANIMATION.DEFAULT_FRAME_INTERVAL, true)
    ];
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update the tree animation
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.animator.update(dt);
  }

  /**
   * Render the tree
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    const currentFrame = this.animator.getCurrentFrame();
    if (currentFrame) {
      ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
    }
  }

  /**
   * Get the current bounds of the tree (for collision detection if needed)
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