import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../lib/supabase";

async function loadProjects(accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/projects?select=id,title,slug,client_name,category,location,project_date,is_published,created_at&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return await response.json() as Array<any>;
}

export default async function ProjectsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const projects = await loadProjects(session.accessToken);

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div>
          <Link href="/admin" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Dashboard</Link>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>Projects</h1>
        </div>
        <Link href="/admin/projects/new" style={{ background: "white", color: "black", padding: "12px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}>+ New project</Link>
      </div>

      {projects.length === 0 ? (
        <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 28, opacity: .8 }}>
          No projects yet. Create the first Vault portfolio project.
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", padding: 20, border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, color: "inherit", textDecoration: "none", background: "rgba(255,255,255,.02)" }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 20, fontWeight: 500 }}>{project.title}</strong>
                  <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", opacity: .7 }}>{project.is_published ? "Published" : "Draft"}</span>
                </div>
                <p style={{ margin: "8px 0 0", opacity: .55, fontSize: 14 }}>{[project.client_name, project.category, project.location].filter(Boolean).join(" · ") || project.slug}</p>
              </div>
              <span style={{ opacity: .45 }}>Edit →</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
