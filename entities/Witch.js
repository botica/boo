import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Witch entity class (the character being scared in level 3)
 */
export class Witch {
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
    // Facing direction: 'right' or 'left'
    this.facing = 'right'; // Start facing right
    
    // Escape animation state
    this.isEscaping = false;
    this.escapeSpeed = Constants.PERSON.ESCAPE_SPEED;
    this.escapePhase = null; // 'initial', 'returning_for_cat', 'final_escape'
    this.catRescueTarget = null;
    this.carryingCat = false;
    
    // Collision state
    this.colliding = false;
    
    // Level tracking for behavior changes
    this.currentLevel = 3; // Witch only appears in level 3
    
    // Animation will be set up when level is configured
    this.animator = null;
  }

  /**
   * Update witch for the current level
   * @param {Object} levelConfig - Current level configuration
   */
  updateForLevel(levelConfig) {
    this.currentLevel = levelConfig.level;
    
    // Witch uses witch sprites
    const sprites = this.assetManager.getWitchSprites();
    const states = AnimationFactory.createPersonAnimations(sprites);
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update witch logic
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

  updateMovement(dt) {
    if (this.isMoving) {
      this.moveTimeLeft -= dt;
      this.x += this.vx * dt;
      // Change facing based on movement direction
      if (this.vx > 0) {
        this.facing = 'right';
      } else if (this.vx < 0) {
        this.facing = 'left';
      }
      
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
        // Set facing immediately on movement start
        this.facing = dir > 0 ? 'right' : 'left';
      }
    }
    
    // Keep witch within bounds (only when not escaping)
    if (!this.isEscaping) {
      CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Update escape animation - witch runs off screen to the right
   * @param {number} dt - Delta time in seconds
   */
  updateEscape(dt) {
    if (!this.escapePhase) {
      this.escapePhase = 'initial';
    }

    switch (this.escapePhase) {
      case 'initial':
        // Move right at escape speed
        this.vx = this.escapeSpeed;
        this.x += this.vx * dt;
        break;
        
      case 'returning_for_cat':
        // Move left back toward the cat
        if (this.catRescueTarget) {
          this.vx = -this.escapeSpeed * 0.8;
          this.x += this.vx * dt;
          // Check for left side of witch colliding with right side of cat
          const witchLeft = this.x - this.width / 2;
          const catRight = this.catRescueTarget.x + this.catRescueTarget.width / 2;
          if (witchLeft <= catRight) {
            // Pick up the cat and change directions
            this.x = catRight + this.width / 2; // Snap witch to cat
            this.vx = this.escapeSpeed;
            this.facing = 'right';
            // Only update cat's velocity, do not snap its x position
            this.catRescueTarget.vx = this.escapeSpeed;
            this.startFinalEscapeWithCat();
          }
        }
        break;
        
      case 'final_escape':
        // Move right at escape speed with cat
        this.vx = this.escapeSpeed;
        this.x += this.vx * dt;
        
        // Update cat position if carrying it (keep original y)
        if (this.carryingCat && this.catRescueTarget) {
          this.catRescueTarget.startBeingCarried(this.x, this.catRescueTarget.y, this.vx, 0);
        }
        break;
    }
    
    // Log position occasionally
    if (Math.floor(performance.now() / 1000) % 2 === 0 && Math.floor(this.x) % 200 === 0) {
      console.log(`Witch escaping: phase=${this.escapePhase}, x=${Math.floor(this.x)}, canvas width=${this.canvas.width}, off screen=${this.isOffScreen()}`);
    }
    
    // No bounds checking during escape - allow movement off screen
  }

  /**
   * Reset witch to initial state
   */
  reset() {
    this.x = this.width/2 + Constants.PERSON.SPAWN_OFFSET_X;
    this.y = this.canvas.height - this.height/2 - Constants.PERSON.SPAWN_OFFSET_Y;
    this.vx = 0;
    this.isMoving = false;
    this.nextMoveIn = MathUtils.random(Constants.PERSON.MOVE_WAIT_MIN, Constants.PERSON.MOVE_WAIT_MAX);
    this.moveTimeLeft = 0;
    this.colliding = false;
    this.isEscaping = false;
    this.escapePhase = null;
    this.catRescueTarget = null;
    this.carryingCat = false;
    this.facing = 'right'; // Reset facing to right
    
    if (this.animator) {
      this.animator.setState('default');
    }
  }

  /**
   * Start escape animation - witch runs off screen in fear
   */
  startEscape() {
    console.log('Witch.startEscape called');
    this.isEscaping = true;
    this.isMoving = false;
    this.vx = 0;
    this.escapePhase = 'initial'; // Track escape phase
    this.catRescueTarget = null;
    this.carryingCat = false;
    
    // Set scared animation
    if (this.animator) {
      this.animator.setState('scared');
      console.log('Witch animation set to scared');
    }
  }

  /**
   * Start the cat rescue sequence for level 3
   */
  startCatRescue(cat) {
    console.log('Witch.startCatRescue called');
    this.escapePhase = 'returning_for_cat';
    this.catRescueTarget = cat;
    this.isEscaping = true;
    this.vx = 0; // Will be set in update loop
  }

  /**
   * Check if witch has reached the cat during rescue
   */
  hasReachedCat() {
  // No longer used for pickup logic
  return false;
  }

  /**
   * Start final escape with cat
   */
  startFinalEscapeWithCat() {
    console.log('Witch.startFinalEscapeWithCat called');
    this.escapePhase = 'final_escape';
    this.carryingCat = true;
    if (this.catRescueTarget) {
      this.catRescueTarget.startBeingCarried(this.x, this.catRescueTarget.y, this.escapeSpeed, 0);
    }
  }

  /**
   * Check if witch is completely off screen to the right
   * @returns {boolean} True if witch is completely off screen
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
}
