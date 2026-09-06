import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const securitySource = fs.readFileSync(new URL("../lib/gallery-security.ts", import.meta.url), "utf8");
const migrationSource = fs.readFileSync(new URL("../db/migrations/20260906_private_client_gallery_foundation.sql", import.meta.url), "utf8");
const createRoute = fs.readFileSync(new URL("../app/api/admin/galleries/route.ts", import.meta.url), "utf8");
const signRoute = fs.readFileSync(new URL("../app/api/admin/galleries/[id]/images/sign/route.ts", import.meta.url), "utf8");

test("gallery PIN helper uses scrypt and timing-safe comparison", () => {
  assert.match(securitySource, /scryptSync/);
  assert.match(securitySource, /timingSafeEqual/);
  assert.doesNotMatch(securitySource, /service_role|sb_secret_/i);
});

test("private gallery migration keeps client storage private and RLS enabled", () => {
  assert.match(migrationSource, /'client-galleries', 'client-galleries', false/);
  assert.match(migrationSource, /client_galleries enable row level security/);
  assert.match(migrationSource, /revoke all on public\.client_galleries from anon/);
  assert.doesNotMatch(migrationSource, /grant .* anon/i);
});

test("admin gallery writes preserve user JWT RLS", () => {
  assert.match(createRoute, /Authorization: `Bearer \$\{session\.accessToken\}`/);
  assert.match(signRoute, /Authorization: `Bearer \$\{session\.accessToken\}`/);
  assert.doesNotMatch(createRoute + signRoute, /service_role|sb_secret_/i);
});

test("private image uploads enforce type and 15 MB limit", () => {
  assert.match(signRoute, /image\/jpeg/);
  assert.match(signRoute, /image\/png/);
  assert.match(signRoute, /image\/webp/);
  assert.match(signRoute, /15 \* 1024 \* 1024/);
});
