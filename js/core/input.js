export function createInput() {
  const inputState = {
    left: false,
    right: false,
    pausePressed: false,
    lastPausePressed: false,
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') inputState.left = true
    if (e.code === 'ArrowRight') inputState.right = true
    if (e.code === 'Space') inputState.pausePressed = true
  })

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') inputState.left = false
    if (e.code === 'ArrowRight') inputState.right = false
    if (e.code === 'Space') inputState.pausePressed = false
  })

  // snapshot to use in the update (to detect pause flanks)
  function getSnapshot() {
    return { ...inputState }
  }

  return { inputState, getSnapshot }
}
