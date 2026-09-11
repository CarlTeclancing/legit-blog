import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cors from 'cors'
import { createCorsOptions } from './cors-config.js'

test('production origins and configured URLs are allowed without opening all origins', () => {
  const config = createCorsOptions({ NODE_ENV: 'production', FRONTEND_URL: ' https://preview.example.test/ ,not-a-url' })
  for (const origin of ['https://www.legit.cm', 'https://legit.cm', 'https://preview.example.test', undefined]) {
    config.origin(origin, (error, allowed) => { assert.equal(error, null); assert.equal(allowed, true) })
  }
  for (const origin of ['https://legit.cm.attacker.test', 'https://unknown.vercel.app', 'http://localhost:5173']) {
    config.origin(origin, (error, allowed) => assert.equal(allowed, false))
  }
  createCorsOptions({}).origin('http://localhost:5173', (error, allowed) => assert.equal(allowed, true))
})

test('preflight and application errors retain production CORS headers', async () => {
  const app = express()
  app.use(cors(createCorsOptions({ NODE_ENV: 'production' })))
  app.get('/error', (req, res) => res.status(500).json({ message: 'Test failure' }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    const origin = 'https://www.legit.cm'
    const preflight = await fetch(`${base}/error`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,x-file-type' } })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
    assert.match(preflight.headers.get('access-control-allow-headers'), /authorization/)
    const response = await fetch(`${base}/error`, { headers: { Origin: origin } })
    assert.equal(response.status, 500)
    assert.equal(response.headers.get('access-control-allow-origin'), origin)
    assert.match(response.headers.get('vary'), /Origin/)
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
})
