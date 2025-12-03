import { createInitialState } from './core/state.js'
import { createInput } from './core/input.js'
import { startLoop } from './core/loop.js'

import { getDomRefs } from './ui/dom.js'
import { updateHUD } from './ui/hud.js'
import { showPauseOverlay, showGameOver } from './ui/overlays.js'

import { updatePaddle, updateBall } from './systems/physics.js'
import { handleWorldCollisions, handlePaddleCollision, handleBrickCollisions } from './systems/collision.js'
import { createBricks, loseLife, restartState, resetBallAndPaddle } from './systems/rules.js'

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
  createBricks(state, dom)
  resetBallAndPaddle(state)
  showPauseOverlay(dom, false)
  showGameOver(dom, false)
}

// GLOBAL UPDATE
function update(delta) {
  if (state.isGameOver) {
    showGameOver(dom, true, state.score)
    return
  }

  const input = getSnapshot()

  // pause control with Space (flank detect)
  if (input.pausePressed && !inputState.lastPausePressed) {
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

  const destroyed = handleBrickCollisions(state)
  if (destroyed > 0) {
    state.score += destroyed * 10
  }

  updateHUD(state, dom)
}

// GLOBAL RENDER
function render() {
  const p = state.paddle
  const b = state.ball

  dom.paddleEl.style.left = p.x + 'px'
  dom.paddleEl.style.top = p.y + 'px'

  dom.ballEl.style.left = b.x + 'px'
  dom.ballEl.style.top = b.y + 'px'
}

// Start Loop
startLoop(update, render)
