/**
 * Game constants for physics, timing, and visual properties
 */
export const Constants = {
  // Player properties
  PLAYER: {
    WIDTH: 150,
    HEIGHT: 150,
    SPEED: 800,
    ACCEL: 3000,
    
    // Float effects
    FLOAT_SMALL_FORCE: 200,
    FLOAT_MEDIUM_FORCE: 450,
    FLOAT_LARGE_FORCE: 1200,
    FLOAT_SMALL_THRESHOLD: 0.05,
    FLOAT_MEDIUM_THRESHOLD: 0.15,
    FLOAT_VERTICAL_FORCE: 50,
    FLOAT_DURATION: 0.5,
    FLOAT_SLOWDOWN_FACTOR: 0.2,
    
    // Wind effects
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
  
  // Person properties
  PERSON: {
    WIDTH: 150,
    HEIGHT: 150,
    MOVE_SPEED: 80,
    ESCAPE_SPEED: 400,
    MOVE_WAIT_MIN: 1.0,
    MOVE_WAIT_MAX: 3.0,
    MOVE_DURATION_MIN: 0.15,
    MOVE_DURATION_MAX: 0.45,
    MOVE_SPEED_VARIANCE_MIN: 0.6,
    MOVE_SPEED_VARIANCE_MAX: 0.9
  },
  
  // Animation timing
  ANIMATION: {
    DEFAULT_FRAME_INTERVAL: 0.4,
    ANGRY_FRAME_COUNT: 4,
    SWIRL_FRAME_COUNT: 2,
    LAUGHING_DURATION: 2800,
    DEAD_DURATION: 1000,
    BOO_TEXT_FLASH_INTERVAL: 0.5,
    BOO_TEXT_DURATION: 1500 // Maximum time BOO text shows (ms)
  },
  
  // UI sizing
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
  
  // Touch interaction
  TOUCH: {
    CLICK_DURATION: 120 // ms
  },
  
  // Visual effects
  BOO_TEXT: {
    OFFSET_Y: 60,
    FONT_SIZE: 48
  },

  // Canvas configuration for responsive sizing
  CANVAS: {
    MIN_WIDTH: 500,
    MAX_WIDTH: 1200,
    ASPECT_RATIO: 16/10, // 16:10 aspect ratio for good gameplay space
    get MIN_HEIGHT() { return Math.round(this.MIN_WIDTH / this.ASPECT_RATIO); },
    get MAX_HEIGHT() { return Math.round(this.MAX_WIDTH / this.ASPECT_RATIO); }
  }
};
