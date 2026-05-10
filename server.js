const fs = require('fs')
const http = require('http')
const path = require('path')

const PORT = process.env.PORT || 3000
const ROOT = __dirname

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

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  const requestedPath = urlPath === '/' ? '/index.html' : urlPath
  const filePath = path.normalize(path.join(ROOT, requestedPath))

  if (!filePath.startsWith(ROOT)) {
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
    res.end(contents)
  })
})

server.listen(PORT, () => {
  console.log(`Game running on port ${PORT}`)
})
