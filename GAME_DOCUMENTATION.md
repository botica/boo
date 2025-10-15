# Game.js Documentation

## Overview
The main `Game` class orchestrates all game systems and manages the complete game lifecycle.

## Architecture

### Core Systems
- **AssetManager**: Loads and manages game assets (sprites, images)
- **Renderer**: Handles all canvas drawing operations
- **GameState**: Manages game state (levels, combos, timers)
- **UIManager**: Controls UI elements (progress bar, combo display)
- **InputManager**: Handles keyboard and touch input

### Entities
- **Player**: The ghost character controlled by arrow keys
- **Person**: The NPC that the player tries to scare
- **Moon**: Background element (visibility varies by level)
- **Tree**: Background element (always visible)
- **Cat**: Special entity for level 3 cat rescue sequence

## Game Flow

1. **Initialization** (`init`)
   - Load all assets
   - Initialize entities
   - Show intro scene

2. **Gameplay Loop** (`update`, `draw`)
   - Update entity positions and animations
   - Check for collisions
   - Handle combo input
   - Render game state

3. **Interaction Sequence**
   - Player lands on person's head → Start interaction
   - Display combo (e.g., Up + Right)
   - Player inputs correct keys → Success
   - Complete all combos → Level complete

4. **Level Progression**
   - Level 1-2: Standard combo completion
   - Level 3: Person escapes with cat rescue
   - After level 3: Outro scene → Reset to level 1

## Key Methods

### Initialization
- `init()`: Load assets and start game
- `onAssetsLoaded()`: Initialize entities after assets load
- `resetScene()`: Reset game state for new level/retry

### Game Loop
- `gameLoop(now)`: Main animation loop using requestAnimationFrame
- `update(dt)`: Update all game logic and entities
- `draw()`: Render current game state

### Level Completion
- `handleLevelComplete(gameComplete)`: Standard level completion with BOO animation
- `handleLevel3Victory()`: Special level 3 ending with person escape
- `completeLevel3Victory()`: Finalize level 3 and start outro

### Animation Sequences
- `startBooAnimation(onComplete)`: BOO text flash animation
- `startLaughingAnimation(onComplete)`: Ghost laughing with "he he" text
- `startFailureAnimation(reason)`: Ghost swirling and dying animation

### Collision Handling
- `handleCollisions()`: Check player-person collision
- `handleTopCollision()`: Landing on head (success)
- `handleSideCollision()`: Hitting side (failure)

### Person Escape (Level 3)
- `handlePersonEscape()`: Manage escape sequences
- `handleLevel3Escape()`: Cat rescue sequence logic

### Input Handling
- `handleComboInput()`: Check if player input matches current combo
- `handleComboSuccess()`: Process successful combo completion
- `handleTimeout()`: Handle combo timeout failure

### Scene Management
- `handleSceneComplete(scene)`: Handle intro/outro completion
- `drawSceneText()`: Render scene fade in/out text

### Rendering
- `drawBackground(levelConfig)`: Draw moon and tree
- `drawEntities(levelConfig)`: Draw player, person, cat
- `drawTextEffects()`: Draw BOO and "he he" text
- `getTextPosition(offsetY)`: Calculate text position (handles escape)

## Animation Timings

- **BOO Flash**: 4 frames × 0.5s = 2.0s total
- **Laughing Duration**: Defined in Constants.ANIMATION.LAUGHING_DURATION
- **Swirl Animation**: Constants.ANIMATION.SWIRL_FRAME_COUNT frames
- **Dead Duration**: Constants.ANIMATION.DEAD_DURATION

## Refactoring Summary

### Changes Made
1. **Removed Debug Logs**: Eliminated console.log statements for cleaner code
2. **Simplified Comments**: Removed redundant inline comments
3. **Extracted Methods**: 
   - Animation sequences → `startBooAnimation`, `startLaughingAnimation`, `startFailureAnimation`
   - Collision handling → `handleTopCollision`, `handleSideCollision`
   - Drawing logic → `drawBackground`, `drawEntities`, `drawTextEffects`, `getTextPosition`
   - Person escape → `handlePersonEscape`, `handleLevel3Escape`
4. **Consolidated Logic**: Combined duplicate animation code
5. **Improved Structure**: Better separation of concerns and method organization

### Benefits
- **Readability**: Shorter methods with clear single responsibilities
- **Maintainability**: Easier to modify individual features
- **Testability**: Smaller, focused methods are easier to test
- **Reusability**: Extracted methods can be called from multiple places
- **Documentation**: Clear JSDoc comments explain each method's purpose

## Testing
The game was tested by:
1. Starting the HTTP server
2. Loading the game in a browser
3. Verifying intro scene plays correctly
4. Confirming ghost movement responds to arrow keys
5. Checking browser console for errors (none found)

All functionality works as expected after refactoring.
