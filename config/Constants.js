/**
 * Game constants for physics, timing, and visual properties
 */
export const Constants = {
  // =================== PLAYER CONSTANTS ===================
  PLAYER: {
    // Basic properties
    WIDTH: 150,
    HEIGHT: 150,
    
    // Spawn position
    SPAWN_OFFSET_X: 10,
    SPAWN_OFFSET_Y: 10,
    
    // Movement speeds
    VERTICAL_SPEED: 200, // UP/DOWN arrow key movement speed - ADJUST THIS FOR Y MOVEMENT
    ACCEL: 1500,
    VERTICAL_INERTIA: 0.97, // How much vertical velocity is retained when key is released

    
    // Float tier system - 2 tiers based on key hold duration
    FLOAT_TIERS: {
      small: {
        force: 350, // Horizontal speed
        threshold: 0, // Always available
        holdDurationMax: 0.075,
        duration: 0.35, // Float duration in seconds
        hopHeight: 20 // Vertical hop height in pixels - ADJUST THIS FOR SMALL FLOAT HEIGHT
      },
      large: {
        force: 850, // Horizontal speed
        threshold: 0.08, // Requires > 0.1s hold
        holdDurationMax: Infinity,
        duration: 0.6, // Float duration in seconds
        hopHeight: 44 // Vertical hop height in pixels - ADJUST THIS FOR LARGE FLOAT HEIGHT
      }
    },

    FLOAT_DURATION: 0.4, // Default fallback
    FLOAT_SLOWDOWN_FACTOR: 0.45, // How much to slow down during deceleration
    FLOAT_FULL_SPEED_RATIO: 0.25, // Maintain full speed for first part of float 
    FLOAT_DECELERATION_RATIO: 0.75, // Decelerate during remaining part
    FLOAT_TIER_INTERPOLATION_SPEED: 800, // How fast to transition between tiers
    FLOAT_HORIZONTAL_INERTIA: 0.90, // Horizontal velocity decay after float ends
    
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
    WIND_STRENGTH_LEVEL4_MIN: 270,
    WIND_STRENGTH_LEVEL4_MAX: 450,
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
  
  // =================== VISUAL & UI CONSTANTS ===================
  ANIMATION: {
    DEFAULT_FRAME_INTERVAL: 0.4,
    ANGRY_FRAME_COUNT: 4,
    SWIRL_FRAME_COUNT: 2,
    LAUGHING_DURATION: 2800,
    DEAD_DURATION: 1000,
    BOO_TEXT_FLASH_INTERVAL: 0.5,
    BOO_TEXT_DURATION: 1500 // Maximum time BOO text shows (ms)
  },
  
  UI: {
    MIN_CANVAS_WIDTH: 320,
    MIN_CANVAS_HEIGHT: 240,
    CANVAS_PADDING: 40,
    MIN_ARROW_SIZE: 64,
    MAX_ARROW_SIZE: 400,
    ARROW_SIZE_FACTOR_WIDTH: 0.45,
    ARROW_SIZE_FACTOR_HEIGHT: 0.6,
    ARROW_FONT_SCALE: 0.45,
    ARROW_GAP: 20,
    MIN_PROGRESS_WIDTH: 64,
    PROGRESS_MARGIN: 40
  },
  
  BOO_TEXT: {
    OFFSET_Y: 60,
    FONT_SIZE: 48
  },

  HEHE_TEXT: {
    OFFSET_Y: 100, // Position above BOO text
    FONT_SIZE: 32,
    FLASH_INTERVAL: 0.3,
    DURATION: 2200 // Shortened by two flash cycles (2 * 0.3 * 1000 = 600ms less)
  },

  SCENE_TEXT: {
    INTRO_TEXT: "float around and scare people\nby landing on their heads and\ninputting the correct key combo.\ncorrect input advances the level.\ndont run into the side of someone\nor you'll blow away!",
    OUTRO_TEXT: "you won!",
    FONT_SIZE: 24,
    FADE_DURATION: 4.0, // Total scene duration in seconds (increased)
    FADE_FRAME_INTERVAL: 0.5, // Frame interval for fade animation (matches sprite animations)
    // Fade sequence: 0% 50% 100% 100% 100% 100% 50% 0% over 8 frames (4 seconds at 0.5s per frame)
    FADE_OPACITY_SEQUENCE: [0, 0.5, 1, 1, 1, 1, 0.5, 0],
    LINE_HEIGHT: 40 // Spacing between lines for multi-line text
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
    CLICK_DURATION: 120 // ms
  }
};
