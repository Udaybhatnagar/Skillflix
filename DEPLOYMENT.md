# Deploy Skillflix: Vercel + Render or Railway + PostgreSQL

Use the repository root for both services because this project uses npm workspaces and one root lockfile. Use Node.js 22 (at least 22.12) on both hosts.

## 1. Create the production database

Create a Neon PostgreSQL project and copy its TLS connection string from the Connect dialog. Use that value as `DATABASE_URL` only on the backend. Railway PostgreSQL or Render PostgreSQL also work. Local Docker data and local demo users do not transfer to this database.

## 2. Deploy the backend on Render

1. New → Web Service → connect `Udaybhatnagar/Skillflix`.
2. Branch: `main`. Runtime: Node. Leave Root Directory blank (repository root).
3. Build Command: `npm ci --include=dev && npm run build -w @skillflix/api`.
4. Start Command: `node apps/api/dist/bootstrap.js`.
5. Health Check Path: `/api/health`.
6. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=` your production PostgreSQL connection string
   - `WEB_ORIGIN=https://YOUR-PROJECT.vercel.app` (replace once Vercel assigns the final URL)
   - `NODE_VERSION=22`
7. Deploy and copy the API origin, such as `https://YOUR-API.onrender.com`.

The bootstrap start command runs migrations automatically and seeds content only when the database has no courses. It records initialization so future starts preserve managed content. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no Super Admin exists, it provisions that first administrator too. This works on Render without Shell access. `DATABASE_URL` must point to a working PostgreSQL database before startup.

If using the basic `index.js` start command instead, initialize the database once using the backend Shell:

```sh
node apps/api/dist/db/migrate.js
node apps/api/dist/db/seed.js
```

Run migration for each subsequent schema release. Run the content seed on the first deployment; it contains example learning content, not demo users. If your service does not offer a shell, use the local commands in step 4 below against the production database.

## 3. Railway alternative

Create a project from the same GitHub repository. Keep the service at the repository root. Set Build Command to `npm ci --include=dev && npm run build -w @skillflix/api` and Start Command to `node apps/api/dist/index.js`. Set `NODE_ENV`, `DATABASE_URL`, and `WEB_ORIGIN` as above. Generate a public domain in Networking and copy its HTTPS origin. Use Node 22 in the build settings. Run the same migration, seed, and admin commands against that service's database. Deploy only one backend option.

## 4. Create the production administrator

In the backend's environment settings, temporarily add:

```text
ADMIN_EMAIL=your-real-email@example.com
ADMIN_PASSWORD=your-unique-password-of-at-least-16-characters
ADMIN_NAME=Your Name
```

Run in its shell:

```sh
node apps/api/dist/auth/provision-admin.js
```

Then remove `ADMIN_PASSWORD` from the service environment. The account is stored in PostgreSQL. This command creates only the first Super Admin. Do not run `db:seed:demo` on production.

If shell access is unavailable, run these in a local PowerShell window (requires your production database's external connection string):

```powershell
$env:DATABASE_URL = Read-Host 'Production DATABASE_URL' -MaskInput
npm run db:migrate
npm run db:seed
$env:ADMIN_EMAIL = Read-Host 'Admin email'
$env:ADMIN_NAME = Read-Host 'Admin name'
$env:ADMIN_PASSWORD = Read-Host 'Admin password, 16+ characters' -MaskInput
npm run admin:provision -w @skillflix/api
Remove-Item Env:DATABASE_URL, Env:ADMIN_EMAIL, Env:ADMIN_NAME, Env:ADMIN_PASSWORD
```

`-MaskInput` requires PowerShell 7. Existing environment values override the local `.env` for these commands.

## 5. Configure Vercel's API proxy

Run locally, substituting the actual backend origin:

```powershell
node scripts/configure-vercel.mjs https://YOUR-API.onrender.com
git add vercel.json
git commit -m "Configure production API proxy"
git push
```

For Railway, use its generated HTTPS origin instead. This adds a Vercel rewrite from `/api/*` to the backend before the SPA fallback. Browser requests remain on the frontend origin so HttpOnly login cookies work with `SameSite=Lax`. Do not set `VITE_API_URL` when using this proxy. The backend still checks the exact frontend origin on write requests.

## 6. Deploy the frontend on Vercel

1. Add New → Project → import `Udaybhatnagar/Skillflix`.
2. Keep Root Directory at `./` (repository root). Select Vite as the Framework Preset.
3. The root `vercel.json` supplies Install Command `npm ci`, Build Command `npm run build -w @skillflix/web`, and Output Directory `apps/web/dist`.
4. Select Node 22 in project settings.
5. Leave `VITE_API_URL` unset. Set `SITE_URL=https://YOUR-PROJECT.vercel.app` once the final domain is known, then redeploy to regenerate the sitemap.
6. Deploy and copy the final frontend URL.
7. Set backend `WEB_ORIGIN` to exactly that URL (HTTPS, no trailing slash) and redeploy the backend.

Use the stable production URL for testing; preview deployments have different origins and are not automatically allowed. Update `WEB_ORIGIN` and `SITE_URL` if you attach a custom domain.

## 7. Verify the deployed application

- Open `https://YOUR-PROJECT.vercel.app/api/health`; expect `{"status":"ok"}`.
- Open `/exams`, `/skills`, `/teachers`, and a course URL directly.
- Log in with the production administrator, refresh, and open `/admin/dashboard`.
- Create a learner and check saves, topic completion, and embedded video playback.
- Test logout and a private route in a separate browser session.

Optional: configure `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on Vercel using the same Google OAuth web client, with the final frontend origin authorized. Configure backend `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` for verification and password reset mail. Provider setup and deployment are separate from pushing code.

Before public launch, replace the contact placeholder and review the privacy and terms pages. Local demo credentials are not production accounts.
