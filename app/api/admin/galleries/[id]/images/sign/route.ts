import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../../../lib/supabase";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 15 * 1024 * 1024;

function safeFilename(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "image.jpg";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { filename?: string; contentType?: string; size?: number };
  const filename = safeFilename(body.filename ?? "");
  const contentType = body.contentType ?? "";
  const size = Number(body.size ?? 0);
  if (!ALLOWED_TYPES.has(contentType) || !Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image up to 15 MB." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();
  const galleryCheck = await fetch(`${url}/rest/v1/client_galleries?id=eq.${encodeURIComponent(id)}&select=id`, { headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` } });
  const galleries = galleryCheck.ok ? await galleryCheck.json() as Array<{ id: string }> : [];
  if (!galleries[0]) return NextResponse.json({ error: "Gallery not found." }, { status: 404 });

  const objectPath = `${id}/${crypto.randomUUID()}-${filename}`;
  const signResponse = await fetch(`${url}/storage/v1/object/upload/sign/client-galleries/${objectPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ upsert: false }),
  });
  if (!signResponse.ok) return NextResponse.json({ error: "Unable to authorize upload." }, { status: 502 });
  const signed = await signResponse.json() as { url?: string; token?: string };
  return NextResponse.json({ path: objectPath, filename, signedUrl: signed.url, token: signed.token });
}
