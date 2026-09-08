import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../../../../lib/supabase";

type ImageRow = { storage_path: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, imageId } = await params;
  const { url, key } = getSupabasePublicConfig();
  const authenticatedHeaders = { apikey: key, Authorization: `Bearer ${session.accessToken}` };
  const imageResponse = await fetch(
    `${url}/rest/v1/client_gallery_images?id=eq.${encodeURIComponent(imageId)}&gallery_id=eq.${encodeURIComponent(id)}&select=storage_path&limit=1`,
    { headers: authenticatedHeaders, cache: "no-store" }
  );
  const images = imageResponse.ok ? await imageResponse.json() as ImageRow[] : [];
  const image = images[0];
  if (!image) return NextResponse.json({ error: "Image not found." }, { status: 404 });

  const encodedPath = image.storage_path.split("/").map(encodeURIComponent).join("/");
  const signResponse = await fetch(`${url}/storage/v1/object/sign/client-galleries/${encodedPath}`, {
    method: "POST",
    headers: { ...authenticatedHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 90, transform: { width: 480, height: 360, resize: "cover", quality: 70 } }),
    cache: "no-store",
  });
  const signed = await signResponse.json().catch(() => null) as { signedURL?: string; signedUrl?: string } | null;
  const signedPath = signed?.signedURL ?? signed?.signedUrl;
  if (!signResponse.ok || !signedPath) return NextResponse.json({ error: "Thumbnail unavailable." }, { status: 502 });
  const signedUrl = signedPath.startsWith("http")
    ? signedPath
    : `${url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
  const target = new URL(signedUrl);
  if (target.protocol !== "https:" || target.hostname !== new URL(url).hostname) {
    return NextResponse.json({ error: "Thumbnail unavailable." }, { status: 502 });
  }

  const upstream = await fetch(target, { redirect: "follow" });
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Thumbnail unavailable." }, { status: 502 });
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
    "Cache-Control": "private, max-age=60, no-transform",
    "X-Content-Type-Options": "nosniff",
  });
  return new Response(upstream.body, { status: 200, headers });
}
