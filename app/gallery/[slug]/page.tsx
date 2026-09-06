import type { Metadata } from "next";
import { getGalleryImages, getGallerySelections } from "../../../lib/gallery-server";
import { getGallerySession } from "../../../lib/gallery-session";
import ClientGalleryViewer from "./ClientGalleryViewer";
import GalleryPinForm from "./GalleryPinForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Client Gallery",
  description: "Secure private photography delivery from Vault Studio.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ClientGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let session = null;
  try { session = await getGallerySession(slug); } catch { session = null; }
  if (!session) return <GalleryPinForm slug={slug} />;

  const [images, selections] = await Promise.all([
    getGalleryImages(session.gallery.id),
    getGallerySelections(session.gallery.id),
  ]);

  return (
    <ClientGalleryViewer
      slug={session.gallery.slug}
      title={session.gallery.title}
      clientName={session.gallery.client_name}
      description={session.gallery.description}
      eventDate={session.gallery.event_date}
      images={images.map(({ id, filename, alt_text, sort_order }) => ({ id, filename, alt_text, sort_order }))}
      initialSelections={selections.map((selection) => selection.image_id)}
      selectionLimit={session.gallery.selection_limit}
      submittedAt={session.gallery.selection_submitted_at}
    />
  );
}
