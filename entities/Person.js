import { NPCEntity } from './NPCEntity.js';
import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Person entity class (the character being scared)
 * Represents the guy (level 1) and businessman (level 2)
 */
export class Person extends NPCEntity {
  constructor(assetManager, canvas) {
    super(assetManager, canvas, { level: 1, defaultFacing: 'right' });
  }

  /**
   * Override: Level 1 guy stays stationary (sitting on bench)
   */
  shouldStayStationary() {
    return this.currentLevel === 1;
  }

  /**
   * Update person for the current level
   * @param {Object} levelConfig - Current level configuration
   */
  updateForLevel(levelConfig) {
    this.currentLevel = levelConfig.level;
    let sprites;
    let defaultState = 'default';
    
    switch (levelConfig.level) {
      case 1:
        sprites = this.assetManager.getLevel1PersonSprites();
        defaultState = 'sleeping';
        break;
      case 2:
        sprites = this.assetManager.getBusinessSprites();
        break;
    }
    
    const states = AnimationFactory.createPersonAnimations(sprites);
    this.animator = new AnimatedEntity(states, defaultState);
  }

  /**
   * Reset person to initial state
   */
  reset() {
    // Default spawn: bottom left
    // For level 2, spawn bottom right
    if (this.currentLevel === 2) {
      this.x = this.canvas.width - this.width/2 - Constants.PERSON.SPAWN_OFFSET_X;
      this.y = this.canvas.height - this.height/2 - Constants.PERSON.SPAWN_OFFSET_Y;
      this.facing = 'left'; // Businessman faces left
    } else {
      this.x = this.width/2 + Constants.PERSON.SPAWN_OFFSET_X;
      this.y = this.canvas.height - this.height/2 - Constants.PERSON.SPAWN_OFFSET_Y;
      this.facing = 'right'; // Guy faces right
    }
    
    // Call parent reset for common properties
    super.reset();
    
    // Set appropriate default state based on level
    if (this.animator) {
      const defaultState = this.currentLevel === 1 ? 'sleeping' : 'default';
      this.animator.setState(defaultState);
    }
  }
}