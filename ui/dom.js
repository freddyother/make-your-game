export function getDomRefs() {
  const hudTime = document.getElementById('hud-time')
  const hudScore = document.getElementById('hud-score')
  const hudLives = document.getElementById('hud-lives')

  const gameArea = document.getElementById('game-area')
  const paddleEl = document.getElementById('paddle')
  const ballEl = document.getElementById('ball')

  const pauseOverlay = document.getElementById('pause-overlay')
  const btnContinue = document.getElementById('btn-continue')
  const btnRestart = document.getElementById('btn-restart')

  const gameoverOverlay = document.getElementById('gameover-overlay')
  const gameoverScoreEl = document.getElementById('gameover-score')
  const btnRestartGameOver = document.getElementById('btn-restart-from-gameover')

  return {
    hudTime,
    hudScore,
    hudLives,
    gameArea,
    paddleEl,
    ballEl,
    pauseOverlay,
    btnContinue,
    btnRestart,
    gameoverOverlay,
    gameoverScoreEl,
    btnRestartGameOver,
  }
}
