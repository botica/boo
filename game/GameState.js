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
    // Level state
    this.currentLevel = 1;
    this.combosCompleted = 0;
    
    // Interaction state
    this.interactionActive = false;
    this.animationInProgress = false;
    
    // Combo state
    this.resetComboState();
    
    // Visual effects
    this.showBooText = false;
    this.booTextTimer = 0;
    this.showHeheText = false;
    this.heheTextTimer = 0;
    
    // Scene management
    this.gameHasStarted = false; // Track if game has ever been started
    this.currentScene = null; // 'intro', 'outro', or null for gameplay
    this.sceneTimer = 0;
    this.sceneFrameIndex = 0;
    this.sceneStartTime = 0;
    
    // Cache config data
    this.arrowKeys = GameConfig.arrowKeys;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
  }

  resetComboState() {
    this.currentCombo = null;
    this.comboTimeLeft = 0;
    this.comboAccepted = false;
    this.lastCombo = null;
    this.levelCombos = [];
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
      console.log(`Level advanced to ${this.currentLevel}`);
    }
  }

  resetToLevel1() {
    this.currentLevel = 1;
    this.comboDuration = GameConfig.levelConfig[this.currentLevel].comboDuration;
    this.updateLevelTitle();
  }

  updateLevelTitle() {
    document.title = `game - Level ${this.currentLevel}`;
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
    console.log('Interaction ended:', reason || 'finished');
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
    
    // Filter out only the last combo to prevent consecutive duplicates
    const availableCombos = this.lastCombo 
      ? allCombos.filter(combo => combo !== this.lastCombo)
      : allCombos;
    
    const chosen = this.selectRandomCombo(availableCombos);
    
    // Debug logging
    console.log(`Previous combo: ${this.lastCombo}, Generated combo: ${chosen}`);
    
    this.lastCombo = chosen;
    this.levelCombos.push(chosen);
    this.currentCombo = chosen.split('|');
    this.comboTimeLeft = this.comboDuration;
    this.comboAccepted = false;
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
    this.animationInProgress = true;
    
    if (this.currentLevel < GameConfig.MAX_LEVELS) {
      console.log(`boo! you scared them! advancing to level ${this.currentLevel + 1}!`);
      return 'level_complete';
    } else {
      console.log('boo! you scared them! you beat the game!');
      return 'game_complete';
    }
  }

  processComboTimeout() {
    this.comboAccepted = true;
    this.animationInProgress = true;
    console.log('Try again?');
  }

  // =================== ANIMATION MANAGEMENT ===================

  startSuccessAnimation() {
    this.showBooText = true;
    this.booTextTimer = 0;
    this.animationInProgress = true;
  }

  startLaughingAnimation() {
    this.showHeheText = true;
    this.heheTextTimer = 0;
  }

  endSuccessAnimation() {
    this.showBooText = false;
    this.showHeheText = false;
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
      if (this.booTextTimer >= Constants.ANIMATION.BOO_TEXT_DURATION / 1000) {
        this.showBooText = false;
      }
    }
    
    if (this.showHeheText) {
      this.heheTextTimer += dt;
      if (this.heheTextTimer >= Constants.HEHE_TEXT.DURATION / 1000) {
        this.showHeheText = false;
      }
    }
  }

  updateComboTimer(dt, changes) {
    if (this.interactionActive && this.currentCombo) {
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
    this.showHeheText = false;
    this.heheTextTimer = 0;
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
    this.sceneStartTime = performance.now();
    console.log('Starting intro scene');
  }

  startOutroScene() {
    this.currentScene = 'outro';
    this.sceneTimer = 0;
    this.sceneFrameIndex = 0;
    this.sceneStartTime = performance.now();
    console.log('Starting outro scene');
  }

  updateScene(dt) {
    if (!this.currentScene) return { sceneComplete: false };

    this.sceneTimer += dt;
    
    // Update frame index based on animation interval
    const frameInterval = Constants.SCENE_TEXT.FADE_FRAME_INTERVAL;
    const newFrameIndex = Math.floor(this.sceneTimer / frameInterval);
    
    if (newFrameIndex !== this.sceneFrameIndex) {
      this.sceneFrameIndex = newFrameIndex;
    }

    // Check if scene is complete
    const totalFrames = Constants.SCENE_TEXT.FADE_OPACITY_SEQUENCE.length;
    if (this.sceneFrameIndex >= totalFrames) {
      console.log(`${this.currentScene} scene complete`);
      const completedScene = this.currentScene;
      this.currentScene = null;
      this.sceneTimer = 0;
      this.sceneFrameIndex = 0;
      
      // Mark game as started if intro completed
      if (completedScene === 'intro') {
        this.gameHasStarted = true;
      }
      
      return { sceneComplete: true, completedScene };
    }

    return { sceneComplete: false };
  }

  getCurrentSceneOpacity() {
    if (!this.currentScene) return 0;
    
    const sequence = Constants.SCENE_TEXT.FADE_OPACITY_SEQUENCE;
    if (this.sceneFrameIndex >= sequence.length) return 0;
    
    return sequence[this.sceneFrameIndex];
  }

  isInScene() {
    return this.currentScene !== null;
  }
}