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
