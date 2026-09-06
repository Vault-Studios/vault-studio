import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the finished Vault experience replaces the starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("app/components/VaultHome.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(page, /DepthHero/);
  assert.match(page, /localizedPath\(locale, "\/book"\)/);
  assert.match(layout, /Photography & Film Studio/);
  assert.doesNotMatch(
    `${page}\n${layout}\n${packageJson}`,
    /codex-preview|_sites-preview|react-loading-skeleton/
  );
});

test("booking requests use Supabase storage protected by RLS", async () => {
  const [route, schema] = await Promise.all([
    readFile(new URL("app/api/bookings/route.ts", root), "utf8"),
    readFile(new URL("supabase/booking_submissions.sql", root), "utf8"),
  ]);

  assert.match(route, /supabaseRest\("booking_submissions"/);
  assert.match(schema, /enable row level security/i);
  assert.match(schema, /grant insert .* anon, authenticated/i);
});

test("premium integrations keep safe fallbacks", async () => {
  const [content, reviews, swahili, stream, skeleton] = await Promise.all([
    readFile(new URL("lib/content/index.ts", root), "utf8"),
    readFile(new URL("app/api/reviews/route.ts", root), "utf8"),
    readFile(new URL("app/sw/page.tsx", root), "utf8"),
    readFile(new URL("app/components/EximCaseStudy.tsx", root), "utf8"),
    readFile(new URL("templates/premium-portfolio-skeleton/README.md", root), "utf8"),
  ]);

  assert.match(content, /supabaseProjects/);
  assert.match(content, /localProjects/);
  assert.match(reviews, /review_submissions/);
  assert.match(swahili, /locale="sw"/);
  assert.match(stream, /cloudflarestream\.com/);
  assert.match(skeleton, /Reusable architecture/);
});
