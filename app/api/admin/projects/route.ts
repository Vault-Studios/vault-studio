import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";

function clean(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/projects?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return Response.json({ error: "Could not load projects." }, { status: 502 });
  return Response.json(await response.json());
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const title = clean(body.title, 180);
  const slug = slugify(clean(body.slug, 140) || title);
  if (!title || !slug) return Response.json({ error: "Title is required." }, { status: 400 });

  const payload = {
    slug,
    title,
    client_name: clean(body.client_name, 180),
    category: clean(body.category, 120),
    location: clean(body.location, 180),
    project_date: clean(body.project_date, 20) || null,
    summary: clean(body.summary, 1000),
    description: clean(body.description, 8000),
    cover_image_url: clean(body.cover_image_url, 2000) || null,
    is_published: body.is_published === true,
  };

  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/projects`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.code === "23505" ? "That project slug is already in use." : "Could not create project.";
    return Response.json({ error: message }, { status: 400 });
  }

  return Response.json(data?.[0] ?? data, { status: 201 });
}
