import { NextResponse } from "next/server";
import { finalizeGallerySelection } from "../../../../lib/gallery-server";
import { getGallerySession, requestIsSameOrigin } from "../../../../lib/gallery-session";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await getGallerySession(slug);
    if (!session) return NextResponse.json({ error: "Gallery session expired." }, { status: 401 });
    const result = await finalizeGallerySelection(session.gallery.id);
    if (!result.ok) {
      const message = result.reason === "empty"
        ? "Select at least one photograph before submitting."
        : "Selections are already closed for this gallery.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ ok: true, submittedAt: result.submittedAt });
  } catch {
    return NextResponse.json({ error: "Unable to submit your selections." }, { status: 503 });
  }
}
