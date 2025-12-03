/* Updates the on-screen HUD elements such as time, score and lives.  
Synchronises game state values with their visual representation.  
Keeps UI updates separate from gameplay logic.
*/
export function updateHUD(state, dom) {
  dom.hudTime.textContent = state.timeElapsed.toFixed(1)
  dom.hudScore.textContent = state.score
  dom.hudLives.textContent = state.lives
  dom.hudFps.textContent = 'FPS: ' + fps.toFixed(0)
}
