/**
 * AssetManager handles loading and managing all game sprites and images
 */
import { GameConfig } from '../config/GameConfig.js';

export class AssetManager {
  constructor() {
    this.sprites = {};
    this.loadedCount = 0;
    this.totalAssets = 0;
    this.onAllAssetsLoaded = null;
  }

  /**
   * Initialize and load all game assets
   * @param {Function} callback - Called when all assets are loaded
   */
  async loadAssets(callback) {
    this.onAllAssetsLoaded = callback;
    
    // Define all sprite paths
    const assetPaths = {
      // Ghost sprites
      ghostDefault: 'images/boo-inverse.png',
      ghostAlt: 'images/boo-inverse-1.png',
      ghostScare1: 'images/boo-angry-v2-0.png',
      ghostScare2: 'images/boo-angry-v2-1.png',
      ghostLaugh1: 'images/boo-laugh-v2-0.png',
      ghostLaugh2: 'images/boo-laugh-v2-1.png',
      ghostSwirl1: 'images/boo-swirl-v2-0.png',
      ghostSwirl2: 'images/boo-swirl-v2-1.png',
      
      // Person sprites
      personDefault: 'images/person-mock.png',
      personAlt: 'images/person-mock-1.png',
      personScared: 'images/person-scared.png',
      personScaredAlt: 'images/person-scared-1.png',
      
      // Sleeping person sprites
      guySleeping: 'images/guy-sleeping.png',
      guySleeping1: 'images/guy-sleeping-1.png',
      guyScared: 'images/guy-scared.png',
      guyScared1: 'images/guy-scared-1.png',
      
      // Business person sprites
      businessDefault: 'images/business.png',
      businessAlt: 'images/business-1.png',
      businessScared: 'images/business-scared.png',
      businessScaredAlt: 'images/business-scared-1.png',
      
      // Moon sprites
      moon1: 'images/moon.png',
      moon2: 'images/moon-1.png',
      
      // Tree sprites
      tree1: 'images/tree.png',
      tree2: 'images/tree-1.png',
      
      // City sprites
      city1: 'images/city.png',
      city2: 'images/city-1.png',
      
      // Cat sprites
      cat: 'images/cat.png',
      cat1: 'images/cat-1.png',
      catScared: 'images/cat-scared.png',
      catScared1: 'images/cat-scared-1.png',
      
      // Arrow UI sprites (from GameConfig)
      arrowUpLarge: GameConfig.arrowImages.large.ArrowUp,
      arrowDownLarge: GameConfig.arrowImages.large.ArrowDown,
      arrowLeftLarge: GameConfig.arrowImages.large.ArrowLeft,
      arrowRightLarge: GameConfig.arrowImages.large.ArrowRight,
      arrowUpSmall: GameConfig.arrowImages.small.ArrowUp,
      arrowDownSmall: GameConfig.arrowImages.small.ArrowDown,
      arrowLeftSmall: GameConfig.arrowImages.small.ArrowLeft,
      arrowRightSmall: GameConfig.arrowImages.small.ArrowRight,
      
      // Progress bar sprites (from GameConfig)
      progressBar0: GameConfig.progressBarImages[0],
      progressBar1: GameConfig.progressBarImages[1],
      progressBar2: GameConfig.progressBarImages[2],
      progressBar3: GameConfig.progressBarImages[3],
      progressBar4: GameConfig.progressBarImages[4],
      progressBar5: GameConfig.progressBarImages[5]
    };

    this.totalAssets = Object.keys(assetPaths).length;

    // Load all sprites
    for (const [key, path] of Object.entries(assetPaths)) {
      this.loadSprite(key, path);
    }
  }

  /**
   * Load a single sprite
   * @param {string} key - Unique identifier for the sprite
   * @param {string} path - Path to the image file
   */
  loadSprite(key, path) {
    const image = new Image();
    image.src = path;
    
    image.onload = () => {
      this.loadedCount++;
      if (this.loadedCount === this.totalAssets && this.onAllAssetsLoaded) {
        this.onAllAssetsLoaded();
      }
    };

    image.onerror = () => {
      console.error(`Failed to load sprite: ${path}`);
    };

    this.sprites[key] = image;
  }

  /**
   * Get a sprite by key
   * @param {string} key - Sprite identifier
   * @returns {HTMLImageElement} The loaded image
   */
  getSprite(key) {
    return this.sprites[key];
  }

  /**
   * Get multiple sprites by keys
   * @param {string[]} keys - Array of sprite identifiers
   * @returns {HTMLImageElement[]} Array of loaded images
   */
  getSprites(keys) {
    return keys.map(key => this.sprites[key]).filter(sprite => sprite);
  }

  /**
   * Check if all assets are loaded
   * @returns {boolean} True if all assets are loaded
   */
  isLoaded() {
    return this.loadedCount === this.totalAssets;
  }

  /**
   * Get loading progress
   * @returns {number} Progress as a percentage (0-100)
   */
  getProgress() {
    return this.totalAssets > 0 ? (this.loadedCount / this.totalAssets) * 100 : 0;
  }

  /**
   * Get sprite sets for different character types
   */
  getGhostSprites() {
    return {
      default: [this.sprites.ghostDefault, this.sprites.ghostAlt],
      moving: [this.sprites.ghostDefault, this.sprites.ghostAlt],
      scaring: [this.sprites.ghostScare1, this.sprites.ghostScare2],
      angry: [this.sprites.ghostScare1, this.sprites.ghostScare2],
      laughing: [this.sprites.ghostLaugh1, this.sprites.ghostLaugh2],
      swirling: [this.sprites.ghostSwirl1, this.sprites.ghostSwirl2],
      dead: []
    };
  }

  getPersonSprites() {
    return {
      default: [this.sprites.personDefault, this.sprites.personAlt],
      scared: [this.sprites.personScared, this.sprites.personScaredAlt]
    };
  }

  getLevel1PersonSprites() {
    return {
      default: [this.sprites.personDefault, this.sprites.personAlt],
      sleeping: [this.sprites.guySleeping, this.sprites.guySleeping1],
      scared: [this.sprites.guyScared, this.sprites.guyScared1]
    };
  }

  getBusinessSprites() {
    return {
      default: [this.sprites.businessDefault, this.sprites.businessAlt],
      scared: [this.sprites.businessScared, this.sprites.businessScaredAlt]
    };
  }

  getMoonSprites() {
    return {
      default: [this.sprites.moon1, this.sprites.moon2]
    };
  }

  getTreeSprites() {
    return {
      default: [this.sprites.tree1, this.sprites.tree2]
    };
  }

  getCitySprites() {
    return {
      default: [this.sprites.city1, this.sprites.city2]
    };
  }

  getCatSprite() {
    return {
      default: [this.sprites.cat, this.sprites.cat1],
      scared: [this.sprites.catScared, this.sprites.catScared1]
    };
  }
}