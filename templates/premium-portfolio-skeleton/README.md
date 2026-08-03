# Premium Portfolio Skeleton

Reusable architecture for a media-heavy creative portfolio. It deliberately contains no client identity, media or credentials.

## Modules

- `content-model.md`: CMS content responsibilities and project fields.
- `backend.sql`: reviews, bookings and availability with public-safe RLS.
- `env.example`: service configuration contract.
- `implementation-checklist.md`: repeatable build and launch sequence.

Recommended split: CMS for editorial content, Supabase for operational records, Cloudflare Stream for video, and locale-prefixed routes for translated pages. Keep a local content and MP4 fallback so a third-party outage never empties the portfolio.
