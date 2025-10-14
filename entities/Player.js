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
    
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = Constants.PLAYER.WIDTH;
    this.height = Constants.PLAYER.HEIGHT;
    this.facing = 'right';
    
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
    
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
    this.windChangeInterval = Constants.PLAYER.WIND_CHANGE_INTERVAL;
    
    this.setupAnimation();
  }

  setupAnimation() {
    const ghostSprites = this.assetManager.getGhostSprites();
    const states = AnimationFactory.createGhostAnimations(ghostSprites);
    this.animator = new AnimatedEntity(states, 'default');
  }

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

  handleVerticalMovement(input) {
    let inputY = 0;
    if (input.keys['ArrowUp']) inputY -= 1;
    if (input.keys['ArrowDown']) inputY += 1;
    
    let targetVy = 0;
    if (inputY !== 0) {
      targetVy = inputY * Constants.PLAYER.VERTICAL_SPEED;
    }
    
    if (inputY !== 0) {
      this.vy = targetVy;
    } else {
      this.vy *= Constants.PLAYER.VERTICAL_INERTIA;
    }
  }

  updatePosition(dt) {
    if (this.floatActive) {
      this.vx = this.floatDirection.x * this.floatCurrentSpeed;
      this.floatResidualVx = this.vx;
    } else {
      this.floatResidualVx *= Constants.PLAYER.FLOAT_HORIZONTAL_INERTIA;
      this.vx = this.floatResidualVx;
    }

    this.x += this.windVx * dt;
    this.y += this.windVy * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.applyBoundsChecking();
  }

  applyBoundsChecking() {
    if (this.floatActive && this.floatVerticalOffset !== 0) {
      const effectiveY = this.y + this.floatVerticalOffset;
      const halfH = this.height / 2;
      
      if (effectiveY - halfH < 0) {
        this.y = halfH - this.floatVerticalOffset;
      } else if (effectiveY + halfH > this.canvas.height) {
        this.y = this.canvas.height - halfH - this.floatVerticalOffset;
      }
      
      const halfW = this.width / 2;
      this.x = Math.max(halfW, Math.min(this.canvas.width - halfW, this.x));
    } else {
      CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
    }
  }

  handleFloatInput(input) {
    const currentTime = this.getCurrentTime();
    
    this.updateFacingDirection(input);
    
    ['ArrowLeft', 'ArrowRight'].forEach(key => {
      if (input.keys[key] && !this.keyPressStart[key] && !this.floatActive) {
        this.keyPressStart[key] = currentTime;
        this.startFloat(key, 'immediate');
      } else if (!input.keys[key] && this.keyPressStart[key]) {
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
    const direction = key === 'ArrowLeft' ? -1 : 1;
    this.facing = direction > 0 ? 'right' : 'left';
    
    this.floatActive = true;
    this.floatTimer = 0;
    this.floatMode = 'small';
    this.floatKey = key;
    this.totalHoldDuration = undefined;
    
    this.floatDirection.x = direction;
    this.floatDirection.y = 0;
    this.floatInitialSpeed = Constants.PLAYER.FLOAT_TIERS.small.force;
    this.floatCurrentSpeed = Constants.PLAYER.FLOAT_TIERS.small.force;
    
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
  }

  updateFloatEffects(dt, levelConfig) {
    if (levelConfig && levelConfig.hasFloats !== false) {
      if (this.floatActive) {
        this.floatTimer += dt;
        
        const currentTime = this.getCurrentTime();
        const keyStillHeld = this.keyPressStart[this.floatKey] !== null;
        
        const holdDuration = this.calculateHoldDuration(currentTime, keyStillHeld);
        
        const { targetMode, targetForce, targetDuration } = this.determineFloatTier(holdDuration);
        
        this.updateFloatMode(targetMode, targetForce, dt);
        
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
    let targetDuration = Constants.PLAYER.FLOAT_TIERS.small.duration;
    
    if (holdDuration > Constants.PLAYER.FLOAT_TIERS.large.threshold) {
      targetMode = 'large';
      targetForce = Constants.PLAYER.FLOAT_TIERS.large.force;
      targetDuration = Constants.PLAYER.FLOAT_TIERS.large.duration;
    }
    
    return { targetMode, targetForce, targetDuration };
  }
  
  updateFloatMode(targetMode, targetForce, dt) {
    if (targetMode !== this.floatMode) {
      this.floatMode = targetMode;
      this.floatInitialSpeed = targetForce;
    }
    
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
    let speedMultiplier;
    if (progress < Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) {
      speedMultiplier = 1.0;
    } else {
      const decelerateProgress = (progress - Constants.PLAYER.FLOAT_FULL_SPEED_RATIO) / 
                                Constants.PLAYER.FLOAT_DECELERATION_RATIO;
      const easeFactor = Math.pow(1 - decelerateProgress, 2);
      speedMultiplier = Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR + 
                       (1 - Constants.PLAYER.FLOAT_SLOWDOWN_FACTOR) * easeFactor;
    }
    
    this.floatCurrentSpeed = this.floatInitialSpeed * speedMultiplier;
  }
  
  updateVerticalFloatEffect(dt) {
    const currentTier = Constants.PLAYER.FLOAT_TIERS[this.floatMode];
    const progress = Math.min(this.floatTimer / currentTier.duration, 1.0);
    
    // Simple sine wave creates natural arc motion
    this.floatVerticalOffset = -Math.sin(progress * Math.PI) * currentTier.hopHeight;
  }
  
  endFloat() {
    this.floatActive = false;
    this.vy = 0;
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    this.keyPressStart = {};
  }

  // =================== WIND SYSTEM ===================
  
  updateWindEffects(dt, levelConfig) {
    if (levelConfig && levelConfig.hasWind) {
      this.windTimer += dt;
      
      if (this.windTimer >= this.windChangeInterval) {
        this.windTimer = 0;
        
        // Generate random wind force
        const windStrength = MathUtils.random(
          Constants.PLAYER.WIND_STRENGTH_NORMAL_MIN, 
          Constants.PLAYER.WIND_STRENGTH_NORMAL_MAX
        );
        
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
    const playerIsMoving = Math.abs(this.vx) > Constants.PLAYER.MOVEMENT_THRESHOLD || 
                          Math.abs(this.vy) > Constants.PLAYER.MOVEMENT_THRESHOLD;
    if (playerIsMoving && this.animator.currentState === 'default') {
      this.animator.setState('moving');
    } else if (!playerIsMoving && this.animator.currentState === 'moving') {
      this.animator.setState('default');
    }
  }

  reset() {
    this.x = this.canvas.width - this.width/2 - Constants.PLAYER.SPAWN_OFFSET_X;
    this.y = this.height/2 + Constants.PLAYER.SPAWN_OFFSET_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    
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
    
    this.floatVerticalOffset = 0;
    this.floatVerticalVelocity = 0;
    
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
    
    this.animator.setState('default');
  }

  getCurrentFrame() {
    return this.animator.getCurrentFrame();
  }

  getEffectiveY() {
    return this.y + this.floatVerticalOffset;
  }

  setAnimationState(state, options = {}) {
    this.animator.setState(state, options);
  }
}