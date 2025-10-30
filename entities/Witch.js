import { NPCEntity } from './NPCEntity.js';
import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Witch entity class (the character being scared in level 3)
 * Handles victory sequence with cat rescue
 */
export class Witch extends NPCEntity {
  constructor(assetManager, canvas) {
    super(assetManager, canvas, { level: 3, defaultFacing: 'right' });
    
    // Level 3 victory sequence state
    this.cat = null;
    this.victorySequenceTriggered = false;
    this.catRescueScheduled = false;
    
    // Witch-specific escape state for cat rescue
    this.isEscaping = false;
    this.escapeSpeed = Constants.PERSON.ESCAPE_SPEED;
    this.escapePhase = null; // 'initial', 'returning_for_cat', 'final_escape'
    this.carryingCat = false;
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
    
    // Store sprites reference for dimension updates
    this.sprites = sprites;
    
    // Use original sprite dimensions instead of hardcoded constants
    this.updateDimensionsForState('default');
  }

  /**
   * Update width/height based on current animation state
   * @param {string} state - Animation state ('default' or 'scared')
   */
  updateDimensionsForState(state) {
    if (!this.sprites || !this.sprites[state] || !this.sprites[state][0]) {
      return;
    }
    
    const sprite = this.sprites[state][0];
    this.width = sprite.width;
    this.height = sprite.height;
  }

  /**
   * Reset witch to initial state
   */
  reset() {
    // Witch spawns bottom left with custom offset
    this.x = this.width/2 + Constants.WITCH.SPAWN_OFFSET_X;
    this.y = this.canvas.height - this.height/2 - Constants.WITCH.SPAWN_OFFSET_Y;
    
    // Reset facing direction
    this.facing = 'right';
    
    // Call parent reset for common properties
    super.reset();
    
    // Reset escape and victory sequence state
    this.isEscaping = false;
    this.victorySequenceTriggered = false;
    this.catRescueScheduled = false;
    this.escapePhase = null;
    this.carryingCat = false;
    
    // Set default animation state
    if (this.animator) {
      this.animator.setState('default');
      this.updateDimensionsForState('default');
    }
  }

  /**
   * Set the cat reference for level 3 interactions
   * @param {Cat} cat - The cat entity
   */
  setCat(cat) {
    this.cat = cat;
  }

  /**
   * Override update to handle escape animation
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
   * Start escape animation - witch runs off screen in fear
   */
  startEscape() {
    console.log(`${this.constructor.name}.startEscape called`);
    this.isEscaping = true;
    this.isMoving = false;
    this.vx = 0;
    this.escapePhase = 'initial';
    
    // Set scared animation
    if (this.animator) {
      this.animator.setState('scared');
      this.updateDimensionsForState('scared');
      console.log(`${this.constructor.name} animation set to scared`);
    }
  }

  /**
   * Override updateEscape to handle cat rescue phases
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
    if (this.cat) {
      this.vx = -this.escapeSpeed * 0.8;
      this.x += this.vx * dt;
      
      // Check for collision with cat
      const witchLeft = this.x - this.width / 2;
      const catRight = this.cat.x + this.cat.width / 2;
      
      if (witchLeft <= catRight) {
        // Pick up the cat and reverse direction
        this.x = catRight + this.width / 2;
        this.vx = this.escapeSpeed;
        this.facing = 'right';
        this.cat.vx = this.escapeSpeed;
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
    if (this.carryingCat && this.cat) {
      // Preserve cat's original y position
      this.cat.startBeingCarried(this.vx, 0);
    }
  }

  /**
   * Start the cat rescue sequence
   */
  startCatRescue(cat) {
    console.log(`${this.constructor.name}.startCatRescue called`);
    this.escapePhase = 'returning_for_cat';
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
    if (this.cat) {
      this.cat.startBeingCarried(this.escapeSpeed, 0);
    }
  }

  /**
   * Start the level 3 victory sequence
   * This initiates the escape sequence and makes the cat scared
   */
  startVictorySequence() {
    // Start escape (this sets witch to scared automatically via NPCEntity)
    this.startEscape();
    
    // Make the cat scared
    if (this.cat) {
      this.cat.setScared();
    }
    
    this.victorySequenceTriggered = false;
    this.catRescueScheduled = false;
  }

  /**
   * Update witch escape sequence and handle cat rescue timing
   * Should be called during update if witch is escaping
   * @returns {boolean} True if victory sequence is complete
   */
  updateVictorySequence() {
    if (!this.isEscaping || !this.isOffScreen()) {
      return false;
    }

    // Handle initial escape phase - schedule cat rescue after delay
    if (this.escapePhase === 'initial' && !this.victorySequenceTriggered) {
      this.victorySequenceTriggered = true;
      
      if (!this.catRescueScheduled) {
        this.catRescueScheduled = true;
        const catRescueDelay = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
        setTimeout(() => {
          this.startCatRescue(this.cat);
        }, catRescueDelay * 1000);
      }
      return false;
    }
    
    // Handle final escape phase - check if witch and cat are off screen
    if (this.escapePhase === 'final_escape') {
      if (this.cat && this.cat.isOffScreen()) {
        return true; // Victory sequence complete!
      }
    }
    
    return false;
  }

  /**
   * Check if the victory sequence is in progress
   * @returns {boolean} True if witch is escaping
   */
  isVictorySequenceActive() {
    return this.isEscaping;
  }
}