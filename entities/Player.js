import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Player (Ghost) entity class
 */
export class Player {
  constructor(assetManager, canvas) {
    this.canvas = canvas;
    this.assetManager = assetManager;
    
    // Position and movement
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = Constants.PLAYER.WIDTH;
    this.height = Constants.PLAYER.HEIGHT;
    
    // Movement properties
    this.speed = Constants.PLAYER.SPEED;
    this.accel = Constants.PLAYER.ACCEL;
    this.facing = 'right';
    
    // Float effects
    this.floatTimer = 0;
    this.floatActive = false;
    this.floatForce = 0;
    this.floatDirection = { x: 0, y: 0 };
    this.floatInitialSpeed = 0;
    this.floatCurrentSpeed = 0;
    this.keyPressStart = {};
    this.keyPressStartTime = 0;
    
    // Vertical float movement effect
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
    this.windChangeInterval = Constants.PLAYER.WIND_CHANGE_INTERVAL;
    
    // Initialize animation
    this.setupAnimation();
  }

  setupAnimation() {
    const ghostSprites = this.assetManager.getGhostSprites();
    const states = AnimationFactory.createGhostAnimations(ghostSprites);
    this.animator = new AnimatedEntity(states, 'default');
  }

  /**
   * Update player logic
   * @param {number} dt - Delta time in seconds
   * @param {Object} input - Input state
   * @param {Object} levelConfig - Current level configuration
   * @param {boolean} interactionActive - Whether player is in interaction mode
   * @param {boolean} animationInProgress - Whether animation is playing
   */
  update(dt, input, levelConfig, interactionActive, animationInProgress) {
    // Update animation
    this.animator.update(dt);

    // Handle movement when not in interaction or animation
    if (!interactionActive && !animationInProgress) {
      this.updateMovement(dt, input, levelConfig);
      this.updateAnimationState();
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  updateMovement(dt, input, levelConfig) {
    // Update float effects
    this.updateFloatEffects(dt, levelConfig);
    
    // Update wind effects
    this.updateWindEffects(dt, levelConfig);
    
    // Handle input for float system
    this.handleFloatInput(input);

    // Apply float velocity if active
    if (this.floatActive) {
      // Horizontal movement from float system
      this.vx = this.floatDirection.x * this.floatCurrentSpeed;
      
      // Vertical movement with acceleration (same as normal movement)
      let inputY = 0;
      if (input.keys['ArrowUp']) inputY -= 1;
      if (input.keys['ArrowDown']) inputY += 1;
      
      // Calculate target vertical velocity 
      let targetVy = 0;
      if (inputY !== 0) {
        targetVy = inputY * this.speed;
      }
      
      // Apply acceleration to vertical movement
      const maxDelta = this.accel * dt;
      const dvy = targetVy - this.vy;
      if (Math.abs(dvy) > maxDelta) this.vy += Math.sign(dvy) * maxDelta;
      else this.vy = targetVy;
      
      // Note: Bounds checking temporarily disabled to test float movement
      // The existing CollisionDetector.clampToBounds will handle final positioning
    } else {
      // Normal movement when not floating - only vertical movement allowed
      // Horizontal movement is handled exclusively by the float system
      let inputX = 0, inputY = 0;
      if (input.keys['ArrowUp']) inputY -= 1;
      if (input.keys['ArrowDown']) inputY += 1;
      // Note: ArrowLeft and ArrowRight are not processed for regular movement

      // Calculate target velocity (only vertical)
      let targetVx = 0, targetVy = 0;
      if (inputY !== 0) {
        targetVy = inputY * this.speed;
      }

      // Apply acceleration
      const maxDelta = this.accel * dt;
      const dvx = targetVx - this.vx;
      const dvy = targetVy - this.vy;
      
      if (Math.abs(dvx) > maxDelta) this.vx += Math.sign(dvx) * maxDelta;
      else this.vx = targetVx;
      if (Math.abs(dvy) > maxDelta) this.vy += Math.sign(dvy) * maxDelta;
      else this.vy = targetVy;
    }

    // Apply wind effect to position
    this.x += this.windVx * dt;
    this.y += this.windVy * dt;

    // Update position with bounds checking
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
  }

  handleFloatInput(input) {
    const currentTime = Date.now() / 1000; // Convert to seconds
    
    // Update facing direction based on current key presses
    if (input.keys['ArrowLeft']) {
      this.facing = 'left';
    } else if (input.keys['ArrowRight']) {
      this.facing = 'right';
    }
    
    // Check for new key presses - start float immediately
    ['ArrowLeft', 'ArrowRight'].forEach(key => {
      if (input.keys[key] && !this.keyPressStart[key] && !this.floatActive) {
        // Key just pressed - start float immediately
        this.keyPressStart[key] = currentTime;
        this.startFloat(key, 'immediate');
      } else if (!input.keys[key] && this.keyPressStart[key]) {
        // Key released - store the total hold duration for the current float
        if (this.floatActive && this.floatKey === key) {
          this.totalHoldDuration = currentTime - this.keyPressStart[key];
        }
        this.keyPressStart[key] = null;
      }
    });
  }

  startFloat(key, mode) {
    // Set direction based on key
    const direction = key === 'ArrowLeft' ? -1 : 1;
    
    // Update facing direction
    this.facing = direction > 0 ? 'right' : 'left';
    
    // Initialize float - always start with small float
    this.floatActive = true;
    this.floatTimer = 0;
    this.floatMode = 'small'; // Track current float size
    this.floatKey = key; // Track which key triggered this float
    this.totalHoldDuration = undefined; // Reset hold duration tracking
    
    // Set horizontal direction, vertical movement is handled separately via acceleration
    this.floatDirection.x = direction;
    this.floatDirection.y = 0; // Not used for movement anymore
    this.floatInitialSpeed = Constants.PLAYER.FLOAT_TIERS.small.force;
    this.floatCurrentSpeed = Constants.PLAYER.FLOAT_TIERS.small.force;
    
    // Initialize vertical float effect - quick upward movement at start
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = Constants.PLAYER.FLOAT_VERTICAL_INITIAL_VELOCITY;
  }

  updateFloatEffects(dt, levelConfig) {
    if (levelConfig && levelConfig.hasFloats !== false) {
      if (this.floatActive) {
        this.floatTimer += dt;
        
        // Check if key is still held to determine if we should extend the float
        const currentTime = Date.now() / 1000;
        const keyStillHeld = this.keyPressStart[this.floatKey] !== null;
        
        // Use total hold duration (either ongoing or stored from key release)
        let holdDuration;
        if (keyStillHeld) {
          holdDuration = currentTime - this.keyPressStart[this.floatKey];
        } else if (this.totalHoldDuration !== undefined) {
          holdDuration = this.totalHoldDuration;
        } else {
          holdDuration = 0;
        }
        
        // Determine current float mode based on how long key was/is held
        let targetMode = 'small';
        let targetForce = Constants.PLAYER.FLOAT_TIERS.small.force;
        const targetDuration = Constants.PLAYER.FLOAT_DURATION; // Same duration for all
        
        // Check tiers in descending order to find the appropriate tier
        if (holdDuration > Constants.PLAYER.FLOAT_TIERS.large.threshold) {
          targetMode = 'large';
          targetForce = Constants.PLAYER.FLOAT_TIERS.large.force;
        } else if (holdDuration > Constants.PLAYER.FLOAT_TIERS.medium.threshold) {
          targetMode = 'medium';
          targetForce = Constants.PLAYER.FLOAT_TIERS.medium.force;
        }
        
        // Smoothly transition to new force if mode changed
        if (targetMode !== this.floatMode) {
          this.floatMode = targetMode;
          // Update the force immediately
          this.floatInitialSpeed = targetForce;
          this.floatCurrentSpeed = targetForce;
        }
        
        // Calculate completion based on target duration
        const progress = this.floatTimer / targetDuration;
        if (progress >= 1.0) {
          // Float is complete
          this.floatActive = false;
          this.vx = 0;
          this.vy = 0;
          this.floatVerticalOffset = 0;
          this.floatVerticalVelocity = 0;
          // Clear any pending key presses to prevent immediate new float
          this.keyPressStart = {};
        } else {
          // Start at full speed immediately, then slow down after a period
          // Maintain full speed for first portion, then decelerate
          let speedMultiplier;
          if (progress < Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) {
            // Full speed for first portion of duration
            speedMultiplier = 1.0;
          } else {
            // After full speed period, use steep deceleration
            const decelerateProgress = (progress - Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) / 
                                      Constants.PLAYER.FLOAT_DECELERATION_RATIO; // Normalize remaining time
            const easeFactor = Math.pow(1 - decelerateProgress, 2); // Quadratic ease-out
            speedMultiplier = Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR + 
                             (1 - Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR) * easeFactor;
          }
          
          this.floatCurrentSpeed = this.floatInitialSpeed * speedMultiplier;
          
          // Update vertical float effect
          // Apply gravity-like effect to bring player back down
          this.floatVerticalVelocity += Constants.PLAYER.FLOAT_VERTICAL_GRAVITY * dt;
          this.floatVerticalOffset += this.floatVerticalVelocity * dt;
          
          // Apply damping to prevent oscillation
          this.floatVerticalVelocity *= Constants.PLAYER.FLOAT_VERTICAL_DAMPING;
        }
      }
    }
  }

  updateWindEffects(dt, levelConfig) {
    if (levelConfig && levelConfig.hasWind) {
      this.windTimer += dt;
      
      if (this.windTimer >= this.windChangeInterval) {
        this.windTimer = 0;
        
        // Generate random wind force - level 4 has double strength
        let windStrength;
        if (levelConfig.level === 4) {
          windStrength = MathUtils.random(
            Constants.PLAYER.WIND_STRENGTH_LEVEL4_MIN, 
            Constants.PLAYER.WIND_STRENGTH_LEVEL4_MAX
          );
        } else {
          windStrength = MathUtils.random(
            Constants.PLAYER.WIND_STRENGTH_NORMAL_MIN, 
            Constants.PLAYER.WIND_STRENGTH_NORMAL_MAX
          );
        }
        
        const windAngle = Math.random() * Math.PI * 2;
        const windForceX = Math.cos(windAngle) * windStrength;
        const windForceY = Math.sin(windAngle) * windStrength * Constants.PLAYER.WIND_Y_FACTOR;
        
        this.windVx = this.windVx * Constants.PLAYER.WIND_INERTIA + 
                     windForceX * (1 - Constants.PLAYER.WIND_INERTIA);
        this.windVy = this.windVy * Constants.PLAYER.WIND_INERTIA + 
                     windForceY * (1 - Constants.PLAYER.WIND_INERTIA);
      }
      
      this.windVx *= Constants.PLAYER.WIND_DECAY;
      this.windVy *= Constants.PLAYER.WIND_DECAY;
    } else {
      this.windVx *= Constants.PLAYER.WIND_DECAY_NO_WIND;
      this.windVy *= Constants.PLAYER.WIND_DECAY_NO_WIND;
    }
  }

  updateAnimationState() {
    const playerIsMoving = Math.abs(this.vx) > 0.001 || Math.abs(this.vy) > 0.001;
    if (playerIsMoving && this.animator.currentState === 'default') {
      this.animator.setState('moving');
    } else if (!playerIsMoving && this.animator.currentState === 'moving') {
      this.animator.setState('default');
    }
  }

  /**
   * Reset player to initial state
   */
  reset() {
    this.x = this.canvas.width - this.width/2 - Constants.PLAYER.SPAWN_OFFSET_X;
    this.y = this.height/2 + Constants.PLAYER.SPAWN_OFFSET_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    this.floatTimer = 0;
    this.floatActive = false;
    this.floatForce = 0;
    this.floatDirection = { x: 0, y: 0 };
    this.floatInitialSpeed = 0;
    this.floatCurrentSpeed = 0;
    this.floatMode = 'small';
    this.floatKey = null;
    this.keyPressStart = {};
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    this.animator.setState('default');
  }

  /**
   * Get current sprite frame
   * @returns {HTMLImageElement|null} Current sprite frame
   */
  getCurrentFrame() {
    return this.animator.getCurrentFrame();
  }

  /**
   * Get the effective Y position including vertical float effect
   * @returns {number} Y position with float effect applied
   */
  getEffectiveY() {
    return this.y + this.floatVerticalOffset;
  }

  /**
   * Set animation state
   * @param {string} state - Animation state name
   * @param {Object} options - Animation options
   */
  setAnimationState(state, options = {}) {
    this.animator.setState(state, options);
  }
}