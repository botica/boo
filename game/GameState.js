/**
 * GameState manages all game state including levels, combos, and interaction timing
 */
import { GameConfig } from '../config/GameConfig.js';
import { Constants } from '../config/Constants.js';

export class GameState {
  constructor() {
    this.initializeState();
  }

  // =================== INITIALIZATION ===================

  initializeState() {
    this.currentLevel = 1;
    this.combosCompleted = 0;
    
    this.interactionActive = false;
    this.animationInProgress = false;
    
    this.resetComboState();
    
    this.showBooText = false;
    this.booTextTimer = 0;
    this.booTextFrameIndex = 0;
  this.continuousLaughing = false;
    
    this.gameHasStarted = false;
    this.currentScene = null;
    this.sceneTimer = 0;
    this.sceneFrameIndex = 0;
    this.sceneStartTime = 0;
    
    this.arrowKeys = GameConfig.arrowKeys;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
  }

  resetComboState() {
    this.currentCombo = null;
    this.comboTimeLeft = 0;
    this.comboAccepted = false;
    this.lastCombo = null;
    this.levelCombos = [];
    this.comboStartDelay = 0; // Delay timer before countdown starts
  }

  // =================== LEVEL MANAGEMENT ===================

  getCurrentLevelConfig() {
    return GameConfig.levelConfig[this.currentLevel];
  }

  advanceToNextLevel() {
    if (this.currentLevel < GameConfig.MAX_LEVELS) {
      this.currentLevel++;
      this.combosCompleted = 0;
      this.resetComboState();
      this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
      this.updateLevelTitle();
    }
  }

  resetToLevel1() {
    this.currentLevel = 1;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
    this.updateLevelTitle();
  }

  updateLevelTitle() {
    document.title = `boo! - level ${this.currentLevel}`;
  }

  // =================== INTERACTION MANAGEMENT ===================

  startInteraction() {
    if (this.interactionActive) return;
    
    this.interactionActive = true;
    this.comboAccepted = false;
    this.resetComboState();
    this.startNextCombo();
  }

  endInteraction(reason) {
    this.interactionActive = false;
    this.currentCombo = null;
    this.comboTimeLeft = 0;
  }

  // =================== COMBO GENERATION ===================

  generateAllCombos() {
    const all = [];
    for (const a of this.arrowKeys) {
      for (const b of this.arrowKeys) {
        if (a === b) continue;
        all.push(`${a}|${b}`);
      }
    }
    return all;
  }

  selectRandomCombo(availableCombos) {
    return availableCombos[Math.floor(Math.random() * availableCombos.length)];
  }

  startNextCombo() {
    const config = this.getCurrentLevelConfig();
    this.comboDuration = config ? config.comboDuration : 5.0;
    
    const allCombos = this.generateAllCombos();
    const availableCombos = this.lastCombo 
      ? allCombos.filter(combo => combo !== this.lastCombo)
      : allCombos;
    
    const chosen = this.selectRandomCombo(availableCombos);
    
    this.lastCombo = chosen;
    this.levelCombos.push(chosen);
    this.currentCombo = chosen.split('|');
    this.comboTimeLeft = this.comboDuration;
    this.comboAccepted = false;
    // Calculate delay proportional to progress bar frame duration
    // Each progress bar frame represents (comboDuration / PROGRESS_BAR_FRAMES) seconds
    const frameTime = this.comboDuration / Constants.UI.PROGRESS_BAR_FRAMES;
    this.comboStartDelay = frameTime * Constants.UI.PROGRESS_BAR_START_DELAY_FACTOR;
  }

  // =================== COMBO PROCESSING ===================

  processComboSuccess() {
    this.comboAccepted = true;
    this.combosCompleted++;
    
    if (this.combosCompleted >= GameConfig.COMBOS_PER_LEVEL) {
      return this.handleLevelCompletion();
    } else {
      return 'continue';
    }
  }

  handleLevelCompletion() {
    this.showBooText = true;
    this.booTextTimer = 0;
    this.booTextFrameIndex = 0;
    this.animationInProgress = true;
    
    if (this.currentLevel < GameConfig.MAX_LEVELS) {
      return 'level_complete';
    } else {
      return 'game_complete';
    }
  }

  processComboTimeout() {
    this.comboAccepted = true;
    this.animationInProgress = true;
  }

  // =================== ANIMATION MANAGEMENT ===================

  startSuccessAnimation() {
    this.showBooText = true;
    this.booTextTimer = 0;
    this.booTextFrameIndex = 0;
    this.animationInProgress = true;
  }

  startLaughingAnimation() {
  // Laughing animation only
  }

  startContinuousLaughing() {
  this.continuousLaughing = true;
  }

  endSuccessAnimation() {
  this.showBooText = false;
  this.animationInProgress = false;
  }

  startFailureAnimation() {
    this.animationInProgress = true;
  }

  endFailureAnimation() {
    this.animationInProgress = false;
  }

  // =================== UPDATE & RESET ===================

  update(dt) {
    const changes = {};
    
    this.updateBooText(dt);
    this.updateComboTimer(dt, changes);
    
    return changes;
  }

  updateBooText(dt) {
    if (this.showBooText) {
      this.booTextTimer += dt;
      
      // Calculate frame index based on timer (same fade logic as scene text)
      const frameInterval = Constants.ANIMATION.DEFAULT_FRAME_INTERVAL;
      this.booTextFrameIndex = Math.floor(this.booTextTimer / frameInterval);
      
      // Total duration: 4 frames (full opacity for 2 frames, fade for 1 frame, gone for 1 frame)
      const booTextDuration = 4 * frameInterval;
      
      if (this.booTextTimer >= booTextDuration) {
        this.showBooText = false;
      }
    }
  }

  /**
   * Get the current opacity for BOO text using the unified fade effect
   * @returns {number} Opacity value (0-1)
   */
  getBooTextOpacity() {
    if (!this.showBooText) return 0;
    return this.getFadeOutOpacity(this.booTextFrameIndex);
  }

  updateComboTimer(dt, changes) {
    if (this.interactionActive && this.currentCombo) {
      // Wait for delay period before starting countdown
      if (this.comboStartDelay > 0) {
        this.comboStartDelay -= dt;
        // Keep progress at 100% during delay
        changes.progressPercentage = 1.0;
        return;
      }
      
      this.comboTimeLeft -= dt;
      const pct = Math.max(0, Math.min(1, this.comboTimeLeft / this.comboDuration));
      changes.progressPercentage = pct;

      if (this.comboTimeLeft <= 0 && !this.comboAccepted) {
        this.processComboTimeout();
        changes.timeout = true;
      }
    }
  }

  reset() {
    this.interactionActive = false;
    this.animationInProgress = false;
    this.resetComboState();
    this.showBooText = false;
    this.booTextTimer = 0;
    this.booTextFrameIndex = 0;
    this.continuousLaughing = false;
    this.combosCompleted = 0;
  }

  // =================== UTILITY METHODS ===================

  getComboDisplaySymbols(combo) {
    return combo.map(key => GameConfig.arrowSymbols[key] || key);
  }

  hasWindEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasWind && !this.interactionActive && !this.animationInProgress;
  }

  hasFloatEffect() {
    const config = this.getCurrentLevelConfig();
    return config && config.hasFloats !== false && !this.interactionActive && !this.animationInProgress;
  }

  // =================== SCENE MANAGEMENT ===================

  startIntroScene() {
    this.currentScene = 'intro';
    this.sceneTimer = 0;
    this.sceneFrameIndex = 0;
    this.sceneTextIndex = 0; // Track which intro text frame we're on
    this.sceneStartTime = performance.now();
  }

  startOutroScene() {
    this.currentScene = 'outro';
    this.sceneTimer = 0;
    this.sceneFrameIndex = 0;
    this.sceneStartTime = performance.now();
  }

  updateScene(dt) {
    if (!this.currentScene) return { sceneComplete: false };

    this.sceneTimer += dt;
    
    const frameInterval = Constants.SCENE_TEXT.FADE_FRAME_INTERVAL;
    const newFrameIndex = Math.floor(this.sceneTimer / frameInterval);
    
    if (newFrameIndex !== this.sceneFrameIndex) {
      this.sceneFrameIndex = newFrameIndex;
    }

    const totalFrames = 4; // Full opacity (2 frames) + 50% opacity (1 frame) + 0% opacity (1 frame)
    
    // Check if current fade cycle is complete
    if (this.sceneFrameIndex >= totalFrames) {
      // For intro, check if we have more text frames to show
      if (this.currentScene === 'intro' && Array.isArray(Constants.SCENE_TEXT.INTRO_TEXT)) {
        this.sceneTextIndex++;
        
        // If there are more intro text frames, reset for next frame
        if (this.sceneTextIndex < Constants.SCENE_TEXT.INTRO_TEXT.length) {
          this.sceneTimer = 0;
          this.sceneFrameIndex = 0;
          return { sceneComplete: false };
        }
      }
      
      // Scene is complete
      const completedScene = this.currentScene;
      this.currentScene = null;
      this.sceneTimer = 0;
      this.sceneFrameIndex = 0;
      this.sceneTextIndex = 0;
      
      if (completedScene === 'intro') {
        this.gameHasStarted = true;
      }
      
      return { sceneComplete: true, completedScene };
    }

    return { sceneComplete: false };
  }

  getCurrentSceneOpacity() {
    if (!this.currentScene) return 0;
    return this.getFadeOutOpacity(this.sceneFrameIndex);
  }

  getCurrentSceneText() {
    if (!this.currentScene) return '';
    
    if (this.currentScene === 'intro') {
      const introText = Constants.SCENE_TEXT.INTRO_TEXT;
      // If intro text is an array, return the current frame
      if (Array.isArray(introText)) {
        return introText[this.sceneTextIndex] || '';
      }
      return introText;
    }
    
    return Constants.SCENE_TEXT.OUTRO_TEXT;
  }

  getFadeOutOpacity(frameIndex) {
    // Frame 0-1: full opacity (1.0) - displayed for 2 frames
    // Frame 2: fade to 50% opacity (0.5) - displayed for 1 frame
    // Frame 3+: fade to dark (0.0) - displayed for 1 frame then done
    if (frameIndex <= 1) return 1.0;
    if (frameIndex === 2) return 0.5;
    return 0;
  }

  isInScene() {
    return this.currentScene !== null;
  }
}