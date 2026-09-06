import { NextResponse } from "next/server";
import { createGalleryImageSignedUrl } from "../../../../../lib/gallery-server";
import { getGallerySession } from "../../../../../lib/gallery-session";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; imageId: string }> }) {
  const { slug, imageId } = await params;
  try {
    const session = await getGallerySession(slug);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const signed = await createGalleryImageSignedUrl(session.gallery.id, imageId);
    if (!signed) return NextResponse.json({ error: "Image not found." }, { status: 404 });

    const upstream = await fetch(signed.signedUrl, { redirect: "follow" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Image unavailable." }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
    headers.set("Cache-Control", "private, max-age=60, no-transform");
    headers.set("X-Content-Type-Options", "nosniff");
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Image unavailable." }, { status: 503 });
  }
}
