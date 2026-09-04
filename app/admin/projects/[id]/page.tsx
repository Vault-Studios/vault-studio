import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import ProjectForm from "../ProjectForm";
import DeleteProjectButton from "./DeleteProjectButton";
import ProjectImages from "./ProjectImages";

type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  category: string;
  location: string;
  project_date: string | null;
  summary: string;
  description: string;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

async function loadProject(id: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const rows = await response.json() as ProjectRecord[];
  return rows[0] ?? null;
}

async function loadImages(id: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/project_images?project_id=eq.${encodeURIComponent(id)}&select=id,image_url,alt_text,sort_order&order=sort_order.asc,created_at.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return await response.json() as Array<{ id: string; image_url: string; alt_text: string; sort_order: number }>;
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const [project, images] = await Promise.all([
    loadProject(id, session.accessToken),
    loadImages(id, session.accessToken),
  ]);
  if (!project) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <Link href="/admin/projects" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Projects</Link>
      <div style={{ margin: "10px 0 28px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>{project.is_published ? "Published" : "Draft"}</p>
        <h1 style={{ margin: 0, fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>Edit project</h1>
      </div>
      <ProjectForm project={project} />
      <ProjectImages projectId={project.id} images={images} />
      <DeleteProjectButton id={project.id} />
    </main>
  );
}
