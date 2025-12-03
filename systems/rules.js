/* Implements the core gameplay rules.  
Creates and manages the brick grid, handles life loss, game restart and ball resets.  
Controls scoring, state transitions and game-over conditions.
*/
import { CONFIG } from '../config.js'

export function createBricks(state, dom) {
  const { BRICK_ROWS, BRICK_COLS, BRICK_WIDTH, BRICK_HEIGHT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT } = CONFIG

  state.bricks = []
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
  const { GAME_WIDTH, HUD_HEIGHT, PADDLE_WIDTH } = CONFIG
  const p = state.paddle
  const b = state.ball

  p.x = (GAME_WIDTH - PADDLE_WIDTH) / 2
  p.y = CONFIG.GAME_HEIGHT - HUD_HEIGHT - 40

  b.stuckToPaddle = true
  b.vx = CONFIG.BALL_SPEED
  b.vy = -CONFIG.BALL_SPEED
}

export function restartState(state) {
  state.isPaused = false
  state.isGameOver = false
  state.timeElapsed = 0
  state.score = 0
  state.lives = CONFIG.INITIAL_LIVES
}
