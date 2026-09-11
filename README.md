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

For the deployed frontend, set the backend deployment environment variable `FRONTEND_URL` to include both local and production origins, for example:
`http://localhost:5173,https://legit-blog-a46l.vercel.app`

The backend includes a Vercel function entry in `backend/api/index.js` and `backend/vercel.json`. Deploy the `backend` directory as the backend Vercel project, and set its `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, and Cloudinary variables in Vercel Project Settings.

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
- Homepage adverts: admins and editors can add banners, upload or reuse media, edit text and links, set display order, and show/hide adverts under **Admin → Adverts**.
- Newsletter subscriber list
- Site identity and editable header/footer settings
- Search endpoint
- Public homepage/category/article routes

Homepage adverts are stored in the `Advert` table. For each deployment, run `npx prisma migrate deploy` and `npx prisma generate` from `backend` before starting the API. The advert migration imports the original three promotions as editable records. The homepage shows only visible adverts and hides the slider when none are visible.

Run advert API and validation checks with `node --test src/adverts.test.js` from `backend`.

## CMS administration

Settings are organized into Basic settings, Branding, SEO & analytics, Footer & social, Publishing, and Advanced tabs. Upload a logo in Branding and save settings. The header and footer use the image, with logo text as a fallback if it is missing or cannot load. The footer uses the live category list and configured social links.

| Role | Access |
| --- | --- |
| Author | Own posts and draft editing/deletion, own uploaded media, profile and password |
| Editor | All posts, publication and bulk status actions, categories, comments, adverts, media and analytics |
| Admin | Editor capabilities plus author applications, newsletter, settings, and author/editor accounts |
| Super admin | Admin capabilities plus administrator account management |

Permissions are checked by the API using the current database account on every authenticated request. Disabling accounts and role changes take effect immediately. Authors cannot publish or modify published posts. Public post endpoints only return published content. Post HTML is sanitized on save and on public article reads.

The Posts screen supports server-side pagination, text/status/category/author/featured/date filters, sorting, bulk status updates, and CSV export of matching posts (up to 10,000 per export). Author exports are restricted to their own posts. CSV formula prefixes are neutralized.

Under Author requests, admins can review applications, save reply drafts, send replies, inspect delivery history, and approve an application by creating an Author or Editor account. Repeated approval and existing email accounts are rejected. Initial passwords are not emailed; share them securely, then the user can change the password under Profile.

Email delivery requires these server environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` (see `backend/.env.example`). Configure them locally and in the backend deployment. Without SMTP, drafts can still be saved and opened in an email app. Sending from an email app is not recorded as server delivery. No email is sent automatically on application approval.

Deploy the backend with `npm run vercel-build` to regenerate Prisma Client and apply migrations. The `20260911090000_cms_management` migration adds logo and application-review storage without deleting existing content. Deploy the frontend after the backend is ready.

Run permission and workflow checks from `backend` with `node --test src/adverts.test.js src/management.test.js`.
