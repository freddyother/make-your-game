const fs = require('fs')
const http = require('http')
const path = require('path')
const { Pool } = require('pg')

const PORT = process.env.PORT || 3000
const ROOT = __dirname
const TOP_LIMIT = 5
const MAX_BODY_BYTES = 10 * 1024

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const pool = new Pool(buildDatabaseConfig())
let databaseReady = false
let databaseInitPromise = null

function buildDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    const config = { connectionString: process.env.DATABASE_URL }
    if (process.env.PGSSLMODE === 'disable') {
      config.ssl = false
    } else if (process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: false }
    }
    return config
  }

  return {
    host: process.env.PGHOST || 'localhost',
    port: Number.parseInt(process.env.PGPORT || '5434', 10),
    database: process.env.PGDATABASE || 'make_your_game',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
  }
}

function ensureDatabase() {
  if (databaseReady) return Promise.resolve()

  if (!databaseInitPromise) {
    databaseInitPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS highscores (
          id BIGSERIAL PRIMARY KEY,
          nickname VARCHAR(10) NOT NULL,
          score INTEGER NOT NULL CHECK (score >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_highscores_leaderboard
          ON highscores (score DESC, created_at ASC, id ASC);
      `)
      .then(() => {
        databaseReady = true
      })
      .finally(() => {
        databaseInitPromise = null
      })
  }

  return databaseInitPromise
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let tooLarge = false

    req.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY_BYTES) {
        tooLarge = true
        const error = new Error('Request body too large')
        error.statusCode = 413
        reject(error)
        req.destroy()
      }
    })

    req.on('error', reject)

    req.on('end', () => {
      if (tooLarge) return
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        const error = new Error('Invalid JSON body')
        error.statusCode = 400
        reject(error)
      }
    })
  })
}

function normalizeNickname(value) {
  const nickname = String(value || '').trim().slice(0, 10).toUpperCase()
  return nickname || 'PLAYER'
}

function normalizeScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score) || score < 0) return null
  return Math.floor(score)
}

function formatScoreRow(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    score: row.score,
    createdAt: row.createdAt,
  }
}

async function getLeaderboard() {
  const result = await pool.query(
    `
      SELECT id, nickname, score, created_at AS "createdAt"
      FROM highscores
      ORDER BY score DESC, created_at ASC, id ASC
      LIMIT $1
    `,
    [TOP_LIMIT],
  )

  return result.rows.map(formatScoreRow)
}

async function handleHighscores(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.writeHead(405, { Allow: 'GET, POST' })
    res.end('Method not allowed')
    return
  }

  try {
    await ensureDatabase()

    if (req.method === 'GET') {
      const list = await getLeaderboard()
      sendJson(res, 200, { list })
      return
    }

    const body = await readJsonBody(req)
    const nickname = normalizeNickname(body.nickname)
    const score = normalizeScore(body.score)

    if (score === null) {
      sendJson(res, 400, { error: 'Score must be a non-negative number' })
      return
    }

    const inserted = await pool.query(
      `
        INSERT INTO highscores (nickname, score)
        VALUES ($1, $2)
        RETURNING id
      `,
      [nickname, score],
    )

    const insertedId = inserted.rows[0].id
    const list = await getLeaderboard()
    const highlightIndex = list.findIndex((row) => row.id === insertedId)

    sendJson(res, 201, { list, highlightIndex })
  } catch (error) {
    if (error.statusCode) {
      sendJson(res, error.statusCode, { error: error.message })
      return
    }

    console.error('Highscore API error:', error)
    sendJson(res, 503, { error: 'Database unavailable' })
  }
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end('Method not allowed')
    return
  }

  let decodedPath
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    res.writeHead(400)
    res.end('Bad request')
    return
  }

  const requestedPath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '')
  const filePath = path.normalize(path.join(ROOT, requestedPath))
  const relativePath = path.relative(ROOT, filePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(req.method === 'HEAD' ? undefined : contents)
  })
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (requestUrl.pathname === '/api/highscores') {
    handleHighscores(req, res)
    return
  }

  serveStatic(req, res, requestUrl.pathname)
})

server.listen(PORT, async () => {
  console.log(`Game running on port ${PORT}`)
  try {
    await ensureDatabase()
    console.log('PostgreSQL highscores ready')
  } catch (error) {
    console.error('PostgreSQL is not ready yet:', error.message)
  }
})
