import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Person entity class (the character being scared)
 */
export class Person {
  constructor(assetManager, canvas) {
    this.canvas = canvas;
    this.assetManager = assetManager;
    
    // Position and movement
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.width = Constants.PERSON.WIDTH;
    this.height = Constants.PERSON.HEIGHT;
    
    // Movement properties
    this.isMoving = false;
    this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX);
    this.moveTimeLeft = 0;
    this.moveSpeed = Constants.PERSON.MOVE_SPEED;
    
    // Collision state
    this.colliding = false;
    
    // Animation will be set up when level is configured
    this.animator = null;
  }

  /**
   * Update person for the current level
   * @param {Object} levelConfig - Current level configuration
   */
  updateForLevel(levelConfig) {
    let sprites;
    switch (levelConfig.level) {
      case 2:
        sprites = this.assetManager.getBusinessSprites();
        break;
      default:
        sprites = this.assetManager.getPersonSprites();
        break;
    }
    
    const states = AnimationFactory.createPersonAnimations(sprites);
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update person logic
   * @param {number} dt - Delta time in seconds
   * @param {boolean} interactionActive - Whether player is in interaction mode
   */
  update(dt, interactionActive) {
    // Update animation
    if (this.animator) {
      this.animator.update(dt);
    }

    // Handle movement when not in interaction
    if (!interactionActive) {
      this.updateMovement(dt);
    }
  }

  updateMovement(dt) {
    if (this.isMoving) {
      this.moveTimeLeft -= dt;
      this.x += this.vx * dt;
      
      if (this.moveTimeLeft <= 0) {
        this.isMoving = false;
        this.vx = 0;
        this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX + 1.0);
      }
    } else {
      this.nextMoveIn -= dt;
      
      if (this.nextMoveIn <= 0) {
        this.isMoving = true;
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.moveTimeLeft = MathUtils.random(
          Constants.PERSON.MOVE_DURATION_MIN, 
          Constants.PERSON.MOVE_DURATION_MAX + 0.15
        );
        const speed = this.moveSpeed * MathUtils.random(
          Constants.PERSON.MOVE_SPEED_VARIANCE_MIN, 
          Constants.PERSON.MOVE_SPEED_VARIANCE_MAX + 0.3
        );
        this.vx = dir * speed;
      }
    }
    
    // Keep person within bounds
    CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
  }

  /**
   * Reset person to initial state
   */
  reset() {
    this.x = this.width/2 + 10;
    this.y = this.canvas.height - this.height/2 - 10;
    this.vx = 0;
    this.isMoving = false;
    this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX);
    this.moveTimeLeft = 0;
    this.colliding = false;
    
    if (this.animator) {
      this.animator.setState('default');
    }
  }

  /**
   * Get current sprite frame
   * @returns {HTMLImageElement|null} Current sprite frame
   */
  getCurrentFrame() {
    return this.animator ? this.animator.getCurrentFrame() : null;
  }

  /**
   * Set animation state
   * @param {string} state - Animation state name
   * @param {Object} options - Animation options
   */
  setAnimationState(state, options = {}) {
    if (this.animator) {
      this.animator.setState(state, options);
    }
  }

  /**
   * Check collision with another entity
   * @param {Object} other - Other entity with x, y, width, height
   * @returns {boolean} True if colliding
   */
  checkCollision(other) {
    return CollisionDetector.checkAABBCollision(this, other);
  }

  /**
   * Determine collision side with another entity
   * @param {Object} other - Other entity
   * @returns {Object} Collision information
   */
  getCollisionInfo(other) {
    return CollisionDetector.getCollisionInfo(this, other);
  }
}