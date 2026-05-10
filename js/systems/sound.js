let audioContext = null
let masterGain = null
let unlockInstalled = false

const MASTER_VOLUME = 0.18

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null

    audioContext = new AudioContextClass()
    masterGain = audioContext.createGain()
    masterGain.gain.value = MASTER_VOLUME
    masterGain.connect(audioContext.destination)
  }

  return audioContext
}

function resumeAudio() {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== 'suspended') return
  ctx.resume().catch(() => {})
}

export function installAudioUnlock() {
  if (unlockInstalled) return
  unlockInstalled = true

  const unlock = () => {
    resumeAudio()
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('touchstart', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
  window.addEventListener('click', unlock)
}

function playTone({ frequency, endFrequency = frequency, type = 'sine', start = 0, duration = 0.08, volume = 0.45 }) {
  const ctx = getAudioContext()
  if (!ctx || !masterGain) return

  resumeAudio()

  const startTime = ctx.currentTime + start
  const endTime = startTime + duration
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endTime)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

  oscillator.connect(gain)
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(endTime + 0.02)
}

function playNoise({ start = 0, duration = 0.08, volume = 0.25, filterFrequency = 1200 }) {
  const ctx = getAudioContext()
  if (!ctx || !masterGain) return

  resumeAudio()

  const startTime = ctx.currentTime + start
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < frameCount; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount)
  }

  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  filter.type = 'bandpass'
  filter.frequency.value = filterFrequency
  filter.Q.value = 6

  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  source.buffer = buffer
  source.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  source.start(startTime)
}

export function playLaunch() {
  playTone({ frequency: 260, endFrequency: 520, type: 'triangle', duration: 0.09, volume: 0.28 })
}

export function playPaddleHit() {
  playTone({ frequency: 190, endFrequency: 260, type: 'square', duration: 0.05, volume: 0.18 })
  playTone({ frequency: 420, endFrequency: 360, type: 'triangle', start: 0.015, duration: 0.04, volume: 0.12 })
}

export function playWallHit(count = 1) {
  const hits = Math.min(count, 3)

  for (let i = 0; i < hits; i++) {
    playTone({ frequency: 310 + i * 25, endFrequency: 250 + i * 20, type: 'square', start: i * 0.018, duration: 0.035, volume: 0.09 })
  }
}

export function playBrickBreak(count = 1) {
  const hits = Math.min(count, 3)

  for (let i = 0; i < hits; i++) {
    const start = i * 0.025
    playNoise({ start, duration: 0.055, volume: 0.16, filterFrequency: 1500 + i * 260 })
    playTone({ frequency: 520 + i * 80, endFrequency: 300 + i * 50, type: 'sawtooth', start, duration: 0.05, volume: 0.09 })
  }
}

export function playLoseLife() {
  playTone({ frequency: 300, endFrequency: 170, type: 'sawtooth', duration: 0.16, volume: 0.24 })
  playTone({ frequency: 190, endFrequency: 95, type: 'triangle', start: 0.12, duration: 0.18, volume: 0.2 })
}

export function playGameOver() {
  playTone({ frequency: 260, endFrequency: 210, type: 'sawtooth', duration: 0.2, volume: 0.22 })
  playTone({ frequency: 210, endFrequency: 150, type: 'sawtooth', start: 0.18, duration: 0.22, volume: 0.22 })
  playTone({ frequency: 150, endFrequency: 95, type: 'triangle', start: 0.38, duration: 0.28, volume: 0.22 })
  playTone({ frequency: 95, endFrequency: 55, type: 'sine', start: 0.64, duration: 0.45, volume: 0.2 })
  playNoise({ start: 0.08, duration: 0.5, volume: 0.08, filterFrequency: 380 })
}

export function playLevelUp() {
  playTone({ frequency: 330, type: 'triangle', duration: 0.12, volume: 0.2 })
  playTone({ frequency: 440, type: 'triangle', start: 0.11, duration: 0.12, volume: 0.2 })
  playTone({ frequency: 554, type: 'triangle', start: 0.22, duration: 0.14, volume: 0.22 })
  playTone({ frequency: 660, type: 'triangle', start: 0.35, duration: 0.18, volume: 0.22 })
  playTone({ frequency: 880, type: 'sine', start: 0.5, duration: 0.35, volume: 0.18 })
  playNoise({ start: 0.2, duration: 0.22, volume: 0.06, filterFrequency: 2400 })
}

export function playPowerUp(kind) {
  switch (kind) {
    case 'life':
      playTone({ frequency: 420, type: 'sine', duration: 0.08, volume: 0.22 })
      playTone({ frequency: 630, type: 'sine', start: 0.07, duration: 0.12, volume: 0.24 })
      break

    case 'widen':
      playTone({ frequency: 260, endFrequency: 390, type: 'triangle', duration: 0.13, volume: 0.2 })
      break

    case 'shrink':
      playTone({ frequency: 180, endFrequency: 95, type: 'sawtooth', duration: 0.16, volume: 0.2 })
      playNoise({ start: 0.02, duration: 0.09, volume: 0.08, filterFrequency: 500 })
      break

    case 'multiball':
      playTone({ frequency: 300, type: 'square', duration: 0.06, volume: 0.16 })
      playTone({ frequency: 420, type: 'square', start: 0.045, duration: 0.06, volume: 0.14 })
      playTone({ frequency: 540, type: 'square', start: 0.09, duration: 0.06, volume: 0.12 })
      break

    case 'slow':
      playTone({ frequency: 520, endFrequency: 260, type: 'sine', duration: 0.22, volume: 0.18 })
      break

    case 'scorex2':
      playTone({ frequency: 660, type: 'triangle', duration: 0.07, volume: 0.2 })
      playTone({ frequency: 880, type: 'triangle', start: 0.06, duration: 0.1, volume: 0.18 })
      break

    default:
      playTone({ frequency: 360, type: 'triangle', duration: 0.1, volume: 0.16 })
      break
  }
}
