/* Applies movement and physics to the paddle and ball.
   Handles paddle motion from input and ball position updates with optional slow effect.
*/
import { CONFIG } from '../config.js'

export function updatePaddle(state, input, delta) {
  const p = state.paddle

  // movimiento horizontal según teclado
  if (input.left) {
    p.x -= CONFIG.PADDLE_SPEED * delta
  }
  if (input.right) {
    p.x += CONFIG.PADDLE_SPEED * delta
  }

  // mantener la pala dentro de los límites
  if (p.x < 0) p.x = 0
  const maxX = CONFIG.GAME_WIDTH - p.width
  if (p.x > maxX) p.x = maxX

  // si la bola está pegada a la pala, la acompañamos
  if (state.ball.stuckToPaddle) {
    const b = state.ball
    b.x = p.x + p.width / 2 - b.size / 2
    b.y = p.y - b.size - 4
  }
}

export function updateBall(state, delta) {
  const b = state.ball
  if (b.stuckToPaddle) return

  // slow effect → reduce velocidad mientras slowActive sea true
  let speedModifier = 1
  if (state.slowActive) {
    speedModifier = 0.5 // 50% de velocidad
  }

  b.x += b.vx * delta * speedModifier
  b.y += b.vy * delta * speedModifier
}
