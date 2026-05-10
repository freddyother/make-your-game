/* Detects and processes collisions between all balls, walls, paddle and bricks.
   Returns collision events (such as falling out of bounds) and adjusts ball direction.
   Manages brick destruction and simple physics responses.
*/
import { CONFIG } from '../config.js'

function getAllBalls(state) {
  return [state.ball, ...(state.extraBalls || [])].filter(Boolean)
}

export function handleWorldCollisions(state) {
  const worldTop = state.isMobile ? 0 : CONFIG.HUD_HEIGHT

  const extras = state.extraBalls || []
  const main = state.ball
  const balls = [main, ...extras]

  // go backwards because we can eliminate balls
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]
    if (!b) continue
    if (b.stuckToPaddle) continue

    // side walls
    if (b.x <= 0) {
      b.x = 0
      b.vx *= -1
    }
    if (b.x + b.size >= state.gameWidth) {
      b.x = state.gameWidth - b.size
      b.vx *= -1
    }

    // roof
    if (b.y <= worldTop) {
      b.y = worldTop
      b.vy *= -1
    }

    // below → that ball is lost
    if (b.y + b.size >= state.gameHeight) {
      if (i === 0) {
        // the main ball has fallen
        if (extras.length > 0) {
          const promoted = extras.shift()
          state.ball = promoted
        } else {
          // no balls left
          state.extraBalls = []
          return 'fell-out'
        }
      } else {
        // an extra ball has fallen
        extras.splice(i - 1, 1) // offset of 1 because the main one is at index 0
      }
    }
  }

  state.extraBalls = extras
  return null
}

export function handlePaddleCollision(state) {
  const p = state.paddle
  const balls = getAllBalls(state)

  balls.forEach((b) => {
    if (!b) return

    if (rectIntersect(b.x, b.y, b.size, b.size, p.x, p.y, p.width, p.height)) {
      // place the ball on top of the paddle
      b.y = p.y - b.size
      b.vy *= -1

      // modify vx according to the point of impact
      const hitPos = b.x + b.size / 2 - p.x
      const hitRatio = (hitPos - p.width / 2) / (p.width / 2)
      b.vx = CONFIG.BALL_SPEED * hitRatio * (1 + (state.level - 1) * 0.15)
    }
  })
}

// Returns an array with the destroyed bricks (for score and power-ups)
export function handleBrickCollisions(state) {
  const balls = getAllBalls(state)
  const destroyedBricks = []

  balls.forEach((b) => {
    if (!b) return

    for (const brick of state.bricks) {
      if (brick.destroyed) continue

      if (rectIntersect(b.x, b.y, b.size, b.size, brick.x, brick.y, brick.width, brick.height)) {
        brick.destroyed = true
        if (brick.dom) brick.dom.style.display = 'none'
        destroyedBricks.push(brick)

        // side detection: top/bottom vs. side (using that ball)
        const ballCentreX = b.x + b.size / 2
        const ballCentreY = b.y + b.size / 2
        const brickCentreX = brick.x + brick.width / 2
        const brickCentreY = brick.y + brick.height / 2

        const diffX = ballCentreX - brickCentreX
        const diffY = ballCentreY - brickCentreY

        const overlapX = brick.width / 2 + b.size / 2 - Math.abs(diffX)
        const overlapY = brick.height / 2 + b.size / 2 - Math.abs(diffY)

        if (overlapX < overlapY) {
          // side blow → reverse vx
          if (diffX > 0) {
            b.x = brick.x + brick.width + 0.1
          } else {
            b.x = brick.x - b.size - 0.1
          }
          b.vx *= -1
        } else {
          // up/down stroke → reverse vy
          if (diffY > 0) {
            b.y = brick.y + brick.height + 0.1
          } else {
            b.y = brick.y - b.size - 0.1
          }
          b.vy *= -1
        }

        // this ball only breaks one brick per frame
        break
      }
    }
  })

  return destroyedBricks
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
