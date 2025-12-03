export function updateHUD(state, dom) {
  dom.hudTime.textContent = state.timeElapsed.toFixed(1)
  dom.hudScore.textContent = state.score
  dom.hudLives.textContent = state.lives
}
