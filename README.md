# Vault Studio

Premium photography and film portfolio for Vault, built with a cinematic scrollytelling front end and a modular content/business backend.

## Premium architecture

- **Sanity CMS** supplies projects and galleries through `lib/content/`. Checked-in content is a resilient fallback.
- **Supabase** stores booking enquiries, review submissions, moderation state and public availability. Run `supabase/booking_submissions.sql` and `supabase/premium_backend.sql` in the Supabase SQL Editor.
- **Cloudflare Stream** is enabled per project through a Stream UID; local MP4 remains the development fallback.
- **Internationalization** uses `/` for English and `/sw` for Kiswahili, including localized booking routes and search metadata.

## Configure

Copy `.env.example` to `.env.local` and fill in the services being used. Vinext 0.0.50 automatically loads `.env.local` for `npm run dev`, so no per-terminal environment commands are needed. The file is covered by `.env*` in `.gitignore`; verify it remains untracked before committing. Public Supabase credentials are protected by the SQL row-level security policies. A server key may be placed only in the ignored `.env.local` file for development or in an encrypted Worker secret—never in committed files or browser-visible variables.

For Supabase, use the project HTTPS URL and its `sb_publishable_...` key:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SERVER_KEY=sb_secret_YOUR_SERVER_KEY
```

Do not use `.dev.vars` for this Vinext setup. Vinext's Next-compatible server environment loader reads `.env.local` before Vite creates the RSC/SSR environments. Cloudflare's Vite plugin may also read Wrangler development-variable files, but maintaining two local secret files creates ambiguous precedence.

```bash
npm install
npm run dev
npm run build
```

CMS field instructions live in `cms/sanity/README.md`. A clean, provider-ready foundation for future client portfolios is stored in `templates/premium-portfolio-skeleton/`.

## Content workflow

1. Upload a project video to Cloudflare Stream and copy its UID.
2. Create matching English and Kiswahili project entries in Sanity.
3. Add the UID, cover image, gallery, credits and translated copy.
4. Publish. The site refreshes CMS content automatically without a code deployment.

Reviews remain private in `review_submissions` until their status is changed to `approved`. Bookings enter with `new` status. Availability is controlled by the single `availability_status` row with id `studio`.

### Cloudflare runtime configuration

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as encrypted bindings on the
deployed Worker. The explicit `nodejs_compat_populate_process_env` compatibility
flag makes those bindings available to the Vinext server bundle at request time; no
Supabase credentials are committed or bundled as fallbacks. Keep the
publishable key paired with RLS and never substitute a service-role key.

Local `.env.local` values are development inputs only; they do not replace or
override the deployed Worker's encrypted bindings. `worker/index.ts` keeps the
explicit request-time bridge from Worker bindings to Vinext's `process.env`.

`SUPABASE_SERVER_KEY` is a separate, server-only Supabase secret key used only
by `lib/gallery-server.ts` for PIN-protected client galleries. Create a named
secret key for this gateway in Supabase, place it in ignored `.env.local` for
development, and add it as an encrypted Cloudflare Worker secret in production.
It must never use a `NEXT_PUBLIC_` or `VITE_` prefix. Existing admin, booking,
review, and project routes continue to use the publishable key plus the signed-in
administrator's JWT and RLS.

Before deploying the private gallery routes, review and apply
`supabase/migrations/20260906180553_private_client_gallery_sessions.sql` through
the normal Supabase migration workflow. The migration creates hashed server
sessions and database-enforced gallery lifecycle/selection limits; it grants no
gallery access to `anon` or `authenticated` browser roles.

After deployment, `GET /api/health/supabase` performs a read-only connection
check and returns only safe metadata (configuration state, hostname, project
reference, key type, and upstream status). It never returns the key.

## Update the studio status

Open Supabase → **Table Editor** → `availability_status` and edit the `studio` row. The public site reads this row automatically; no redeployment is needed.

- `available` — accepting new commissions
- `limited` — selected production dates remain
- `engaged` — currently working on a project, while future enquiries remain open
- `unavailable` — bookings are temporarily paused

Use `message_en` and `message_sw` for the public headline. Set `next_available_date` when the studio knows its next opening, or leave it empty when no date should be displayed.

