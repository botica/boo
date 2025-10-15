/**
 * Game configuration including level settings and key mappings
 */
export const GameConfig = {
  MAX_LEVELS: 3,
  COMBOS_PER_LEVEL: 3,
  
  levelConfig: {
    1: {
      level: 1,
      comboDuration: 10.0,
      hasWind: false,
      hasFloats: true,
      showMoon: false,
      showTree: true
    },
    2: {
      level: 2,
      comboDuration: 8.0,
      hasWind: true,
      hasFloats: true,
      showMoon: true,
      showTree: false
    },
    3: {
      level: 3,
      comboDuration: 6.0,
      hasWind: false,
      hasFloats: true,
      showMoon: true,
      showTree: false
    }
  },
  
  arrowKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  
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
  
  arrowSymbols: {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  }
};
