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
  const response = await fetch(`${url}/rest/v1/client_galleries?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return NextResponse.json({ error: "Unable to update gallery." }, { status: 502 });
  return NextResponse.redirect(new URL(`/admin/galleries/${id}`, request.url), 303);
}
