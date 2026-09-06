export type GalleryStatus = "draft" | "active" | "selection_submitted" | "archived";

export type ClientGallery = {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  client_email: string;
  event_date: string | null;
  description: string;
  status: GalleryStatus;
  selection_limit: number | null;
  allow_downloads: boolean;
  expires_at: string | null;
  selection_submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientGallerySelection = {
  gallery_id: string;
  image_id: string;
  selected_at: string;
};

export type ClientGalleryImage = {
  id: string;
  gallery_id: string;
  storage_path: string;
  filename: string;
  alt_text: string;
  sort_order: number;
  is_downloadable: boolean;
  created_at: string;
};

export function galleryClientPath(slug: string) {
  return `/gallery/${encodeURIComponent(slug)}`;
}

export function isGalleryExpired(expiresAt: string | null, now = Date.now()) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= now);
}
