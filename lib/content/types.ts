import type { Locale } from "../i18n";

export type ProjectGalleryItem = { src: string; alt: string; caption: string };
export type Project = {
  slug: string;
  locale: Locale;
  client: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  location: string;
  services: string;
  coverImage: string;
  gallery: ProjectGalleryItem[];
  sourceUrl?: string;
  video: { streamUid?: string; mp4?: string; poster: string; duration?: string };
};
