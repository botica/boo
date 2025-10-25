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
    
    // Movement properties for escape sequence
    this.vx = 0;
    this.vy = 0;
    this.isBeingCarried = false;
    this.originalX = 0;
    this.originalY = 0;
    
    // Set initial position
    this.setInitialPosition();
    
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
   * Set initial position based on canvas size
   */
  setInitialPosition() {
    this.x = this.canvas.width - this.width - Constants.CAT.MARGIN_FROM_EDGE - 150;
    this.y = this.canvas.height - this.height / 2;
    this.originalX = this.x;
    this.originalY = this.y;
  }

  /**
   * Get the current sprite frame for rendering
   */
  get sprite() {
    return this.animation?.getCurrentFrame() ?? null;
  }

  update(dt) {
    // Update animation
    this.animation?.update(dt);
    
    // For now, cat doesn't move unless it's being carried
    if (this.isBeingCarried) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }

  /**
   * Start being carried during escape sequence
   */
  startBeingCarried(carrierVx, carrierVy) {
    this.isBeingCarried = true;
    this.vx = carrierVx;
    this.vy = carrierVy;
  }

  /**
   * Update cat position based on canvas size (called on resize)
   */
  updatePosition() {
    // Just use the same initial position calculation
    if (!this.isBeingCarried) {
      this.setInitialPosition();
    } else {
      // Update original position for when cat is released
      this.originalX = this.canvas.width - this.width - Constants.CAT.MARGIN_FROM_EDGE - 150;
      this.originalY = this.canvas.height - this.height / 2;
    }
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
    this.animation?.setState('scared');
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