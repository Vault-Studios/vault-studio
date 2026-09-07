import { NextResponse } from "next/server";
import {
  digestGalleryClient,
  digestGallerySessionToken,
  generateGallerySessionToken,
  verifyGalleryPin,
} from "../../../../lib/gallery-security";
import { isGalleryExpired } from "../../../../lib/gallery-types";
import {
  clearGalleryUnlockFailures,
  createGallerySession,
  getGalleryForPinVerification,
  getGalleryUnlockAttempt,
  registerGalleryUnlockFailure,
} from "../../../../lib/gallery-server";
import {
  GALLERY_SESSION_COOKIE,
  GALLERY_SESSION_SECONDS,
  galleryCookiePath,
  requestIsSameOrigin,
} from "../../../../lib/gallery-session";

const DUMMY_PIN_HASH =
  "scrypt$ad3a0af296be5c428776ae917e75fd39$ecb3b9aca33e2811ae3f5cc4e65cfd054171d434f50e3493be7047176d671b0e";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  let body: { pin?: unknown };
  try { body = await request.json() as { pin?: unknown }; }
  catch { return NextResponse.json({ error: "Enter a valid gallery PIN." }, { status: 400 }); }

  const { slug } = await params;
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || pin.trim().length < 4 || pin.length > 32) {
    return NextResponse.json({ error: "Enter a valid gallery PIN." }, { status: 400 });
  }

  try {
    const gallery = await getGalleryForPinVerification(slug);
    const candidateHash = gallery?.pin_hash ?? DUMMY_PIN_HASH;
    const clientDigest = digestGalleryClient(
      slug,
      request.headers.get("cf-connecting-ip")?.trim() || "unknown"
    );
    const unlockAttempt = gallery
      ? await getGalleryUnlockAttempt(gallery.id, clientDigest)
      : null;
    const isLocked = Boolean(
      unlockAttempt?.locked_until && new Date(unlockAttempt.locked_until).getTime() > Date.now()
    );
    const pinMatches = verifyGalleryPin(pin, candidateHash);
    const accessible = Boolean(
      gallery && gallery.status === "active" && !isGalleryExpired(gallery.expires_at)
    );

    if (isLocked) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    if (!pinMatches || !accessible || !gallery) {
      if (gallery && accessible) {
        const failed = await registerGalleryUnlockFailure(gallery.id, clientDigest);
        if (failed.locked_until && new Date(failed.locked_until).getTime() > Date.now()) {
          return NextResponse.json(
            { error: "Too many attempts. Try again later." },
            { status: 429, headers: { "Retry-After": "900" } }
          );
        }
      }
      return NextResponse.json({ error: "Gallery or PIN not recognized." }, { status: 401 });
    }

    await clearGalleryUnlockFailures(gallery.id, clientDigest);
    const token = generateGallerySessionToken();
    const expiresAt = new Date(Date.now() + GALLERY_SESSION_SECONDS * 1000).toISOString();
    await createGallerySession(gallery.id, digestGallerySessionToken(token), expiresAt);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(GALLERY_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: galleryCookiePath(gallery.slug),
      maxAge: GALLERY_SESSION_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Private gallery access is temporarily unavailable." }, { status: 503 });
  }
}
