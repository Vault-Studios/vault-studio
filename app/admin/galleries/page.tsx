import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../lib/supabase";
import type { ClientGallery } from "../../../lib/gallery-types";

async function getGalleries(accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/client_galleries?select=id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,selection_submitted_at,created_at,updated_at&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json() as Promise<ClientGallery[]>;
}

export default async function AdminGalleriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const galleries = await getGalleries(session.accessToken);

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div><p className="eyebrow">Client delivery</p><h1>Private galleries</h1><p>Create secure client galleries, upload proofs, and review final photo selections.</p></div>
        <Link className="adminPrimaryButton" href="/admin/galleries/new">New gallery</Link>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Gallery manager</p><h2>Client galleries</h2></div></div>
        {galleries.length ? (
          <div className="adminList">
            {galleries.map((gallery) => (
              <Link className="adminListItem" href={`/admin/galleries/${gallery.id}`} key={gallery.id}>
                <div><strong>{gallery.title}</strong><span>{gallery.client_name} · /gallery/{gallery.slug}</span></div>
                <span>{gallery.status.replaceAll("_", " ")}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="adminEmptyState"><h3>No galleries created yet</h3><p>Your first private client gallery will appear here with its status and selection progress.</p><Link href="/admin/galleries/new">Create first gallery</Link></div>
        )}
      </section>
    </main>
  );
}
