import type { Locale } from "../i18n";
import type { Project } from "./types";

const query = `*[_type == "project" && language == $language] | order(featuredOrder asc){
  "slug": slug.current, language, client, title, category, year, summary, location,
  services, "coverImage": coverImage.asset->url,
  "gallery": gallery[]{"src": image.asset->url, alt, caption},
  "video": {"streamUid": video.streamUid, "mp4": video.mp4Url, "poster": video.poster.asset->url, "duration": video.duration}
}`;

export async function sanityProjects(locale: Locale): Promise<Project[] | null> {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET ?? "production";
  if (!projectId) return null;

  const params = new URLSearchParams({ query, "$language": JSON.stringify(locale) });
  const endpoint = `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}?${params}`;
  const response = await fetch(endpoint, {
    headers: process.env.SANITY_READ_TOKEN
      ? { Authorization: `Bearer ${process.env.SANITY_READ_TOKEN}` }
      : undefined,
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Sanity content request failed (${response.status})`);
  const payload = (await response.json()) as { result?: Project[] };
  return payload.result ?? [];
}
