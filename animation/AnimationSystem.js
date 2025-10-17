/**
 * Animation system for managing sprite animations
 */
import { Constants } from '../config/Constants.js';

/**
 * Represents a single animation state with frames and timing
 */
export class AnimationState {
  constructor(name, frames, interval = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL, loop = true) {
    this.name = name;
    this.frames = frames;
    this.interval = interval; // Interval between frames in SECONDS
    this.loop = loop;
  }
}

/**
 * Manages animation states and frame progression for game entities
 */
export class AnimatedEntity {
  constructor(states, defaultState = 'default') {
    this.states = new Map();
    this.defaultState = defaultState;
    this.currentState = defaultState;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.tempEndTime = 0;
    this.tempEndCallback = null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    // Add states to the entity
    for (const state of states) {
      this.states.set(state.name, state);
    }
  }
  
  /**
   * Set the current animation state
   * @param {string} stateName - Name of the state to switch to
   * @param {Object} options - Animation options
   * @param {number} options.frameCount - Number of frames to play before ending (preferred)
   * @param {number} options.duration - Duration in SECONDS (deprecated, converted to frameCount)
   * @param {Function} options.onComplete - Callback when animation completes
   * @param {boolean} options.immediate - If true, start at interval offset instead of 0
   */
  setState(stateName, options = {}) {
    const { duration, frameCount, onComplete, immediate = false } = options;
    
    if (!this.states.has(stateName)) {
      console.warn(`Animation state "${stateName}" not found`);
      return;
    }
    
    this.currentState = stateName;
    this.frameTimer = immediate ? this.getCurrentState().interval : 0;
    this.frameIndex = 0;
    this.tempEndTime = 0;
    this.tempEndCallback = onComplete || null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    // Prefer frameCount, but support duration for backward compatibility
    if (frameCount && frameCount > 0) {
      this.tempStateFrameCount = frameCount;
      this.tempStateFramesPlayed = 0;
    } else if (duration && duration > 0) {
      // Convert duration to frame count (round to nearest frame)
      const state = this.getCurrentState();
      this.tempStateFrameCount = Math.round(duration / state.interval);
      this.tempStateFramesPlayed = 0;
    }
  }
  
  /**
   * Get the current animation state
   * @returns {AnimationState} Current state object
   */
  getCurrentState() {
    return this.states.get(this.currentState) || this.states.get(this.defaultState);
  }
  
  /**
   * Get the current frame image
   * @returns {HTMLImageElement|null} Current frame or null if no frames
   */
  getCurrentFrame() {
    const state = this.getCurrentState();
    if (!state || !state.frames || state.frames.length === 0) return null;
    return state.frames[this.frameIndex % state.frames.length];
  }
  
  /**
   * Update animation timing and frame progression
   * @param {number} dt - Delta time in SECONDS
   */
  update(dt) {
    const state = this.getCurrentState();
    if (!state) return;
    
    this.frameTimer += dt;
    
    // Check if we should advance frame
    if (this.frameTimer >= state.interval) {
      this.frameTimer -= state.interval;
      
      if (state.frames && state.frames.length > 0) {
        this.frameIndex = (this.frameIndex + 1) % state.frames.length;
        
        // Handle frame count limits
        if (this.tempStateFrameCount > 0) {
          this.tempStateFramesPlayed++;
          if (this.tempStateFramesPlayed >= this.tempStateFrameCount) {
            this._endTempState();
            return;
          }
        }
      }
    }
  }
  
  /**
   * End temporary state and return to default
   * @private
   */
  _endTempState() {
    const callback = this.tempEndCallback;
    this.tempEndTime = 0;
    this.tempEndCallback = null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    // Only reset to default state if we're not in a permanent state like 'dead'
    if (this.currentState !== 'dead') {
      this.currentState = this.defaultState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
    
    if (callback) callback();
  }
  
  /**
   * Check if entity is currently animating (has multiple frames)
   * @returns {boolean} True if animating
   */
  isAnimating() {
    const state = this.getCurrentState();
    return state && state.frames && state.frames.length > 1;
  }
}

/**
 * Factory class for creating common animation configurations
 */
export class AnimationFactory {
  /**
   * Create ghost animation states
   * @param {Object} sprites - Sprite collections from AssetManager
   * @returns {AnimationState[]} Array of animation states
   */
  static createGhostAnimations(sprites) {
    const interval = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
    return [
      new AnimationState('default', sprites.default, interval, true),
      new AnimationState('moving', sprites.moving, interval, true),
      new AnimationState('scaring', sprites.scaring, interval, true),
      new AnimationState('angry', sprites.angry, interval, true),
      new AnimationState('laughing', sprites.laughing, interval, true),
      new AnimationState('swirling', sprites.swirling, interval, true),
      new AnimationState('dead', sprites.dead, interval, false)
    ];
  }

  /**
   * Create person animation states
   * @param {Object} sprites - Sprite collections for person
   * @returns {AnimationState[]} Array of animation states
   */
  static createPersonAnimations(sprites) {
    const interval = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
    return [
      new AnimationState('default', sprites.default, interval, true),
      new AnimationState('sleeping', sprites.sleeping, interval, true),
      new AnimationState('scared', sprites.scared, interval, true)
    ];
  }

  /**
   * Create cat animation states
   * @param {Object} sprites - Sprite collections for cat
   * @returns {AnimationState[]} Array of animation states
   */
  static createCatAnimations(sprites) {
    const interval = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
    return [
      new AnimationState('default', sprites.default, interval, true)
    ];
  }
}