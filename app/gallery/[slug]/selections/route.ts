import { NextResponse } from "next/server";
import { saveGallerySelection } from "../../../../lib/gallery-server";
import { getGallerySession, requestIsSameOrigin } from "../../../../lib/gallery-session";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const { slug } = await params;
  let body: { imageId?: unknown; selected?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return NextResponse.json({ error: "Invalid selection request." }, { status: 400 }); }
  if (typeof body.imageId !== "string" || !UUID_PATTERN.test(body.imageId) || typeof body.selected !== "boolean") {
    return NextResponse.json({ error: "Invalid selection request." }, { status: 400 });
  }

  try {
    const session = await getGallerySession(slug);
    if (!session) return NextResponse.json({ error: "Gallery session expired." }, { status: 401 });
    const result = await saveGallerySelection(session.gallery.id, body.imageId, body.selected);
    if (!result.ok) {
      if (result.reason === "limit") return NextResponse.json({ error: "Selection limit reached." }, { status: 409 });
      if (result.reason === "image") return NextResponse.json({ error: "Image not found in this gallery." }, { status: 404 });
      return NextResponse.json({ error: "Selections are closed for this gallery." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, count: result.count });
  } catch {
    return NextResponse.json({ error: "Unable to update your selection." }, { status: 503 });
  }
}
