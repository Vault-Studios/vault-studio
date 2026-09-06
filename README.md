# Vault Studio

Premium photography and film portfolio for Vault, built with a cinematic scrollytelling front end and a modular content/business backend.

## Premium architecture

- **Sanity CMS** supplies projects and galleries through `lib/content/`. Checked-in content is a resilient fallback.
- **Supabase** stores booking enquiries, review submissions, moderation state and public availability. Run `supabase/booking_submissions.sql` and `supabase/premium_backend.sql` in the Supabase SQL Editor.
- **Cloudflare Stream** is enabled per project through a Stream UID; local MP4 remains the development fallback.
- **Internationalization** uses `/` for English and `/sw` for Kiswahili, including localized booking routes and search metadata.

## Configure

Copy `.env.example` to `.env.local` and fill in the services being used. Public Supabase credentials are protected by the SQL row-level security policies; never place a service-role key in this project.

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

