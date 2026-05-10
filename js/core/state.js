/* Creates and manages the global game state structure.
   Defines initial values for paddle, ball, bricks, score, lives, timing and game flags.
   Holds all mutable gameplay data used by the different systems.
*/
import { CONFIG } from '../config.js'

export function createInitialState() {
  const { GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, BALL_SPEED, INITIAL_LIVES } = CONFIG
  const paddleY = CONFIG.IS_MOBILE ? GAME_HEIGHT - PADDLE_HEIGHT - CONFIG.PADDLE_BOTTOM_OFFSET : GAME_HEIGHT - HUD_HEIGHT - 40

  // main ball
  const mainBall = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: BALL_SPEED,
    vy: -BALL_SPEED,
    size: BALL_SIZE,
    stuckToPaddle: true,
  }

  return {
    isPaused: false,
    isGameOver: false,

    timeElapsed: 0,
    score: 0,

    // score multiplier (for x2 power-up)
    scoreMultiplier: 1,

    isMobile: CONFIG.IS_MOBILE,
    gameWidth: GAME_WIDTH,
    gameHeight: GAME_HEIGHT,
    hudHeight: HUD_HEIGHT,

    lives: INITIAL_LIVES,

    level: 1,
    bricksRemaining: 0,

    paddle: {
      x: (GAME_WIDTH - PADDLE_WIDTH) / 2,
      y: paddleY,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },

    // main ball (compat with old code)
    ball: mainBall,

    // array with ALL balls (main + extra)
    extraBalls: [],

    bricks: [],

    // list of active power-ups on screen
    powerUps: [],

    // temporary effects of power-ups
    slowActive: false,
    slowTimer: 0, // countdown to the slow effect

    scoreMultiplierTimer: 0, // countdown to score x2

    // multi-ball activado alguna vez
    multiballActive: false,
  }
}
