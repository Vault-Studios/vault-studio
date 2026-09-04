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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const form = await request.formData();
  const file = form.get("file");
  const altText = typeof form.get("alt_text") === "string" ? String(form.get("alt_text")).trim().slice(0, 300) : "";
  const makeCover = form.get("make_cover") === "true";

  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: "Use JPG, PNG, WebP or AVIF images." }, { status: 400 });
  if (file.size > maxBytes) return Response.json({ error: "Image must be 12 MB or smaller." }, { status: 400 });

  const { url, key } = getSupabasePublicConfig();
  const filename = safeFileName(file.name);
  const objectPath = `${id}/${filename}`;
  const upload = await fetch(`${url}/storage/v1/object/project-images/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
  });

  if (!upload.ok) {
    const details = await upload.json().catch(() => null);
    return Response.json({ error: details?.message || "Could not upload image. Check the project-images Storage policy." }, { status: 400 });
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
    await fetch(`${url}/storage/v1/object/project-images/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`, {
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
