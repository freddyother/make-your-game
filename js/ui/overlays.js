/* Controls visibility of pause and game-over overlays.  
Displays or hides menus based on game state changes.  
Updates the final score shown on the game-over screen.
*/
export function showPauseOverlay(dom, show) {
  dom.pauseOverlay.classList.toggle('hidden', !show)
}

export function showGameOver(dom, show, finalScore = 0) {
  dom.gameoverOverlay.classList.toggle('hidden', !show)
  if (show) {
    dom.gameoverScoreEl.textContent = finalScore
  }
}
