import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import type { ClientGallery } from "../../../../lib/gallery-types";

async function getGallery(id: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/client_galleries?id=eq.${encodeURIComponent(id)}&select=id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,created_at,updated_at`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const rows = await response.json() as ClientGallery[];
  return rows[0] ?? null;
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const gallery = await getGallery(id, session.accessToken);

  if (!gallery) {
    return <main className="adminPage"><section className="adminPanel"><h1>Gallery not found</h1><Link href="/admin/galleries">Back to galleries</Link></section></main>;
  }

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div><p className="eyebrow">{gallery.status}</p><h1>{gallery.title}</h1><p>{gallery.client_name} · /gallery/{gallery.slug}</p></div>
        <Link href="/admin/galleries">All galleries</Link>
      </section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Private delivery</p><h2>Gallery workspace</h2></div></div>
        <dl className="adminDetailGrid">
          <div><dt>Client</dt><dd>{gallery.client_name}</dd></div>
          <div><dt>Email</dt><dd>{gallery.client_email || "—"}</dd></div>
          <div><dt>Event date</dt><dd>{gallery.event_date || "—"}</dd></div>
          <div><dt>Selection limit</dt><dd>{gallery.selection_limit ?? "Unlimited"}</dd></div>
          <div><dt>Downloads</dt><dd>{gallery.allow_downloads ? "Allowed" : "Disabled"}</dd></div>
          <div><dt>Expires</dt><dd>{gallery.expires_at ? new Date(gallery.expires_at).toLocaleString() : "No expiry"}</dd></div>
        </dl>
        {gallery.description ? <p>{gallery.description}</p> : null}
        <div className="adminEmptyState"><h3>Photos come next</h3><p>The gallery is private and saved as a draft. The next milestone adds direct private Storage uploads, ordering, activation, and the client link controls.</p></div>
      </section>
    </main>
  );
}
