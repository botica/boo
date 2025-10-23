/**
 * Game.js - game orchestrator
 */

import { AssetManager } from './assets/AssetManager.js';
import { Player } from './entities/Player.js';
import { Person } from './entities/Person.js';
import { Witch } from './entities/Witch.js';
import { Moon } from './entities/Moon.js';
import { Tree } from './entities/Tree.js';
import { City } from './entities/City.js';
import { Cat } from './entities/Cat.js';
import { InputManager } from './input/InputManager.js';
import { GameState } from './game/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { Renderer } from './graphics/Renderer.js';
import { Constants } from './config/Constants.js';

/**
 * Main Game class that orchestrates all game systems
 */
export class Game {
  constructor() {
    // Get canvas reference
    this.canvas = document.getElementById('game');
    if (!this.canvas) {
      throw new Error('Canvas element with id "game" not found');
    }

    // Initialize core systems
    this.assetManager = new AssetManager();
    this.renderer = new Renderer(this.canvas);
    this.gameState = new GameState();
    this.uiManager = new UIManager(this.canvas);
    this.inputManager = new InputManager();
    
    // Game entities (will be initialized after assets load)
    this.player = null;
    this.person = null;
    this.personEntity = null; // Level 1 & 2 person
    this.witchEntity = null;  // Level 3 witch
    this.moon = null;
    this.tree = null;
    this.city = null;
    this.cat = null;
    
    // Game loop tracking
    this.lastTime = performance.now();
    this.isRunning = false;
    
    // Level 3 escape tracking
    this.level3EscapeTriggered = false;
    
    // Bind methods to preserve context
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.onAssetsLoaded = this.onAssetsLoaded.bind(this);
    this.onResize = this.onResize.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize and start the game
   */
  async init() {
    try {
      this.resizeCanvas();
      this.renderer.drawLoadingScreen(0);
      await this.assetManager.loadAssets(this.onAssetsLoaded);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }

  /**
   * Called when all assets are loaded
   */
  onAssetsLoaded() {
  this.player = new Player(this.assetManager, this.canvas);
  this.player.gameState = this.gameState;
    this.personEntity = new Person(this.assetManager, this.canvas);
    this.witchEntity = new Witch(this.assetManager, this.canvas);
    this.person = this.personEntity; // Start with person for level 1
    this.moon = new Moon(this.assetManager, Constants.MOON.OFFSET_X, Constants.MOON.OFFSET_Y);
    this.tree = new Tree(this.assetManager);
    this.city = new City(this.assetManager);
    this.cat = new Cat(this.assetManager, this.canvas);
    
    this.resetScene();
    this.gameState.updateLevelTitle();
    
    if (!this.gameState.gameHasStarted) {
      this.gameState.startIntroScene();
    }
    
    this.start();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', this.onResize);
  }

  /**
   * Handle window resize
   */
  onResize() {
    this.resizeCanvas();
    this.resetScene();
  }

  /**
   * Resize canvas and UI elements
   */
  resizeCanvas() {
    const container = document.querySelector('.game-container');
    if (!container) {
      this.setCanvasDimensions();
      return;
    }
    
    const containerWidth = container.clientWidth - 20;
    const containerHeight = container.clientHeight - 20;
    
    let canvasWidth = Math.max(Constants.CANVAS.MIN_WIDTH, 
                              Math.min(Constants.CANVAS.MAX_WIDTH, containerWidth));
    let canvasHeight = Math.round(canvasWidth / Constants.CANVAS.ASPECT_RATIO);
    
    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight;
      canvasWidth = Math.round(canvasHeight * Constants.CANVAS.ASPECT_RATIO);
      canvasWidth = Math.max(Constants.CANVAS.MIN_WIDTH, 
                            Math.min(Constants.CANVAS.MAX_WIDTH, canvasWidth));
    }
    
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
  }
  
  /**
   * Fallback method for setting canvas dimensions when container is not available
   */
  setCanvasDimensions() {
    const viewportWidth = window.innerWidth - 40;
    const viewportHeight = window.innerHeight - 40;
    
    let canvasWidth = Math.max(Constants.CANVAS.MIN_WIDTH, 
                              Math.min(Constants.CANVAS.MAX_WIDTH, viewportWidth * 0.8));
    let canvasHeight = Math.round(canvasWidth / Constants.CANVAS.ASPECT_RATIO);
    
    if (canvasHeight > viewportHeight * 0.8) {
      canvasHeight = viewportHeight * 0.8;
      canvasWidth = Math.round(canvasHeight * Constants.CANVAS.ASPECT_RATIO);
    }
    
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Main game loop
   * @param {number} now - Current timestamp
   */
  gameLoop(now) {
    if (!this.isRunning) return;
    
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.update(dt);
    this.draw();
    
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Update game logic
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Handle scene updates first
    const sceneUpdate = this.gameState.updateScene(dt);
    if (sceneUpdate.sceneComplete) {
      this.handleSceneComplete(sceneUpdate.completedScene);
    }
    
    // Skip normal game updates during intro scene only
    if (this.gameState.currentScene === 'intro') {
      return;
    }
    
    // During outro scene, allow entity updates but skip game logic
    if (this.gameState.currentScene === 'outro') {
      // Update game state to keep timers running (especially heheTextTimer for flashing)
      this.gameState.update(dt);
      
      // Update entities for animation
      const levelConfig = this.gameState.getCurrentLevelConfig();
      
      if (this.player) {
        this.player.update(
          dt,
          this.inputManager,
          levelConfig,
          false, // no interaction
          true   // animation in progress - prevents player control during outro
        );
      }
      
      if (this.person) {
        this.person.update(dt, false); // no interaction
      }
      
      // Update moon, tree, and city
      if (this.moon && levelConfig.showMoon) {
        this.moon.update(dt);
      }
      
      if (this.tree) {
        this.tree.update(dt);
      }
      
      if (this.city && levelConfig.showCity) {
        this.city.update(dt);
      }
      
      return;
    }
    
    // Update game state
    const stateChanges = this.gameState.update(dt);
    
    // Handle state changes
    this.handleStateChanges(stateChanges);
    
    // Update entities
    const levelConfig = this.gameState.getCurrentLevelConfig();
    
    if (this.player) {
      this.player.update(
        dt,
        this.inputManager,
        levelConfig,
        this.gameState.interactionActive,
        this.gameState.animationInProgress
      );
    }
    
    if (this.person) {
      this.person.update(dt, this.gameState.interactionActive);
      this.handlePersonEscape();
    }
    
    // Update moon (visibility based on level config)
    if (this.moon && levelConfig.showMoon) {
      this.moon.update(dt);
    }
    
    // Update tree (visible on all levels)
    if (this.tree) {
      this.tree.update(dt);
    }
    
    // Update city (only on level 2)
    if (this.city && levelConfig.showCity) {
      this.city.update(dt);
    }
    
    // Update cat (only on level 3)
    if (this.cat && this.gameState.currentLevel === 3) {
      this.cat.update(dt);
    }
    
    // Handle combo input
    this.handleComboInput();
    
    // Handle collisions
    this.handleCollisions();
  }

  /**
   * Handle person escape sequences
   */
  handlePersonEscape() {
    if (!this.person.isEscaping || !this.person.isOffScreen()) {
      return;
    }

    if (this.gameState.currentLevel === 3) {
      this.handleLevel3Escape();
    } else if (!this.level3EscapeTriggered) {
      this.level3EscapeTriggered = true;
      this.completeLevel3Victory();
    }
  }

  /**
   * Handle level 3 specific escape with cat rescue
   */
  handleLevel3Escape() {
    if (this.person.escapePhase === 'initial' && !this.level3EscapeTriggered) {
      this.level3EscapeTriggered = true;
      const catRescueDelay = Constants.ANIMATION.CAT_RESCUE_DELAY_FRAMES * Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
      setTimeout(() => {
        this.person.startCatRescue(this.cat);
      }, catRescueDelay * 1000);
    } else if (this.person.escapePhase === 'final_escape') {
      // Only complete victory when cat is fully off screen
      if (this.cat && this.cat.isOffScreen()) {
        this.completeLevel3Victory();
      }
    }
  }

  /**
   * Handle state changes from game state update
   * @param {Object} stateChanges - Changes that occurred in game state
   */
  handleStateChanges(stateChanges) {
    // Update progress bar
    if (stateChanges.progressPercentage !== undefined) {
      this.uiManager.updateProgress(stateChanges.progressPercentage);
    }
    
    // Handle timeout
    if (stateChanges.timeout) {
      this.handleTimeout();
    }
  }

  /**
   * Handle completion of intro/outro scenes
   * @param {string} completedScene - The scene that just completed ('intro' or 'outro')
   */
  handleSceneComplete(completedScene) {
    if (completedScene === 'outro') {
      this.gameState.resetToLevel1();
      this.resetScene();
    }
  }

  /**
   * Handle combo input checking
   */
  handleComboInput() {
    if (this.gameState.interactionActive && this.gameState.currentCombo) {
      if (this.inputManager.checkComboSuccess(this.gameState.currentCombo)) {
        if (!this.gameState.comboAccepted) {
          this.handleComboSuccess();
        }
      }
    }
  }

  /**
   * Handle successful combo input
   */
  handleComboSuccess() {
    this.uiManager.highlightSuccessfulCombo();
    const result = this.gameState.processComboSuccess();
    
    switch (result) {
      case 'continue':
        this.startNextCombo();
        break;
      case 'level_complete':
        this.handleLevelComplete(false);
        break;
      case 'game_complete':
        this.handleLevelComplete(true);
        break;
    }
  }

  /**
   * Start the next combo in the sequence
   */
  startNextCombo() {
    this.gameState.startNextCombo();
    this.updateComboUI();
    this.inputManager.setCurrentCombo(this.gameState.currentCombo);
    this.inputManager.startComboTracking();
  }

  /**
   * Handle level completion
   * @param {boolean} gameComplete - Whether the entire game is complete
   */
  handleLevelComplete(gameComplete) {
    this.uiManager.showComboUI(false);
    
    if (gameComplete && this.gameState.currentLevel === 3) {
      this.handleLevel3Victory();
      return;
    }
    
    this.startBooAnimation(() => {
      this.person.setAnimationState('scared');
      this.startLaughingAnimation(() => {
        this.gameState.endSuccessAnimation();
        
        if (!gameComplete) {
          this.gameState.advanceToNextLevel();
        }
        
        this.endInteraction(gameComplete ? 'success: game complete' : 'success: level advanced');
        this.resetScene();
      });
    });
  }

  /**
   * Start BOO text animation
   * @param {Function} onComplete - Callback when animation completes
   */
  startBooAnimation(onComplete) {
    this.gameState.startSuccessAnimation();
    const booFlashDelay = Constants.ANIMATION.BOO_TEXT_FLASH_FRAMES * 
                         Constants.ANIMATION.DEFAULT_FRAME_INTERVAL * 
                         Constants.ANIMATION.BOO_TEXT_FLASH_CYCLES;
    setTimeout(onComplete, booFlashDelay * 1000);
  }

  /**
   * Start laughing animation with "he he" text
   * @param {Function} onComplete - Callback when animation completes
   */
  startLaughingAnimation(onComplete) {
    this.player.setAnimationState('laughing', {
      frames: Constants.ANIMATION.LAUGHING_FRAMES,
      onComplete
    });
    this.gameState.startLaughingAnimation();
  }

  /**
   * Handle special level 3 victory with person escape animation
   */
  handleLevel3Victory() {
    this.level3EscapeTriggered = false;
    
    this.startBooAnimation(() => {
      this.gameState.showBooText = false;
      this.person.startEscape();
      
      // Make the cat scared when person is scared
      if (this.cat) {
        this.cat.setScared();
      }
      
      this.player.setAnimationState('laughing', { loop: true });
      this.gameState.startContinuousLaughing();
    });
  }

  /**
   * Complete level 3 victory sequence and start outro scene
   */
  completeLevel3Victory() {
    if (this.gameState.currentLevel !== 3) {
      return;
    }
    
    this.endInteraction('success: game complete - person escaped!');
    this.gameState.startOutroScene();
  }

  /**
   * Handle combo timeout/failure
   */
  handleTimeout() {
    this.uiManager.showComboUI(false);
    this.startFailureAnimation();
  }

  /**
   * Handle collisions between entities
   */
  handleCollisions() {
    if (!this.player || !this.person) return;
    
    const nowColliding = this.person.checkCollision(this.player);
    
    if (nowColliding && !this.person.colliding) {
      const collisionInfo = this.person.getCollisionInfo(this.player);
      
      if (collisionInfo.isTopCollision) {
        this.handleTopCollision();
      } else {
        this.handleSideCollision();
      }
    }
    
    this.person.colliding = nowColliding;
  }

  /**
   * Handle top collision (successful landing)
   */
  handleTopCollision() {
    this.player.y = this.person.y - (this.person.height + this.player.height) / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.startInteraction();
  }

  /**
   * Handle side collision failure
   */
  handleSideCollision() {
    this.player.vx = 0;
    this.player.vy = 0;
    this.uiManager.showComboUI(false);
    this.startFailureAnimation('failed: side collision');
  }

  /**
   * Start failure animation sequence
   * @param {string} reason - Reason for failure (default: 'timeout')
   */
  startFailureAnimation(reason = 'timeout') {
    this.gameState.startFailureAnimation();
    this.player.setAnimationState('swirling', {
      frames: Constants.ANIMATION.SWIRL_FRAMES,
      onComplete: () => {
        this.player.setAnimationState('dead', {
          frames: Constants.ANIMATION.DEAD_FRAMES,
          onComplete: () => {
            this.gameState.endFailureAnimation();
            this.endInteraction(reason);
            this.resetScene();
          }
        });
      }
    });
  }

  /**
   * Start interaction mode
   */
  startInteraction() {
    this.gameState.startInteraction();
    this.player.setAnimationState('scaring');
    this.uiManager.showComboUI(true);
    this.updateComboUI();
    this.inputManager.setCurrentCombo(this.gameState.currentCombo);
    this.inputManager.startComboTracking();
  }

  /**
   * End interaction mode
   * @param {string} reason - Reason for ending
   */
  endInteraction(reason) {
    this.gameState.endInteraction(reason);
    
    if (!(reason.includes('game complete') && this.gameState.currentLevel === 3)) {
      this.player.setAnimationState('default');
    }
    
    this.uiManager.resetAll();
    this.inputManager.resetKeys();
  }

  /**
   * Update combo UI display
   */
  updateComboUI() {
    if (this.gameState.currentCombo) {
      const symbols = this.gameState.getComboDisplaySymbols(this.gameState.currentCombo);
      this.uiManager.updateComboDisplay(this.gameState.currentCombo, symbols);
      this.uiManager.resetProgress();
    }
  }

  /**
   * Reset the game scene
   */
  resetScene() {
    this.gameState.reset();
    
    if (this.player) {
      this.player.reset();
    }
    
    // Swap between person and witch based on level
    const currentLevel = this.gameState.currentLevel;
    if (currentLevel === 3) {
      this.person = this.witchEntity;
    } else {
      this.person = this.personEntity;
    }
    
    if (this.person) {
      this.person.updateForLevel(this.gameState.getCurrentLevelConfig());
      this.person.reset();
    }
    
    if (this.moon) {
      this.moon.x = Constants.MOON.OFFSET_X;
      this.moon.y = Constants.MOON.OFFSET_Y;
    }
    
    if (this.tree) {
      this.tree.x = this.canvas.width / 2 + 50;
      this.tree.y = this.canvas.height - 400;
    }
    
    if (this.city) {
      this.city.x = Constants.CITY.DEFAULT_X_OFFSET;
      this.city.y = Constants.CITY.DEFAULT_Y_OFFSET;
    }
    
    if (this.cat) {
      this.cat.reset();
    }
    
    this.uiManager.resetAll();
    this.inputManager.resetKeys();
  }

  /**
   * Draw the game
   */
  draw() {
    const levelConfig = this.gameState.getCurrentLevelConfig();
    this.renderer.clear();

    if (this.gameState.currentScene === 'intro') {
      this.drawSceneText();
      return;
    }

    this.drawBackground(levelConfig);
    this.drawEntities(levelConfig);
    this.drawTextEffects();
    this.drawSceneText();
  }

  /**
   * Draw background elements (city, moon and tree)
   * @param {Object} levelConfig - Current level configuration
   */
  drawBackground(levelConfig) {
    // Draw city first (furthest back)
    if (this.city && levelConfig.showCity) {
      this.city.render(this.renderer.ctx);
    }
    
    if (this.moon && levelConfig.showMoon) {
      this.moon.render(this.renderer.ctx);
    }
    
    if (this.tree && levelConfig.showTree) {
      this.tree.render(this.renderer.ctx);
    }
  }

  /**
   * Draw game entities
   * @param {Object} levelConfig - Current level configuration
   */
  drawEntities(levelConfig) {
    if (this.cat && this.gameState.currentLevel === 3) {
      this.renderer.drawCat(this.cat);
    }
    
    if (this.person) {
      this.renderer.drawPerson(this.person);
    }
    
    if (this.player) {
      this.renderer.drawPlayer(this.player);
    }
  }

  /**
   * Draw text effects (BOO and "he he")
   */
  drawTextEffects() {
    if (this.gameState.showBooText && this.player && this.person) {
      const { x, y } = this.getTextPosition(Constants.BOO_TEXT.OFFSET_Y);
      this.renderer.drawBooText(x, y, this.gameState.booTextTimer);
    }
  }

  /**
   * Get text position based on player and person positions
   * @param {number} offsetY - Y offset from entity position
   * @returns {Object} Object with x and y coordinates
   */
  getTextPosition(offsetY) {
    if (this.person.isEscaping) {
      return {
        x: this.player.x,
        y: this.player.y - offsetY
      };
    }
    
    return {
      x: (this.player.x + this.person.x) / 2,
      y: Math.min(this.player.y, this.person.y) - offsetY
    };
  }

  /**
   * Draw intro/outro scene text if active
   */
  drawSceneText() {
    if (!this.gameState.isInScene()) return;
    
    const opacity = this.gameState.getCurrentSceneOpacity();
    const text = this.gameState.currentScene === 'intro' 
      ? Constants.SCENE_TEXT.INTRO_TEXT 
      : Constants.SCENE_TEXT.OUTRO_TEXT;
    
    if (text && opacity > 0) {
      this.renderer.drawSceneText(text, opacity);
    }
  }

  /**
   * Get current game statistics for debugging
   * @returns {Object} Game statistics
   */
  getStats() {
    return {
      level: this.gameState.currentLevel,
      interactionActive: this.gameState.interactionActive,
      animationInProgress: this.gameState.animationInProgress,
      combosCompleted: this.gameState.combosCompleted,
      currentCombo: this.gameState.currentCombo,
      assetsLoaded: this.assetManager.isLoaded()
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
  }
}