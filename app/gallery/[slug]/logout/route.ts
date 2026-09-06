import { NextResponse } from "next/server";
import { revokeGallerySession } from "../../../../lib/gallery-server";
import {
  GALLERY_SESSION_COOKIE,
  galleryCookiePath,
  getGallerySession,
  requestIsSameOrigin,
} from "../../../../lib/gallery-session";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await getGallerySession(slug);
    if (session) await revokeGallerySession(session.sessionId, session.gallery.id);
  } catch {
    // Always clear the browser token; server-side revocation remains best effort.
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GALLERY_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: galleryCookiePath(slug),
    maxAge: 0,
  });
  return response;
}
