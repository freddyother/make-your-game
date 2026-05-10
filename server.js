const fs = require('fs')
const http = require('http')
const path = require('path')
const { Pool } = require('pg')

const PORT = process.env.PORT || 3000
const ROOT = __dirname
const REAL_ROOT = fs.realpathSync(ROOT)
const TOP_LIMIT = 5
const MAX_STORED_SCORES = 500
const MAX_BODY_BYTES = 10 * 1024
const MAX_SCORE = 999999999
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const API_GET_LIMIT = 120
const API_POST_LIMIT = 20

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

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

const pool = new Pool(buildDatabaseConfig())
const rateLimitBuckets = new Map()
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

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'highscores_score_max_check'
          ) THEN
            ALTER TABLE highscores
              ADD CONSTRAINT highscores_score_max_check
              CHECK (score <= 999999999);
          END IF;
        END $$;
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
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendText(res, statusCode, body, extraHeaders = {}) {
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function getClientIp(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwardedFor = req.headers['x-forwarded-for']
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim()
    }

    const cloudflareIp = req.headers['cf-connecting-ip']
    if (typeof cloudflareIp === 'string' && cloudflareIp.trim()) {
      return cloudflareIp.trim()
    }
  }

  return req.socket.remoteAddress || 'unknown'
}

function isRateLimited(req, limit) {
  const now = Date.now()
  const key = `${getClientIp(req)}:${req.method}:${req.url?.split('?')[0] || '/'}`
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    cleanupRateLimitBuckets(now)
    return false
  }

  bucket.count += 1
  return bucket.count > limit
}

function cleanupRateLimitBuckets(now) {
  if (rateLimitBuckets.size < 1000) return

  for (const [key, bucket] of rateLimitBuckets) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key)
    }
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let receivedBytes = 0
    let tooLarge = false

    req.on('data', (chunk) => {
      receivedBytes += chunk.length
      if (receivedBytes > MAX_BODY_BYTES) {
        tooLarge = true
        const error = new Error('Request body too large')
        error.statusCode = 413
        reject(error)
        req.destroy()
        return
      }

      chunks.push(chunk)
    })

    req.on('error', reject)

    req.on('end', () => {
      if (tooLarge) return
      const body = Buffer.concat(chunks).toString('utf8')
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
  const nickname = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 _-]/g, '')
    .trim()
    .slice(0, 10)
  return nickname || 'PLAYER'
}

function normalizeScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return null
  return Math.floor(score)
}

function isJsonRequest(req) {
  const contentType = req.headers['content-type'] || ''
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()
  return mediaType === 'application/json'
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

async function pruneHighscores() {
  await pool.query(
    `
      DELETE FROM highscores
      WHERE id NOT IN (
        SELECT id
        FROM highscores
        ORDER BY score DESC, created_at ASC, id ASC
        LIMIT $1
      )
    `,
    [MAX_STORED_SCORES],
  )
}

async function handleHighscores(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendText(res, 405, 'Method not allowed', { Allow: 'GET, POST' })
    return
  }

  try {
    const limit = req.method === 'POST' ? API_POST_LIMIT : API_GET_LIMIT
    if (isRateLimited(req, limit)) {
      sendJson(res, 429, { error: 'Too many requests. Try again soon.' })
      return
    }

    await ensureDatabase()

    if (req.method === 'GET') {
      const list = await getLeaderboard()
      sendJson(res, 200, { list })
      return
    }

    if (!isJsonRequest(req)) {
      sendJson(res, 415, { error: 'Content-Type must be application/json' })
      return
    }

    const body = await readJsonBody(req)
    const nickname = normalizeNickname(body.nickname)
    const score = normalizeScore(body.score)

    if (score === null) {
      sendJson(res, 400, { error: `Score must be between 0 and ${MAX_SCORE}` })
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
    await pruneHighscores()
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
    sendText(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' })
    return
  }

  let decodedPath
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    sendText(res, 400, 'Bad request')
    return
  }

  const requestedPath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '')
  const filePath = path.normalize(path.join(ROOT, requestedPath))
  const relativePath = path.relative(ROOT, filePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    sendText(res, 403, 'Forbidden')
    return
  }

  if (!isAllowedStaticPath(relativePath)) {
    sendText(res, 404, 'Not found')
    return
  }

  fs.realpath(filePath, (realPathError, realFilePath) => {
    if (realPathError) {
      sendText(res, 404, 'Not found')
      return
    }

    const realRelativePath = path.relative(REAL_ROOT, realFilePath)
    if (realRelativePath.startsWith('..') || path.isAbsolute(realRelativePath) || !isAllowedStaticPath(realRelativePath)) {
      sendText(res, 404, 'Not found')
      return
    }

    fs.readFile(realFilePath, (error, contents) => {
      if (error) {
        sendText(res, 404, 'Not found')
        return
      }

      const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream'
      res.writeHead(200, {
        ...SECURITY_HEADERS,
        'Content-Type': contentType,
        'Content-Length': contents.length,
      })
      res.end(req.method === 'HEAD' ? undefined : contents)
    })
  })
}

function isAllowedStaticPath(relativePath) {
  const safePath = relativePath.split(path.sep).join('/')
  if (safePath === 'index.html') return true
  if (safePath.startsWith('css/') && !safePath.includes('/.')) return true
  if (safePath.startsWith('js/') && !safePath.includes('/.')) return true
  if (safePath.startsWith('assets/') && !safePath.includes('/.')) return true
  return false
}

const server = http.createServer((req, res) => {
  let requestUrl
  try {
    requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  } catch {
    sendText(res, 400, 'Bad request')
    return
  }

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
