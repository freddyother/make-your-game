/* Updates the movement of the paddle and the ball based on player input and delta time.  
Keeps objects within game bounds and maintains ball attachment to the paddle before launch.  
Handles purely physical motion without game-rule decisions.
*/
import { CONFIG } from '../config.js'

export function updatePaddle(state, input, delta) {
  const { GAME_WIDTH } = CONFIG
  const p = state.paddle

  if (input.left) p.x -= CONFIG.PADDLE_SPEED * delta
  if (input.right) p.x += CONFIG.PADDLE_SPEED * delta

  if (p.x < 0) p.x = 0
  if (p.x + p.width > GAME_WIDTH) p.x = GAME_WIDTH - p.width

  if (state.ball.stuckToPaddle) {
    const b = state.ball
    b.x = p.x + p.width / 2 - b.size / 2
    b.y = p.y - b.size - 4
  }
}

export function updateBall(state, delta) {
  const b = state.ball
  if (b.stuckToPaddle) return

  b.x += b.vx * delta
  b.y += b.vy * delta
}
