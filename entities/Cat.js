import { Constants } from '../config/Constants.js';
import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';

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
    
    // Position cat in bottom right corner, moved left 150px total, bottom-aligned
    this.x = canvas.width - this.width - Constants.CAT.MARGIN_FROM_EDGE - 150;
    this.y = canvas.height - this.height/2; // Center Y at bottom edge to align sprite bottom with canvas bottom
    
    // Movement properties for escape sequence
    this.vx = 0;
    this.vy = 0;
    this.isBeingCarried = false;
    this.originalX = this.x;
    this.originalY = this.y;
    
    // Sprite and animation
    this.sprites = null;
    this.animation = null;
    this.loadSprite();
  }

  loadSprite() {
    this.sprites = this.assetManager.getCatSprite();
    
    // Initialize animation system
    const animationStates = AnimationFactory.createCatAnimations(this.sprites);
    this.animation = new AnimatedEntity(animationStates, 'default');
  }

  /**
   * Get the current sprite frame for rendering
   */
  get sprite() {
    return this.animation ? this.animation.getCurrentFrame() : null;
  }

  update(dt) {
    // Update animation
    if (this.animation) {
      this.animation.update(dt);
    }
    
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
  // Do NOT snap cat to witch's position, just update velocity
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
    
    // Reset animation to default state
    if (this.animation) {
      this.animation.setState('default');
    }
  }

  /**
   * Set cat to scared state (called when person is scared on level 3)
   */
  setScared() {
    if (this.animation) {
      this.animation.setState('scared');
    }
  }

  /**
   * Check if cat is off screen
   */
  isOffScreen() {
  // Only off screen if the entire image is past the right edge
  return (this.x - this.width / 2) > this.canvas.width;
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