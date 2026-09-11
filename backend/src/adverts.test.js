import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { advertRoutes, validateAdvert } from './adverts.js'

const advert = { title: 'Campaign', eyebrow: '', description: 'Discover more', image: '/assets/art.svg', imageAlt: 'Artwork', action: 'Read more', href: 'https://example.com/campaign', color: '#ead8ca', active: false, sortOrder: 2 }

test('advert validation rejects unsafe URLs, incomplete content and invalid display values', () => {
  assert.equal(validateAdvert({ ...advert, title: '  Campaign  ', id: 'ignored' }).title, 'Campaign')
  assert.equal(validateAdvert(advert).id, undefined)
  for (const href of ['javascript:alert(1)', '//evil.example', '/\\evil.example', 'data:text/html,test', 'https://']) {
    assert.throws(() => validateAdvert({ ...advert, href }), { status: 400 })
  }
  for (const change of [{ title: '' }, { imageAlt: '' }, { image: 'javascript:alert(1)' }, { active: 'false' }, { sortOrder: -1 }, { sortOrder: 1.5 }, { color: 'red' }]) {
    assert.throws(() => validateAdvert({ ...advert, ...change }), { status: 400 })
  }
  for (const href of ['/about', '#latest-stories', 'https://example.com']) assert.equal(validateAdvert({ ...advert, href }).href, href)
})

test('advert API requires editorial access and persists visibility and edits', async () => {
  process.env.JWT_SECRET = 'advert-tests-only'
  const rows = []
  const prisma = { advert: {
    findMany: async ({ where, orderBy }) => {
      assert.deepEqual(orderBy[0], { sortOrder: 'asc' })
      return rows.filter(row => !where || row.active === where.active).sort((a, b) => a.sortOrder - b.sortOrder)
    },
    create: async ({ data }) => { const row = { ...data, id: String(rows.length + 1) }; rows.push(row); return row },
    update: async ({ where, data }) => {
      const row = rows.find(row => row.id === where.id)
      if (!row) throw Object.assign(new Error('Missing'), { code: 'P2025' })
      Object.assign(row, data); return row
    },
  } }
  const app = express()
  app.locals.prisma = {user:{findUnique:async({where})=>({id:where.id,role:where.id,active:true})}}
  app.use(express.json(), advertRoutes(prisma))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (path, method = 'GET', body, role) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ id: role, role }, process.env.JWT_SECRET)}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  try {
    assert.equal((await request('/admin/adverts')).status, 401)
    assert.equal((await request('/admin/adverts', 'POST', advert, 'AUTHOR')).status, 403)
    assert.equal((await request('/admin/adverts', 'GET', undefined, 'AUTHOR')).status, 403)
    assert.equal((await request('/admin/adverts', 'POST', { ...advert, href: 'javascript:alert(1)' }, 'ADMIN')).status, 400)
    const created = await request('/admin/adverts', 'POST', advert, 'EDITOR')
    assert.equal(created.status, 201)
    const row = await created.json()
    assert.deepEqual(await (await request('/adverts')).json(), [])
    assert.equal((await (await request('/admin/adverts', 'GET', undefined, 'ADMIN')).json()).length, 1)
    const update = await request(`/admin/adverts/${row.id}`, 'PUT', { ...advert, title: 'Updated campaign', active: true }, 'ADMIN')
    assert.equal(update.status, 200)
    const publicResponse = await request('/adverts')
    assert.equal(publicResponse.headers.get('cache-control'), 'no-store')
    assert.equal((await publicResponse.json())[0].title, 'Updated campaign')
    await request(`/admin/adverts/${row.id}`, 'PUT', advert, 'SUPER_ADMIN')
    assert.deepEqual(await (await request('/adverts')).json(), [])
    assert.equal((await request('/admin/adverts/missing', 'PUT', advert, 'ADMIN')).status, 404)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
