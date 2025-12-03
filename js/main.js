/* Entry point of the game.  
Initialises the game state, input handlers, DOM references, brick layout and core systems.  
Starts the main update/render loop and orchestrates all game systems: physics, collisions, rules, HUD updates and UI overlays.  
Acts as the central coordinator connecting all modules.
*/

import { createInitialState } from './core/state.js'
import { createInput } from './core/input.js'
import { startLoop } from './core/loop.js'

import { getDomRefs } from './ui/dom.js'
import { updateHUD } from './ui/hud.js'
import { showPauseOverlay, showGameOver } from './ui/overlays.js'

import { updatePaddle, updateBall } from './systems/physics.js'
import { handleWorldCollisions, handlePaddleCollision, handleBrickCollisions } from './systems/collision.js'
import { createBricks, loseLife, restartState, resetBallAndPaddle, advanceLevel, maybeSpawnPowerUps, updatePowerUps } from './systems/rules.js'

const state = createInitialState()
const dom = getDomRefs()
const { inputState, getSnapshot } = createInput()

createBricks(state, dom)
resetBallAndPaddle(state)

// Bottons UI
dom.btnContinue.addEventListener('click', () => {
  state.isPaused = false
  showPauseOverlay(dom, false)
})
dom.btnRestart.addEventListener('click', () => {
  restartGame()
})
dom.btnRestartGameOver.addEventListener('click', () => {
  restartGame()
})

function restartGame() {
  restartState(state)

  // clear power-ups from the DOM
  state.powerUps.forEach((pu) => {
    if (pu.dom) pu.dom.remove()
  })
  state.powerUps = []

  createBricks(state, dom)
  resetBallAndPaddle(state)
  showPauseOverlay(dom, false)
  showGameOver(dom, false)
}

// GLOBAL UPDATE
function update(delta, fps) {
  if (state.isGameOver) {
    showGameOver(dom, true, state.score)
    return
  }

  const input = getSnapshot()

  // pause control with Space (flank detect)
  // Throw the ball if it is stuck to the paddle.
  if (state.ball.stuckToPaddle && input.pausePressed && !inputState.lastPausePressed) {
    state.ball.stuckToPaddle = false // Throw the ball

    // If the ball is already in play, use space to pause.
  } else if (input.pausePressed && !inputState.lastPausePressed) {
    state.isPaused = !state.isPaused
    showPauseOverlay(dom, state.isPaused)
  }
  inputState.lastPausePressed = input.pausePressed

  if (state.isPaused) return

  state.timeElapsed += delta

  updatePaddle(state, input, delta)
  updateBall(state, delta)

  const worldEvent = handleWorldCollisions(state)
  if (worldEvent === 'fell-out') {
    loseLife(state)
  }

  handlePaddleCollision(state)

  const destroyedBricks = handleBrickCollisions(state)
  if (destroyedBricks.length > 0) {
    state.score += destroyedBricks.length * 10 * state.level
    state.bricksRemaining -= destroyedBricks.length

    maybeSpawnPowerUps(state, destroyedBricks, dom)

    if (state.bricksRemaining <= 0) {
      advanceLevel(state, dom)
    }
  }

  updatePowerUps(state, delta, dom)

  updateHUD(state, dom, fps)
}

// GLOBAL RENDER
function render() {
  const p = state.paddle
  const b = state.ball

  dom.paddleEl.style.left = p.x + 'px'
  dom.paddleEl.style.top = p.y + 'px'
  dom.paddleEl.style.width = p.width + 'px'

  dom.ballEl.style.left = b.x + 'px'
  dom.ballEl.style.top = b.y + 'px'
}

// Start Loop
startLoop(update, render)
