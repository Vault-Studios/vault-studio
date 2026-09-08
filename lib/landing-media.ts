import type { Project } from "./content/types";
import type { Locale } from "./i18n";
import { resolveLandingImageValue, resolveLandingProjectValue } from "./landing-media-resolver.js";
import { supabaseRest } from "./supabase";

export const LANDING_SLOT_KEYS = [
  "hero",
  "service_photography",
  "service_film",
  "service_commercial",
  "parallax_1",
  "parallax_2",
  "parallax_3",
  "studio_story",
  "featured_project",
  "featured_takeover_image",
  "closing_background",
] as const;

export type LandingSlotKey = (typeof LANDING_SLOT_KEYS)[number];

export type LandingMediaSlot = {
  slot_key: LandingSlotKey;
  project_id: string | null;
  image_id: string | null;
  alt_text_en: string | null;
  alt_text_sw: string | null;
  sort_order: number;
  active: boolean;
  updated_at?: string;
};

export type ResolvedLandingImage = {
  src: string;
  alt: string;
  sourceLabel?: string;
  projectId?: string;
  imageId?: string;
};

const PUBLIC_SLOT_FIELDS = "slot_key,project_id,image_id,alt_text_en,alt_text_sw,sort_order,active,updated_at";

export function isLandingSlotKey(value: string): value is LandingSlotKey {
  return (LANDING_SLOT_KEYS as readonly string[]).includes(value);
}

export async function getPublicLandingMediaSlots(): Promise<LandingMediaSlot[]> {
  try {
    const response = await supabaseRest(
      `site_media_slots?active=eq.true&select=${PUBLIC_SLOT_FIELDS}&order=sort_order.asc,slot_key.asc`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const rows = (await response.json()) as LandingMediaSlot[];
    return rows.filter((row) => isLandingSlotKey(row.slot_key) && row.active === true);
  } catch {
    return [];
  }
}

export function resolveLandingImage(
  slots: LandingMediaSlot[],
  projects: Project[],
  key: Exclude<LandingSlotKey, "featured_project">,
  locale: Locale,
  fallback: ResolvedLandingImage,
): ResolvedLandingImage {
  return resolveLandingImageValue(slots, projects, key, locale, fallback) as ResolvedLandingImage;
}

export function resolveLandingProject(
  slots: LandingMediaSlot[],
  projects: Project[],
  fallback?: Project,
): Project | undefined {
  return resolveLandingProjectValue(slots, projects, fallback) as Project | undefined;
}
