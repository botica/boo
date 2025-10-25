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
      hasFloats: true,
      showMoon: false,
      showTree: true
    },
    2: {
      level: 2,
      comboDuration: 2.0,
      hasWind: true,
      hasFloats: true,
      showMoon: false,
      showTree: false,
      showCity: true
    },
    3: {
      level: 3,
      comboDuration: 1.0,
      hasWind: false,
      hasFloats: true,
      showMoon: true,
      showTree: false
    }
  },
  
  arrowKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  
  arrowImages: {
    large: {
      ArrowLeft: 'images/ui/arrow-90-l.png',
      ArrowRight: 'images/ui/arrow-90-r.png',
      ArrowUp: 'images/ui/arrow-90-u.png',
      ArrowDown: 'images/ui/arrow-90-d.png'
    },
    small: {
      ArrowLeft: 'images/ui/arrow-30-l.png',
      ArrowRight: 'images/ui/arrow-30-r.png',
      ArrowUp: 'images/ui/arrow-30-u.png',
      ArrowDown: 'images/ui/arrow-30-d.png'
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
