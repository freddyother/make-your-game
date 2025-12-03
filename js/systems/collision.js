/* Detects and processes collisions between the ball, walls, paddle and bricks.  
Returns collision events (such as falling out of bounds) and adjusts ball direction accordingly.  
Manages brick destruction and simple physics responses.
*/
import { CONFIG } from '../config.js'

export function handleWorldCollisions(state) {
  const { GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT } = CONFIG
  const b = state.ball

  // side walls
  if (b.x <= 0) {
    b.x = 0
    b.vx *= -1
  }
  if (b.x + b.size >= GAME_WIDTH) {
    b.x = GAME_WIDTH - b.size
    b.vx *= -1
  }

  // roof
  if (b.y <= HUD_HEIGHT) {
    b.y = HUD_HEIGHT
    b.vy *= -1
  }

  // below → we notify the system of rules for losing life
  if (b.y + b.size >= GAME_HEIGHT) {
    return 'fell-out'
  }

  return null
}

export function handlePaddleCollision(state) {
  const p = state.paddle
  const b = state.ball

  if (rectIntersect(b.x, b.y, b.size, b.size, p.x, p.y, p.width, p.height)) {
    b.y = p.y - b.size
    b.vy *= -1

    const hitPos = b.x + b.size / 2 - p.x
    const hitRatio = (hitPos - p.width / 2) / (p.width / 2)
    b.vx = CONFIG.BALL_SPEED * hitRatio
  }
}

export function handleBrickCollisions(state) {
  const b = state.ball
  let destroyedCount = 0

  state.bricks.forEach((brick) => {
    if (brick.destroyed) return

    if (rectIntersect(b.x, b.y, b.size, b.size, brick.x, brick.y, brick.width, brick.height)) {
      brick.destroyed = true
      brick.dom.style.display = 'none'
      destroyedCount += 1
      b.vy *= -1
    }
  })

  return destroyedCount
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
