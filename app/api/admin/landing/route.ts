import { getAdminSession } from "../../../../lib/admin-auth";
import { isLandingSlotKey, LANDING_SLOT_KEYS, type LandingSlotKey } from "../../../../lib/landing-media";
import { getSupabasePublicConfig } from "../../../../lib/supabase";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function adminFetch(path: string, accessToken: string, init?: RequestInit) {
  const { url, key } = getSupabasePublicConfig();
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
}

async function publishedProjectExists(projectId: string, accessToken: string) {
  const response = await adminFetch(
    `projects?id=eq.${encodeURIComponent(projectId)}&is_published=eq.true&select=id&limit=1`,
    accessToken,
  );
  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length === 1;
}

async function loadPublishedImage(imageId: string, accessToken: string) {
  const response = await adminFetch(
    `project_images?id=eq.${encodeURIComponent(imageId)}&select=id,project_id&limit=1`,
    accessToken,
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ id: string; project_id: string }>;
  const image = rows[0];
  if (!image || !(await publishedProjectExists(image.project_id, accessToken))) return null;
  return image;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const response = await adminFetch(
    "site_media_slots?select=slot_key,project_id,image_id,alt_text_en,alt_text_sw,sort_order,active,updated_at&order=sort_order.asc,slot_key.asc",
    session.accessToken,
  );
  if (!response.ok) return Response.json({ error: "Could not load landing page choices." }, { status: 502 });
  return Response.json(await response.json());
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slotKey = text(body?.slot_key, 80);
  if (!isLandingSlotKey(slotKey)) return Response.json({ error: "Unknown landing page slot." }, { status: 400 });

  let projectId = text(body?.project_id, 40) || null;
  let imageId = text(body?.image_id, 40) || null;

  if (slotKey === "featured_project") {
    imageId = null;
    if (!projectId || !uuidPattern.test(projectId) || !(await publishedProjectExists(projectId, session.accessToken))) {
      return Response.json({ error: "Choose a published project." }, { status: 400 });
    }
  } else {
    projectId = null;
    if (!imageId || !uuidPattern.test(imageId)) {
      return Response.json({ error: "Choose an image from a published project." }, { status: 400 });
    }
    const image = await loadPublishedImage(imageId, session.accessToken);
    if (!image) return Response.json({ error: "That image is no longer available on a published project." }, { status: 400 });
    projectId = image.project_id;
  }

  const payload = {
    slot_key: slotKey,
    project_id: projectId,
    image_id: imageId,
    alt_text_en: text(body?.alt_text_en) || null,
    alt_text_sw: text(body?.alt_text_sw) || null,
    sort_order: LANDING_SLOT_KEYS.indexOf(slotKey as LandingSlotKey),
    active: true,
    updated_at: new Date().toISOString(),
  };

  const response = await adminFetch(
    "site_media_slots?on_conflict=slot_key",
    session.accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) return Response.json({ error: "Could not save this landing page choice." }, { status: 400 });
  const rows = await response.json().catch(() => []);
  return Response.json(rows?.[0] ?? payload);
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const slotKey = new URL(request.url).searchParams.get("slot_key") || "";
  if (!isLandingSlotKey(slotKey)) return Response.json({ error: "Unknown landing page slot." }, { status: 400 });

  const response = await adminFetch(
    `site_media_slots?slot_key=eq.${encodeURIComponent(slotKey)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!response.ok) return Response.json({ error: "Could not reset this landing page choice." }, { status: 400 });
  return Response.json({ ok: true });
}
