/* Updates the on-screen HUD elements such as time, score, level, fps and lives.  
Synchronises game state values with their visual representation.  
Keeps UI updates separate from gameplay logic.
*/
export function updateHUD(state, dom, fps = 0) {
  dom.hudTime.textContent = state.timeElapsed.toFixed(1)
  dom.hudScore.textContent = state.score
  dom.hudLives.textContent = state.lives
  dom.hudLevel.textContent = state.level || 1
  dom.hudFps.textContent = fps.toFixed(0)
}
