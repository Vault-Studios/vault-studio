import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { readApiError } from "../lib/api-response.js";

test("admin login error parsing handles JSON, empty, malformed, and unreadable bodies", async () => {
  const fallback = "Unable to sign in (502).";

  assert.equal(
    await readApiError(new Response('{"error":"Supabase unavailable"}'), fallback),
    "Supabase unavailable"
  );
  assert.equal(await readApiError(new Response(""), fallback), fallback);
  assert.equal(await readApiError(new Response("<html>Bad gateway</html>"), fallback), fallback);
  assert.equal(
    await readApiError({ text: async () => { throw new Error("stream failed"); } }, fallback),
    fallback
  );
});

test("admin login keeps network failures and HTTP failures visible", async () => {
  const form = await readFile(new URL("../app/admin/login/LoginForm.tsx", import.meta.url), "utf8");

  assert.match(form, /if \(!response\.ok\)/);
  assert.match(form, /Unable to sign in \(\$\{response\.status\}\)/);
  assert.match(form, /Unable to reach the admin login service/);
  assert.doesNotMatch(form, /response\.json\(\)/);
});
