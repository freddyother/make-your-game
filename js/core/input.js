/* Handles keyboard input for the game.  
Tracks key states (left, right, pause) and exposes a snapshot for the update cycle.  
Ensures smooth continuous movement without key spamming.
*/
import { CONFIG } from '../config.js'

export function createInput() {
  const inputState = {
    left: false,
    right: false,
    pausePressed: false,
    lastPausePressed: false,
    launchPressed: false,
    lastLaunchPressed: false,
    pointerActive: false,
    pointerX: null,
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

  if (CONFIG.HAS_TOUCH) {
    const gameArea = document.getElementById('game-area')
    let lastTapTime = 0
    let lastTapX = 0
    let lastTapY = 0

    const updatePointer = (clientX) => {
      if (!gameArea) return
      const rect = gameArea.getBoundingClientRect()
      if (rect.width <= 0) return
      const ratio = CONFIG.GAME_WIDTH / rect.width
      inputState.pointerX = (clientX - rect.left) * ratio
    }

    const queueDoubleTapAction = () => {
      inputState.launchPressed = true
      window.setTimeout(() => {
        inputState.launchPressed = false
      }, 120)
    }

    const handleTap = (clientX, clientY) => {
      inputState.pointerActive = true
      updatePointer(clientX)

      const now = performance.now()
      const tapDistance = Math.hypot(clientX - lastTapX, clientY - lastTapY)
      if (now - lastTapTime < 320 && tapDistance < 44) {
        lastTapTime = 0
        queueDoubleTapAction()
      } else {
        lastTapTime = now
        lastTapX = clientX
        lastTapY = clientY
      }
    }

    if (window.PointerEvent) {
      gameArea?.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        handleTap(e.clientX, e.clientY)

        gameArea.setPointerCapture?.(e.pointerId)
      })

      gameArea?.addEventListener('pointermove', (e) => {
        if (!inputState.pointerActive) return
        e.preventDefault()
        updatePointer(e.clientX)
      })

      const releasePointer = (e) => {
        inputState.pointerActive = false
        gameArea?.releasePointerCapture?.(e.pointerId)
      }

      gameArea?.addEventListener('pointerup', releasePointer)
      gameArea?.addEventListener('pointercancel', releasePointer)
      gameArea?.addEventListener('lostpointercapture', () => {
        inputState.pointerActive = false
      })
    } else {
      gameArea?.addEventListener(
        'touchstart',
        (e) => {
          const touch = e.touches[0]
          if (!touch) return
          if (e.cancelable) e.preventDefault()
          handleTap(touch.clientX, touch.clientY)
        },
        { passive: false },
      )

      gameArea?.addEventListener(
        'touchmove',
        (e) => {
          if (!inputState.pointerActive) return
          const touch = e.touches[0]
          if (!touch) return
          if (e.cancelable) e.preventDefault()
          updatePointer(touch.clientX)
        },
        { passive: false },
      )

      const releaseTouch = () => {
        inputState.pointerActive = false
      }

      gameArea?.addEventListener('touchend', releaseTouch)
      gameArea?.addEventListener('touchcancel', releaseTouch)
    }

    gameArea?.addEventListener(
      'touchend',
      (e) => {
        if (e.cancelable) e.preventDefault()
      },
      { passive: false },
    )
  }

  // snapshot to use in the update (to detect pause flanks)
  function getSnapshot() {
    return { ...inputState }
  }

  return { inputState, getSnapshot }
}
