import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import type { ClientGallery, ClientGalleryImage } from "../../../../lib/gallery-types";
import GalleryImageUploader from "./GalleryImageUploader";

async function supabaseGet<T>(path: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) return [] as T[];
  return response.json() as Promise<T[]>;
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const galleries = await supabaseGet<ClientGallery>(`client_galleries?id=eq.${encodeURIComponent(id)}&select=id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,created_at,updated_at`, session.accessToken);
  const gallery = galleries[0];
  if (!gallery) return <main className="adminPage"><section className="adminPanel"><h1>Gallery not found</h1><Link href="/admin/galleries">Back to galleries</Link></section></main>;
  const images = await supabaseGet<ClientGalleryImage>(`client_gallery_images?gallery_id=eq.${encodeURIComponent(id)}&select=id,gallery_id,storage_path,filename,alt_text,sort_order,is_downloadable,created_at&order=sort_order.asc`, session.accessToken);

  return (
    <main className="adminPage">
      <section className="adminHero"><div><p className="eyebrow">{gallery.status}</p><h1>{gallery.title}</h1><p>{gallery.client_name} · /gallery/{gallery.slug}</p></div><Link href="/admin/galleries">All galleries</Link></section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Private delivery</p><h2>Gallery workspace</h2></div></div>
        <dl className="adminDetailGrid"><div><dt>Client</dt><dd>{gallery.client_name}</dd></div><div><dt>Email</dt><dd>{gallery.client_email || "—"}</dd></div><div><dt>Event date</dt><dd>{gallery.event_date || "—"}</dd></div><div><dt>Selection limit</dt><dd>{gallery.selection_limit ?? "Unlimited"}</dd></div><div><dt>Downloads</dt><dd>{gallery.allow_downloads ? "Allowed" : "Disabled"}</dd></div><div><dt>Expires</dt><dd>{gallery.expires_at ? new Date(gallery.expires_at).toLocaleString() : "No expiry"}</dd></div></dl>
        {gallery.description ? <p>{gallery.description}</p> : null}
        <div className="adminActions">
          {gallery.status !== "active" ? <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="active"/><button className="adminPrimaryButton" type="submit" disabled={!images.length}>Activate gallery</button></form> : <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="draft"/><button type="submit">Return to draft</button></form>}
          {gallery.status !== "archived" ? <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="archived"/><button type="submit">Archive</button></form> : null}
          {gallery.status === "active" ? <code>/gallery/{gallery.slug}</code> : null}
        </div>
      </section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Proofs</p><h2>{images.length} photo{images.length === 1 ? "" : "s"}</h2></div></div>
        <GalleryImageUploader galleryId={gallery.id} />
        {images.length ? <div className="adminList">{images.map((image, index) => <div className="adminListItem" key={image.id}><div><strong>{String(index + 1).padStart(2, "0")} · {image.filename}</strong><span>Private Storage · {image.is_downloadable ? "downloadable" : "view only"}</span></div></div>)}</div> : <div className="adminEmptyState"><h3>No photos yet</h3><p>Upload the first proof above. Files remain in the private client-galleries bucket.</p></div>}
      </section>
    </main>
  );
}
