import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../../lib/supabase";

const STATUSES = new Set(["draft", "active", "archived"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const form = await request.formData();
  const status = String(form.get("status") ?? "");
  if (!STATUSES.has(status)) return NextResponse.json({ error: "Invalid gallery status." }, { status: 400 });

  const { url, key } = getSupabasePublicConfig();
  const authenticatedHeaders = {
    apikey: key,
    Authorization: `Bearer ${session.accessToken}`,
  };

  if (status === "active") {
    const imageResponse = await fetch(
      `${url}/rest/v1/client_gallery_images?gallery_id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
      { headers: authenticatedHeaders, cache: "no-store" }
    );
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Unable to verify gallery images." }, { status: 502 });
    }
    const images = (await imageResponse.json()) as Array<{ id: string }>;
    if (images.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one image before activating this gallery." },
        { status: 409 }
      );
    }
  }

  const response = await fetch(`${url}/rest/v1/client_galleries?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...authenticatedHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return NextResponse.json({ error: "Unable to update gallery." }, { status: 502 });
  return NextResponse.redirect(new URL(`/admin/galleries/${id}`, request.url), 303);
}
