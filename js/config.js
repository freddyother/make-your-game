/* Contains all configuration constants and tuning parameters used across the game.  
Defines sizes, speeds, layout values, brick grid dimensions and initial gameplay settings.  
Provides a single source of truth for numerical values to keep the game easily adjustable.
*/
export const CONFIG = {
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  HUD_HEIGHT: 40,

  PADDLE_WIDTH: 120,
  PADDLE_HEIGHT: 16,
  PADDLE_SPEED: 400,

  BALL_SIZE: 14,
  BALL_SPEED: 350,

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
  POWERUP_CHANCE: 0.3, // 30% chance per destroyed brick
}
