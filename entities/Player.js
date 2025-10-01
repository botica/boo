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
    
    // Wind and gust effects
    this.gustTimer = 0;
    this.gustCycle = Constants.PLAYER.GUST_CYCLE;
    this.gustStrength = Constants.PLAYER.GUST_STRENGTH_BASE;
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
    // Update gust effects
    this.updateGustEffects(dt, levelConfig);
    
    // Update wind effects
    this.updateWindEffects(dt, levelConfig);
    
    // Handle input
    let inputX = 0, inputY = 0;
    if (input.keys['ArrowUp']) inputY -= 1;
    if (input.keys['ArrowDown']) inputY += 1;
    if (input.keys['ArrowLeft']) inputX -= 1;
    if (input.keys['ArrowRight']) inputX += 1;

    // Update facing direction
    if (inputX < 0) this.facing = 'left';
    else if (inputX > 0) this.facing = 'right';

    // Calculate target velocity with gust strength
    let targetVx = 0, targetVy = 0;
    const len = Math.hypot(inputX, inputY);
    if (len > 0) {
      const gustModifiedSpeed = this.speed * this.gustStrength;
      targetVx = (inputX / len) * gustModifiedSpeed;
      targetVy = (inputY / len) * gustModifiedSpeed;
    }

    // Apply acceleration with gust strength
    const gustModifiedAccel = this.accel * this.gustStrength;
    const maxDelta = gustModifiedAccel * dt;
    const dvx = targetVx - this.vx;
    const dvy = targetVy - this.vy;
    
    if (Math.abs(dvx) > maxDelta) this.vx += Math.sign(dvx) * maxDelta;
    else this.vx = targetVx;
    if (Math.abs(dvy) > maxDelta) this.vy += Math.sign(dvy) * maxDelta;
    else this.vy = targetVy;

    // Apply wind effect to position
    this.x += this.windVx * dt;
    this.y += this.windVy * dt;

    // Update position with bounds checking
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    CollisionDetector.clampToBounds(this, this.canvas.width, this.canvas.height);
  }

  updateGustEffects(dt, levelConfig) {
    if (levelConfig && levelConfig.hasGusts !== false) {
      this.gustTimer += dt;
      this.gustStrength = Constants.PLAYER.GUST_STRENGTH_BASE + 
                         Constants.PLAYER.GUST_STRENGTH_AMPLITUDE * 
                         Math.sin((this.gustTimer / this.gustCycle) * Math.PI * 2);
    } else {
      this.gustStrength = Constants.PLAYER.GUST_STRENGTH_BASE;
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
    this.x = this.canvas.width - this.width/2 - 10;
    this.y = this.height/2 + 10;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    this.gustTimer = 0;
    this.gustStrength = Constants.PLAYER.GUST_STRENGTH_BASE;
    this.windVx = 0;
    this.windVy = 0;
    this.windTimer = 0;
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
   * Set animation state
   * @param {string} state - Animation state name
   * @param {Object} options - Animation options
   */
  setAnimationState(state, options = {}) {
    this.animator.setState(state, options);
  }
}