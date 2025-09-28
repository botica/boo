const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = 'boo-mock-2.png';
const spriteAlt = new Image();
spriteAlt.src = 'boo-mock-2-1.png';
const personSprite = new Image();
personSprite.src = 'person-mock.png';

// sprite animation state (frames are same size)
const spriteFrames = [sprite, spriteAlt];
let spriteFrameIndex = 0;
let spriteAnimTimer = 0;
const spriteAnimInterval = 0.5; // seconds between frames

function resizeCanvas() {
  // overlayed tiles-arrows are fixed and should not reduce available canvas width
  const leftW = 0;
  const rightW = 0;
  const gutter = 12;
  const availableWidth = Math.max(320, window.innerWidth - leftW - rightW - gutter - 40);
  const availableHeight = Math.max(240, window.innerHeight - 40);
  canvas.width = Math.floor(availableWidth);
  canvas.height = Math.floor(availableHeight);

  const bigSize = Math.max(64, Math.min(400, Math.floor(Math.min(canvas.width * 0.45, canvas.height * 0.6))));
  const arrow1 = document.getElementById('arrow-1');
  const arrow2 = document.getElementById('arrow-2');
  if (arrow1) { arrow1.style.width = `${bigSize}px`; arrow1.style.height = `${bigSize}px`; arrow1.style.fontSize = `${Math.floor(bigSize*0.45)}px`; }
  if (arrow2) { arrow2.style.width = `${bigSize}px`; arrow2.style.height = `${bigSize}px`; arrow2.style.fontSize = `${Math.floor(bigSize*0.45)}px`; }

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

const tileSize = 48;
const tileGap = 6;
const tilePadding = 10;

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

const arrowKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];

const keys = {};
arrowKeys.forEach(k => keys[k] = false);

let requireKeyRelease = false;
const keyReleasedSinceComboStart = {};
arrowKeys.forEach(k => keyReleasedSinceComboStart[k] = true);

let interactionActive = false;
let currentCombo = null;
let currentLevel = 1;
const levelDurations = { 1: 10.0, 2: 8.0, 3: 5.0 };//level durations in seconds
let comboDuration = levelDurations[currentLevel];
let comboTimeLeft = 0;
let combosCompleted = 0;
let comboAccepted = false;
let usedCombos = [];

function updateLevelTitle() {
  document.title = `game - Level ${currentLevel}`;
}

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
    for (let i=0;i<2;i++) {
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

  // Mark this arrow key as released for the current combo-checking rules
  if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = true;

  if (tileEls[k]) {
    tileEls[k].style.background = '#000';
    tileEls[k].style.color = '#fff';
    tileEls[k].style.border = '1px solid #fff';
  }
  if (interactionActive && currentCombo) {
    for (let i=0;i<2;i++) {
      if (currentCombo[i] === k) {
        arrowEls[i].style.background = '#000';
        arrowEls[i].style.color = '#fff';
        arrowEls[i].style.border = '1px solid #fff';
      }
    }
  }
});

let lastTime = performance.now();

function rectsOverlap(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width)/2 &&
         Math.abs(a.y - b.y) < (a.height + b.height)/2;
}

function startInteraction() {
  if (interactionActive) return;
  interactionActive = true;
  combosCompleted = 0;
  comboAccepted = false;
  usedCombos = [];
  showComboUI(true);
  startNextCombo();
}

function startNextCombo() {
  comboDuration = levelDurations[currentLevel] || 5.0;
  // Inline combo-picking (enumerate ordered pairs, exclude a|a)
  const all = [];
  for (const a of arrowKeys) {
    for (const b of arrowKeys) {
      if (a === b) continue;
      all.push(`${a}|${b}`);
    }
  }
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

  // Require keys to come up if they are currently pressed.
  requireKeyRelease = true;
  for (const k of arrowKeys) {
    keyReleasedSinceComboStart[k] = !keys[k]; // true if not currently pressed
  }

  let flashState = false;
  let flashTimer = 0;
  const labelMap = {
    ArrowLeft: '<',
    ArrowRight: '>',
    ArrowUp: '^',
    ArrowDown: 'v'
  };
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

function showComboUI(show) {
  const node = document.getElementById('combo-ui');
  if (node) node.style.display = show ? 'flex' : 'none';
  if (arrowsEl) arrowsEl.style.display = show ? 'flex' : 'none';
  if (arrowArea) arrowArea.style.display = show ? 'flex' : 'none';
}

function endInteraction(reason, opts = {}) {
  const { alertMsg = null, resetSceneAfter = false } = opts;

  interactionActive = false;
  currentCombo = null;
  comboTimeLeft = 0;

  if (resetSceneAfter) {
    resetScene();
    if (alertMsg) alert(alertMsg);
    console.log('interaction ended:', reason || 'finished');
    return;
  }

  if (arrowsEl) arrowsEl.style.display = 'none';
  if (arrowArea) arrowArea.style.display = 'none';
  showComboUI(false);

  if (arrowEls[0]) {
    arrowEls[0].textContent = '';
    arrowEls[0].style.background = '#000';
    arrowEls[0].style.color = '#fff';
    arrowEls[0].style.border = '1px solid #fff';
    arrowEls[0].style.display = 'none';
  }
  if (arrowEls[1]) {
    arrowEls[1].textContent = '';
    arrowEls[1].style.background = '#000';
    arrowEls[1].style.color = '#fff';
    arrowEls[1].style.border = '1px solid #fff';
    arrowEls[1].style.display = 'none';
  }

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

  if (alertMsg) alert(alertMsg);
}

function handleTimeout() {
  endInteraction('timeout', { alertMsg: 'Try again?', resetSceneAfter: true });
}

function resetScene() {
  interactionActive = false;
  currentCombo = null;
  comboTimeLeft = 0;
  combosCompleted = 0;
  comboAccepted = false;
  usedCombos = [];
  let flashState = false;
  let flashTimer = 0;
  if (arrowsEl) arrowsEl.style.display = 'none';
  if (arrowArea) arrowArea.style.display = 'none';
  const node = document.getElementById('combo-ui');
  if (node) node.style.display = 'none';
  if (progressFill) progressFill.style.transform = 'scaleX(1)';
  for (const k in tileEls) {
    const el = tileEls[k];
    if (el && el.style) {
      el.style.background = '#000';
      el.style.color = '#fff';
      el.style.border = '1px solid #fff';
    }
  }
  if (arrowEls[0]) {
    arrowEls[0].textContent = '';
    arrowEls[0].style.background = '#000';
    arrowEls[0].style.color = '#fff';
    arrowEls[0].style.border = '1px solid #fff';
    arrowEls[0].style.display = 'none';
  }
  if (arrowEls[1]) {
    arrowEls[1].textContent = '';
    arrowEls[1].style.background = '#000';
    arrowEls[1].style.color = '#fff';
    arrowEls[1].style.border = '1px solid #fff';
    arrowEls[1].style.display = 'none';
  }

  for (const k in keys) keys[k] = false;

  player.x = canvas.width - player.width/2 - 10;
  player.y = player.height/2 + 10;
  player.vx = 0;
  player.vy = 0;
  player.facing = 'right';

  person.x = person.width/2 + 10;
  person.y = canvas.height - person.height/2 - 10;

  person.colliding = false;
  person.vx = 0;
  person.isMoving = false;
  person.nextMoveIn = 1 + Math.random()*2.0;
  person.moveTimeLeft = 0;
}

function checkComboSuccess() {
  if (!currentCombo) return false;
  // both required keys must be pressed
  if (!(keys[currentCombo[0]] && keys[currentCombo[1]])) return false;
  // no other arrow keys may be pressed
  for (const k of arrowKeys) {
    if (k === currentCombo[0] || k === currentCombo[1]) continue;
    if (keys[k]) return false;
  }

  if (requireKeyRelease) {
    const a = currentCombo[0], b = currentCombo[1];
    if (!keyReleasedSinceComboStart[a] || !keyReleasedSinceComboStart[b]) return false;
  }

  return true;
}

function update(dt) {
  if (!interactionActive) {
    let inputX = 0, inputY = 0;
    if (keys['ArrowUp']) inputY -= 1;
    if (keys['ArrowDown']) inputY += 1;
    if (keys['ArrowLeft']) inputX -= 1;
    if (keys['ArrowRight']) inputX += 1;

    if (inputX < 0) player.facing = 'left';
    else if (inputX > 0) player.facing = 'right';

    let targetVx = 0, targetVy = 0;
    const len = Math.hypot(inputX, inputY);
    if (len > 0) {
      targetVx = (inputX / len) * player.speed;
      targetVy = (inputY / len) * player.speed;
    }

    const maxDelta = player.accel * dt;
    const dvx = targetVx - player.vx;
    const dvy = targetVy - player.vy;
    if (Math.abs(dvx) > maxDelta) player.vx += Math.sign(dvx) * maxDelta;
    else player.vx = targetVx;
    if (Math.abs(dvy) > maxDelta) player.vy += Math.sign(dvy) * maxDelta;
    else player.vy = targetVy;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  // Animate ghost sprite only while the player is moving
  const playerIsMoving = Math.abs(player.vx) > 0.001 || Math.abs(player.vy) > 0.001;
  if (playerIsMoving) {
    spriteAnimTimer += dt;
    while (spriteAnimTimer >= spriteAnimInterval) {
      spriteAnimTimer -= spriteAnimInterval;
      spriteFrameIndex = (spriteFrameIndex + 1) % spriteFrames.length;
    }
  } else {
    // when stationary: stop advancing frames but keep the current frame visible.
    // clear the timer so the interval restarts consistently when movement resumes.
    spriteAnimTimer = 0;
  }

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
    const halfW = person.width/2;
    person.x = Math.max(halfW, Math.min(canvas.width - halfW, person.x));
  }

  if (interactionActive && currentCombo) {
    comboTimeLeft -= dt;
    const pct = Math.max(0, Math.min(1, comboTimeLeft / comboDuration));
    progressFill.style.transform = `scaleX(${pct})`;

    if (checkComboSuccess()) {
      if (!comboAccepted) {
        comboAccepted = true;
        combosCompleted++;
        if (arrowEls[0]) {
          arrowEls[0].style.background = '#fff';
          arrowEls[0].style.color = '#000';
          arrowEls[0].style.border = '1px solid #000';
        }
        if (arrowEls[1]) {
          arrowEls[1].style.background = '#fff';
          arrowEls[1].style.color = '#000';
          arrowEls[1].style.border = '1px solid #000';
        }
        if (combosCompleted >= 3) {
          if (currentLevel < 3) {
            alert('boo! you scared them! advancing to the next level!');
            currentLevel++;
            updateLevelTitle();
            endInteraction('success: level advanced');
            resetScene();
          } else {
            alert('boo! you scared them! you beat the game!');
            currentLevel = 1;
            updateLevelTitle();
            endInteraction('success: game complete');
            resetScene();
          }
        } else {
          // Immediately start the next combo (remove the pause).
          startNextCombo();
        }
      }
    } else if (comboTimeLeft <= 0) {
      handleTimeout();
    }
  }

  const nowColliding = rectsOverlap(player, person);
  if (nowColliding && !person.colliding) {
    const dx = player.x - person.x;
    const dy = player.y - person.y;
    const overlapX = (player.width + person.width)/2 - Math.abs(dx);
    const overlapY = (player.height + person.height)/2 - Math.abs(dy);
    const isTopCollision = (overlapY <= overlapX) && (dy < 0);

    if (isTopCollision) {
      player.y = person.y - (person.height + player.height) / 2;
      player.vx = 0;
      player.vy = 0;
      startInteraction();
    } else {
      handleTimeout();
    }
  }
  person.colliding = nowColliding;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(personSprite, person.x - person.width/2, person.y - person.height/2, person.width, person.height);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 1;
  ctx.strokeRect(person.x - person.width/2, person.y - person.height/2, person.width, person.height);

  // choose current frame (fallback to original sprite)
  const currentSpriteImg = spriteFrames[spriteFrameIndex] || sprite;

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

function loop(now) {
  const dt = (now - lastTime)/1000;
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

let _assetsLoaded = 0;
function _onAssetLoad() {
  _assetsLoaded++;
  // we now load 3 images: sprite, spriteAlt, personSprite
  if (_assetsLoaded === 3) {
    resizeCanvas();
    updateLevelTitle();
    resetScene();
    requestAnimationFrame(loop);
  }
}
sprite.onload = _onAssetLoad;
spriteAlt.onload = _onAssetLoad;
personSprite.onload = _onAssetLoad;

// Add automation / click-press support for arrow tiles and combo arrows
{
  // Helper to simulate press (keydown) and update UI/flags
  function pressKey(k) {
    if (!k) return;
    if (!(k in keys)) keys[k] = false;
    keys[k] = true;
    // mark that the key is currently pressed (so requireKeyRelease logic can work)
    if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = false;

    // Update visual state (same as window keydown handler)
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

    // Dispatch a keyboard event so any listeners relying on real events still run
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
    } catch (e) {
      // ignore if synthetic event creation is restricted
    }
  }

  // Helper to simulate release (keyup) and update UI/flags
  function releaseKey(k) {
    if (!k) return;
    if (!(k in keys)) keys[k] = false;
    keys[k] = false;
    // mark as released for combo logic
    if (k in keyReleasedSinceComboStart) keyReleasedSinceComboStart[k] = true;

    // Update visual state (same as window keyup handler)
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
      // ignore
    }
  }

  // Attach press/release handlers to a tile element that represents a specific key name
  function attachTilePress(tileEl, keyName) {
    if (!tileEl || !keyName) return;
    // make it focusable / accessible
    tileEl.tabIndex = tileEl.tabIndex || 0;
    tileEl.setAttribute('role', 'button');

    // pointer events (mouse/touch)
    tileEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      pressKey(keyName);
      // capture pointer so we get pointerup even if pointer leaves
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

    // support click automation by performing a short press/release on click
    tileEl.addEventListener('click', e => {
      // quick press
      pressKey(keyName);
      setTimeout(() => releaseKey(keyName), 120);
    });

    // keyboard activation (Enter / Space)
    tileEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // avoid repeat behavior: only press on initial keydown
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

  // Attach to each static tile (ArrowUp / ArrowDown / ArrowLeft / ArrowRight)
  for (const k of Object.keys(tileEls)) {
    attachTilePress(tileEls[k], k);
  }

  // Attach to the dynamic combo arrow elements (arrowEls[0] and arrowEls[1]).
  // These press whatever key is required by the current combo at the time of activation.
  function attachComboArrow(el, index) {
    if (!el) return;
    el.tabIndex = el.tabIndex || 0;
    el.setAttribute('role', 'button');

    const doPress = () => {
      const k = currentCombo ? currentCombo[index] : null;
      if (k) {
        pressKey(k);
      }
    };
    const doRelease = () => {
      const k = currentCombo ? currentCombo[index] : null;
      if (k) {
        releaseKey(k);
      }
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

  attachComboArrow(arrowEls[0], 0);
  attachComboArrow(arrowEls[1], 1);
}
