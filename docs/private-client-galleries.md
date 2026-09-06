# Private Client Galleries

## Phase 2 architecture

Client photographs live in the private `client-galleries` Supabase Storage bucket. Public URLs must never be generated for this bucket.

### Tables

- `client_galleries`: gallery metadata, lifecycle, hashed PIN, selection/download rules, expiry.
- `client_gallery_images`: private Storage object metadata and ordering.
- `client_gallery_selections`: the client's chosen image IDs.

### Security boundary

Database and Storage RLS currently grant direct access only to authenticated Vault admins present in `admin_users`. The `anon` role has no direct gallery table privileges.

The client application must therefore use an application-mediated gallery session:

1. Client visits `/gallery/[slug]`.
2. Server accepts the PIN over POST and verifies it against `pin_hash`.
3. Successful verification creates a short-lived, HttpOnly, Secure, SameSite=Lax gallery-session cookie scoped to the gallery flow. Do not place the PIN or reusable database credentials in the cookie.
4. Gallery APIs validate that session before returning gallery metadata or accepting selections.
5. Image viewing uses short-lived signed URLs for objects in the private bucket.
6. Selection writes are validated server-side against gallery/image membership, lifecycle, expiry, and selection limit.
7. Downloads are exposed only when both gallery and image permit them.

### Admin manager — implementation status

Implemented on `feature/private-client-galleries`:

- `/admin/galleries` authenticated list
- `/admin/galleries/new` create form
- server-side scrypt PIN hashing with random salt
- authenticated create API using the admin JWT/RLS
- gallery workspace/detail page
- private signed direct-to-Storage upload authorization
- upload metadata registration and ordering
- draft/active/archive lifecycle controls
- gallery security regression tests

Next:

- render private image previews for admins with short-lived signed URLs
- image removal/reordering/download toggles
- client PIN/session endpoint
- `/gallery/[slug]` viewer
- favourites/selections + submit lock
- admin selection review

### Privacy requirements

- Never store plaintext gallery PINs.
- Never expose the Supabase secret/service-role key.
- Never make `client-galleries` public.
- Never return raw private Storage paths to an unauthenticated client before gallery authorization.
- Signed image URLs should be short lived and regenerated only for an authorized gallery session.
- Admin operations continue to use the authenticated admin JWT so Supabase RLS remains authoritative.

> Checkpoint: admin manager foundation is ready for local build and runtime verification before client-session work begins.

Local verification target: create one draft gallery, upload one small JPEG, activate it, and confirm the object remains inaccessible through a public Storage URL.

Do not merge this feature branch into `main` until the gallery client session/viewer and selection workflow have passed production smoke testing.

Security note: activation alone does not grant anonymous database or Storage access; the upcoming application session remains the only intended client gateway.

Current checkpoint commit includes no plaintext PIN fixture or private client image data.

After local verification, continue on this same feature branch rather than modifying the stable `main` release.

Expected local entry point after checkout: `http://localhost:3000/admin/galleries`.

Run the repository build/tests before treating this checkpoint as verified; these GitHub-side commits have not executed your local Vinext toolchain.

If the build reveals Vinext/Cloudflare compatibility issues, fix them on the feature branch before deploying any gallery code.

Admin image uploads are intentionally direct-to-Storage so large photo binaries do not pass through the Worker request body.

Gallery activation is disabled in the admin UI until at least one image has been registered.

This checkpoint intentionally leaves the client route inaccessible; no PIN entry screen is exposed until the session design is implemented.

Use a disposable gallery and non-sensitive photo for the first smoke test.

The Supabase schema migration has already been applied; the checked-in SQL exists to keep repository schema history aligned with production.

Next implementation checkpoint begins only after `npm run build` and `npm test` pass locally.

No deployment was performed as part of this checkpoint.

Recommended verification command order: `git pull`, `npm run build`, `npm test`, then `npm run dev`.

If the upload succeeds, verify its metadata appears in the gallery workspace before activating the gallery.

Do not use real client photographs during this first verification pass.

After activation, the client URL is intentionally not functional yet; that is the next implementation slice.

The stable Studio Pro production deployment remains unchanged.

This is the admin-foundation checkpoint for Phase 2. Proceed to the client session/viewer only after local verification passes.

The feature branch is expected to remain unmerged throughout this verification.

Report any build error verbatim before changing the gallery security model.

Once verified, the next slice will add the PIN/session gateway without granting anonymous Supabase table access.

Use the feature branch for all verification fixes.

Ready to move branch ref.
