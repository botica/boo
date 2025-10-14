import { AssetManager } from './assets/AssetManager.js';
import { Player } from './entities/Player.js';
import { Person } from './entities/Person.js';
import { Moon } from './entities/Moon.js';
import { Tree } from './entities/Tree.js';
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
    this.moon = null;
    this.tree = null;
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
      console.log('Initializing game...');
      
      // Resize canvas initially
      this.resizeCanvas();
      
      // Show loading screen
      this.renderer.drawLoadingScreen(0);
      
      // Load all game assets
      await this.assetManager.loadAssets(this.onAssetsLoaded);
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }

  /**
   * Called when all assets are loaded
   */
  onAssetsLoaded() {
    console.log('All assets loaded, starting game...');
    
    // Initialize game entities
    this.player = new Player(this.assetManager, this.canvas);
    this.person = new Person(this.assetManager, this.canvas);
    
    // Initialize moon (positioned in top left corner, size 50px)
    const moonX = Constants.MOON.OFFSET_X;
    const moonY = Constants.MOON.OFFSET_Y;
    this.moon = new Moon(this.assetManager, moonX, moonY);
    
    // Initialize tree (positioned just right of center at bottom)
    this.tree = new Tree(this.assetManager);
    
    // Initialize cat (only visible on level 3)
    this.cat = new Cat(this.assetManager, this.canvas);
    
    // Set up initial game state
    this.resetScene();
    this.gameState.updateLevelTitle();
    
    // Start with intro scene if game hasn't started yet
    if (!this.gameState.gameHasStarted) {
      this.gameState.startIntroScene();
    }
    
    // Hide loading and start game loop
    this.start();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.onResize);
    
    // Input manager will handle keyboard and touch events
    // Connect input manager to UI manager for visual feedback
    this.setupInputUIConnection();
  }

  /**
   * Connect input manager to UI manager for visual feedback
   */
  setupInputUIConnection() {
    // Input manager handles its own visual feedback
    // We just need to provide it with the current combo from game state
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
      console.warn('Game container not found, falling back to window dimensions');
      this.setCanvasDimensions();
      return;
    }
    
    // Calculate available space accounting for container padding
    const containerWidth = container.clientWidth - 20; // Account for padding
    const containerHeight = container.clientHeight - 20;
    
    // Determine canvas size based on container and constraints
    let canvasWidth = Math.max(Constants.CANVAS.MIN_WIDTH, 
                              Math.min(Constants.CANVAS.MAX_WIDTH, containerWidth));
    let canvasHeight = Math.round(canvasWidth / Constants.CANVAS.ASPECT_RATIO);
    
    // Check if height fits, adjust if needed
    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight;
      canvasWidth = Math.round(canvasHeight * Constants.CANVAS.ASPECT_RATIO);
      canvasWidth = Math.max(Constants.CANVAS.MIN_WIDTH, 
                            Math.min(Constants.CANVAS.MAX_WIDTH, canvasWidth));
    }
    
    // Set canvas dimensions
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
    
    console.log(`Canvas resized: ${canvasWidth}x${canvasHeight}`);
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
          false  // no animation in progress
        );
      }
      
      if (this.person) {
        this.person.update(dt, false); // no interaction
      }
      
      // Update moon and tree
      if (this.moon && levelConfig.showMoon) {
        this.moon.update(dt);
      }
      
      if (this.tree) {
        this.tree.update(dt);
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
      
      // Handle level 3 cat rescue sequence
      if (this.gameState.currentLevel === 3 && this.person.isEscaping) {
        if (this.person.escapePhase === 'initial' && this.person.isOffScreen() && !this.level3EscapeTriggered) {
          console.log('Person escaped off screen initially, starting cat rescue');
          this.level3EscapeTriggered = true;
          // Start cat rescue sequence
          setTimeout(() => {
            console.log('Person returning for cat');
            this.person.startCatRescue(this.cat);
          }, 1000); // 1 second delay before returning
        } else if (this.person.escapePhase === 'final_escape' && this.person.isOffScreen()) {
          console.log('Person escaped with cat, completing level 3');
          this.completeLevel3Victory();
        }
      }
      // Handle non-level 3 escape completion
      else if (this.person.isEscaping && this.person.isOffScreen() && 
               this.gameState.currentLevel !== 3 && !this.level3EscapeTriggered) {
        console.log('Person escaped off screen, completing level');
        this.level3EscapeTriggered = true;
        this.completeLevel3Victory();
      }
    }
    
    // Update moon (visibility based on level config)
    if (this.moon && levelConfig.showMoon) {
      this.moon.update(dt);
    }
    
    // Update tree (visible on all levels)
    if (this.tree) {
      this.tree.update(dt);
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
    console.log(`Scene completed: ${completedScene}`);
    
    if (completedScene === 'intro') {
      // Intro complete, start normal gameplay
      console.log('Intro scene complete, starting normal gameplay');
    } else if (completedScene === 'outro') {
      // Outro complete, reset game for next round
      console.log('Outro scene complete, resetting game for next round');
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
    // Highlight successful combo in UI
    this.uiManager.highlightSuccessfulCombo();
    
    // Process combo success
    const result = this.gameState.processComboSuccess();
    
    switch (result) {
      case 'continue':
        this.startNextCombo();
        break;
      case 'level_complete':
        console.log('Level complete detected');
        this.handleLevelComplete(false);
        break;
      case 'game_complete':
        console.log('Game complete detected');
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
    // Set the current combo in input manager BEFORE starting tracking
    this.inputManager.setCurrentCombo(this.gameState.currentCombo);
    this.inputManager.startComboTracking();
  }

  /**
   * Handle level completion
   * @param {boolean} gameComplete - Whether the entire game is complete
   */
  handleLevelComplete(gameComplete) {
    this.uiManager.showComboUI(false);
    
    console.log(`handleLevelComplete called: gameComplete=${gameComplete}, currentLevel=${this.gameState.currentLevel}`);
    
    // Special handling for level 3 (game complete) - person escapes
    if (gameComplete && this.gameState.currentLevel === 3) {
      console.log('Triggering level 3 victory');
      this.handleLevel3Victory();
      return;
    }
    
    console.log('Using standard level complete animation');
    
    // Start BOO text immediately
    this.gameState.startSuccessAnimation();
    
    // Wait for 2 complete BOO text flashes (4 frame changes = 2.0 seconds)
    const booFlashDelay = Constants.ANIMATION.BOO_TEXT_FLASH_INTERVAL * 4; // 2 complete flashes
    
    setTimeout(() => {
      // After BOO flashes, make person scared and ghost starts laughing immediately
      this.person.setAnimationState('scared');
      
      this.player.setAnimationState('laughing', {
        duration: Constants.ANIMATION.LAUGHING_DURATION,
        onComplete: () => {
          this.gameState.endSuccessAnimation();
          
          // Advance level after laughing animation completes
          if (!gameComplete) {
            this.gameState.advanceToNextLevel();
          }
          
          this.endInteraction(gameComplete ? 'success: game complete' : 'success: level advanced');
          this.resetScene();
        }
      });
      
      // Start "he he" text when laughing begins
      this.gameState.startLaughingAnimation();
      
    }, booFlashDelay * 1000); // Convert to milliseconds
  }

  /**
   * Handle special level 3 victory with person escape animation
   */
  handleLevel3Victory() {
    console.log('handleLevel3Victory started');
    // Reset escape tracking flag
    this.level3EscapeTriggered = false;
    
    // Start BOO text immediately
    this.gameState.startSuccessAnimation();
    
    // Wait for 2 complete BOO text flashes (4 frame changes = 2.0 seconds)
    const booFlashDelay = Constants.ANIMATION.BOO_TEXT_FLASH_INTERVAL * 4; // 2 complete flashes
    
    setTimeout(() => {
      console.log('BOO flashes complete, starting escape sequence');
      // Stop BOO text from showing during escape
      this.gameState.showBooText = false;
      
      // After BOO flashes, person starts escaping and ghost starts laughing immediately
      this.person.startEscape();
      
      // Start continuous laughing animation (no duration limit)
      this.player.setAnimationState('laughing', {
        loop: true // Make it loop indefinitely
      });
      
      // Start continuous "he he" text when laughing begins
      this.gameState.startContinuousLaughing();
      
    }, booFlashDelay * 1000); // Convert to milliseconds
  }

  /**
   * Complete level 3 victory sequence and start outro scene
   */
  completeLevel3Victory() {
    // Prevent multiple calls - if we're not on level 3 anymore, we already completed
    if (this.gameState.currentLevel !== 3) {
      console.log('Level 3 victory already completed, skipping');
      return;
    }
    
    console.log('Completing level 3 victory, starting outro scene');
    // Don't end the success animation - keep laughing and "he he" text
    // this.gameState.endSuccessAnimation(); // Commented out to keep laughing
    this.endInteraction('success: game complete - person escaped!');
    
    // Start outro scene (laughing will continue until game resets)
    this.gameState.startOutroScene();
  }

  /**
   * Handle combo timeout/failure
   */
  handleTimeout() {
    this.uiManager.showComboUI(false);
    
    // Start failure animation
    this.gameState.startFailureAnimation();
    this.player.setAnimationState('swirling', {
      frameCount: Constants.ANIMATION.SWIRL_FRAME_COUNT,
      onComplete: () => {
        this.player.setAnimationState('dead', {
          duration: Constants.ANIMATION.DEAD_DURATION,
          onComplete: () => {
            this.gameState.endFailureAnimation();
            this.endInteraction('timeout');
            this.resetScene();
          }
        });
      }
    });
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
        // Top collision starts interaction
        this.player.y = this.person.y - (this.person.height + this.player.height) / 2;
        this.player.vx = 0;
        this.player.vy = 0;
        this.startInteraction();
      } else {
        // Side collision causes failure
        this.handleSideCollision();
      }
    }
    
    this.person.colliding = nowColliding;
  }

  /**
   * Handle side collision failure
   */
  handleSideCollision() {
    this.player.vx = 0;
    this.player.vy = 0;
    this.uiManager.showComboUI(false);
    
    this.gameState.startFailureAnimation();
    this.player.setAnimationState('swirling', {
      frameCount: Constants.ANIMATION.SWIRL_FRAME_COUNT,
      onComplete: () => {
        this.player.setAnimationState('dead', {
          duration: Constants.ANIMATION.DEAD_DURATION,
          onComplete: () => {
            this.gameState.endFailureAnimation();
            this.endInteraction('failed: side collision');
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
    // Set the current combo in input manager BEFORE starting tracking
    this.inputManager.setCurrentCombo(this.gameState.currentCombo);
    this.inputManager.startComboTracking();
  }

  /**
   * End interaction mode
   * @param {string} reason - Reason for ending
   */
  endInteraction(reason) {
    this.gameState.endInteraction(reason);
    
    // Don't reset player animation during level 3 victory (keep laughing)
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
    // Reset game state
    this.gameState.reset();
    
    // Reset entities
    if (this.player) {
      this.player.reset();
    }
    
    if (this.person) {
      this.person.updateForLevel(this.gameState.getCurrentLevelConfig());
      this.person.reset();
    }
    
    // Reposition moon for current canvas size
    if (this.moon) {
      const moonX = Constants.MOON.OFFSET_X;
      const moonY = Constants.MOON.OFFSET_Y;
      this.moon.x = moonX;
      this.moon.y = moonY;
    }
    
    // Reposition tree for current canvas size
    if (this.tree) {
      this.tree.x = this.canvas.width / 2 + 50;
      this.tree.y = this.canvas.height - 400;  // Updated for 4x tree height
    }
    
    // Reset cat position
    if (this.cat) {
      this.cat.reset();
    }
    
    // Reset UI
    this.uiManager.resetAll();
    this.inputManager.resetKeys();
  }

  /**
   * Draw the game
   */
  draw() {
    const levelConfig = this.gameState.getCurrentLevelConfig();
    
    // Clear screen
    this.renderer.clear();

    // During intro scene, show nothing but the text
    if (this.gameState.currentScene === 'intro') {
      // Don't draw anything - just the scene text will be rendered at the end
    } 
    // During outro scene, show game elements in background
    else if (this.gameState.currentScene === 'outro') {
      // Draw moon in background (visibility based on level config)
      if (this.moon && levelConfig.showMoon) {
        this.moon.render(this.renderer.ctx);
      }
      
      // Draw tree in background (visibility based on level config)
      if (this.tree && levelConfig.showTree) {
        this.tree.render(this.renderer.ctx);
      }
      
      // Draw cat during outro if it was on level 3
      if (this.cat && this.gameState.currentLevel === 3) {
        this.renderer.drawCat(this.cat);
      }
      
      // Draw entities during outro
      if (this.person) {
        this.renderer.drawPerson(this.person);
      }
      
      if (this.player) {
        this.renderer.drawPlayer(this.player);
      }
      
      // Draw "he he" text during outro if laughing
      if (this.gameState.showHeheText && this.player) {
        const textX = this.player.x;
        const textY = this.player.y - Constants.HEHE_TEXT.OFFSET_Y;
        this.renderer.drawHeheText(textX, textY, this.gameState.heheTextTimer);
      }
    } else {
      // Normal gameplay rendering
      // Draw moon in background (visibility based on level config)
      if (this.moon && levelConfig.showMoon) {
        this.moon.render(this.renderer.ctx);
      }
      
      // Draw tree in background (visibility based on level config)
      if (this.tree && levelConfig.showTree) {
        this.tree.render(this.renderer.ctx);
      }
      
      // Draw cat (only on level 3)
      if (this.cat && this.gameState.currentLevel === 3) {
        this.renderer.drawCat(this.cat);
      }
      
      // Draw entities
      if (this.person) {
        this.renderer.drawPerson(this.person);
      }
      
      if (this.player) {
        this.renderer.drawPlayer(this.player);
      }
      
      // Draw "BOO!" text if active (fixed position during level 3 escape)
      if (this.gameState.showBooText && this.player && this.person) {
        let textX, textY;
        
        if (this.person.isEscaping) {
          // Keep BOO text at player position during escape
          textX = this.player.x;
          textY = this.player.y - Constants.BOO_TEXT.OFFSET_Y;
        } else {
          // Normal positioning between player and person
          textX = (this.player.x + this.person.x) / 2;
          textY = Math.min(this.player.y, this.person.y) - Constants.BOO_TEXT.OFFSET_Y;
        }
        
        this.renderer.drawBooText(textX, textY, this.gameState.booTextTimer);
      }

      // Draw "he he" text if active (appears above BOO text when laughing)
      if (this.gameState.showHeheText && this.player && this.person) {
        let textX, textY;
        
        if (this.person.isEscaping) {
          // Keep he he text at player position during escape
          textX = this.player.x;
          textY = this.player.y - Constants.HEHE_TEXT.OFFSET_Y;
        } else {
          // Normal positioning between player and person, above BOO text
          textX = (this.player.x + this.person.x) / 2;
          textY = Math.min(this.player.y, this.person.y) - Constants.HEHE_TEXT.OFFSET_Y;
        }
        
        this.renderer.drawHeheText(textX, textY, this.gameState.heheTextTimer);
      }
    }

    // Draw scene text (intro/outro) if active - this should always be on top
    if (this.gameState.isInScene()) {
      const opacity = this.gameState.getCurrentSceneOpacity();
      let text = '';
      
      if (this.gameState.currentScene === 'intro') {
        text = Constants.SCENE_TEXT.INTRO_TEXT;
      } else if (this.gameState.currentScene === 'outro') {
        text = Constants.SCENE_TEXT.OUTRO_TEXT;
      }
      
      if (text && opacity > 0) {
        this.renderer.drawSceneText(text, opacity);
      }
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
    // Additional cleanup could be added here
  }
}