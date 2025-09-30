const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Load all sprite images
const sprite = new Image();
sprite.src = 'images/boo-mock-2.png';
const spriteAlt = new Image();
spriteAlt.src = 'images/boo-mock-2-1.png';
const spriteScare1 = new Image();
spriteScare1.src = 'images/boo-scare-1.png';
const spriteScare2 = new Image();
spriteScare2.src = 'images/boo-scare-2.png';
const spriteLaugh1 = new Image();
spriteLaugh1.src = 'images/boo-laugh-1.png';
const spriteLaugh2 = new Image();
spriteLaugh2.src = 'images/boo-laugh-2.png';
const spriteSwirl1 = new Image();
spriteSwirl1.src = 'images/boo-swirl-1.png';
const spriteSwirl2 = new Image();
spriteSwirl2.src = 'images/boo-swirl-2.png';

// Person sprites for different levels
const personSprite = new Image();
personSprite.src = 'images/person-mock.png';
const personSpriteAlt = new Image();
personSpriteAlt.src = 'images/person-mock-1.png';
const personScared = new Image();
personScared.src = 'images/person-scared.png';
const personScaredAlt = new Image();
personScaredAlt.src = 'images/person-scared-1.png';

const businessSprite = new Image();
businessSprite.src = 'images/business.png';
const businessSpriteAlt = new Image();
businessSpriteAlt.src = 'images/business-1.png';
const businessScared = new Image();
businessScared.src = 'images/business-scared.png';
const businessScaredAlt = new Image();
businessScaredAlt.src = 'images/business-scared-1.png';

// Animation system
class AnimationState {
  constructor(name, frames, interval = 0.4, loop = true) {
    this.name = name;
    this.frames = frames;
    this.interval = interval; // seconds between frames
    this.loop = loop;
  }
}

class AnimatedEntity {
  constructor(states, defaultState = 'default') {
    this.states = new Map();
    this.defaultState = defaultState;
    this.currentState = defaultState;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.tempEndTime = 0;
    this.tempEndCallback = null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    // Add states to the entity
    for (const state of states) {
      this.states.set(state.name, state);
    }
  }
  
  setState(stateName, options = {}) {
    const { duration, frameCount, onComplete, immediate = false } = options;
    
    if (!this.states.has(stateName)) {
      console.warn(`Animation state "${stateName}" not found`);
      return;
    }
    
    this.currentState = stateName;
    this.frameTimer = immediate ? this.getCurrentState().interval : 0;
    this.frameIndex = 0;
    this.tempEndTime = 0;
    this.tempEndCallback = onComplete || null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    if (duration && duration > 0) {
      this.tempEndTime = performance.now() + duration;
    } else if (frameCount && frameCount > 0) {
      this.tempStateFrameCount = frameCount;
      this.tempStateFramesPlayed = 0;
    }
  }
  
  getCurrentState() {
    return this.states.get(this.currentState) || this.states.get(this.defaultState);
  }
  
  getCurrentFrame() {
    const state = this.getCurrentState();
    if (!state || !state.frames || state.frames.length === 0) return null;
    return state.frames[this.frameIndex % state.frames.length];
  }
  
  update(dt) {
    const state = this.getCurrentState();
    if (!state) return;
    
    this.frameTimer += dt;
    
    // Check if we should advance frame
    if (this.frameTimer >= state.interval) {
      this.frameTimer -= state.interval;
      
      if (state.frames && state.frames.length > 0) {
        this.frameIndex = (this.frameIndex + 1) % state.frames.length;
        
        // Handle frame count limits
        if (this.tempStateFrameCount > 0) {
          this.tempStateFramesPlayed++;
          if (this.tempStateFramesPlayed >= this.tempStateFrameCount) {
            this._endTempState();
            return;
          }
        }
      }
    }
    
    // Check time-based limits
    if (this.tempEndTime > 0 && performance.now() >= this.tempEndTime) {
      this._endTempState();
    }
  }
  
  _endTempState() {
    const callback = this.tempEndCallback;
    this.tempEndTime = 0;
    this.tempEndCallback = null;
    this.tempStateFrameCount = 0;
    this.tempStateFramesPlayed = 0;
    
    // Only reset to default state if we're not in a permanent state like 'dead'
    if (this.currentState !== 'dead') {
      this.currentState = this.defaultState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
    
    if (callback) callback();
  }
  
  isAnimating() {
    const state = this.getCurrentState();
    return state && state.frames && state.frames.length > 1;
  }
}

// Create ghost animation states
const ghostStates = [
  new AnimationState('default', [sprite], 0.4, false), // Single frame, no animation
  new AnimationState('moving', [sprite, spriteAlt], 0.4, true),
  new AnimationState('scaring', [spriteScare1, spriteScare2], 0.4, true),
  new AnimationState('laughing', [spriteLaugh1, spriteLaugh2], 0.4, true),
  new AnimationState('swirling', [spriteSwirl1, spriteSwirl2], 0.4, true),
  new AnimationState('dead', [], 0.4, false) // Empty frames array for invisible state
];

// Create ghost entity
const ghostAnimator = new AnimatedEntity(ghostStates, 'default');

// Create person animation states - will be updated per level
let personStates = [];
let personAnimator = null;

// Function to update person animator for current level
function updatePersonAnimatorForLevel() {
  const config = levelConfig[currentLevel];
  if (!config) return;
  
  personStates = [
    new AnimationState('default', config.sprites.default, 0.4, true),
    new AnimationState('scared', config.sprites.scared, 0.4, true)
  ];
  
  personAnimator = new AnimatedEntity(personStates, 'default');
}

// Level configuration
const MAX_LEVELS = 5;
const levelConfig = {
  1: {
    comboDuration: 10.0,
    sprites: {
      default: [personSprite, personSpriteAlt],
      scared: [personScared, personScaredAlt]
    }
  },
  2: {
    comboDuration: 8.0,
    sprites: {
      default: [businessSprite, businessSpriteAlt],
      scared: [businessScared, businessScaredAlt]
    }
  },
  3: {
    comboDuration: 6.0,
    sprites: {
      default: [personSprite, personSpriteAlt], // Reuse for now
      scared: [personScared, personScaredAlt]
    }
  },
  4: {
    comboDuration: 4.0,
    sprites: {
      default: [personSprite, personSpriteAlt], // Reuse for now
      scared: [personScared, personScaredAlt]
    }
  },
  5: {
    comboDuration: 2.0,
    sprites: {
      default: [personSprite, personSpriteAlt], // Reuse for now
      scared: [personScared, personScaredAlt]
    }
  }
};

// Adjust canvas and UI elements to fit window
function resizeCanvas() {
  const availableWidth = Math.max(320, window.innerWidth - 40);
  const availableHeight = Math.max(240, window.innerHeight - 40);
  canvas.width = Math.floor(availableWidth);
  canvas.height = Math.floor(availableHeight);

  const bigSize = Math.max(64, Math.min(400, Math.floor(Math.min(canvas.width * 0.45, canvas.height * 0.6))));
  const arrow1 = document.getElementById('arrow-1');
  const arrow2 = document.getElementById('arrow-2');
  if (arrow1) { 
    arrow1.style.width = `${bigSize}px`; 
    arrow1.style.height = `${bigSize}px`; 
    arrow1.style.fontSize = `${Math.floor(bigSize*0.45)}px`; 
  }
  if (arrow2) { 
    arrow2.style.width = `${bigSize}px`; 
    arrow2.style.height = `${bigSize}px`; 
    arrow2.style.fontSize = `${Math.floor(bigSize*0.45)}px`; 
  }

  const gap = 20;
  const progressEl = document.querySelector('.progress');
  if (progressEl) {
    const desired = bigSize * 2 + gap;
    const maxAllowed = canvas.width - 40;
    const finalW = Math.max(64, Math.min(desired, maxAllowed));
    progressEl.style.width = `${finalW}px`;
  }
}

window.addEventListener('resize', () => {
  resizeCanvas();
  resetScene();
});

// Game entities
const player = {
  x: 0, y: 0, vx: 0, vy: 0,
  width: 100, height: 100,
  speed: 800,
  facing: 'right',
  accel: 3000
};

const person = {
  width: 150,
  height: 150,
  x: 0, y: 0,
  colliding: false,
  vx: 0,
  isMoving: false,
  nextMoveIn: 1 + Math.random()*2.0,
  moveTimeLeft: 0,
  moveSpeed: 80
};

// UI elements
const tileSize = 48;
const tileEls = {
  ArrowUp:   document.getElementById('tile-up'),
  ArrowLeft: document.getElementById('tile-left'),
  ArrowDown: document.getElementById('tile-down'),
  ArrowRight:document.getElementById('tile-right'),
};

const arrowArea = document.getElementById('arrow-area');
const arrowsEl = document.getElementById('arrows');
const arrowEls = {
  0: document.getElementById('arrow-1'),
  1: document.getElementById('arrow-2'),
};
const progressFill = document.getElementById('progress-fill');

// Game state
const arrowKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
const keys = {};
arrowKeys.forEach(k => keys[k] = false);

let requireKeyRelease = false;
const keyReleasedSinceComboStart = {};
arrowKeys.forEach(k => keyReleasedSinceComboStart[k] = true);

let interactionActive = false;
let currentCombo = null;
let currentLevel = 1;
const levelDurations = { 1: 5.0, 2: 3.0, 3: 2.0 };
let comboDuration = levelConfig[currentLevel].comboDuration;
let comboTimeLeft = 0;
let combosCompleted = 0;
let comboAccepted = false;
let usedCombos = [];
let animationInProgress = false;

function updateLevelTitle() {
  document.title = `game - Level ${currentLevel}`;
}

// Input handling
window.addEventListener('keydown', e => {
  const raw = e.key || '';
  const k = (raw.length === 1) ? raw.toLowerCase() : raw;
  if (k in keys) keys[k] = true;

  if (tileEls[k]) {
    tileEls[k].style.background = '#fff';
    tileEls[k].style.color = '#000';
    tileEls[k].style.border = '1px solid #000';
  }
  if (interactionActive && currentCombo) {
    for (let i=0; i<2; i++) {
      if (currentCombo[i] === k) {
        arrowEls[i].style.background = '#fff';
        arrowEls[i].style.color = '#000';
        arrowEls[i].style.border = '1px solid #000';
      }
    }
  }
});

window.addEventListener('keyup', e => {
  const raw = e.key || '';
  const k = (raw.length === 1) ? raw.toLowerCase() : raw;
  if (k in keys) keys[k] = false;

  if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = true;

  if (tileEls[k]) {
    tileEls[k].style.background = '#000';
    tileEls[k].style.color = '#fff';
    tileEls[k].style.border = '1px solid #fff';
  }
  if (interactionActive && currentCombo) {
    for (let i=0; i<2; i++) {
      if (currentCombo[i] === k) {
        arrowEls[i].style.background = '#000';
        arrowEls[i].style.color = '#fff';
        arrowEls[i].style.border = '1px solid #fff';
      }
    }
  }
});

let lastTime = performance.now();

// Collision detection
function rectsOverlap(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width)/2 &&
         Math.abs(a.y - b.y) < (a.height + b.height)/2;
}

// Start interaction mode when player collides with person from above
function startInteraction() {
  if (interactionActive) return;
  interactionActive = true;
  combosCompleted = 0;
  comboAccepted = false;
  usedCombos = [];
  
  ghostAnimator.setState('scaring');
  showComboUI(true);
  startNextCombo();
}

// Begin the next combo challenge
function startNextCombo() {
  const config = levelConfig[currentLevel];
  comboDuration = config ? config.comboDuration : 5.0;
  
  // Generate all possible arrow key pairs (excluding same-key pairs)
  const all = [];
  for (const a of arrowKeys) {
    for (const b of arrowKeys) {
      if (a === b) continue;
      all.push(`${a}|${b}`);
    }
  }
  
  // Select a combo that hasn't been used recently
  let remaining = all.filter(k => !usedCombos.includes(k));
  if (remaining.length === 0) {
    usedCombos = [];
    remaining = all.slice();
  }
  const chosen = remaining[Math.floor(Math.random() * remaining.length)];
  usedCombos.push(chosen);
  const parts = chosen.split('|');
  currentCombo = [parts[0], parts[1]];
  comboTimeLeft = comboDuration;
  
  if (progressFill) {
    progressFill.style.transform = 'scaleX(1)';
  }
  comboAccepted = false;

  // Require keys to be released before they can be used for the combo
  requireKeyRelease = true;
  for (const k of arrowKeys) {
    keyReleasedSinceComboStart[k] = !keys[k];
  }

  // Map arrow keys to display symbols
  const labelMap = {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  };
  
  // Update UI to show the current combo
  if (arrowsEl) arrowsEl.style.display = 'flex';
  if (arrowEls[0]) {
    arrowEls[0].style.display = '';
    arrowEls[0].textContent = labelMap[currentCombo[0]] || currentCombo[0];
    arrowEls[0].style.background = '#000';
    arrowEls[0].style.color = '#fff';
    arrowEls[0].style.border = '1px solid #fff';
  }
  if (arrowEls[1]) {
    arrowEls[1].style.display = '';
    arrowEls[1].textContent = labelMap[currentCombo[1]] || currentCombo[1];
    arrowEls[1].style.background = '#000';
    arrowEls[1].style.color = '#fff';
    arrowEls[1].style.border = '1px solid #fff';
  }
  showComboUI(true);
}

// Toggle visibility of combo UI elements
function showComboUI(show) {
  const node = document.getElementById('combo-ui');
  if (node) node.style.display = show ? 'flex' : 'none';
  if (arrowsEl) arrowsEl.style.display = show ? 'flex' : 'none';
  if (arrowArea) arrowArea.style.display = show ? 'flex' : 'none';
  
  const progressEl = document.querySelector('.progress');
  if (progressEl) progressEl.style.display = show ? 'flex' : 'none';
}

// End the current interaction session
function endInteraction(reason, opts = {}) {
  const { resetSceneAfter = false } = opts;

  interactionActive = false;
  ghostAnimator.setState('default');
  currentCombo = null;
  comboTimeLeft = 0;

  if (resetSceneAfter) {
    resetScene();
    console.log('interaction ended:', reason || 'finished');
    return;
  }

  // Hide UI elements
  showComboUI(false);
  if (arrowsEl) arrowsEl.style.display = 'none';
  if (arrowArea) arrowArea.style.display = 'none';

  // Reset arrow styling
  for (let i = 0; i < 2; i++) {
    if (arrowEls[i]) {
      arrowEls[i].textContent = '';
      arrowEls[i].style.background = '#000';
      arrowEls[i].style.color = '#fff';
      arrowEls[i].style.border = '1px solid #fff';
      arrowEls[i].style.display = 'none';
    }
  }

  // Reset tile styling
  for (const k in tileEls) {
    const el = tileEls[k];
    if (el && el.style) {
      el.style.background = '#000';
      el.style.color = '#fff';
      el.style.border = '1px solid #fff';
    }
  }

  if (progressFill) progressFill.style.transform = 'scaleX(1)';
  
  console.log('interaction ended:', reason || 'finished');
}

// Handle timeout/failure with swirl animation
function handleTimeout() {
  showComboUI(false);
  animationInProgress = true;
  
  // Show swirling for exactly 2 frames (800ms), then invisible for 1000ms
  ghostAnimator.setState('swirling', {
    frameCount: 2,
    onComplete: () => {
      ghostAnimator.setState('dead', {
        duration: 1000,
        onComplete: () => {
          animationInProgress = false;
          endInteraction('timeout');
          resetScene();
        }
      });
    }
  });
}

// Reset the game scene
function resetScene() {
  interactionActive = false;
  animationInProgress = false;
  currentCombo = null;
  comboTimeLeft = 0;
  combosCompleted = 0;
  comboAccepted = false;
  usedCombos = [];
  
  ghostAnimator.setState('default');
  
  // Update person animator for current level and reset state
  updatePersonAnimatorForLevel();
  if (personAnimator) {
    personAnimator.setState('default');
  }
  
  // Hide UI elements
  showComboUI(false);

  // Reset key states
  for (const k in keys) keys[k] = false;

  // Reset player position and state
  player.x = canvas.width - player.width/2 - 10;
  player.y = player.height/2 + 10;
  player.vx = 0;
  player.vy = 0;
  player.facing = 'right';

  // Reset person position and state
  person.x = person.width/2 + 10;
  person.y = canvas.height - person.height/2 - 10;
  person.colliding = false;
  person.vx = 0;
  person.isMoving = false;
  person.nextMoveIn = 1 + Math.random()*2.0;
  person.moveTimeLeft = 0;
}

// Check if player has successfully input the combo
function checkComboSuccess() {
  if (!currentCombo) return false;
  
  // Both required keys must be pressed
  if (!(keys[currentCombo[0]] && keys[currentCombo[1]])) return false;
  
  // No other arrow keys may be pressed
  for (const k of arrowKeys) {
    if (k === currentCombo[0] || k === currentCombo[1]) continue;
    if (keys[k]) return false;
  }

  // Keys must have been released after combo started
  if (requireKeyRelease) {
    const a = currentCombo[0], b = currentCombo[1];
    if (!keyReleasedSinceComboStart[a] || !keyReleasedSinceComboStart[b]) return false;
  }

  return true;
}

// Main update function
function update(dt) {
  const nowMs = performance.now();
  
  // Update ghost animation
  ghostAnimator.update(dt);
  
  // Update person animation
  personAnimator.update(dt);
  
  // Handle player movement when not in interaction or animation
  if (!interactionActive && !animationInProgress) {
    let inputX = 0, inputY = 0;
    if (keys['ArrowUp']) inputY -= 1;
    if (keys['ArrowDown']) inputY += 1;
    if (keys['ArrowLeft']) inputX -= 1;
    if (keys['ArrowRight']) inputX += 1;

    if (inputX < 0) player.facing = 'left';
    else if (inputX > 0) player.facing = 'right';

    // Calculate target velocity based on input
    let targetVx = 0, targetVy = 0;
    const len = Math.hypot(inputX, inputY);
    if (len > 0) {
      targetVx = (inputX / len) * player.speed;
      targetVy = (inputY / len) * player.speed;
    }

    // Apply acceleration
    const maxDelta = player.accel * dt;
    const dvx = targetVx - player.vx;
    const dvy = targetVy - player.vy;
    if (Math.abs(dvx) > maxDelta) player.vx += Math.sign(dvx) * maxDelta;
    else player.vx = targetVx;
    if (Math.abs(dvy) > maxDelta) player.vy += Math.sign(dvy) * maxDelta;
    else player.vy = targetVy;

    // Update position with bounds checking
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));
    
    // Update ghost animation state based on movement
    const playerIsMoving = Math.abs(player.vx) > 0.001 || Math.abs(player.vy) > 0.001;
    if (playerIsMoving && ghostAnimator.currentState === 'default') {
      ghostAnimator.setState('moving');
    } else if (!playerIsMoving && ghostAnimator.currentState === 'moving') {
      ghostAnimator.setState('default');
    }
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  // Person movement when not in interaction
  if (!interactionActive) {
    if (person.isMoving) {
      person.moveTimeLeft -= dt;
      person.x += person.vx * dt;
      if (person.moveTimeLeft <= 0) {
        person.isMoving = false;
        person.vx = 0;
        person.nextMoveIn = 1 + Math.random()*3.0;
      }
    } else {
      person.nextMoveIn -= dt;
      if (person.nextMoveIn <= 0) {
        person.isMoving = true;
        const dir = Math.random() < 0.5 ? -1 : 1;
        person.moveTimeLeft = 0.15 + Math.random() * 0.45;
        const speed = person.moveSpeed * (0.6 + Math.random()*0.9);
        person.vx = dir * speed;
      }
    }
    // Keep person within bounds
    const halfW = person.width/2;
    person.x = Math.max(halfW, Math.min(canvas.width - halfW, person.x));
  }

  // Handle combo interaction
  if (interactionActive && currentCombo) {
    comboTimeLeft -= dt;
    const pct = Math.max(0, Math.min(1, comboTimeLeft / comboDuration));
    progressFill.style.transform = `scaleX(${pct})`;

    if (checkComboSuccess()) {
      if (!comboAccepted) {
        comboAccepted = true;
        combosCompleted++;
        
        // Highlight successful combo
        for (let i = 0; i < 2; i++) {
          if (arrowEls[i]) {
            arrowEls[i].style.background = '#fff';
            arrowEls[i].style.color = '#000';
            arrowEls[i].style.border = '1px solid #000';
          }
        }
        
        if (combosCompleted >= 3) {
          // Success: show laugh animation and advance level or complete game
          showComboUI(false);
          animationInProgress = true;
          
          // Make person scared when ghost laughs
          personAnimator.setState('scared');
          
          if (currentLevel < MAX_LEVELS) {
            console.log(`boo! you scared them! advancing to level ${currentLevel + 1}!`);
            currentLevel++;
            updateLevelTitle();
            ghostAnimator.setState('laughing', {
              duration: 2800,
              onComplete: () => {
                animationInProgress = false;
                endInteraction('success: level advanced');
                resetScene();
              }
            });
          } else {
            console.log('boo! you scared them! you beat the game!');
            currentLevel = 1;
            updateLevelTitle();
            ghostAnimator.setState('laughing', {
              duration: 2800,
              onComplete: () => {
                animationInProgress = false;
                endInteraction('success: game complete');
                resetScene();
              }
            });
          }
        } else {
          // Continue to next combo
          startNextCombo();
        }
      }
    } else if (comboTimeLeft <= 0) {
      // Handle timeout
      if (!comboAccepted) {
        comboAccepted = true;
        console.log('Try again?');
        handleTimeout();
      }
    }
  }

  // Check for collision between player and person
  const nowColliding = rectsOverlap(player, person);
  if (nowColliding && !person.colliding) {
    // Determine collision side
    const dx = player.x - person.x;
    const dy = player.y - person.y;
    const overlapX = (player.width + person.width)/2 - Math.abs(dx);
    const overlapY = (player.height + person.height)/2 - Math.abs(dy);
    const isTopCollision = (overlapY <= overlapX) && (dy < 0);

    if (isTopCollision) {
      // Top collision starts interaction
      player.y = person.y - (person.height + player.height) / 2;
      player.vx = 0;
      player.vy = 0;
      startInteraction();
    } else {
      // Side collision causes failure
      player.vx = 0;
      player.vy = 0;
      showComboUI(false);
      animationInProgress = true;
      
      // Show swirling for exactly 2 frames (800ms), then invisible for 1000ms
      ghostAnimator.setState('swirling', {
        frameCount: 2,
        onComplete: () => {
          ghostAnimator.setState('dead', {
            duration: 1000,
            onComplete: () => {
              animationInProgress = false;
              endInteraction('failed: side collision');
              resetScene();
            }
          });
        }
      });
    }
  }
  person.colliding = nowColliding;
}

// Draw the game scene
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get current person sprite frame
  const currentPersonImg = personAnimator.getCurrentFrame() || personSprite;

  // Draw person
  ctx.drawImage(currentPersonImg, person.x - person.width/2, person.y - person.height/2, person.width, person.height);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 1;
  ctx.strokeRect(person.x - person.width/2, person.y - person.height/2, person.width, person.height);

  // Get current ghost sprite frame
  const currentSpriteImg = ghostAnimator.getCurrentFrame();

  // Only draw ghost if there's a valid sprite (not in dead state)
  if (currentSpriteImg) {
    // Draw player with proper facing direction
    if (player.facing === 'left') {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(-1, 1);
      ctx.drawImage(currentSpriteImg, -player.width/2, -player.height/2, player.width, player.height);
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 1;
      ctx.strokeRect(-player.width/2, -player.height/2, player.width, player.height);
      ctx.restore();
    } else {
      ctx.drawImage(currentSpriteImg, player.x - player.width/2, player.y - player.height/2, player.width, player.height);
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 1;
      ctx.strokeRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    }
  }
}

// Main game loop
function loop(now) {
  const dt = (now - lastTime)/1000;
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Asset loading and game initialization
let _assetsLoaded = 0;
function _onAssetLoad() {
  _assetsLoaded++;
  // Start game when all 16 images are loaded (12 original + 4 business sprites)
  if (_assetsLoaded === 16) {
    resizeCanvas();
    updateLevelTitle();
    resetScene();
    requestAnimationFrame(loop);
  }
}

sprite.onload = _onAssetLoad;
spriteAlt.onload = _onAssetLoad;
spriteScare1.onload = _onAssetLoad;
spriteScare2.onload = _onAssetLoad;
spriteLaugh1.onload = _onAssetLoad;
spriteLaugh2.onload = _onAssetLoad;
spriteSwirl1.onload = _onAssetLoad;
spriteSwirl2.onload = _onAssetLoad;
personSprite.onload = _onAssetLoad;
personSpriteAlt.onload = _onAssetLoad;
personScared.onload = _onAssetLoad;
personScaredAlt.onload = _onAssetLoad;
businessSprite.onload = _onAssetLoad;
businessSpriteAlt.onload = _onAssetLoad;
businessScared.onload = _onAssetLoad;
businessScaredAlt.onload = _onAssetLoad;

// Input utilities for touch/mobile support
function pressKey(k) {
  if (!k) return;
  if (!(k in keys)) keys[k] = false;
  keys[k] = true;
  if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = false;

  // Update visual state
  if (tileEls[k]) {
    tileEls[k].style.background = '#fff';
    tileEls[k].style.color = '#000';
    tileEls[k].style.border = '1px solid #000';
  }
  if (interactionActive && currentCombo) {
    for (let i = 0; i < 2; i++) {
      if (currentCombo[i] === k && arrowEls[i]) {
        arrowEls[i].style.background = '#fff';
        arrowEls[i].style.color = '#000';
        arrowEls[i].style.border = '1px solid #000';
      }
    }
  }

  // Dispatch keyboard event
  try {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  } catch (e) {
    // Ignore errors
  }
}

function releaseKey(k) {
  if (!k) return;
  if (!(k in keys)) keys[k] = false;
  keys[k] = false;
  if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = true;

  // Update visual state
  if (tileEls[k]) {
    tileEls[k].style.background = '#000';
    tileEls[k].style.color = '#fff';
    tileEls[k].style.border = '1px solid #fff';
  }
  if (interactionActive && currentCombo) {
    for (let i = 0; i < 2; i++) {
      if (currentCombo[i] === k && arrowEls[i]) {
        arrowEls[i].style.background = '#000';
        arrowEls[i].style.color = '#fff';
        arrowEls[i].style.border = '1px solid #fff';
      }
    }
  }

  try {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
  } catch (e) {
    // Ignore errors
  }
}

// Add touch/click support for arrow tiles and combo arrows
function attachTilePress(tileEl, keyName) {
  if (!tileEl || !keyName) return;
  tileEl.tabIndex = tileEl.tabIndex || 0;
  tileEl.setAttribute('role', 'button');

  // Pointer events
  tileEl.addEventListener('pointerdown', e => {
    e.preventDefault();
    pressKey(keyName);
    tileEl.setPointerCapture && tileEl.setPointerCapture(e.pointerId);
  });
  
  tileEl.addEventListener('pointerup', e => {
    releaseKey(keyName);
    tileEl.releasePointerCapture && tileEl.releasePointerCapture(e.pointerId);
  });
  
  tileEl.addEventListener('pointercancel', e => {
    releaseKey(keyName);
    tileEl.releasePointerCapture && tileEl.releasePointerCapture(e.pointerId);
  });

  // Click support
  tileEl.addEventListener('click', e => {
    pressKey(keyName);
    setTimeout(() => releaseKey(keyName), 120);
  });

  // Keyboard accessibility
  tileEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pressKey(keyName);
    }
  });
  
  tileEl.addEventListener('keyup', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      releaseKey(keyName);
    }
  });
}

// Attach handlers to combo arrow elements
function attachComboArrow(el, index) {
  if (!el) return;
  el.tabIndex = el.tabIndex || 0;
  el.setAttribute('role', 'button');

  const doPress = () => {
    const k = currentCombo ? currentCombo[index] : null;
    if (k) pressKey(k);
  };
  
  const doRelease = () => {
    const k = currentCombo ? currentCombo[index] : null;
    if (k) releaseKey(k);
  };

  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    doPress();
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
  });
  
  el.addEventListener('pointerup', e => {
    doRelease();
    el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
  });
  
  el.addEventListener('click', e => {
    doPress();
    setTimeout(doRelease, 120);
  });
  
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      doPress();
    }
  });
  
  el.addEventListener('keyup', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      doRelease();
    }
  });
}

// Set up input handlers
for (const k of Object.keys(tileEls)) {
  attachTilePress(tileEls[k], k);
}

attachComboArrow(arrowEls[0], 0);
attachComboArrow(arrowEls[1], 1);
