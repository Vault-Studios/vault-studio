import "server-only";

import type { ClientGallery, ClientGalleryImage, ClientGallerySelection } from "./gallery-types";
import { isGalleryExpired } from "./gallery-types";
import { getSupabasePublicConfig } from "./supabase";

const PRIVATE_BUCKET = "client-galleries";
const SIGNED_URL_SECONDS = 120;
const EXPECTED_SUPABASE_HOST = "hxqsnztxokfemmysyjyw.supabase.co";

type GalleryForPinVerification = ClientGallery & { pin_hash: string };

type GallerySessionRow = {
  id: string;
  gallery_id: string;
  token_digest: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

type GalleryUnlockAttempt = {
  failure_count: number;
  locked_until: string | null;
};

export type AuthorizedGallerySession = {
  sessionId: string;
  gallery: ClientGallery;
  expiresAt: string;
};

function getGalleryServerConfig() {
  const { url } = getSupabasePublicConfig();
  const key = process.env.SUPABASE_SERVER_KEY?.trim() ?? "";
  const hostname = new URL(url).hostname;

  if (hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error("Private gallery Supabase project configuration is invalid.");
  }

  if (!key) {
    throw new Error(
      "Private gallery server configuration is missing. Set SUPABASE_SERVER_KEY in ignored local configuration or as an encrypted Worker secret."
    );
  }
  if (!key.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_SERVER_KEY must be a server-only Supabase secret key.");
  }

  return { url, key };
}

async function galleryRequest(path: string, init?: RequestInit) {
  const { url, key } = getGalleryServerConfig();
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Private gallery data request failed (${response.status}).`);
  }
  return response;
}

async function galleryRows<T>(path: string) {
  const response = await galleryRequest(`/rest/v1/${path}`);
  return (await response.json()) as T[];
}

const GALLERY_SELECT =
  "id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,selection_submitted_at,created_at,updated_at";

export async function getGalleryForPinVerification(slug: string) {
  const rows = await galleryRows<GalleryForPinVerification>(
    `client_galleries?slug=eq.${encodeURIComponent(slug)}&select=${GALLERY_SELECT},pin_hash&limit=1`
  );
  return rows[0] ?? null;
}

export async function createGallerySession(
  galleryId: string,
  tokenDigest: string,
  expiresAt: string
) {
  const response = await galleryRequest("/rest/v1/client_gallery_sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      gallery_id: galleryId,
      token_digest: tokenDigest,
      expires_at: expiresAt,
    }),
  });
  const rows = (await response.json()) as GallerySessionRow[];
  if (!rows[0]) throw new Error("Private gallery session was not created.");
  return rows[0];
}

export async function getGalleryUnlockAttempt(galleryId: string, clientDigest: string) {
  const rows = await galleryRows<GalleryUnlockAttempt>(
    `client_gallery_unlock_attempts?gallery_id=eq.${encodeURIComponent(galleryId)}&client_digest=eq.${encodeURIComponent(clientDigest)}&select=failure_count,locked_until&limit=1`
  );
  return rows[0] ?? null;
}

export async function registerGalleryUnlockFailure(galleryId: string, clientDigest: string) {
  const response = await galleryRequest("/rest/v1/rpc/register_client_gallery_unlock_failure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_gallery_id: galleryId, p_client_digest: clientDigest }),
  });
  const payload = (await response.json()) as GalleryUnlockAttempt | GalleryUnlockAttempt[];
  const attempt = Array.isArray(payload) ? payload[0] : payload;
  if (!attempt) throw new Error("Gallery unlock limit was not recorded.");
  return attempt;
}

export async function clearGalleryUnlockFailures(galleryId: string, clientDigest: string) {
  await galleryRequest(
    `/rest/v1/client_gallery_unlock_attempts?gallery_id=eq.${encodeURIComponent(galleryId)}&client_digest=eq.${encodeURIComponent(clientDigest)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } }
  );
}

export async function getAuthorizedGallerySession(
  slug: string,
  tokenDigest: string,
  now = Date.now()
): Promise<AuthorizedGallerySession | null> {
  const sessionRows = await galleryRows<GallerySessionRow>(
    `client_gallery_sessions?token_digest=eq.${encodeURIComponent(tokenDigest)}&revoked_at=is.null&select=id,gallery_id,token_digest,expires_at,created_at,last_seen_at,revoked_at&limit=1`
  );
  const session = sessionRows[0];
  if (!session || new Date(session.expires_at).getTime() <= now) return null;

  const galleryRowsResult = await galleryRows<ClientGallery>(
    `client_galleries?id=eq.${encodeURIComponent(session.gallery_id)}&slug=eq.${encodeURIComponent(slug)}&select=${GALLERY_SELECT}&limit=1`
  );
  const gallery = galleryRowsResult[0];
  if (
    !gallery ||
    !["active", "selection_submitted"].includes(gallery.status) ||
    isGalleryExpired(gallery.expires_at, now)
  ) {
    return null;
  }

  return { sessionId: session.id, gallery, expiresAt: session.expires_at };
}

export async function revokeGallerySession(sessionId: string, galleryId: string) {
  await galleryRequest(
    `/rest/v1/client_gallery_sessions?id=eq.${encodeURIComponent(sessionId)}&gallery_id=eq.${encodeURIComponent(galleryId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    }
  );
}

export async function getGalleryImages(galleryId: string) {
  return galleryRows<ClientGalleryImage>(
    `client_gallery_images?gallery_id=eq.${encodeURIComponent(galleryId)}&select=id,gallery_id,filename,alt_text,sort_order,is_downloadable,created_at&order=sort_order.asc,created_at.asc`
  );
}

export async function getGallerySelections(galleryId: string) {
  return galleryRows<ClientGallerySelection>(
    `client_gallery_selections?gallery_id=eq.${encodeURIComponent(galleryId)}&select=gallery_id,image_id,selected_at&order=selected_at.asc`
  );
}

async function getScopedGalleryImage(galleryId: string, imageId: string) {
  const rows = await galleryRows<ClientGalleryImage>(
    `client_gallery_images?id=eq.${encodeURIComponent(imageId)}&gallery_id=eq.${encodeURIComponent(galleryId)}&select=id,gallery_id,storage_path,filename,alt_text,sort_order,is_downloadable,created_at&limit=1`
  );
  return rows[0] ?? null;
}

export async function createGalleryImageSignedUrl(galleryId: string, imageId: string) {
  const image = await getScopedGalleryImage(galleryId, imageId);
  if (!image) return null;

  const encodedPath = image.storage_path.split("/").map(encodeURIComponent).join("/");
  const response = await galleryRequest(
    `/storage/v1/object/sign/${PRIVATE_BUCKET}/${encodedPath}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: SIGNED_URL_SECONDS }),
    }
  );
  const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = payload.signedURL ?? payload.signedUrl;
  if (!signedPath) throw new Error("Private image URL was not created.");

  const { url } = getGalleryServerConfig();
  const signedUrl = signedPath.startsWith("http")
    ? signedPath
    : `${url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;

  return { image, signedUrl };
}

async function requireOpenGallery(galleryId: string, now = Date.now()) {
  const rows = await galleryRows<ClientGallery>(
    `client_galleries?id=eq.${encodeURIComponent(galleryId)}&select=${GALLERY_SELECT}&limit=1`
  );
  const gallery = rows[0];
  if (!gallery || gallery.status !== "active" || isGalleryExpired(gallery.expires_at, now)) {
    return null;
  }
  return gallery;
}

export async function saveGallerySelection(
  galleryId: string,
  imageId: string,
  selected: boolean
) {
  const gallery = await requireOpenGallery(galleryId);
  if (!gallery) return { ok: false as const, reason: "closed" as const };

  const image = await getScopedGalleryImage(galleryId, imageId);
  if (!image) return { ok: false as const, reason: "image" as const };

  if (selected) {
    const current = await getGallerySelections(galleryId);
    if (current.some((item) => item.image_id === imageId)) {
      return { ok: true as const, count: current.length };
    }
    if (gallery.selection_limit !== null && current.length >= gallery.selection_limit) {
      return { ok: false as const, reason: "limit" as const };
    }

    try {
      await galleryRequest("/rest/v1/client_gallery_selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({ gallery_id: galleryId, image_id: imageId }),
      });
    } catch {
      return { ok: false as const, reason: "rejected" as const };
    }
  } else {
    await galleryRequest(
      `/rest/v1/client_gallery_selections?gallery_id=eq.${encodeURIComponent(galleryId)}&image_id=eq.${encodeURIComponent(imageId)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } }
    );
  }

  const updated = await getGallerySelections(galleryId);
  return { ok: true as const, count: updated.length };
}

export async function finalizeGallerySelection(galleryId: string) {
  const gallery = await requireOpenGallery(galleryId);
  if (!gallery) return { ok: false as const, reason: "closed" as const };

  const selections = await getGallerySelections(galleryId);
  if (selections.length === 0) return { ok: false as const, reason: "empty" as const };

  const submittedAt = new Date().toISOString();
  const response = await galleryRequest(
    `/rest/v1/client_galleries?id=eq.${encodeURIComponent(galleryId)}&status=eq.active`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        status: "selection_submitted",
        selection_submitted_at: submittedAt,
        updated_at: submittedAt,
      }),
    }
  );
  const rows = (await response.json()) as ClientGallery[];
  return rows.length === 1
    ? { ok: true as const, submittedAt }
    : { ok: false as const, reason: "closed" as const };
}
