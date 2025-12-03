export function showPauseOverlay(dom, show) {
  dom.pauseOverlay.classList.toggle('hidden', !show)
}

export function showGameOver(dom, show, finalScore = 0) {
  dom.gameoverOverlay.classList.toggle('hidden', !show)
  if (show) {
    dom.gameoverScoreEl.textContent = finalScore
  }
}
