import { getAdminSession } from "../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../lib/supabase";

export async function DELETE(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { imageId } = await context.params;
  const { url, key } = getSupabasePublicConfig();
  const lookup = await fetch(`${url}/rest/v1/project_images?id=eq.${encodeURIComponent(imageId)}&select=id,image_url&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const rows = await lookup.json().catch(() => []);
  const image = rows?.[0];
  if (!lookup.ok || !image) return Response.json({ error: "Image not found." }, { status: 404 });

  const marker = "/storage/v1/object/public/project-images/";
  const objectPath = typeof image.image_url === "string" && image.image_url.includes(marker)
    ? image.image_url.split(marker)[1]
    : null;

  if (objectPath) {
    const storageDelete = await fetch(`${url}/storage/v1/object/project-images/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
    });
    if (!storageDelete.ok) return Response.json({ error: "Could not delete the stored file." }, { status: 400 });
  }

  const removeMetadata = await fetch(`${url}/rest/v1/project_images?id=eq.${encodeURIComponent(imageId)}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
  });
  if (!removeMetadata.ok) return Response.json({ error: "Could not delete image metadata." }, { status: 400 });
  return Response.json({ ok: true });
}
