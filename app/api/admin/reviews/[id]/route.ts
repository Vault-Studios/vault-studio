import { getAdminSession } from "../../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../../lib/supabase";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";
  if (!new Set(["pending", "approved", "rejected"]).has(status)) {
    return Response.json({ error: "Invalid review status." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();
  const headers = { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };

  const sourceResponse = await fetch(`${url}/rest/v1/review_submissions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers, cache: "no-store" });
  const sourceRows = await sourceResponse.json().catch(() => []);
  const source = sourceRows?.[0];
  if (!sourceResponse.ok || !source) return Response.json({ error: "Review not found." }, { status: 404 });

  if (status === "approved") {
    const publicResponse = await fetch(`${url}/rest/v1/reviews_public?on_conflict=source_submission_id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        source_submission_id: source.id,
        name: source.name,
        company: source.company,
        project: source.project,
        rating: source.rating,
        review: source.review,
        approved_at: new Date().toISOString(),
      }),
    });
    if (!publicResponse.ok) return Response.json({ error: "Could not publish review." }, { status: 400 });
  } else {
    await fetch(`${url}/rest/v1/reviews_public?source_submission_id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });
  }

  const updateResponse = await fetch(`${url}/rest/v1/review_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ status, approved_at: status === "approved" ? new Date().toISOString() : null }),
  });
  const updated = await updateResponse.json().catch(() => null);
  if (!updateResponse.ok) return Response.json({ error: "Could not update review." }, { status: 400 });
  return Response.json(updated?.[0] ?? updated);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/review_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
  });
  if (!response.ok) return Response.json({ error: "Could not delete review." }, { status: 400 });
  return Response.json({ ok: true });
}
