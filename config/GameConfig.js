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
      hasFloats: true,
      showMoon: true,
      showTree: true
    },
    2: {
      level: 2,
      comboDuration: 8.0,
      hasWind: true,
      hasFloats: true,
      showMoon: true,
      showTree: true
    },
    3: {
      level: 3,
      comboDuration: 6.0,
      hasWind: false,
      hasFloats: true,
      showMoon: true,
      showTree: true
    },
    4: {
      level: 4,
      comboDuration: 4.0,
      hasWind: true,
      hasFloats: true,
      showMoon: true,
      showTree: true
    },
    5: {
      level: 5,
      comboDuration: 2.0,
      hasWind: false,
      hasFloats: true,
      showMoon: false,
      showTree: false
    }
  },
  
  // Key mappings
  arrowKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  
  // Arrow key display images
  arrowImages: {
    large: {
      ArrowLeft: 'images/ui/arrow-left-200px.png',
      ArrowRight: 'images/ui/arrow-right-200px.png',
      ArrowUp: 'images/ui/arrow-up-200px.png',
      ArrowDown: 'images/ui/arrow-down-200px.png'
    },
    small: {
      ArrowLeft: 'images/ui/arrow-left-50px.png',
      ArrowRight: 'images/ui/arrow-right-50px.png',
      ArrowUp: 'images/ui/arrow-up-50px.png',
      ArrowDown: 'images/ui/arrow-down-50px.png'
    }
  },
  
  // Arrow key display symbols (kept for backwards compatibility)
  arrowSymbols: {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  }
};
