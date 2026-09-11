import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  digestGalleryClient,
  digestGallerySessionToken,
  generateGallerySessionToken,
  hashGalleryPin,
  verifyGalleryPin,
} from "../lib/gallery-security.ts";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(testDirectory, "..");
const read = (relativePath) => fs.readFileSync(path.join(rootDirectory, relativePath), "utf8");
// Git includes tracked env/config files even if an ignore rule also matches them.
// Untracked local secrets are not project source and must not be read by this scan.
const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: rootDirectory,
  encoding: "utf8",
}).split("\0").filter(Boolean);
const buildFiles = (directory) => fs.readdirSync(path.join(rootDirectory, directory), { recursive: true })
  .map((file) => path.join(directory, file))
  .filter((file) => fs.statSync(path.join(rootDirectory, file)).isFile());

const serverSource = read("lib/gallery-server.ts");
const sessionSource = read("lib/gallery-session.ts");
const unlockSource = read("app/gallery/[slug]/unlock/route.ts");
const imageSource = read("app/gallery/[slug]/images/[imageId]/route.ts");
const selectionSource = read("app/gallery/[slug]/selections/route.ts");
const submitSource = read("app/gallery/[slug]/submit/route.ts");
const adminGallerySource = read("app/admin/galleries/[id]/page.tsx");
const migrationSource = read(
  "supabase/migrations/20260906180553_private_client_gallery_sessions.sql"
);
const foundationMigrationSource = read(
  "db/migrations/20260906_private_client_gallery_foundation.sql"
);

test("PIN verification accepts the correct PIN and rejects wrong or malformed values", () => {
  const encoded = hashGalleryPin("4826");
  assert.equal(verifyGalleryPin("4826", encoded), true);
  assert.equal(verifyGalleryPin("4827", encoded), false);
  assert.equal(verifyGalleryPin("4826", "not-a-valid-hash"), false);
  assert.throws(() => hashGalleryPin("123"), /between 4 and 32 characters/);
  assert.match(unlockSource, /request\.json\(\)/);
  assert.match(unlockSource, /pin\.trim\(\)\.length < 4/);
  assert.match(unlockSource, /Gallery or PIN not recognized/);
});

test("unlocking fails closed for missing, inactive, or expired galleries", () => {
  assert.match(unlockSource, /gallery\?\.pin_hash \?\? DUMMY_PIN_HASH/);
  assert.match(unlockSource, /gallery\.status === "active"/);
  assert.match(unlockSource, /!isGalleryExpired\(gallery\.expires_at\)/);
  assert.match(unlockSource, /if \(!pinMatches \|\| !accessible \|\| !gallery\)/);
  assert.match(unlockSource, /status: 401/);
});

test("PIN failures are rate-limited without storing a plaintext client address", () => {
  const digest = digestGalleryClient("release-review", "203.0.113.10");
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(digest, /203\.0\.113\.10/);
  assert.match(unlockSource, /request\.headers\.get\("cf-connecting-ip"\)/);
  assert.match(unlockSource, /getGalleryUnlockAttempt\(gallery\.id, clientDigest\)/);
  assert.match(unlockSource, /registerGalleryUnlockFailure\(gallery\.id, clientDigest\)/);
  assert.match(unlockSource, /status: 429/);
  assert.match(unlockSource, /"Retry-After": "900"/);
  assert.match(migrationSource, /failure_count \+ 1 >= 5/);
  assert.match(migrationSource, /interval '15 minutes'/);
  assert.match(migrationSource, /revoke execute on function public\.register_client_gallery_unlock_failure/);
});

test("gallery sessions use an opaque token while Supabase stores only its digest", () => {
  const tokenA = generateGallerySessionToken();
  const tokenB = generateGallerySessionToken();
  assert.match(tokenA, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(tokenA, tokenB);
  assert.match(digestGallerySessionToken(tokenA), /^[a-f0-9]{64}$/);
  assert.notEqual(digestGallerySessionToken(tokenA), tokenA);

  assert.match(unlockSource, /digestGallerySessionToken\(token\)/);
  assert.match(unlockSource, /httpOnly: true/);
  assert.match(unlockSource, /sameSite: "lax"/);
  assert.match(unlockSource, /secure: process\.env\.NODE_ENV === "production"/);
  assert.match(unlockSource, /path: galleryCookiePath\(gallery\.slug\)/);
  assert.doesNotMatch(unlockSource, /cookies\.set\([^)]*pin/i);
});

test("missing, invalid, revoked, expired, and wrong-gallery sessions are rejected", () => {
  assert.match(sessionSource, /if \(!isGallerySessionToken\(token\)\) return null/);
  assert.match(serverSource, /revoked_at=is\.null/);
  assert.match(serverSource, /new Date\(session\.expires_at\)\.getTime\(\) <= now/);
  assert.match(serverSource, /slug=eq\.\$\{encodeURIComponent\(slug\)\}/);
  assert.match(serverSource, /!\["active", "selection_submitted"\]\.includes\(gallery\.status\)/);
  assert.match(serverSource, /isGalleryExpired\(gallery\.expires_at, now\)/);
});

test("private images are gallery-scoped and signed only after session authorization", () => {
  assert.match(serverSource, /client_gallery_images\?id=eq\.\$\{encodeURIComponent\(imageId\)\}&gallery_id=eq\.\$\{encodeURIComponent\(galleryId\)\}/);
  assert.ok(
    imageSource.indexOf("const session = await getGallerySession(slug)") <
      imageSource.indexOf("const signed = await createGalleryImageSignedUrl")
  );
  assert.match(imageSource, /status: 401/);
  assert.match(imageSource, /Cache-Control", "private, max-age=60, no-transform/);
  assert.doesNotMatch(imageSource, /storage_path/);
});

test("selection writes enforce authorization, scope, uniqueness, limits, and finalization", () => {
  assert.ok(
    selectionSource.indexOf("const session = await getGallerySession(slug)") <
      selectionSource.indexOf("const result = await saveGallerySelection")
  );
  assert.match(selectionSource, /UUID_PATTERN\.test\(body\.imageId\)/);
  assert.match(serverSource, /getScopedGalleryImage\(galleryId, imageId\)/);
  assert.match(serverSource, /current\.some\(\(item\) => item\.image_id === imageId\)/);
  assert.match(serverSource, /current\.length >= gallery\.selection_limit/);
  assert.match(serverSource, /Prefer: "resolution=ignore-duplicates,return=minimal"/);
  assert.match(submitSource, /getGallerySession\(slug\)/);
  assert.match(serverSource, /selections\.length === 0/);
  assert.match(serverSource, /status: "selection_submitted"/);

  assert.match(migrationSource, /for update/);
  assert.match(migrationSource, /gallery_status <> 'active'/);
  assert.match(migrationSource, /gallery_expires_at <= now\(\)/);
  assert.match(migrationSource, /where id = target_image_id and gallery_id = target_gallery_id/);
  assert.match(migrationSource, /current_selection_count >= gallery_selection_limit/);
  assert.match(migrationSource, /before insert or update or delete/);
  assert.match(migrationSource, /if tg_op = 'DELETE' then\s+return old;\s+end if;\s+return new;/);
  assert.match(migrationSource, /if not found and tg_op = 'DELETE' then\s+return old/);
});

test("browser roles cannot read sessions or private gallery records", () => {
  assert.match(migrationSource, /alter table public\.client_gallery_sessions enable row level security/);
  assert.match(migrationSource, /revoke all on public\.client_gallery_sessions from public, anon, authenticated/);
  assert.match(migrationSource, /revoke all on public\.client_gallery_unlock_attempts from public, anon, authenticated/);
  assert.match(migrationSource, /revoke all on schema private from public, anon, authenticated/);
  assert.match(foundationMigrationSource, /'client-galleries', 'client-galleries', false/);
  assert.doesNotMatch(migrationSource, /grant .* to (anon|authenticated)/i);
  assert.match(migrationSource, /revoke all on public\.client_galleries from service_role/);
  assert.match(migrationSource, /grant update \(status, selection_submitted_at, updated_at\)/);
  assert.match(migrationSource, /grant insert \(gallery_id, token_digest, expires_at\)/);
});

test("the privileged key is isolated from client, admin, and shared runtime modules", () => {
  const allowedReferences = new Set([
    ".env.example",
    "README.md",
    "lib/gallery-server.ts",
    "worker/index.ts",
    "tests/client-gallery-gateway.test.mjs",
  ]);
  const unexpectedReferences = [];
  for (const relativePath of [...trackedFiles, ...buildFiles("dist/client")]) {
    if (allowedReferences.has(relativePath)) continue;
    if (/SUPABASE_SERVER_KEY|NEXT_PUBLIC_SUPABASE_SERVER_KEY|VITE_SUPABASE_SERVER_KEY/.test(read(relativePath))) {
      unexpectedReferences.push(relativePath);
    }
  }
  assert.deepEqual(unexpectedReferences, []);
  assert.match(serverSource, /import "server-only"/);
  assert.match(serverSource, /headers\.set\("apikey", key\)/);
  assert.match(serverSource, /hostname !== EXPECTED_SUPABASE_HOST/);
  assert.match(serverSource, /hxqsnztxokfemmysyjyw\.supabase\.co/);
  assert.doesNotMatch(serverSource, /headers\.set\("Authorization"/);
  assert.doesNotMatch(serverSource, /export async function galleryRequest/);
  assert.doesNotMatch(adminGallerySource, /gallery-server|SUPABASE_SERVER_KEY|sb_secret_/i);
});

test("source does not contain a committed Supabase secret credential", () => {
  const exposedCredentials = [];
  for (const relativePath of [...trackedFiles, ...buildFiles("dist")]) {
    // Vinext copies local secrets here for the local server; never exempt client output
    // or a force-tracked copy of this file from credential checks.
    if (relativePath.replaceAll("\\", "/") === "dist/server/.dev.vars" &&
        !trackedFiles.includes("dist/server/.dev.vars")) continue;
    const source = read(relativePath);
    const hasSecretKey = /sb_secret_[A-Za-z0-9_-]{20,}|service_role\.[A-Za-z0-9_-]{20,}/.test(source);
    const hasServiceRoleJwt = [...source.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)]
      .some((match) => {
        try {
          return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")).role === "service_role";
        } catch {
          return false;
        }
      });
    if (hasSecretKey || hasServiceRoleJwt) exposedCredentials.push(relativePath);
  }
  // Report paths only: assertion output must never include credential values.
  assert.deepEqual(exposedCredentials, []);
});
