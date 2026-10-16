// Minimal cross-origin "CDN" that serves ./.next/static, so the app (on
// localhost:3000) loads its chunks from a different origin (127.0.0.1:4000).
// Returns ACAO:* and correct content-types, mimicking a real static CDN.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const PORT = Number(process.env.CDN_PORT ?? 4000)
const ROOT = process.cwd()

const TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url ?? '').split('?')[0])
    if (!url.startsWith('/_next/static/')) {
      res.writeHead(404).end('not found')
      return
    }
    const buf = await readFile(join(ROOT, url.replace('/_next/', '.next/')))
    res.writeHead(200, {
      'content-type': TYPES[extname(url)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    })
    res.end(buf)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[cdn] serving ./.next/static at http://127.0.0.1:${PORT}`)
})
