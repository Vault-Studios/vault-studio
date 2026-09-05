import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Supabase uses runtime bindings without committed credentials", async () => {
  const [helper, worker, wranglerConfig, exampleEnv] = await Promise.all([
    readFile(new URL("lib/supabase.ts", root), "utf8"),
    readFile(new URL("worker/index.ts", root), "utf8"),
    readFile(new URL("wrangler.jsonc", root), "utf8"),
    readFile(new URL(".env.example", root), "utf8"),
  ]);

  assert.match(helper, /process\.env\[name\]/);
  assert.match(helper, /SUPABASE_URL/);
  assert.match(helper, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(worker, /exposeSupabaseBindingsToVinext/);
  assert.match(worker, /process\.env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(helper, /sb_publishable_[A-Za-z0-9_-]{20,}/);
  assert.match(wranglerConfig, /nodejs_compat_populate_process_env/);
  assert.match(exampleEnv, /sb_publishable_YOUR_KEY/);
});

test("anonymous Supabase requests do not manufacture a user session", async () => {
  const [helper, cms, recovery, staticSite] = await Promise.all([
    readFile(new URL("lib/supabase.ts", root), "utf8"),
    readFile(new URL("lib/content/supabase.ts", root), "utf8"),
    readFile(new URL("app/api/admin/password-recovery/route.ts", root), "utf8"),
    readFile(new URL("docs/script.js", root), "utf8"),
  ]);

  assert.doesNotMatch(
    `${helper}\n${cms}\n${recovery}\n${staticSite}`,
    /Authorization:\s*`Bearer \$\{(?:key|supabaseKey)\}`/
  );
});

test("responsive navigation has exclusive desktop and mobile modes", async () => {
  const [hero, css] = await Promise.all([
    readFile(new URL("app/components/DepthHero.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(hero, /className="desktopNav"/);
  assert.match(hero, /className=\{`mobileMenu/);
  assert.match(css, /@media \(min-width: 981px\)[\s\S]*\.nav \.mobileMenu\.isOpen \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*\.nav \.desktopNav \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.availability \{ display: none; \}/);
});

test("recovery sessions that land on the homepage reach the password form", async () => {
  const [layout, recoveryRedirect] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/components/RecoveryRedirect.tsx", root), "utf8"),
  ]);

  assert.match(layout, /<RecoveryRedirect \/>/);
  assert.match(recoveryRedirect, /params\.get\("type"\) !== "recovery"/);
  assert.match(recoveryRedirect, /window\.location\.replace\(`\/admin\/reset-password\$\{hash\}`\)/);
});
