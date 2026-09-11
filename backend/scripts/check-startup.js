// Exercise the same entry point used by Vercel before accepting a build.
import assert from 'node:assert/strict'
process.env.VERCEL = '1'
const { default: app } = await import('../api/index.js')
const server = app.listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
try {
  const base = `http://127.0.0.1:${server.address().port}`
  for (const origin of ['https://www.legit.cm', 'https://legit.cm']) {
    const response = await fetch(`${base}/api/health`, { headers: { Origin: origin } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), origin)
    const preflight = await fetch(`${base}/api/admin/posts`, {
      method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
  }
  console.log('Vercel entry point, production origins and preflight checks passed.')
} finally {
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  await app.locals.prisma.$disconnect()
}
