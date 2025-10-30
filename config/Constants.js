/**
 * Game constants for physics, timing, and visual properties
 */
const Constants = {
  // =================== DEBUG ===================
  DEBUG: true, // Set to true to show yellow debug outlines on entities
  
  // =================== PLAYER CONSTANTS ===================
  PLAYER: {
    // Basic properties
    WIDTH: 150,
    HEIGHT: 150,
    
    // Spawn position
    SPAWN_OFFSET_X: 10,
    SPAWN_OFFSET_Y: 10,
    
    // Movement speeds
    VERTICAL_SPEED: 225, // UP/DOWN arrow key movement speed - ADJUST THIS FOR Y MOVEMENT
    ACCEL: 1500,
    VERTICAL_INERTIA: 0.96, // How much vertical velocity is retained when key is released

    
    // Float tier system - 2 tiers based on key hold duration
    FLOAT_TIERS: {
      small: {
        force: 350, // Horizontal speed
        threshold: 0, // Always available
        holdDurationMax: 0.075,
        duration: 0.4, // Float duration in seconds
        hopHeight: 20 // Vertical hop height in pixels - ADJUST THIS FOR SMALL FLOAT HEIGHT
      },
      large: {
        force: 850, // Horizontal speed
        threshold: 0.1, // Requires > 0.1s hold
        holdDurationMax: Infinity,
        duration: 0.6, // Float duration in seconds
        hopHeight: 35 // Vertical hop height in pixels - ADJUST THIS FOR LARGE FLOAT HEIGHT
      }
    },

    FLOAT_DURATION: 0.4, // Default fallback
    FLOAT_SLOWDOWN_FACTOR: 0.45, // How much to slow down during deceleration
    FLOAT_FULL_SPEED_RATIO: 0.25, // Maintain full speed for first part of float 
    FLOAT_DECELERATION_RATIO: 0.75, // Decelerate during remaining part
    FLOAT_TIER_INTERPOLATION_SPEED: 750, // How fast to transition between tiers
    FLOAT_HORIZONTAL_INERTIA: 0.93, // Horizontal velocity decay after float ends
    
    // Movement detection threshold
    MOVEMENT_THRESHOLD: 0.001, // Minimum velocity to be considered "moving"
    
    // Time calculation
    TIME_SCALE: 1000, // Milliseconds to seconds conversion
    
    // ===== WIND SYSTEM =====
    WIND_CHANGE_INTERVAL: 0.3,
    WIND_INERTIA: 0.7,
    WIND_DECAY: 0.998,
    WIND_DECAY_NO_WIND: 0.9,
    
    // Wind strength by level
    WIND_STRENGTH_NORMAL_MIN: 135,
    WIND_STRENGTH_NORMAL_MAX: 225,
    WIND_Y_FACTOR: 0.3
  },
  
  // =================== OTHER ENTITY CONSTANTS ===================
  PERSON: {
    WIDTH: 225,
    HEIGHT: 225,
    MOVE_SPEED: 80,
    ESCAPE_SPEED: 400,
    MOVE_WAIT_MIN: 1.0,
    MOVE_WAIT_MAX: 3.0,
    MOVE_DURATION_MIN: 0.15,
    MOVE_DURATION_MAX: 0.45,
    MOVE_SPEED_VARIANCE_MIN: 0.6,
    MOVE_SPEED_VARIANCE_MAX: 0.9,
    
    // Spawn position
    SPAWN_OFFSET_X: 10,
    SPAWN_OFFSET_Y: 10
  },
  
  MOON: {
    WIDTH: 100,
    HEIGHT: 100,
    OFFSET_X: 20,
    OFFSET_Y: 20
  },
  
  TREE: {
    WIDTH: 200,
    HEIGHT: 400,
    DEFAULT_X_OFFSET: 200,
    DEFAULT_Y_OFFSET: 300
  },
  
  CITY: {
    WIDTH: 1200,
    HEIGHT: 800,
    DEFAULT_X_OFFSET: 0,
    DEFAULT_Y_OFFSET: 0
  },
  
  WITCH: {
    SPAWN_OFFSET_X: 100, // Horizontal offset from left edge (default spawn position)
    SPAWN_OFFSET_Y: 10  // Vertical offset from bottom edge
  },
  
  CAT: {
    WIDTH: 150,
    HEIGHT: 150,
    MARGIN_FROM_EDGE: 20,
    CARRY_OFFSET_X: 0, // Offset when being carried by person
    CARRY_OFFSET_Y: 0
  },
  
  // =================== ANIMATION CONSTANTS ===================
  // All animation durations are in FRAMES for consistency
  ANIMATION: {
    // Frame timing - interval between animation frames (in seconds)
    DEFAULT_FRAME_INTERVAL: 0.5,
    
    // Ghost animation durations (in frames)
    ANGRY_FRAMES: 4,
    SWIRL_FRAMES: 2,
    LAUGHING_FRAMES: 6,
    DEAD_FRAMES: 2,
    
    // Text animation timings (in frames)
    BOO_TEXT_FLASH_FRAMES: 1,  // How many frames per flash
    BOO_TEXT_FLASH_CYCLES: 4,  // Number of flash cycles (controls both display duration and callback timing)
    
    // Level 3 cat rescue timing
    CAT_RESCUE_DELAY_FRAMES: 2, // Delay before person starts cat rescue (in frames)
  },
  
  UI: {
    MIN_CANVAS_WIDTH: 320,
    MIN_CANVAS_HEIGHT: 240,
    CANVAS_PADDING: 40,
    MIN_ARROW_SIZE: 30,
    MAX_ARROW_SIZE: 90,
    ARROW_SIZE_FACTOR_WIDTH: 0.45,
    ARROW_SIZE_FACTOR_HEIGHT: 0.6,
    ARROW_FONT_SCALE: 0.45,
    ARROW_GAP: 20,
    MIN_PROGRESS_WIDTH: 64,
    PROGRESS_MARGIN: 40,
    PROGRESS_BAR_FRAMES: 5, // Number of progress bar animation frames (0-5 = 6 frames total, 5 transitions)
    PROGRESS_BAR_START_DELAY_FACTOR: 0.5, // Delay as a fraction of one progress bar frame duration
    get COMBO_SUCCESS_BLINK_DURATION() { return Constants.ANIMATION.DEFAULT_FRAME_INTERVAL * 1000 / 4; } //fraction of def frame int
  },
  
  // Text display settings
  TEXT: {
    FONT_SIZE: 96,  // Font size for scene text (intro, outro)
    SCARY_MESSAGE: "BOO!",  // Text displayed when scaring someone
    SCARY_MESSAGE_FONT_SIZE: 220  // Font size for scary message
  },
  
  SCENE_TEXT: {
    INTRO_TEXT: [
      "WELCOME TO BOO GAME!",
      "FLOAT AROUND AND SCARE PEOPLE",
      "BY LANDING ON THEIR HEADS AND",
      "INPUTTING THE CORRECT KEY COMBO.",
      "CORRECT INPUT ADVANCES THE LEVEL.",
      "DONT RUN INTO THE SIDE OF SOMEONE",
      "OR YOU'LL BLOW AWAY!"
    ],
    OUTRO_TEXT: "YOU WON!",
    // Uses TEXT.FONT_SIZE
    LINE_HEIGHT: 96 // Spacing between lines for multi-line text
  },

  // Canvas configuration for responsive sizing
  CANVAS: {
    MIN_WIDTH: 700,
    MAX_WIDTH: 1200,
    ASPECT_RATIO: 16/10, // 16:10 aspect ratio for good gameplay space
    get MIN_HEIGHT() { return Math.round(this.MIN_WIDTH / this.ASPECT_RATIO); },
    get MAX_HEIGHT() { return Math.round(this.MAX_WIDTH / this.ASPECT_RATIO); }
  },
  
  // =================== INPUT CONSTANTS ===================
  TOUCH: {
    CLICK_DURATION: 0.12 // Duration in seconds (120ms)
  }
};

Object.defineProperty(Constants.SCENE_TEXT, 'FADE_FRAME_INTERVAL', {
  get() { return Constants.ANIMATION.DEFAULT_FRAME_INTERVAL; }
});

export { Constants };
