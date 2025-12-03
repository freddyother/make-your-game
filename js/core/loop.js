/* Implements the main game loop using requestAnimationFrame.  
Calculates delta time between frames and invokes the update and render functions.  
Ensures consistent timing and smooth 60 FPS animation.
*/

export function startLoop(updateFn, renderFn) {
  let lastTimestamp = performance.now()

  let fps = 0
  let frames = 0
  let fpsAccumTime = 0

  function frame(timestamp) {
    const delta = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    // --- FPS COUNTER ---
    frames++
    fpsAccumTime += delta

    if (fpsAccumTime >= 1) {
      fps = frames
      frames = 0
      fpsAccumTime = 0
    }

    // updateFn now receives FPS as second parameter
    updateFn(delta, fps)

    renderFn()

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
