import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveLandingImageValue, resolveLandingProjectValue } from "../lib/landing-media-resolver.js";

const root = new URL("../", import.meta.url);
const fallback = { src: "/fallback.jpg", alt: "Automatic image", sourceLabel: "Automatic" };
const projects = [{
  id: "11111111-1111-4111-8111-111111111111",
  client: "Vault Client",
  title: "Project One",
  gallery: [{
    id: "22222222-2222-4222-8222-222222222222",
    projectId: "11111111-1111-4111-8111-111111111111",
    src: "/curated.jpg",
    alt: "CMS description",
  }],
}];

function slot(overrides = {}) {
  return {
    slot_key: "hero",
    project_id: projects[0].id,
    image_id: projects[0].gallery[0].id,
    alt_text_en: "Curated English alt",
    alt_text_sw: "Maelezo ya Kiswahili",
    active: true,
    ...overrides,
  };
}

test("missing or inactive landing slots preserve automatic fallback", () => {
  assert.equal(resolveLandingImageValue([], projects, "hero", "en", fallback), fallback);
  assert.equal(resolveLandingImageValue([slot({ active: false })], projects, "hero", "en", fallback), fallback);
});

test("configured landing image overrides fallback and localizes alt text", () => {
  assert.deepEqual(resolveLandingImageValue([slot()], projects, "hero", "sw", fallback), {
    src: "/curated.jpg",
    alt: "Maelezo ya Kiswahili",
    sourceLabel: "Vault Client",
    imageId: projects[0].gallery[0].id,
    projectId: projects[0].id,
  });
});

test("missing, deleted or mismatched image references fail safely", () => {
  assert.equal(resolveLandingImageValue([slot({ image_id: "33333333-3333-4333-8333-333333333333" })], projects, "hero", "en", fallback), fallback);
  assert.equal(resolveLandingImageValue([slot({ project_id: "44444444-4444-4444-8444-444444444444" })], projects, "hero", "en", fallback), fallback);
});

test("configured featured project overrides fallback and deleted project falls back", () => {
  const automatic = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "Automatic" };
  const configured = resolveLandingProjectValue([slot({ slot_key: "featured_project", image_id: null })], projects, automatic);
  assert.equal(configured, projects[0]);
  assert.equal(resolveLandingProjectValue([slot({ slot_key: "featured_project", project_id: null, image_id: null })], projects, automatic), automatic);
});

test("migration exposes only active reads and admin-authorized writes", async () => {
  const [migration, publicReader] = await Promise.all([
    readFile(new URL("supabase/migrations/20260907132115_landing_media_slots.sql", root), "utf8"),
    readFile(new URL("lib/landing-media.ts", root), "utf8"),
  ]);
  assert.match(migration, /alter table public\.site_media_slots enable row level security/i);
  assert.match(migration, /for select\s+to anon, authenticated\s+using \(active = true\)/i);
  assert.match(migration, /revoke all on table public\.site_media_slots from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.site_media_slots to anon/i);
  assert.match(migration, /for insert[\s\S]*public\.admin_users[\s\S]*auth\.uid\(\)/i);
  assert.match(migration, /for update[\s\S]*using[\s\S]*with check[\s\S]*public\.admin_users/i);
  assert.match(migration, /for delete[\s\S]*public\.admin_users/i);
  assert.doesNotMatch(migration, /user_metadata|security definer|client_galler/i);
  assert.match(publicReader, /active=eq\.true/);
  assert.match(publicReader, /select=\$\{PUBLIC_SLOT_FIELDS\}/);
  assert.doesNotMatch(publicReader, /created_at|admin_users|email/);
});

test("admin landing endpoint uses the existing JWT and publishable-key architecture", async () => {
  const route = await readFile(new URL("app/api/admin/landing/route.ts", root), "utf8");
  assert.match(route, /getAdminSession\(\)/);
  assert.match(route, /Authorization.*Bearer.*session\.accessToken/s);
  assert.match(route, /getSupabasePublicConfig\(\)/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_|VITE_|service_role|sb_secret_/i);
});

test("private gallery migration remains unchanged by landing curation", async () => {
  const migration = await readFile(new URL("supabase/migrations/20260906180553_private_client_gallery_sessions.sql", root), "utf8");
  assert.match(migration, /client_gallery_sessions/);
  assert.doesNotMatch(migration, /site_media_slots/);
});
