/**
 * Game configuration including level settings and key mappings
 */
export const GameConfig = {
  MAX_LEVELS: 3,
  COMBOS_PER_LEVEL: 3,
  
  levelConfig: {
    1: {
      level: 1,
      comboDuration: 4.0,
      hasWind: false,
      showMoon: false,
      showTree: true
    },
    2: {
      level: 2,
      comboDuration: 2.0,
      hasWind: true,
      showMoon: false,
      showTree: false,
      showCity: true
    },
    3: {
      level: 3,
      comboDuration: 1.0,
      hasWind: false,
      showMoon: true,
      showTree: false
    }
  },
  
  arrowKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  
  arrowImages: {
    large: {
      ArrowLeft: 'images/ui/left-100.png',
      ArrowRight: 'images/ui/right-100.png',
      ArrowUp: 'images/ui/up-100.png',
      ArrowDown: 'images/ui/down-100.png'
    },
    small: {
      ArrowLeft: 'images/ui/left-50.png',
      ArrowRight: 'images/ui/right-50.png',
      ArrowUp: 'images/ui/up-50.png',
      ArrowDown: 'images/ui/down-50.png'
    }
  },
  
  arrowSymbols: {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  },
  
  progressBarImages: {
    0: 'images/ui/prog-bar-0-200px.png',
    1: 'images/ui/prog-bar-1-200px.png',
    2: 'images/ui/prog-bar-2-200px.png',
    3: 'images/ui/prog-bar-3-200px.png',
    4: 'images/ui/prog-bar-4-200px.png',
    5: 'images/ui/prog-bar-5-200px.png'
  }
};
