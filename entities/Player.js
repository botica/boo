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
    
    // ===== BASIC PROPERTIES =====
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = Constants.PLAYER.WIDTH;
    this.height = Constants.PLAYER.HEIGHT;
    this.facing = 'right';
    
    // ===== FLOAT SYSTEM =====
    this.floatTimer = 0;
    this.floatActive = false;
    this.floatDirection = { x: 0, y: 0 };
    this.floatInitialSpeed = 0;
    this.floatCurrentSpeed = 0;
    this.floatMode = 'small';
    this.floatKey = null;
    this.keyPressStart = {};
    this.totalHoldDuration = undefined;
    this.floatResidualVx = 0; // Horizontal velocity that persists after float ends
    
    // ===== VERTICAL FLOAT EFFECT =====
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    
    // ===== WIND SYSTEM =====
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

  // =================== MAIN UPDATE METHODS ===================
  
  /**
   * Update player logic
   * @param {number} dt - Delta time in seconds
   * @param {Object} input - Input state
   * @param {Object} levelConfig - Current level configuration
   * @param {boolean} interactionActive - Whether player is in interaction mode
   * @param {boolean} animationInProgress - Whether animation is playing
   */
  update(dt, input, levelConfig, interactionActive, animationInProgress) {
    this.animator.update(dt);

    if (!interactionActive && !animationInProgress) {
      this.updateMovement(dt, input, levelConfig);
      this.updateAnimationState();
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  updateMovement(dt, input, levelConfig) {
    this.updateFloatEffects(dt, levelConfig);
    this.updateWindEffects(dt, levelConfig);
    this.handleFloatInput(input);
    this.handleVerticalMovement(input);
    this.updatePosition(dt);
  }

  // =================== MOVEMENT HANDLING ===================
  
  handleVerticalMovement(input) {
    let inputY = 0;
    if (input.keys['ArrowUp']) inputY -= 1;
    if (input.keys['ArrowDown']) inputY += 1;
    
    let targetVy = 0;
    if (inputY !== 0) {
      targetVy = inputY * Constants.PLAYER.VERTICAL_SPEED;
    }
    
    // Apply inertia
    if (inputY !== 0) {
      this.vy = targetVy; // Instant response when key is pressed
    } else {
      this.vy *= Constants.PLAYER.VERTICAL_INERTIA; // Gradual slowdown when key released
    }
  }

  updatePosition(dt) {
    // Set horizontal velocity from float system
    if (this.floatActive) {
      this.vx = this.floatDirection.x * this.floatCurrentSpeed;
      this.floatResidualVx = this.vx; // Store current velocity for inertia after float ends
    } else {
      // Apply inertia to residual float velocity (gradual slowdown)
      this.floatResidualVx *= Constants.PLAYER.FLOAT_HORIZONTAL_INERTIA;
      this.vx = this.floatResidualVx;
    }

    // Apply wind effect
    this.x += this.windVx * dt;
    this.y += this.windVy * dt;

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.applyBoundsChecking();
  }

  applyBoundsChecking() {
    if (this.floatActive && this.floatVerticalOffset !== 0) {
      // Custom bounds checking for float effect
      const effectiveY = this.y + this.floatVerticalOffset;
      const halfH = this.height / 2;
      
      if (effectiveY - halfH < 0) {
        this.y = halfH - this.floatVerticalOffset;
      } else if (effectiveY + halfH > this.canvas.height) {
        this.y = this.canvas.height - halfH - this.floatVerticalOffset;
      }
      
      // Horizontal bounds
      const halfW = this.width / 2;
      this.x = Math.max(halfW, Math.min(this.canvas.width - halfW, this.x));
    } else {
      // Normal bounds checking
      CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
    }
  }

  // =================== FLOAT SYSTEM ===================
  
  handleFloatInput(input) {
    const currentTime = this.getCurrentTime();
    
    // Update facing direction based on current key presses
    this.updateFacingDirection(input);
    
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
  
  updateFacingDirection(input) {
    if (input.keys['ArrowLeft']) {
      this.facing = 'left';
    } else if (input.keys['ArrowRight']) {
      this.facing = 'right';
    }
  }
  
  getCurrentTime() {
    return Date.now() / Constants.PLAYER.TIME_SCALE;
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
        const currentTime = this.getCurrentTime();
        const keyStillHeld = this.keyPressStart[this.floatKey] !== null;
        
        // Use total hold duration (either ongoing or stored from key release)
        const holdDuration = this.calculateHoldDuration(currentTime, keyStillHeld);
        
        // Determine current float mode based on how long key was/is held
        const { targetMode, targetForce } = this.determineFloatTier(holdDuration);
        const targetDuration = Constants.PLAYER.FLOAT_DURATION; // Same duration for all
        
        // Smoothly transition to new force if mode changed
        this.updateFloatMode(targetMode, targetForce, dt);
        
        // Calculate completion based on target duration
        const progress = this.floatTimer / targetDuration;
        if (progress >= 1.0) {
          this.endFloat();
        } else {
          this.updateFloatSpeed(progress);
          this.updateVerticalFloatEffect(dt);
        }
      }
    }
  }
  
  calculateHoldDuration(currentTime, keyStillHeld) {
    if (keyStillHeld) {
      return currentTime - this.keyPressStart[this.floatKey];
    } else if (this.totalHoldDuration !== undefined) {
      return this.totalHoldDuration;
    }
    return 0;
  }
  
  determineFloatTier(holdDuration) {
    let targetMode = 'small';
    let targetForce = Constants.PLAYER.FLOAT_TIERS.small.force;
    
    // Check tiers in descending order to find the appropriate tier
    if (holdDuration > Constants.PLAYER.FLOAT_TIERS.large.threshold) {
      targetMode = 'large';
      targetForce = Constants.PLAYER.FLOAT_TIERS.large.force;
    }
    
    return { targetMode, targetForce };
  }
  
  updateFloatMode(targetMode, targetForce, dt) {
    // Smoothly transition to new force if mode changed
    if (targetMode !== this.floatMode) {
      this.floatMode = targetMode;
      this.floatInitialSpeed = targetForce;
    }
    
    // Smooth interpolation towards target force
    const interpolationSpeed = Constants.PLAYER.FLOAT_TIER_INTERPOLATION_SPEED;
    const speedDifference = targetForce - this.floatCurrentSpeed;
    const maxChange = interpolationSpeed * dt;
    
    if (Math.abs(speedDifference) > maxChange) {
      this.floatCurrentSpeed += Math.sign(speedDifference) * maxChange;
    } else {
      this.floatCurrentSpeed = targetForce;
    }
  }
  
  updateFloatSpeed(progress) {
    // Start at full speed immediately, then slow down after a period
    let speedMultiplier;
    if (progress < Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) {
      // Full speed for first portion of duration
      speedMultiplier = 1.0;
    } else {
      // After full speed period, use steep deceleration
      const decelerateProgress = (progress - Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) / 
                                Constants.PLAYER.FLOAT_DECELERATION_RATIO;
      const easeFactor = Math.pow(1 - decelerateProgress, 2); // Quadratic ease-out
      speedMultiplier = Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR + 
                       (1 - Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR) * easeFactor;
    }
    
    this.floatCurrentSpeed = this.floatInitialSpeed * speedMultiplier;
  }
  
  updateVerticalFloatEffect(dt) {
    // Apply gravity-like effect to bring player back down
    this.floatVerticalVelocity += Constants.PLAYER.FLOAT_VERTICAL_GRAVITY * dt;
    this.floatVerticalOffset += this.floatVerticalVelocity * dt;
    
    // Apply damping to prevent oscillation
    this.floatVerticalVelocity *= Constants.PLAYER.FLOAT_VERTICAL_DAMPING;
  }
  
  endFloat() {
    this.floatActive = false;
    // Don't zero vx immediately - let inertia handle the deceleration
    this.vy = 0;
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    // Clear any pending key presses to prevent immediate new float
    this.keyPressStart = {};
  }

  // =================== WIND SYSTEM ===================
  
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

  // =================== ANIMATION & UTILITY METHODS ===================
  
  updateAnimationState() {
    const playerIsMoving = Math.abs(this.vx) > Constants.PLAYER.MOVEMENT_THRESHOLD || 
                          Math.abs(this.vy) > Constants.PLAYER.MOVEMENT_THRESHOLD;
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
    // Position and basic movement
    this.x = this.canvas.width - this.width/2 - Constants.PLAYER.SPAWN_OFFSET_X;
    this.y = this.height/2 + Constants.PLAYER.SPAWN_OFFSET_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    
    // Float system
    this.floatTimer = 0;
    this.floatActive = false;
    this.floatDirection = { x: 0, y: 0 };
    this.floatInitialSpeed = 0;
    this.floatCurrentSpeed = 0;
    this.floatMode = 'small';
    this.floatKey = null;
    this.keyPressStart = {};
    this.totalHoldDuration = undefined;
    this.floatResidualVx = 0;
    
    // Vertical float effect
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    
    // Wind system
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
    
    // Animation
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