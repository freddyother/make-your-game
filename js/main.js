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
import { createBricks, loseLife, restartState, resetBallAndPaddle, advanceLevel, maybeSpawnPowerUps, updatePowerUps } from './systems/rules.js'
import { handleWorldCollisions, handlePaddleCollision, handleBrickCollisions } from './systems/collision.js'
import { CONFIG, configureForViewport } from './config.js'

// === MOBILE: lock page scrolling (iPhone/Android) ===
configureForViewport()
lockPageScrollOnTouchDevices()

function lockPageScrollOnTouchDevices() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  if (!isTouch) return // en PC no tocamos nada

  // CSS lock (por si el CSS no se cargó o no es suficiente)
  const html = document.documentElement
  const body = document.body

  html.style.overflow = 'hidden'
  html.style.height = CONFIG.IS_MOBILE ? '100dvh' : '100%'

  body.style.overflow = 'hidden'
  body.style.height = CONFIG.IS_MOBILE ? '100dvh' : '100%'
  body.style.position = 'fixed' // iOS Safari: evita que el body se “arrastre”
  body.style.inset = '0'
  body.style.width = '100%'

  // iOS Safari / Android: bloquea scroll por gesto
  const prevent = (e) => {
    if (e.cancelable) e.preventDefault()
  }

  window.addEventListener('touchmove', prevent, { passive: false })

  // Bloquea scroll con rueda / trackpad (por si acaso en móviles/tablets)
  window.addEventListener('wheel', prevent, { passive: false })

  // Bloquea gestos tipo pinch/zoom que a veces “mueven” la página
  window.addEventListener('gesturestart', prevent, { passive: false })
}

const state = createInitialState()
const dom = getDomRefs()
const { inputState, getSnapshot } = createInput()

createBricks(state, dom)
resetBallAndPaddle(state)

// --- Extra refs para el leaderboard ---
const nicknameInput = document.getElementById('nickname-input')
const btnSaveScore = document.getElementById('btn-save-score')
const highscoreTable = document.getElementById('highscore-table')
const highscoreBody = document.getElementById('highscore-body')
const nicknameBox = document.getElementById('nickname-box')

// UI Buttons
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

// we read the score displayed in the overlay
if (btnSaveScore) {
  btnSaveScore.addEventListener('click', () => {
    const nickname = (nicknameInput?.value.trim().substring(0, 10) || 'Player').toUpperCase()

    // we read the score displayed in the overlay
    const score = parseInt(document.getElementById('gameover-score').textContent, 10)

    // ⬇️ now we receive list + highlighted index
    const { list, highlightIndex } = savePlayerScore(nickname, score)

    renderHighScores(highscoreBody, list, highlightIndex)

    if (highscoreTable) {
      highscoreTable.classList.remove('hidden')
    }

    // 🔒 Block second entry:
    // - clear input
    // - disable input and button
    // - hide nickname block
    if (nicknameInput) {
      nicknameInput.value = ''
      nicknameInput.disabled = true
    }
    if (btnSaveScore) {
      btnSaveScore.disabled = true
    }
    if (nicknameBox) {
      nicknameBox.classList.add('hidden') // class use .hidden (display:none)
    }
  })
}

function restartGame() {
  // clear power-ups from the DOM
  state.powerUps.forEach((pu) => {
    if (pu.dom) pu.dom.remove()
  })
  state.powerUps = []

  // Reset logical game state
  restartState(state)

  // 🔄 Reset UI de Game Over / Leaderboard / Nickname
  if (nicknameInput) {
    nicknameInput.value = ''
    nicknameInput.disabled = false
  }
  if (btnSaveScore) {
    btnSaveScore.disabled = false
  }
  if (nicknameBox) {
    nicknameBox.classList.remove('hidden')
  }
  if (highscoreBody) {
    highscoreBody.innerHTML = ''
  }
  if (highscoreTable) {
    highscoreTable.classList.add('hidden')
  }

  createBricks(state, dom)
  resetBallAndPaddle(state)
  showPauseOverlay(dom, false)
  showGameOver(dom, false)
}

// GLOBAL UPDATE
function update(delta, fps) {
  if (state.isGameOver) {
    // we display the overlay with the final score
    showGameOver(dom, true, state.score)
    return
  }

  // === POWER-UP TIMERS ===

  // SLOW: reduces the speed of the ball for slowTimer seconds
  if (state.slowActive) {
    state.slowTimer -= delta
    if (state.slowTimer <= 0) {
      state.slowActive = false
      state.slowTimer = 0
    }
  }

  // SCORE X2: while scoreMultiplierTimer > 0 we use the multiplier;
  // when it reaches zero, we return to x1
  if (state.scoreMultiplierTimer > 0) {
    state.scoreMultiplierTimer -= delta
    if (state.scoreMultiplierTimer <= 0) {
      state.scoreMultiplierTimer = 0
      state.scoreMultiplier = 1
    }
  }

  const input = getSnapshot()
  const launchPressed = input.pausePressed || input.launchPressed
  const launchEdge = launchPressed && !inputState.lastLaunchPressed
  const pauseEdge = input.pausePressed && !inputState.lastPausePressed
  const mobileDoubleTapEdge = state.isMobile && input.launchPressed && !inputState.lastLaunchPressed

  // pause control with Space (edge detect)
  // Throw the ball if it is stuck to the paddle.
  if (state.ball.stuckToPaddle && launchEdge) {
    state.ball.stuckToPaddle = false // Throw the ball

    // If the ball is already in play, use space to pause.
  } else if (pauseEdge || (mobileDoubleTapEdge && !state.isPaused)) {
    state.isPaused = !state.isPaused
    showPauseOverlay(dom, state.isPaused)
  }
  inputState.lastPausePressed = input.pausePressed
  inputState.lastLaunchPressed = launchPressed

  if (state.isPaused) return

  state.timeElapsed += delta

  // paddle movement + ball (with slow applied in updateBall)
  updatePaddle(state, input, delta)
  updateBall(state, delta)

  const worldEvent = handleWorldCollisions(state)
  if (worldEvent === 'fell-out') {
    loseLife(state)
  }

  handlePaddleCollision(state)

  const destroyedBricks = handleBrickCollisions(state)
  if (destroyedBricks.length > 0) {
    // base score: 10 points per brick * level
    const base = destroyedBricks.length * 10 * state.level

    // apply multiplier (scorex2)
    const multiplier = state.scoreMultiplier || 1
    state.score += base * multiplier

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
  dom.paddleEl.style.left = p.x + 'px'
  dom.paddleEl.style.top = p.y + 'px'
  dom.paddleEl.style.width = p.width + 'px'
  dom.paddleEl.style.height = p.height + 'px'

  const balls = [state.ball, ...(state.extraBalls || [])].filter(Boolean)

  // main ball uses the existing #ball
  if (balls[0]) {
    const b0 = balls[0]
    dom.ballEl.style.left = b0.x + 'px'
    dom.ballEl.style.top = b0.y + 'px'
    dom.ballEl.style.width = b0.size + 'px'
    dom.ballEl.style.height = b0.size + 'px'
    b0.dom = dom.ballEl
  }

  // clean extra old balls
  const oldExtras = dom.gameArea.querySelectorAll('.ball-extra')
  oldExtras.forEach((el) => el.remove())

  // create/place extra balls
  for (let i = 1; i < balls.length; i++) {
    const b = balls[i]
    const el = document.createElement('div')

    el.classList.add('ball-extra')

    el.style.left = b.x + 'px'
    el.style.top = b.y + 'px'
    el.style.width = b.size + 'px'
    el.style.height = b.size + 'px'

    dom.gameArea.appendChild(el)
    b.dom = el
  }
}

// Start Loop
startLoop(update, render)

/* =========================================================
   Highscore helpers (LocalStorage) - TOP 5
   ========================================================= */

function loadHighScores() {
  const raw = localStorage.getItem('highscores')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveHighScores(list) {
  localStorage.setItem('highscores', JSON.stringify(list))
}

// Save the score if it enters the TOP 5.
// highlightIndex = -1 if the new score does NOT enter the TOP 5.
function savePlayerScore(nickname, score) {
  let highscores = loadHighScores()

  // we normalise old data (without ts)
  highscores = highscores.map((e) => ({
    nickname: e.nickname,
    score: e.score,
    ts: e.ts || 0,
  }))

  // current order (highest → lowest)
  highscores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (a.ts || 0) - (b.ts || 0)
  })

  const now = Date.now()
  const newEntry = { nickname, score, ts: now }

  let updated = highscores
  let highlightIndex = -1

  if (highscores.length < 5) {
    // Not yet 5 → enter for sure
    updated = [...highscores, newEntry]
  } else {
    const last = highscores[highscores.length - 1]
    if (score > last.score) {
      // Enter the TOP 5 → add and then cut to 5
      updated = [...highscores, newEntry]
    } else {
      // NO entry → return list as it is
      saveHighScores(highscores)
      return { list: highscores, highlightIndex: -1 }
    }
  }

  // Sort and keep only the top 5
  updated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (a.ts || 0) - (b.ts || 0)
  })
  updated = updated.slice(0, 5)

  saveHighScores(updated)

  // position of the new record
  highlightIndex = updated.findIndex((e) => e.score === score && e.nickname === nickname && e.ts === now)

  return { list: updated, highlightIndex }
}

// Paint table highlighting the row highlightIndex (if not -1)
function renderHighScores(tableBody, list, highlightIndex = -1) {
  if (!tableBody) return

  tableBody.innerHTML = ''

  list.forEach((row, i) => {
    const tr = document.createElement('tr')
    if (i === highlightIndex) {
      tr.classList.add('highscore-highlight')
    }

    tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${row.nickname}</td>
        <td>${row.score}</td>
      `
    tableBody.appendChild(tr)
  })
}
