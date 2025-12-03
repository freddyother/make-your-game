/* Implements the core gameplay rules.  
Creates and manages the brick grid, handles life loss, game restart and ball resets.  
Controls scoring, state transitions and game-over conditions.
*/
import { CONFIG } from '../config.js'

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
      brick.dom = el

      dom.gameArea.appendChild(el)
      state.bricks.push(brick)
      state.bricksRemaining += 1
    }
  }
}

export function loseLife(state) {
  state.lives -= 1
  if (state.lives <= 0) {
    state.isGameOver = true
  } else {
    resetBallAndPaddle(state)
  }
}

export function resetBallAndPaddle(state) {
  const { GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT, PADDLE_WIDTH } = CONFIG
  const p = state.paddle
  const b = state.ball

  p.x = (GAME_WIDTH - p.width) / 2
  p.y = GAME_HEIGHT - HUD_HEIGHT - 40

  const speed = getBallSpeedForLevel(state.level || 1)
  b.stuckToPaddle = true
  b.vx = speed
  b.vy = -speed
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
}

// Level up: reset ball/paddle, recreate bricks and increase speed
export function advanceLevel(state, dom) {
  state.level += 1
  createBricks(state, dom)
  resetBallAndPaddle(state)
}

// Create power-ups from destroyed bricks
export function maybeSpawnPowerUps(state, destroyedBricks, dom) {
  destroyedBricks.forEach((brick) => {
    if (Math.random() < CONFIG.POWERUP_CHANCE) {
      const kind = Math.random() < 0.5 ? 'life' : 'widen'

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

      dom.gameArea.appendChild(el)
      pu.dom = el

      state.powerUps.push(pu)
    }
  })
}

// Move power-ups, detect collection and clear those that leave the screen.
export function updatePowerUps(state, delta, dom) {
  const { GAME_HEIGHT } = CONFIG
  const p = state.paddle

  state.powerUps = state.powerUps.filter((pu) => {
    pu.y += pu.vy * delta
    if (pu.dom) {
      pu.dom.style.top = pu.y + 'px'
    }

    // scooped up by the shovel
    if (rectIntersect(pu.x, pu.y, pu.size, pu.size, p.x, p.y, p.width, p.height)) {
      applyPowerUp(state, pu)
      if (pu.dom) pu.dom.remove()
      return false
    }

    // fall out
    if (pu.y > GAME_HEIGHT) {
      if (pu.dom) pu.dom.remove()
      return false
    }

    return true
  })
}

function applyPowerUp(state, powerUp) {
  if (powerUp.kind === 'life') {
    state.lives += 1
  } else if (powerUp.kind === 'widen') {
    const maxWidth = CONFIG.PADDLE_WIDTH * 2
    state.paddle.width = Math.min(state.paddle.width * 1.3, maxWidth)
  }
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
