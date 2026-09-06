import "server-only";

import { cookies } from "next/headers";
import { digestGallerySessionToken } from "./gallery-security";
import { getAuthorizedGallerySession } from "./gallery-server";

export const GALLERY_SESSION_COOKIE = "vault_gallery_session";
export const GALLERY_SESSION_SECONDS = 4 * 60 * 60;

export function isGallerySessionToken(value: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

export async function getGallerySession(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(GALLERY_SESSION_COOKIE)?.value ?? "";
  if (!isGallerySessionToken(token)) return null;

  return getAuthorizedGallerySession(slug, digestGallerySessionToken(token));
}

export function galleryCookiePath(slug: string) {
  return `/gallery/${encodeURIComponent(slug)}`;
}

export function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
