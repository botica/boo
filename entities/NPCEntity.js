import { AnimatedEntity } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Base class for interactive NPC entities (Guy, Businessman, Witch)
 * Handles common movement and collision detection
 */
export class NPCEntity {
  constructor(assetManager, canvas, config = {}) {
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
    this.facing = config.defaultFacing || 'right';
    
    // Collision state
    this.colliding = false;
    
    // Level tracking
    this.currentLevel = config.level || 1;
    
    // Animation will be set up by subclass
    this.animator = null;
  }

  /**
   * Update NPC logic - override in subclass if needed
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

  /**
   * Update movement behavior - can be overridden by subclasses
   */
  updateMovement(dt) {
    // Allow subclasses to prevent movement
    if (this.shouldStayStationary()) {
      this.isMoving = false;
      this.vx = 0;
      return;
    }
    
    if (this.isMoving) {
      this.moveTimeLeft -= dt;
      this.x += this.vx * dt;
      this.updateFacingFromVelocity();
      
      if (this.moveTimeLeft <= 0) {
        this.stopMoving();
      }
    } else {
      this.nextMoveIn -= dt;
      
      if (this.nextMoveIn <= 0) {
        this.startRandomMove();
      }
    }
    
    // Keep NPC within bounds
    CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
  }

  /**
   * Update facing direction based on velocity
   */
  updateFacingFromVelocity() {
    if (this.vx > 0) {
      this.facing = 'right';
    } else if (this.vx < 0) {
      this.facing = 'left';
    }
  }

  /**
   * Stop moving and wait for next move
   */
  stopMoving() {
    this.isMoving = false;
    this.vx = 0;
    this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX + 1.0);
  }

  /**
   * Start a random movement
   */
  startRandomMove() {
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
    this.facing = dir > 0 ? 'right' : 'left';
  }

  /**
   * Check if NPC is completely off screen to the right
   * @returns {boolean} True if NPC is completely off screen
   */
  isOffScreen() {
    return this.x - this.width/2 > this.canvas.width;
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

  // Methods to be overridden by subclasses
  
  /**
   * Override to prevent movement (e.g., level 1 guy stays stationary)
   * @returns {boolean} True if NPC should not move
   */
  shouldStayStationary() {
    return false;
  }

  /**
   * Override to configure NPC for specific level
   * @param {Object} levelConfig - Level configuration
   */
  updateForLevel(levelConfig) {
    this.currentLevel = levelConfig.level;
  }

  /**
   * Override to reset NPC to initial state
   */
  reset() {
    this.vx = 0;
    this.isMoving = false;
    this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX);
    this.moveTimeLeft = 0;
    this.colliding = false;
  }
}
