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
    lives: INITIAL_LIVES,

    paddle: {
      x: (GAME_WIDTH - PADDLE_WIDTH) / 2,
      y: GAME_HEIGHT - HUD_HEIGHT - 40,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },

    ball: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: BALL_SPEED,
      vy: -BALL_SPEED,
      size: BALL_SIZE,
      stuckToPaddle: true,
    },

    bricks: [], // We will fill it elsewhere.
  }
}
