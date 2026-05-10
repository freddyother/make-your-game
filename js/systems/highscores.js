const API_URL = '/api/highscores'

async function requestJson(url, options = {}) {
  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw new Error(getApiUnavailableMessage())
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (isStaticServerPort()) {
      throw new Error(getApiUnavailableMessage())
    }
    throw new Error(data.error || 'Highscore request failed')
  }

  return data
}

function isStaticServerPort() {
  return window.location.port === '8080'
}

function getApiUnavailableMessage() {
  if (isStaticServerPort()) {
    return 'Scores need the Node server. Open http://localhost:3000 instead of :8080.'
  }

  return 'Could not reach the score API. Check that npm start and PostgreSQL are running.'
}

export async function loadHighscores() {
  const data = await requestJson(API_URL)
  return Array.isArray(data.list) ? data.list : []
}

export async function addHighscore(nickname, score) {
  const data = await requestJson(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname, score }),
  })

  return {
    list: Array.isArray(data.list) ? data.list : [],
    highlightIndex: Number.isInteger(data.highlightIndex) ? data.highlightIndex : -1,
  }
}
