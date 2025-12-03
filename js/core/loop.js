/* Implements the main game loop using requestAnimationFrame.  
Calculates delta time between frames and invokes the update and render functions.  
Ensures consistent timing and smooth 60 FPS animation.
*/
export function startLoop(updateFn, renderFn) {
  let lastTimestamp = performance.now()

  function frame(timestamp) {
    const delta = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    updateFn(delta)
    renderFn()

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
