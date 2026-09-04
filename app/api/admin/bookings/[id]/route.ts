import { getAdminSession } from "../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../lib/supabase";

const allowedStatuses = new Set(["new", "contacted", "confirmed", "completed", "cancelled"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";
  if (!allowedStatuses.has(status)) return Response.json({ error: "Invalid booking status." }, { status: 400 });

  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/booking_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return Response.json({ error: "Could not update booking." }, { status: 400 });
  return Response.json(data?.[0] ?? data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/booking_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
  });
  if (!response.ok) return Response.json({ error: "Could not delete booking." }, { status: 400 });
  return Response.json({ ok: true });
}
