import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import type { ClientGallery, ClientGalleryImage, ClientGallerySelection } from "../../../../lib/gallery-types";
import GalleryImageUploader from "./GalleryImageUploader";
import GalleryAdminNav from "../GalleryAdminNav";

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
  const galleries = await supabaseGet<ClientGallery>(`client_galleries?id=eq.${encodeURIComponent(id)}&select=id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,selection_submitted_at,created_at,updated_at`, session.accessToken);
  const gallery = galleries[0];
  if (!gallery) return <main className="galleryAdminPage"><GalleryAdminNav /><section className="adminPanel adminEmptyState"><span>404</span><h1>Gallery not found</h1><p>This gallery may have been removed or is no longer available to your account.</p><Link href="/admin/galleries">Back to galleries</Link></section></main>;
  const images = await supabaseGet<ClientGalleryImage>(`client_gallery_images?gallery_id=eq.${encodeURIComponent(id)}&select=id,gallery_id,storage_path,filename,alt_text,sort_order,is_downloadable,created_at&order=sort_order.asc`, session.accessToken);
  const selections = await supabaseGet<ClientGallerySelection>(`client_gallery_selections?gallery_id=eq.${encodeURIComponent(id)}&select=gallery_id,image_id,selected_at&order=selected_at.asc`, session.accessToken);
  const selectedIds = new Set(selections.map((selection) => selection.image_id));
  const selectedImages = images.filter((image) => selectedIds.has(image.id));
  const workflowStage = gallery.status === "archived" ? 6 : gallery.status === "selection_submitted" ? 5 : gallery.status === "active" ? 3 : images.length ? 1 : 0;
  const workflow = ["Draft", "Upload images", "Activate", "Client selection", "Finalized", "Review / reopen", "Archive"];

  return (
    <main className="galleryAdminPage">
      <GalleryAdminNav />
      <section className="adminHero"><div><span className={`galleryStatus galleryStatus-${gallery.status}`}>{gallery.status.replaceAll("_", " ")}</span><h1>{gallery.title}</h1><p>{gallery.client_name} · /gallery/{gallery.slug}</p></div><Link href="/admin/galleries">All galleries</Link></section>
      <section className="galleryWorkflow" aria-label="Gallery delivery workflow">
        {workflow.map((step, index) => <div className={index <= workflowStage ? "isComplete" : ""} key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>)}
      </section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Private delivery</p><h2>Gallery workspace</h2></div></div>
        <dl className="adminDetailGrid"><div><dt>Client</dt><dd>{gallery.client_name}</dd></div><div><dt>Email</dt><dd>{gallery.client_email || "—"}</dd></div><div><dt>Event date</dt><dd>{gallery.event_date || "—"}</dd></div><div><dt>Selection limit</dt><dd>{gallery.selection_limit ?? "Unlimited"}</dd></div><div><dt>Selected</dt><dd>{selections.length}{gallery.selection_limit === null ? "" : ` / ${gallery.selection_limit}`}</dd></div><div><dt>Submission</dt><dd>{gallery.selection_submitted_at ? new Date(gallery.selection_submitted_at).toLocaleString() : "Not submitted"}</dd></div><div><dt>Downloads</dt><dd>{gallery.allow_downloads ? "Allowed" : "Disabled"}</dd></div><div><dt>Expires</dt><dd>{gallery.expires_at ? new Date(gallery.expires_at).toLocaleString() : "No expiry"}</dd></div></dl>
        {gallery.description ? <p>{gallery.description}</p> : null}
        <div className="adminActions">
          {gallery.status === "archived" ? <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="draft"/><button type="submit">Restore to draft</button></form> : gallery.status !== "active" ? <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="active"/><button className="adminPrimaryButton" type="submit" disabled={!images.length}>{gallery.status === "selection_submitted" ? "Reopen selections" : "Activate gallery"}</button></form> : <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="draft"/><button type="submit">Return to draft</button></form>}
          {gallery.status !== "archived" ? <form method="post" action={`/api/admin/galleries/${gallery.id}/status`}><input type="hidden" name="status" value="archived"/><button type="submit">Archive</button></form> : null}
          {["active", "selection_submitted"].includes(gallery.status) ? <Link className="adminPublicGalleryLink" href={`/gallery/${gallery.slug}`} target="_blank">Open client gallery ↗</Link> : null}
        </div>
      </section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Client choices</p><h2>{selectedImages.length} selected photo{selectedImages.length === 1 ? "" : "s"}</h2></div><span>{gallery.selection_submitted_at ? "Final submission" : "In progress"}</span></div>
        {selectedImages.length ? <div className="adminList">{selectedImages.map((image, index) => <div className="adminListItem" key={image.id}><div><strong>{String(index + 1).padStart(2, "0")} · {image.filename}</strong><span>Client-selected proof</span></div><span className="gallerySelectionBadge">Selected</span></div>)}</div> : <div className="adminEmptyState"><span>00</span><h3>No selections yet</h3><p>The client&apos;s chosen photographs will appear here as they review the gallery.</p></div>}
      </section>
      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Proofs</p><h2>{images.length} photo{images.length === 1 ? "" : "s"}</h2></div></div>
        <GalleryImageUploader galleryId={gallery.id} />
        {images.length ? <div className="galleryProofGrid">{images.map((image, index) => <article className="galleryProofCard" key={image.id}>
          {/* Authenticated thumbnail route returns a resized private image without exposing its path. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" src={`/api/admin/galleries/${gallery.id}/images/${image.id}/thumbnail`} alt={image.alt_text || image.filename} />
          <div><span>Proof {String(index + 1).padStart(2, "0")}</span><strong>{image.filename}</strong><small>{image.is_downloadable ? "Download approved" : "View only"} · Added {new Date(image.created_at).toLocaleDateString()}</small></div>
        </article>)}</div> : <div className="adminEmptyState"><span>00</span><h3>No photos yet</h3><p>Upload the first proof above. Files remain in the private client-galleries bucket.</p></div>}
      </section>
    </main>
  );
}
