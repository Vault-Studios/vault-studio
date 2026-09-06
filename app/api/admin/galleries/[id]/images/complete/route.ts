import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../../../lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { path?: string; filename?: string; altText?: string };
  const path = String(body.path ?? "");
  if (!path.startsWith(`${id}/`) || !body.filename) return NextResponse.json({ error: "Invalid upload metadata." }, { status: 400 });

  const { url, key } = getSupabasePublicConfig();
  const existing = await fetch(`${url}/rest/v1/client_gallery_images?gallery_id=eq.${encodeURIComponent(id)}&select=sort_order&order=sort_order.desc&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` } });
  const rows = existing.ok ? await existing.json() as Array<{ sort_order: number }> : [];
  const sortOrder = (rows[0]?.sort_order ?? -1) + 1;

  const response = await fetch(`${url}/rest/v1/client_gallery_images`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ gallery_id: id, storage_path: path, filename: body.filename, alt_text: String(body.altText ?? ""), sort_order: sortOrder }),
  });
  if (!response.ok) return NextResponse.json({ error: "Unable to register uploaded image." }, { status: 502 });
  const inserted = await response.json();
  return NextResponse.json({ image: inserted[0] });
}
