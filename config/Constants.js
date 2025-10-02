/**
 * Game constants for physics, timing, and visual properties
 */
export const Constants = {
  // Player properties
  PLAYER: {
    WIDTH: 200,
    HEIGHT: 200,
    SPEED: 800,
    ACCEL: 3000,
    
    // Gust effects
    GUST_CYCLE: 0.8,
    GUST_STRENGTH_BASE: 1.0,
    GUST_STRENGTH_AMPLITUDE: 0.8,
    
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
    BOO_TEXT_FLASH_INTERVAL: 0.5
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
  }
};
