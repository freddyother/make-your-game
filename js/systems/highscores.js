/*
highscores


*/

const STORAGE_KEY = 'brickbreaker_highscores_v1'

export function loadHighscores() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveHighscores(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// Add a new score, sort and cut to top 10.
// Return the final sorted list.
export function addHighscore(name, score) {
  const cleanName = (name || 'PLAYER').trim().slice(0, 10) || 'PLAYER'
  const list = loadHighscores()

  list.push({
    name: cleanName,
    score,
    ts: Date.now(),
  })

  // // sort: highest score first; if tied, oldest first
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.ts - b.ts
  })

  const top10 = list.slice(0, 10)
  saveHighscores(top10)
  return top10
}
