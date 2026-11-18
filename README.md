# Skillflix

For Vercel frontend and Render/Railway backend hosting, follow [DEPLOYMENT.md](DEPLOYMENT.md). Use the root Vercel configuration and API proxy described there for that hosting setup.

A learning platform built with React, TypeScript, Vite, Tailwind CSS, Node.js, Express, and PostgreSQL. Public discovery, account based learning progress, a Super Admin content workspace, and an embedded YouTube learning player live in one workspace.

## Project structure

```text
apps/api/src/auth/       Email and Google login, sessions, password reset
apps/api/src/admin/      Protected content and user management APIs
apps/api/src/learning/   Account specific saves and progress APIs
apps/api/src/public/     Published catalog, search, and roadmap APIs
apps/api/src/db/         Additive schema, migration, seed, connection pool
apps/web/src/admin/      Dedicated Super Admin layout and editors
apps/web/src/app/        Routing and page metadata
apps/web/src/components/ Reusable UI, authentication, roadmap components
apps/web/src/context/    Authentication, language, account learning state
apps/web/src/pages/      Public, account, and learning player pages
apps/web/src/services/   Typed API client and Phase 2 progress import
```

## Local development

Requires Node.js 22+, npm, and PostgreSQL 16+. Docker Compose can start the local database.

1. `npm install`
2. Copy `.env.example` to `.env`. For Docker's local database, leave the sample `DATABASE_URL`.
3. `docker compose up -d db`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev`

The API defaults to `http://localhost:4000`; Vite normally uses `http://localhost:5173` and proxies `/api`. If Vite selects another port, adjust `WEB_ORIGIN` when the browser calls the API directly. The seed is safe to rerun for new schema and initial content; existing managed courses, teachers, and resources are preserved.

To create the one allowed Super Admin, set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (16+ characters), and optionally `ADMIN_NAME` in the server environment, then run `npm run admin:provision -w @skillflix/api`. The command refuses to create a second Super Admin. Do not put real credentials in a committed file. Sign in at `/login` and open `/admin/dashboard`.

Run `npm run lint`, `npm run test`, and `npm run build` for TypeScript checks, roadmap logic tests, and production builds. Run `npm run db:migrate` before starting a new API release.

For temporary local accounts, run `npm run db:seed:demo` after the content seed. It creates `admin@skillflix.local`, `aarav@skillflix.local`, and `meera@skillflix.local` and prints randomly generated passwords. Learners receive saved courses, a roadmap, and a bookmark; Aarav also has sample progress. Rerunning rotates only these demo passwords and clears their sessions. An existing different Super Admin is preserved. This command refuses production and remote databases.

## Deployment

Deploy PostgreSQL, the API, then the web build. A Neon PostgreSQL connection string works as `DATABASE_URL`; use its TLS enabled connection string and keep it only on the API host. The API host runs `npm ci`, `npm run build -w @skillflix/api`, `npm run db:migrate`, `npm run db:seed` for first deployment, and `npm run start -w @skillflix/api`. Set `NODE_ENV=production`, `DATABASE_URL`, `PORT`, and `WEB_ORIGIN` to the exact public web origin.

The web host builds with `npm ci` and `npm run build -w @skillflix/web`, then serves `apps/web/dist`. Set `VITE_API_URL` to the public API origin, without `/api` or a trailing slash, and `SITE_URL` to the public web origin before building. Configure SPA fallback to `index.html`; `apps/web/vercel.json` contains a Vercel rewrite. Keep the web and API on the same site (for example `www.example.com` and `api.example.com`) so browser session cookies work with the production `SameSite=Lax` setting. Use HTTPS for both.

Optional providers:

- Google sign in: set the same OAuth web client ID in `GOOGLE_CLIENT_ID` on the API and `VITE_GOOGLE_CLIENT_ID` in the web build. Configure the deployed web origin in Google Cloud. The API verifies Google ID tokens.
- Password reset and email verification: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` on the API. Without SMTP, email signup works but email delivery and password recovery are unavailable.
- YouTube: the player uses the official IFrame Player API. Admins enter supported YouTube URLs and manually curate lesson metadata. YouTube controls ads, branding, embedding permissions, and availability.

`VITE_*` values are public browser build values. Never put database credentials, SMTP passwords, or admin credentials in a `VITE_*` variable.

## Main routes

| Area           | Routes                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery      | `/`, `/courses`, `/exams`, `/skills`, `/teachers`, `/resources`, `/search`                                                                                                 |
| Detail         | `/exams/:slug`, `/skills/:slug`, `/roadmap/:type/:slug`, `/teachers/:slug`                                                                                                 |
| Account        | `/login`, `/signup`, `/profile`, `/my-learning`, `/forgot-password`                                                                                                        |
| Learning       | `/learn/:resourceSlug`                                                                                                                                                     |
| Administration | `/admin/dashboard`, `/admin/users`, `/admin/courses`, `/admin/teachers`, `/admin/roadmaps`, `/admin/resources`, `/admin/playlists`, `/admin/categories`, `/admin/settings` |
| Information    | `/about`, `/contact`, `/privacy`, `/terms`                                                                                                                                 |

Only published content is exposed by public APIs. Admin APIs enforce the Super Admin role on the server. Lesson completion is explicit; opening a video does not mark it complete. Old Phase 2 browser progress is imported into an account on first sign in.

## Verification and remaining launch work

Local PostgreSQL migration and seed, TypeScript checks, roadmap tests, production build, guest authorization checks, email signup/login/logout, Super Admin login and dashboard, course/teacher/resource/playlist/roadmap CRUD, publication visibility, and user progress API persistence were exercised during development. Test records were removed. The embedded player code uses YouTube's supported API, but real browser playback and embedding restrictions must be checked in the deployed environment. Google OAuth, SMTP delivery, and a live Neon database require operator credentials and were not exercised locally.

Before a public launch, provide a real support contact, obtain legal review of the privacy and terms pages, configure the production domain and providers, run browser accessibility and responsive checks, and verify playback against the published YouTube resources. The sitemap generated at build time contains the main public routes; content specific URLs should be added to a deployment time sitemap if search indexing of every course and roadmap is required.
