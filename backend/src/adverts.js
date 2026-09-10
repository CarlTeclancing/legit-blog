import { Router } from 'express'
import { auth, roles } from './middleware/auth.js'

function validUrl(value, image = false) {
  if (/[\s\\\u0000-\u001f]/.test(value)) return false
  if (/^\/(?!\/)/.test(value)) return true
  if (!image && /^#[\w-]+$/.test(value)) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

export function validateAdvert(body) {
  const data = {}
  const fields = { title: 160, eyebrow: 80, description: 500, image: 2048, imageAlt: 250, action: 80, href: 2048, color: 7 }
  for (const [field, max] of Object.entries(fields)) {
    if (typeof body?.[field] !== 'string') throw Object.assign(new Error(`${field} must be text.`), { status: 400 })
    data[field] = body[field].trim()
    if (data[field].length > max) throw Object.assign(new Error(`${field} must be ${max} characters or fewer.`), { status: 400 })
  }
  for (const field of ['title', 'image', 'imageAlt', 'action', 'href']) {
    if (!data[field]) throw Object.assign(new Error(`${field} is required.`), { status: 400 })
  }
  if (!validUrl(data.image, true) || !validUrl(data.href)) throw Object.assign(new Error('Use an http(s) URL or a local /path. Links can also use #section.'), { status: 400 })
  if (!/^#[0-9a-f]{6}$/i.test(data.color)) throw Object.assign(new Error('Choose a valid background color.'), { status: 400 })
  if (typeof body.active !== 'boolean') throw Object.assign(new Error('Visibility must be true or false.'), { status: 400 })
  if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 9999) throw Object.assign(new Error('Display order must be a whole number from 0 to 9999.'), { status: 400 })
  return { ...data, active: body.active, sortOrder: body.sortOrder }
}

export function advertRoutes(prisma) {
  const router = Router()
  const handle = handler => async (req, res, next) => {
    try { await handler(req, res) } catch (error) {
      if (error.status === 400) return res.status(400).json({ message: error.message })
      if (error.code === 'P2025') return res.status(404).json({ message: 'Advert not found.' })
      next(error)
    }
  }
  const orderBy = [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
  router.get('/adverts', handle(async (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json(await prisma.advert.findMany({ where: { active: true }, orderBy }))
  }))
  router.use('/admin/adverts', auth, roles('SUPER_ADMIN', 'ADMIN', 'EDITOR'))
  router.get('/admin/adverts', handle(async (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json(await prisma.advert.findMany({ orderBy }))
  }))
  router.post('/admin/adverts', handle(async (req, res) => {
    res.status(201).json(await prisma.advert.create({ data: validateAdvert(req.body) }))
  }))
  router.put('/admin/adverts/:id', handle(async (req, res) => {
    res.json(await prisma.advert.update({ where: { id: req.params.id }, data: validateAdvert(req.body) }))
  }))
  return router
}
