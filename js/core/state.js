/* Creates and manages the global game state structure.
   Defines initial values for paddle, ball, bricks, score, lives, timing and game flags.
   Holds all mutable gameplay data used by the different systems.
*/
import { CONFIG } from '../config.js'

export function createInitialState() {
  const { GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, BALL_SPEED, INITIAL_LIVES } = CONFIG

  return {
    isPaused: false,
    isGameOver: false,

    timeElapsed: 0,
    score: 0,

    // score multiplier (for x2 power-up)
    scoreMultiplier: 1,

    gameWidth: GAME_WIDTH,
    gameHeight: GAME_HEIGHT,

    lives: INITIAL_LIVES,

    level: 1,
    bricksRemaining: 0,

    paddle: {
      x: (GAME_WIDTH - PADDLE_WIDTH) / 2,
      y: GAME_HEIGHT - HUD_HEIGHT - 40,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },

    // For now, we are continuing with a single main ball.
    ball: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: BALL_SPEED,
      vy: -BALL_SPEED,
      size: BALL_SIZE,
      stuckToPaddle: true,
    },

    bricks: [],

    // list of active power-ups on screen
    powerUps: [],

    // temporary effects of power-ups
    slowActive: false,
    slowTimer: 0, // countdown to the slow effect

    scoreMultiplierTimer: 0, // countdown to score x2

    // hook for multi-ball (we will use it when we extend the engine)
    multiballActive: false,
  }
}
