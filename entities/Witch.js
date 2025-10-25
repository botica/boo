import { NPCEntity } from './NPCEntity.js';
import { AnimatedEntity, AnimationFactory } from '../animation/AnimationSystem.js';
import { Constants } from '../config/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Witch entity class (the character being scared in level 3)
 */
export class Witch extends NPCEntity {
  constructor(assetManager, canvas) {
    super(assetManager, canvas, { level: 3, defaultFacing: 'right' });
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
   * Reset witch to initial state
   */
  reset() {
    // Witch spawns bottom left
    this.x = this.width/2 + Constants.PERSON.SPAWN_OFFSET_X;
    this.y = this.canvas.height - this.height/2 - Constants.PERSON.SPAWN_OFFSET_Y;
    
    // Reset facing direction
    this.facing = 'right';
    
    // Call parent reset for common properties
    super.reset();
    
    // Set default animation state
    if (this.animator) {
      this.animator.setState('default');
    }
  }
}