import { AssetManager } from './assets/AssetManager.js';
import { Player } from './entities/Player.js';
import { Person } from './entities/Person.js';
import { Moon } from './entities/Moon.js';
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
    
    // Game loop tracking
    this.lastTime = performance.now();
    this.isRunning = false;
    
    // Level 5 escape tracking
    this.level5EscapeTriggered = false;
    
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
    const moonX = 20; // 20px margin from left edge
    const moonY = 20; // 20px margin from top edge
    this.moon = new Moon(this.assetManager, moonX, moonY);
    
    // Set up initial game state
    this.resetScene();
    this.gameState.updateLevelTitle();
    
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
    const containerWidth = container.clientWidth - 40; // Account for padding
    const containerHeight = container.clientHeight - 40;
    
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
    
    // Update UI elements
    this.uiManager.resizeElements();
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
    
    this.uiManager.resizeElements();
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
      
      // Check if person has escaped off screen during level 5 victory
      if (this.person.isEscaping && this.person.isOffScreen() && 
          this.gameState.currentLevel === 5 && !this.level5EscapeTriggered) {
        console.log('Person escaped off screen, completing level 5');
        this.level5EscapeTriggered = true;
        // Complete immediately when person is off screen
        this.completeLevel5Victory();
      }
    }
    
    // Update moon (only visible in level 1)
    if (this.moon && this.gameState.currentLevel === 1) {
      this.moon.update(dt);
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
    
    // Special handling for level 5 (game complete) - person escapes
    if (gameComplete && this.gameState.currentLevel === 5) {
      console.log('Triggering level 5 victory');
      this.handleLevel5Victory();
      return;
    }
    
    console.log('Using standard level complete animation');
    
    // Start success animation for other levels
    this.player.setAnimationState('angry', {
      frameCount: Constants.ANIMATION.ANGRY_FRAME_COUNT,
      onComplete: () => {
        this.gameState.endSuccessAnimation();
        
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
      }
    });
    
    // Make person scared immediately
    this.person.setAnimationState('scared');
    this.gameState.startSuccessAnimation();
  }

  /**
   * Handle special level 5 victory with person escape animation
   */
  handleLevel5Victory() {
    console.log('handleLevel5Victory started');
    // Reset escape tracking flag
    this.level5EscapeTriggered = false;
    
    // Start player angry animation first
    this.player.setAnimationState('angry', {
      frameCount: Constants.ANIMATION.ANGRY_FRAME_COUNT,
      onComplete: () => {
        console.log('Player angry animation complete, starting escape');
        // Stop BOO text from showing during escape
        this.gameState.showBooText = false;
        
        // After player gets angry, person starts escaping
        this.person.startEscape();
        
        // Start player laughing while person escapes
        this.player.setAnimationState('laughing', {
          duration: Constants.ANIMATION.LAUGHING_DURATION * 2, // Shorter duration
          onComplete: () => {
            console.log('Player laughing animation complete');
            // Check if person escaped, if not complete anyway
            this.completeLevel5Victory();
          }
        });
      }
    });
    
    this.gameState.startSuccessAnimation();
  }

  /**
   * Complete level 5 victory sequence and reset to level 1
   */
  completeLevel5Victory() {
    // Prevent multiple calls - if we're not on level 5 anymore, we already completed
    if (this.gameState.currentLevel !== 5) {
      console.log('Level 5 victory already completed, skipping');
      return;
    }
    
    console.log('Completing level 5 victory');
    this.gameState.endSuccessAnimation();
    this.gameState.resetToLevel1(); // Reset to level 1 after escape
    this.endInteraction('success: game complete - person escaped!');
    this.resetScene();
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
    this.player.setAnimationState('default');
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
      const moonX = 20; // 20px margin from left edge
      const moonY = 20; // 20px margin from top edge
      this.moon.x = moonX;
      this.moon.y = moonY;
    }
    
    // Reset UI
    this.uiManager.resetAll();
    this.inputManager.resetKeys();
  }

  /**
   * Draw the game
   */
  draw() {
    // Clear screen
    this.renderer.clear();
    
    // Draw moon in background (only visible in level 1)
    if (this.moon && this.gameState.currentLevel === 1) {
      this.moon.render(this.renderer.ctx);
    }
    
    // Draw entities
    if (this.person) {
      this.renderer.drawPerson(this.person);
    }
    
    if (this.player) {
      this.renderer.drawPlayer(this.player);
    }
    
    // Draw "BOO!" text if active (fixed position during level 5 escape)
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