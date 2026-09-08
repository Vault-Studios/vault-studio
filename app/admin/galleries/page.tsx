import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../lib/supabase";
import type { ClientGallery } from "../../../lib/gallery-types";
import GalleryAdminNav from "./GalleryAdminNav";

type GalleryImageRow = { id: string; gallery_id: string };
type GallerySelectionRow = { gallery_id: string; image_id: string };

async function getRows<T>(path: string, accessToken: string): Promise<T[]> {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json() as Promise<T[]>;
}

export default async function AdminGalleriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const [galleries, images, selections] = await Promise.all([
    getRows<ClientGallery>("client_galleries?select=id,slug,title,client_name,client_email,event_date,description,status,selection_limit,allow_downloads,expires_at,selection_submitted_at,created_at,updated_at&order=created_at.desc", session.accessToken),
    getRows<GalleryImageRow>("client_gallery_images?select=id,gallery_id", session.accessToken),
    getRows<GallerySelectionRow>("client_gallery_selections?select=gallery_id,image_id", session.accessToken),
  ]);
  const imageCounts = new Map<string, number>();
  const selectionCounts = new Map<string, number>();
  images.forEach((image) => imageCounts.set(image.gallery_id, (imageCounts.get(image.gallery_id) || 0) + 1));
  selections.forEach((selection) => selectionCounts.set(selection.gallery_id, (selectionCounts.get(selection.gallery_id) || 0) + 1));

  return (
    <main className="galleryAdminPage">
      <GalleryAdminNav />
      <section className="adminHero">
        <div><p className="eyebrow">Client delivery</p><h1>Private galleries</h1><p>Create secure client galleries, upload proofs, and review final photo selections.</p></div>
        <Link className="adminPrimaryButton" href="/admin/galleries/new">New gallery</Link>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeader"><div><p className="eyebrow">Gallery manager</p><h2>Client galleries</h2></div></div>
        {galleries.length ? (
          <div className="galleryManagerGrid">
            {galleries.map((gallery) => {
              const imageCount = imageCounts.get(gallery.id) || 0;
              const selectionCount = selectionCounts.get(gallery.id) || 0;
              return (
                <article className="galleryManagerCard" key={gallery.id}>
                  <div className="galleryManagerCardTop">
                    <span className={`galleryStatus galleryStatus-${gallery.status}`}>{gallery.status.replaceAll("_", " ")}</span>
                    <span>{new Date(gallery.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="galleryManagerCardTitle">
                    <p>{gallery.client_name}</p>
                    <h3>{gallery.title}</h3>
                    <code>/gallery/{gallery.slug}</code>
                  </div>
                  <dl className="galleryManagerMetrics">
                    <div><dt>Proofs</dt><dd>{imageCount}</dd></div>
                    <div><dt>Selected</dt><dd>{selectionCount}{gallery.selection_limit === null ? "" : ` / ${gallery.selection_limit}`}</dd></div>
                    <div><dt>Expiry</dt><dd>{gallery.expires_at ? new Date(gallery.expires_at).toLocaleDateString() : "None"}</dd></div>
                  </dl>
                  <Link className="galleryManageLink" href={`/admin/galleries/${gallery.id}`}>Open workspace <span aria-hidden="true">→</span></Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="adminEmptyState"><h3>No galleries created yet</h3><p>Your first private client gallery will appear here with its status and selection progress.</p><Link href="/admin/galleries/new">Create first gallery</Link></div>
        )}
      </section>
    </main>
  );
}
