import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import ProjectForm from "../ProjectForm";
import DeleteProjectButton from "./DeleteProjectButton";

async function loadProject(id: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const rows = await response.json() as Array<any>;
  return rows[0] ?? null;
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const project = await loadProject(id, session.accessToken);
  if (!project) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <Link href="/admin/projects" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Projects</Link>
      <div style={{ margin: "10px 0 28px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>{project.is_published ? "Published" : "Draft"}</p>
        <h1 style={{ margin: 0, fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>Edit project</h1>
      </div>
      <ProjectForm project={project} />
      <DeleteProjectButton id={project.id} />
    </main>
  );
}
