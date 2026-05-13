/* Contains all configuration constants and tuning parameters used across the game.  
Defines sizes, speeds, layout values, brick grid dimensions and initial gameplay settings.  
Provides a single source of truth for numerical values to keep the game easily adjustable.
*/
export const CONFIG = {
  IS_MOBILE: false,
  HAS_TOUCH: false,

  GAME_WIDTH: 736,
  GAME_HEIGHT: 600,
  HUD_HEIGHT: 40,

  PADDLE_WIDTH: 120,
  PADDLE_HEIGHT: 16,
  PADDLE_SPEED: 400,

  BALL_SIZE: 14,
  BALL_SPEED: 250,

  BRICK_ROWS: 5,
  BRICK_COLS: 8,
  BRICK_WIDTH: 80,
  BRICK_HEIGHT: 24,
  BRICK_PADDING: 8,
  BRICK_OFFSET_TOP: 60,
  BRICK_OFFSET_LEFT: 20,

  INITIAL_LIVES: 3,

  // --- NEW: power-ups & difficulty ---
  POWERUP_SIZE: 18,
  POWERUP_SPEED: 120,
  POWERUP_CHANCE: 0.2, // 20% chance per destroyed brick
  POWERUP_DISABLED_LAST_BRICKS: 3,

  PADDLE_BOTTOM_OFFSET: 40,
  MOBILE_PADDLE_RAISE: 15,
}

export function configureForViewport() {
  const viewport = window.visualViewport
  const viewportWidth = Math.round(viewport?.width || window.innerWidth || CONFIG.GAME_WIDTH)
  const viewportHeight = Math.round(viewport?.height || window.innerHeight || CONFIG.GAME_HEIGHT + CONFIG.HUD_HEIGHT)
  const shortSide = Math.min(viewportWidth, viewportHeight)
  const maxTouchPoints = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0
  const hasTouchApi = 'ontouchstart' in window || maxTouchPoints > 0
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  const isIpadDesktopUserAgent = /Macintosh/i.test(navigator.userAgent) && maxTouchPoints > 1
  const hasTouchControls = hasTouchApi || hasCoarsePointer || isMobileUserAgent || isIpadDesktopUserAgent
  const isPhoneViewport = shortSide <= 540 && viewportHeight >= viewportWidth
  const isPhoneLike = isPhoneViewport && (hasTouchControls || viewportWidth <= 430)

  CONFIG.HAS_TOUCH = hasTouchControls
  CONFIG.IS_MOBILE = isPhoneLike
  document.documentElement.classList.toggle('is-touch-game', hasTouchControls)
  document.documentElement.classList.toggle('is-mobile-game', isPhoneLike)

  if (!isPhoneLike) return CONFIG

  const isPortrait = viewportHeight >= viewportWidth
  const gameWidth = isPortrait ? viewportWidth : Math.min(736, viewportWidth)
  const hudHeight = Math.round(clamp(gameWidth * 0.095, 36, 44))
  const desiredRootHeight = isPortrait ? gameWidth * 1.85 : viewportHeight
  const rootHeight = Math.floor(Math.max(Math.min(viewportHeight, desiredRootHeight), Math.min(viewportHeight, 360)))
  const gameHeight = rootHeight - hudHeight

  const brickCols = 7
  const brickRows = 6
  const brickPadding = Math.round(clamp(gameWidth * 0.018, 5, 8))
  const brickOffsetLeft = Math.round(clamp(gameWidth * 0.035, 12, 24))
  const brickWidth = Math.floor((gameWidth - brickOffsetLeft * 2 - brickPadding * (brickCols - 1)) / brickCols)

  Object.assign(CONFIG, {
    GAME_WIDTH: gameWidth,
    GAME_HEIGHT: gameHeight,
    HUD_HEIGHT: hudHeight,

    PADDLE_WIDTH: Math.round(clamp(gameWidth * 0.24, 84, 120)),
    PADDLE_HEIGHT: Math.round(clamp(gameWidth * 0.034, 12, 16)),
    PADDLE_SPEED: Math.round(clamp(gameWidth * 1.45, 420, 620)),
    PADDLE_BOTTOM_OFFSET: Math.round(clamp(gameHeight * 0.035, 18, 28)) + CONFIG.MOBILE_PADDLE_RAISE,

    BALL_SIZE: Math.round(clamp(gameWidth * 0.03, 11, 14)),
    BALL_SPEED: Math.round(clamp(gameHeight * 0.42, 240, 340)),

    BRICK_ROWS: brickRows,
    BRICK_COLS: brickCols,
    BRICK_WIDTH: brickWidth,
    BRICK_HEIGHT: Math.round(clamp(gameHeight * 0.032, 18, 24)),
    BRICK_PADDING: brickPadding,
    BRICK_OFFSET_TOP: Math.round(clamp(gameHeight * 0.075, 34, 60)),
    BRICK_OFFSET_LEFT: brickOffsetLeft,

    POWERUP_SIZE: Math.round(clamp(gameWidth * 0.04, 14, 18)),
    POWERUP_SPEED: Math.round(clamp(gameHeight * 0.23, 110, 170)),
  })

  document.documentElement.style.setProperty('--game-root-width', `${CONFIG.GAME_WIDTH}px`)
  document.documentElement.style.setProperty('--game-root-height', `${CONFIG.GAME_HEIGHT + CONFIG.HUD_HEIGHT}px`)
  document.documentElement.style.setProperty('--hud-height', `${CONFIG.HUD_HEIGHT}px`)

  return CONFIG
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
