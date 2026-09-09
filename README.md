# Editorial Magazine CMS — React + Node + Prisma

A clean-room, editable editorial magazine implementation inspired by the public information architecture and visual patterns of TheCollector.com.

## Stack
- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: Prisma ORM (SQLite by default; easy to switch to PostgreSQL/MySQL)
- Authentication: JWT + bcrypt
- CMS: Posts, categories, tags, users/admins, media metadata, newsletter, site settings
- Roles: SUPER_ADMIN, ADMIN, EDITOR, AUTHOR

## Important
This package does not contain proprietary TheCollector source code or a bulk copy of its copyrighted articles/images. It includes original sample content and editable local placeholder assets. Replace them from the admin CMS.

## Quick start

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

API: http://localhost:5000

Default seeded account:
- email: admin@example.com
- password: ChangeMe123!

Change this immediately in production.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Admin: http://localhost:5173/admin

## Environment
All configurable runtime values are in:
- `frontend/.env`
- `backend/.env`

Cloudinary media uploads require these backend variables:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Uploads accept JPEG, PNG, WEBP, and GIF files up to 5 MB. The CMS stores Cloudinary URL, dimensions, MIME type, byte size, alt text, and focal-point metadata in the media library.

Commit `.env.example`, but normally do not commit production secrets.

## Main CMS capabilities
- Multi-admin accounts
- Role based access
- Create/edit/delete/publish/draft/archive blog posts
- Featured articles
- Category and tag management
- SEO title/description fields
- Slugs
- Author attribution
- Hero and card images
- Newsletter subscriber list
- Site identity and editable header/footer settings
- Search endpoint
- Public homepage/category/article routes
