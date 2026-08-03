# Vault CMS setup

1. Create a Sanity project and dataset.
2. Add `project.schema.ts` to the Studio and register it in `schemaTypes`.
3. Copy `.env.example` to `.env.local` and fill in `SANITY_PROJECT_ID` and `SANITY_DATASET`.
4. Create one English and one Kiswahili document for each project.

The live site queries Sanity directly through `lib/content/sanity.ts`. If the CMS is unavailable or not configured, it falls back to the checked-in Exim Bank project so the portfolio never renders empty.
