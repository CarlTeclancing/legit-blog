// Keep the production domains available even when FRONTEND_URL only lists localhost.
export function createCorsOptions(env = process.env) {
  const origins = new Set([
    'https://www.legit.cm',
    'https://legit.cm',
    'https://legit-blog-a46l.vercel.app',
    'https://legit-blog.vercel.app',
  ])
  for (const value of (env.FRONTEND_URL || '').split(',')) {
    try {
      const url = new URL(value.trim())
      if (['https:', 'http:'].includes(url.protocol)) origins.add(url.origin)
    } catch { /* Ignore empty or malformed configuration entries. */ }
  }
  return {
    origin(origin, callback) {
      const local = env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '')
      callback(null, !origin || origins.has(origin) || local)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  }
}
