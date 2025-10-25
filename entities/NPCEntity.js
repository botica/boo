import { AnimatedEntity } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Base class for interactive NPC entities (Guy, Businessman, Witch)
 * Handles common movement, escape sequences, collision detection, and cat rescue logic
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
    
    // Escape animation state
    this.isEscaping = false;
    this.escapeSpeed = Constants.PERSON.ESCAPE_SPEED;
    this.escapePhase = null; // 'initial', 'returning_for_cat', 'final_escape'
    this.catRescueTarget = null;
    this.carryingCat = false;
    
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

    // Handle escape animation first (takes priority)
    if (this.isEscaping) {
      this.updateEscape(dt);
    }
    // Handle movement when not in interaction and not escaping
    else if (!interactionActive) {
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
    
    // Keep NPC within bounds (only when not escaping)
    if (!this.isEscaping) {
      CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
    }
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
   * Update escape animation - NPC runs off screen to the right
   * @param {number} dt - Delta time in seconds
   */
  updateEscape(dt) {
    if (!this.escapePhase) {
      this.escapePhase = 'initial';
    }

    switch (this.escapePhase) {
      case 'initial':
        this.handleInitialEscape(dt);
        break;
        
      case 'returning_for_cat':
        this.handleCatReturn(dt);
        break;
        
      case 'final_escape':
        this.handleFinalEscape(dt);
        break;
    }
    
    // Log position occasionally (for debugging)
    if (Math.floor(performance.now() / 1000) % 2 === 0 && Math.floor(this.x) % 200 === 0) {
      console.log(`${this.constructor.name} escaping: phase=${this.escapePhase}, x=${Math.floor(this.x)}, canvas width=${this.canvas.width}, off screen=${this.isOffScreen()}`);
    }
  }

  /**
   * Handle initial escape phase - move right
   */
  handleInitialEscape(dt) {
    this.vx = this.escapeSpeed;
    this.x += this.vx * dt;
  }

  /**
   * Handle returning for cat phase - move left toward cat
   */
  handleCatReturn(dt) {
    if (this.catRescueTarget) {
      this.vx = -this.escapeSpeed * 0.8;
      this.x += this.vx * dt;
      
      // Check for collision with cat
      const npcLeft = this.x - this.width / 2;
      const catRight = this.catRescueTarget.x + this.catRescueTarget.width / 2;
      
      if (npcLeft <= catRight) {
        // Pick up the cat and reverse direction
        this.x = catRight + this.width / 2;
        this.vx = this.escapeSpeed;
        this.facing = 'right';
        this.catRescueTarget.vx = this.escapeSpeed;
        this.startFinalEscapeWithCat();
      }
    }
  }

  /**
   * Handle final escape phase - move right with cat
   */
  handleFinalEscape(dt) {
    this.vx = this.escapeSpeed;
    this.x += this.vx * dt;
    
    // Update cat position if carrying it
    if (this.carryingCat && this.catRescueTarget) {
      // Preserve cat's original y position (witch's behavior)
      this.catRescueTarget.startBeingCarried(this.vx, 0);
    }
  }

  /**
   * Start escape animation - NPC runs off screen in fear
   */
  startEscape() {
    console.log(`${this.constructor.name}.startEscape called`);
    this.isEscaping = true;
    this.isMoving = false;
    this.vx = 0;
    this.escapePhase = 'initial';
    this.catRescueTarget = null;
    this.carryingCat = false;
    
    // Set scared animation
    if (this.animator) {
      this.animator.setState('scared');
      console.log(`${this.constructor.name} animation set to scared`);
    }
  }

  /**
   * Start the cat rescue sequence (for level 3)
   */
  startCatRescue(cat) {
    console.log(`${this.constructor.name}.startCatRescue called`);
    this.escapePhase = 'returning_for_cat';
    this.catRescueTarget = cat;
    this.isEscaping = true;
    this.vx = 0;
  }

  /**
   * Start final escape with cat
   */
  startFinalEscapeWithCat() {
    console.log(`${this.constructor.name}.startFinalEscapeWithCat called`);
    this.escapePhase = 'final_escape';
    this.carryingCat = true;
    if (this.catRescueTarget) {
      this.catRescueTarget.startBeingCarried(this.escapeSpeed, 0);
    }
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
    this.isEscaping = false;
    this.escapePhase = null;
    this.catRescueTarget = null;
    this.carryingCat = false;
  }
}
