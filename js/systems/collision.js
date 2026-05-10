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
      b.vx = Math.abs(b.vx)
    }
    if (b.x + b.size >= state.gameWidth) {
      b.x = state.gameWidth - b.size
      b.vx = -Math.abs(b.vx)
    }

    // roof
    if (b.y <= worldTop) {
      b.y = worldTop
      b.vy = Math.abs(b.vy)
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
      const prevX = Number.isFinite(b.prevX) ? b.prevX : b.x
      const prevY = Number.isFinite(b.prevY) ? b.prevY : b.y
      const cameFromAbove = prevY + b.size <= p.y
      const cameFromLeft = prevX + b.size <= p.x
      const cameFromRight = prevX >= p.x + p.width

      if (cameFromAbove || b.vy > 0) {
        b.y = p.y - b.size
        b.vy = -Math.abs(b.vy)

        // modify vx according to the point of impact
        const hitPos = b.x + b.size / 2 - p.x
        const hitRatio = (hitPos - p.width / 2) / (p.width / 2)
        b.vx = CONFIG.BALL_SPEED * hitRatio * (1 + (state.level - 1) * 0.15)
      } else if (cameFromLeft) {
        b.x = p.x - b.size - 0.1
        b.vx = -Math.abs(b.vx)
      } else if (cameFromRight) {
        b.x = p.x + p.width + 0.1
        b.vx = Math.abs(b.vx)
      }
    }
  })
}

// Returns an array with the destroyed bricks (for score and power-ups)
export function handleBrickCollisions(state) {
  const balls = getAllBalls(state)
  const destroyedBricks = []

  balls.forEach((b) => {
    if (!b) return

    let hit = null

    for (const brick of state.bricks) {
      if (brick.destroyed) continue

      const collision = getMovingRectCollision(b, brick)
      if (collision && (!hit || collision.time < hit.time)) {
        hit = { brick, collision }
      }
    }

    if (!hit) return

    const { brick, collision } = hit
    brick.destroyed = true
    if (brick.dom) brick.dom.style.display = 'none'
    destroyedBricks.push(brick)
    resolveBallAgainstRect(b, brick, collision)
  })

  return destroyedBricks
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function getMovingRectCollision(ball, rect) {
  const prevX = Number.isFinite(ball.prevX) ? ball.prevX : ball.x
  const prevY = Number.isFinite(ball.prevY) ? ball.prevY : ball.y
  const dx = ball.x - prevX
  const dy = ball.y - prevY
  const swept = getSweptAabbCollision(prevX, prevY, dx, dy, ball.size, rect)

  if (swept) return swept

  if (!rectIntersect(ball.x, ball.y, ball.size, ball.size, rect.x, rect.y, rect.width, rect.height)) {
    return null
  }

  return getPenetrationCollision(ball, rect, prevX, prevY)
}

function getSweptAabbCollision(prevX, prevY, dx, dy, size, rect) {
  if (dx === 0 && dy === 0) return null

  const expanded = {
    left: rect.x - size,
    right: rect.x + rect.width,
    top: rect.y - size,
    bottom: rect.y + rect.height,
  }

  const entryX = getEntryTime(prevX, dx, expanded.left, expanded.right)
  const exitX = getExitTime(prevX, dx, expanded.left, expanded.right)
  const entryY = getEntryTime(prevY, dy, expanded.top, expanded.bottom)
  const exitY = getExitTime(prevY, dy, expanded.top, expanded.bottom)
  const entryTime = Math.max(entryX, entryY)
  const exitTime = Math.min(exitX, exitY)

  if (entryTime > exitTime || entryTime < 0 || entryTime > 1) return null

  const cornerEpsilon = 0.0001
  if (Math.abs(entryX - entryY) <= cornerEpsilon) {
    return { time: entryTime, normalX: dx > 0 ? -1 : 1, normalY: dy > 0 ? -1 : 1 }
  }

  if (entryX > entryY) {
    return { time: entryTime, normalX: dx > 0 ? -1 : 1, normalY: 0 }
  }

  return { time: entryTime, normalX: 0, normalY: dy > 0 ? -1 : 1 }
}

function getEntryTime(pos, delta, min, max) {
  if (delta > 0) return (min - pos) / delta
  if (delta < 0) return (max - pos) / delta
  return pos >= min && pos <= max ? -Infinity : Infinity
}

function getExitTime(pos, delta, min, max) {
  if (delta > 0) return (max - pos) / delta
  if (delta < 0) return (min - pos) / delta
  return pos >= min && pos <= max ? Infinity : -Infinity
}

function getPenetrationCollision(ball, rect, prevX, prevY) {
  const prevLeft = prevX
  const prevRight = prevX + ball.size
  const prevTop = prevY
  const prevBottom = prevY + ball.size
  const fromLeft = prevRight <= rect.x
  const fromRight = prevLeft >= rect.x + rect.width
  const fromTop = prevBottom <= rect.y
  const fromBottom = prevTop >= rect.y + rect.height

  if ((fromLeft || fromRight) && (fromTop || fromBottom)) {
    return {
      time: 1,
      normalX: fromLeft ? -1 : 1,
      normalY: fromTop ? -1 : 1,
    }
  }

  if (fromLeft) return { time: 1, normalX: -1, normalY: 0 }
  if (fromRight) return { time: 1, normalX: 1, normalY: 0 }
  if (fromTop) return { time: 1, normalX: 0, normalY: -1 }
  if (fromBottom) return { time: 1, normalX: 0, normalY: 1 }

  const leftOverlap = ball.x + ball.size - rect.x
  const rightOverlap = rect.x + rect.width - ball.x
  const topOverlap = ball.y + ball.size - rect.y
  const bottomOverlap = rect.y + rect.height - ball.y
  const minOverlap = Math.min(leftOverlap, rightOverlap, topOverlap, bottomOverlap)
  const cornerEpsilon = 0.001

  if (Math.abs(leftOverlap - minOverlap) <= cornerEpsilon && Math.abs(topOverlap - minOverlap) <= cornerEpsilon) {
    return { time: 1, normalX: -1, normalY: -1 }
  }
  if (Math.abs(leftOverlap - minOverlap) <= cornerEpsilon && Math.abs(bottomOverlap - minOverlap) <= cornerEpsilon) {
    return { time: 1, normalX: -1, normalY: 1 }
  }
  if (Math.abs(rightOverlap - minOverlap) <= cornerEpsilon && Math.abs(topOverlap - minOverlap) <= cornerEpsilon) {
    return { time: 1, normalX: 1, normalY: -1 }
  }
  if (Math.abs(rightOverlap - minOverlap) <= cornerEpsilon && Math.abs(bottomOverlap - minOverlap) <= cornerEpsilon) {
    return { time: 1, normalX: 1, normalY: 1 }
  }

  if (minOverlap === leftOverlap) return { time: 1, normalX: -1, normalY: 0 }
  if (minOverlap === rightOverlap) return { time: 1, normalX: 1, normalY: 0 }
  if (minOverlap === topOverlap) return { time: 1, normalX: 0, normalY: -1 }
  return { time: 1, normalX: 0, normalY: 1 }
}

function resolveBallAgainstRect(ball, rect, collision) {
  const epsilon = 0.1

  if (collision.normalX < 0) {
    ball.x = rect.x - ball.size - epsilon
    ball.vx = -Math.abs(ball.vx)
  } else if (collision.normalX > 0) {
    ball.x = rect.x + rect.width + epsilon
    ball.vx = Math.abs(ball.vx)
  }

  if (collision.normalY < 0) {
    ball.y = rect.y - ball.size - epsilon
    ball.vy = -Math.abs(ball.vy)
  } else if (collision.normalY > 0) {
    ball.y = rect.y + rect.height + epsilon
    ball.vy = Math.abs(ball.vy)
  }
}
