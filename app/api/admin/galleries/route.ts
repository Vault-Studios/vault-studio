import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { hashGalleryPin } from "../../../../lib/gallery-security";
import { getSupabasePublicConfig } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const clientName = String(form.get("client_name") ?? "").trim();
  const clientEmail = String(form.get("client_email") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const pin = String(form.get("pin") ?? "");
  const eventDate = String(form.get("event_date") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim();
  const expiresInput = String(form.get("expires_at") ?? "").trim();
  const selectionInput = String(form.get("selection_limit") ?? "").trim();

  if (!title || !clientName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Invalid gallery details." }, { status: 400 });
  }

  const selectionLimit = selectionInput ? Number(selectionInput) : null;
  if (selectionLimit !== null && (!Number.isInteger(selectionLimit) || selectionLimit < 1)) {
    return NextResponse.json({ error: "Selection limit must be a positive integer." }, { status: 400 });
  }

  let pinHash: string;
  try { pinHash = hashGalleryPin(pin); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid PIN." }, { status: 400 }); }

  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/client_galleries`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      title,
      client_name: clientName,
      client_email: clientEmail,
      slug,
      pin_hash: pinHash,
      event_date: eventDate,
      description,
      selection_limit: selectionLimit,
      allow_downloads: form.get("allow_downloads") === "on",
      expires_at: expiresInput ? new Date(expiresInput).toISOString() : null,
      status: "draft",
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: response.status === 409 ? "That gallery slug is already in use." : "Unable to create gallery." }, { status: response.status === 409 ? 409 : 502 });
  }

  const rows = await response.json() as Array<{ id: string }>;
  const gallery = rows[0];
  if (!gallery) return NextResponse.json({ error: "Gallery was not returned after creation." }, { status: 502 });

  return NextResponse.redirect(new URL(`/admin/galleries/${gallery.id}`, request.url), 303);
}
