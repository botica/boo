/**
 * Game configuration including level settings and key mappings
 */
export const GameConfig = {
  // Level configuration
  MAX_LEVELS: 5,
  COMBOS_PER_LEVEL: 3,
  
  levelConfig: {
    1: {
      level: 1,
      comboDuration: 10.0,
      hasWind: false,
      hasGusts: true
    },
    2: {
      level: 2,
      comboDuration: 8.0,
      hasWind: true,
      hasGusts: true
    },
    3: {
      level: 3,
      comboDuration: 6.0,
      hasWind: false,
      hasGusts: false
    },
    4: {
      level: 4,
      comboDuration: 4.0,
      hasWind: true,
      hasGusts: true
    },
    5: {
      level: 5,
      comboDuration: 2.0,
      hasWind: false,
      hasGusts: true
    }
  },
  
  // Key mappings
  arrowKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  
  // Arrow key display symbols
  arrowSymbols: {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  }
};
