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
