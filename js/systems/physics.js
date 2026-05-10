/* Applies movement and physics to the paddle and balls.
   Handles paddle motion from input and updates position of
   the main ball and any extra balls, with optional slow effect.
*/
import { CONFIG } from '../config.js'

export function updatePaddle(state, input, delta) {
  const p = state.paddle

  if (state.isMobile && input.pointerActive && Number.isFinite(input.pointerX)) {
    p.x = input.pointerX - p.width / 2
  } else {
    // horizontal movement according to keyboard
    if (input.left) {
      p.x -= CONFIG.PADDLE_SPEED * delta
    }
    if (input.right) {
      p.x += CONFIG.PADDLE_SPEED * delta
    }
  }

  // keep the paddle within the limits
  if (p.x < 0) p.x = 0
  const maxX = state.gameWidth - p.width
  if (p.x > maxX) p.x = maxX

  // any ball is stuck to the paddle
  const balls = [state.ball, ...(state.extraBalls || [])]

  balls.forEach((b) => {
    if (!b || !b.stuckToPaddle) return
    b.prevX = b.x
    b.prevY = b.y
    b.x = p.x + p.width / 2 - b.size / 2
    b.y = p.y - b.size - 4
  })
}

export function updateBall(state, delta) {
  const balls = [state.ball, ...(state.extraBalls || [])]

  // slow effect → reduce speed while slowActive is true
  const speedModifier = state.slowActive ? 0.5 : 1

  balls.forEach((b) => {
    if (!b || b.stuckToPaddle) return

    b.prevX = b.x
    b.prevY = b.y
    b.x += b.vx * delta * speedModifier
    b.y += b.vy * delta * speedModifier
  })
}
