import { getAdminSession } from "../../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../../lib/supabase";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxBytes = 12 * 1024 * 1024;

function safeFileName(name: string) {
  const parts = name.toLowerCase().split(".");
  const ext = parts.length > 1 ? parts.pop()!.replace(/[^a-z0-9]/g, "") : "jpg";
  const base = parts.join("-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "image";
  return `${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

type SignPayload = {
  action: "sign";
  file_name?: string;
  content_type?: string;
  size?: number;
};

type CompletePayload = {
  action: "complete";
  object_path?: string;
  alt_text?: string;
  make_cover?: boolean;
};

type Payload = SignPayload | CompletePayload;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Payload | null;
  if (!body || (body.action !== "sign" && body.action !== "complete")) {
    return Response.json({ error: "Invalid image request." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();

  if (body.action === "sign") {
    const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
    const contentType = typeof body.content_type === "string" ? body.content_type : "";
    const size = typeof body.size === "number" ? body.size : 0;

    if (!fileName) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
    if (!allowedTypes.has(contentType)) return Response.json({ error: "Use JPG, PNG, WebP or AVIF images." }, { status: 400 });
    if (!Number.isFinite(size) || size <= 0) return Response.json({ error: "Image file is empty." }, { status: 400 });
    if (size > maxBytes) return Response.json({ error: "Image must be 12 MB or smaller." }, { status: 400 });

    const objectPath = `${id}/${safeFileName(fileName)}`;
    const encodedPath = encodeURIComponent(objectPath).replace(/%2F/g, "/");
    const signed = await fetch(`${url}/storage/v1/object/upload/sign/project-images/${encodedPath}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });

    const signedData = await signed.json().catch(() => null) as { url?: string; message?: string } | null;
    if (!signed.ok || !signedData?.url) {
      return Response.json({ error: signedData?.message || "Could not prepare image upload. Check the project-images Storage policy." }, { status: 400 });
    }

    const signedUrl = signedData.url.startsWith("http")
      ? signedData.url
      : `${url}/storage/v1${signedData.url}`;

    return Response.json({ object_path: objectPath, signed_url: signedUrl });
  }

  const objectPath = typeof body.object_path === "string" ? body.object_path.trim() : "";
  const altText = typeof body.alt_text === "string" ? body.alt_text.trim().slice(0, 300) : "";
  const makeCover = body.make_cover === true;

  if (!objectPath || !objectPath.startsWith(`${id}/`) || objectPath.includes("..")) {
    return Response.json({ error: "Invalid uploaded image path." }, { status: 400 });
  }

  const publicUrl = `${url}/storage/v1/object/public/project-images/${objectPath}`;
  const existing = await fetch(`${url}/rest/v1/project_images?project_id=eq.${encodeURIComponent(id)}&select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, Prefer: "count=exact" },
    cache: "no-store",
  });
  const range = existing.headers.get("content-range");
  const count = Number(range?.split("/")[1] ?? 0) || 0;

  const insert = await fetch(`${url}/rest/v1/project_images`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ project_id: id, image_url: publicUrl, alt_text: altText, sort_order: count }),
  });

  const rows = await insert.json().catch(() => null);
  if (!insert.ok) {
    const encodedPath = encodeURIComponent(objectPath).replace(/%2F/g, "/");
    await fetch(`${url}/storage/v1/object/project-images/${encodedPath}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => null);
    return Response.json({ error: "Image uploaded but gallery metadata could not be saved." }, { status: 400 });
  }

  if (makeCover) {
    await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cover_image_url: publicUrl, updated_at: new Date().toISOString() }),
    });
  }

  return Response.json(rows?.[0] ?? rows, { status: 201 });
}
