/* Implements the core gameplay rules.
   Creates and manages the brick grid, handles life loss, game restart and ball resets.
   Controls scoring, state transitions and game-over conditions, including power-ups.
*/
import { CONFIG } from '../config.js'

const SLOW_FACTOR = 0.5 // ball at 50% speed
const SLOW_DURATION = 8 // slow effect seconds
const SCORE_X2_DURATION = 10 // score seconds x2

function getBallSpeedForLevel(level) {
  const base = CONFIG.BALL_SPEED
  const multiplier = 1 + (level - 1) * 0.2 // +20% per level
  return base * multiplier
}

export function createBricks(state, dom) {
  const { BRICK_ROWS, BRICK_COLS, BRICK_WIDTH, BRICK_HEIGHT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT } = CONFIG

  state.bricks = []
  state.bricksRemaining = 0

  const old = dom.gameArea.querySelectorAll('.brick')
  old.forEach((b) => b.remove())

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const x = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING)
      const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING)

      const brick = {
        x,
        y,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        destroyed: false,
      }

      const el = document.createElement('div')
      el.classList.add('brick')
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      el.style.width = BRICK_WIDTH + 'px'
      el.style.height = BRICK_HEIGHT + 'px'
      brick.dom = el

      dom.gameArea.appendChild(el)
      state.bricks.push(brick)
      state.bricksRemaining += 1
    }
  }
}

export function loseLife(state) {
  clearPowerUps(state)
  state.lives -= 1
  if (state.lives <= 0) {
    state.isGameOver = true
  } else {
    resetBallAndPaddle(state)
  }
}

export function resetBallAndPaddle(state) {
  const { GAME_HEIGHT, HUD_HEIGHT, BALL_SIZE, PADDLE_HEIGHT } = CONFIG
  const p = state.paddle
  const b = state.ball

  p.height = PADDLE_HEIGHT
  p.x = (state.gameWidth - p.width) / 2
  p.y = state.isMobile ? state.gameHeight - p.height - CONFIG.PADDLE_BOTTOM_OFFSET : GAME_HEIGHT - HUD_HEIGHT - 40

  const speed = getBallSpeedForLevel(state.level || 1)

  // main ball reattaches to the paddle
  b.prevX = b.x
  b.prevY = b.y
  b.stuckToPaddle = true
  b.size = BALL_SIZE
  b.vx = speed
  b.vy = -speed

  // The actual position is adjusted in updateBall when it is stuckToPaddle.

  // clear any extra balls
  clearExtraBalls(state)
  state.multiballActive = false
}

export function clearPowerUps(state) {
  const powerUps = state.powerUps || []
  powerUps.forEach((pu) => {
    if (pu.dom) pu.dom.remove()
  })
  state.powerUps = []
}

export function clearExtraBalls(state) {
  const extraBalls = state.extraBalls || []
  extraBalls.forEach((ball) => {
    if (ball.dom) ball.dom.remove()
  })
  state.extraBalls = []
}

export function restartState(state) {
  state.isPaused = false
  state.isGameOver = false
  state.timeElapsed = 0
  state.score = 0
  state.lives = CONFIG.INITIAL_LIVES

  state.level = 1
  state.bricksRemaining = 0

  state.powerUps = []
  state.paddle.width = CONFIG.PADDLE_WIDTH

  // temporary effects
  state.slowActive = false
  state.slowTimer = 0
  state.scoreMultiplier = 1
  state.scoreMultiplierTimer = 0

  // multi-ball
  state.multiballActive = false
  state.extraBalls = []
}

// Level up: reset ball/paddle, recreate bricks and increase speed
export function advanceLevel(state, dom) {
  state.level += 1
  clearPowerUps(state)
  clearExtraBalls(state)
  state.multiballActive = false
  createBricks(state, dom)
  resetBallAndPaddle(state)
}

/**
 * Decide what type of power-up to generate, with distribution:
 * - shrink (power-down): 10% of possible power-ups,
 * only available if the paddle is already at maximum size.
 * - the remaining 90% is divided equally between:
 * life, multiball, slow, scorex2. but no widen
 */
function choosePowerupKind(state) {
  const basePaddleWidth = CONFIG.PADDLE_WIDTH
  const maxPaddleWidth = basePaddleWidth * 2

  const atMaxSize = state.paddle.width >= maxPaddleWidth - 0.5

  // 🟦 Case 1: if the paddle is not at maximum
  // we distribute everything among the 5 positive power-ups
  if (!atMaxSize) {
    const options = ['life', 'widen', 'multiball', 'slow', 'scorex2']
    const idx = Math.floor(Math.random() * options.length)
    return options[idx]
  }
  // 🟥 Case 2: if the paddle is at maximum
  //  10% shrink (power-down rojo)
  //  90% is distributed among the others (but NOT widen)
  const nonSizeOptions = ['life', 'multiball', 'slow', 'scorex2'] // No 'widen'
  const r = Math.random()

  // 10% for shrink
  if (r < 0.1) {
    return 'shrink'
  }

  // The remainder (0.1–1.0) is divided equally among the remaining four.
  const r2 = (r - 0.1) / 0.9 // we normalise to (0, 1)
  const idx = Math.floor(r2 * nonSizeOptions.length)
  return nonSizeOptions[idx]
}

// Create power-ups from destroyed bricks
export function maybeSpawnPowerUps(state, destroyedBricks, dom) {
  destroyedBricks.forEach((brick) => {
    if (Math.random() < CONFIG.POWERUP_CHANCE) {
      const kind = choosePowerupKind(state)

      const pu = {
        x: brick.x + brick.width / 2 - CONFIG.POWERUP_SIZE / 2,
        y: brick.y + brick.height / 2 - CONFIG.POWERUP_SIZE / 2,
        vy: CONFIG.POWERUP_SPEED,
        size: CONFIG.POWERUP_SIZE,
        kind,
        active: true,
        dom: null,
      }

      const el = document.createElement('div')
      el.classList.add('powerup', `powerup-${kind}`)
      el.style.left = pu.x + 'px'
      el.style.top = pu.y + 'px'
      el.style.width = pu.size + 'px'
      el.style.height = pu.size + 'px'

      dom.gameArea.appendChild(el)
      pu.dom = el

      state.powerUps.push(pu)
    }
  })
}

// Move power-ups, detect collection and clear those that leave the screen.
export function updatePowerUps(state, delta, dom) {
  const p = state.paddle

  state.powerUps = state.powerUps.filter((pu) => {
    pu.y += pu.vy * delta
    if (pu.dom) {
      pu.dom.style.top = pu.y + 'px'
    }

    // collected by the paddle
    if (rectIntersect(pu.x, pu.y, pu.size, pu.size, p.x, p.y, p.width, p.height)) {
      applyPowerUp(state, pu)
      if (pu.dom) pu.dom.remove()
      return false
    }

    // falls out of screen
    if (pu.y > state.gameHeight) {
      if (pu.dom) pu.dom.remove()
      return false
    }

    return true
  })
}

// Create N extra balls from the main ball
function spawnExtraBalls(state, count) {
  const main = state.ball
  if (!main) return

  const speed = Math.hypot(main.vx, main.vy) || getBallSpeedForLevel(state.level || 1)

  const balls = state.extraBalls || []
  const baseAngle = Math.atan2(main.vy, main.vx) || -Math.PI / 3 // somewhat upwards

  const spread = Math.PI / 8 // ball separation

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i - (count - 1) / 2) * spread
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    balls.push({
      x: main.x,
      y: main.y,
      prevX: main.x,
      prevY: main.y,
      vx,
      vy,
      size: main.size,
      stuckToPaddle: false,
      dom: null, // will be created in render()
    })
  }

  state.extraBalls = balls
}

function applyPowerUp(state, powerUp) {
  const baseWidth = CONFIG.PADDLE_WIDTH
  const maxWidth = baseWidth * 2

  switch (powerUp.kind) {
    case 'life':
      state.lives += 1
      break

    case 'widen':
      state.paddle.width = Math.min(state.paddle.width * 1.3, maxWidth)
      break

    case 'shrink':
      // power-down: we reduce the paddle to its original size
      state.paddle.width = baseWidth
      break

    case 'multiball':
      // only triggered multi-ball if there was no extra already
      if (!state.multiballActive) {
        spawnExtraBalls(state, 2) // 2 extra balls
        state.multiballActive = true
      }
      break

    case 'slow':
      state.slowActive = true
      state.slowTimer = SLOW_DURATION
      break

    case 'scorex2':
      state.scoreMultiplier = 2
      state.scoreMultiplierTimer = SCORE_X2_DURATION
      break

    default:
      break
  }
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
