import { Constants } from '../config/Constants.js';

/**
 * Cat entity class (appears only on level 3)
 */
export class Cat {
  constructor(assetManager, canvas) {
    this.canvas = canvas;
    this.assetManager = assetManager;
    
    // Position and movement
    this.width = Constants.CAT.WIDTH;
    this.height = Constants.CAT.HEIGHT;
    
    // Position cat in bottom right corner
    this.x = canvas.width - this.width - Constants.CAT.MARGIN_FROM_EDGE;
    this.y = canvas.height - this.height - Constants.CAT.MARGIN_FROM_EDGE;
    
    // Movement properties for escape sequence
    this.vx = 0;
    this.vy = 0;
    this.isBeingCarried = false;
    this.originalX = this.x;
    this.originalY = this.y;
    
    // Sprite
    this.sprite = null;
    this.loadSprite();
  }

  loadSprite() {
    this.sprite = this.assetManager.getCatSprite();
  }

  update(dt) {
    // For now, cat doesn't move unless it's being carried
    if (this.isBeingCarried) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }

  /**
   * Start being carried during escape sequence
   */
  startBeingCarried(carrierX, carrierY, carrierVx, carrierVy) {
    this.isBeingCarried = true;
    // Position cat relative to carrier
    this.x = carrierX + Constants.CAT.CARRY_OFFSET_X;
    this.y = carrierY + Constants.CAT.CARRY_OFFSET_Y;
    this.vx = carrierVx;
    this.vy = carrierVy;
  }

  /**
   * Reset cat to original position
   */
  reset() {
    this.x = this.originalX;
    this.y = this.originalY;
    this.vx = 0;
    this.vy = 0;
    this.isBeingCarried = false;
  }

  /**
   * Check if cat is off screen
   */
  isOffScreen() {
    return this.x < -this.width || 
           this.x > this.canvas.width || 
           this.y < -this.height || 
           this.y > this.canvas.height;
  }

  /**
   * Get cat bounds for collision detection
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