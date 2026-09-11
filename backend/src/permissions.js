export const admins = ['SUPER_ADMIN', 'ADMIN']
export const editorial = [...admins, 'EDITOR']
export const allRoles = [...editorial, 'AUTHOR']
const sections = {
  posts: allRoles, profile: allRoles, media: allRoles, notifications: allRoles,
  stats: editorial, categories: editorial, comments: editorial, adverts: editorial,
  newsletter: admins, users: admins, settings: admins, 'author-requests': admins,
}
export function adminAccess(req, res, next) {
  res.set('Cache-Control', 'no-store')
  const section = req.path.split('/').filter(Boolean)[0]
  if (!sections[section]?.includes(req.user.role)) return res.status(403).json({ message: 'Your role cannot access this section.' })
  next()
}
export function accountPermission(actor, target, role, active) {
  if (!allRoles.includes(role)) return 'Choose a valid role.'
  if (actor.role !== 'SUPER_ADMIN' && (['ADMIN', 'SUPER_ADMIN'].includes(role) || ['ADMIN', 'SUPER_ADMIN'].includes(target?.role))) return 'Only super admins can manage administrator accounts.'
  if (target?.id === actor.id && (role !== actor.role || active === false)) return 'You cannot change your own role or deactivate your own account.'
  return null
}
export const ownPosts = user => user.role === 'AUTHOR' ? { authorId: user.id } : {}
