import type { Locale } from "../i18n";
import { getSupabasePublicConfig } from "../supabase";
import type { Project } from "./types";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  category: string;
  location: string;
  project_date: string | null;
  summary: string;
  description: string;
  cover_image_url: string | null;
};

type ImageRow = {
  project_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

export async function supabaseProjects(locale: Locale): Promise<Project[]> {
  const { url, key } = getSupabasePublicConfig();
  const projectResponse = await fetch(
    `${url}/rest/v1/projects?is_published=eq.true&select=id,slug,title,client_name,category,location,project_date,summary,description,cover_image_url&order=project_date.desc.nullslast,created_at.desc`,
    {
      headers: { apikey: key },
      cache: "no-store",
    }
  );

  if (!projectResponse.ok) throw new Error(`Supabase projects request failed: ${projectResponse.status}`);
  const rows = (await projectResponse.json()) as ProjectRow[];
  if (!rows.length) return [];

  const ids = rows.map((project) => project.id).join(",");
  const imageResponse = await fetch(
    `${url}/rest/v1/project_images?project_id=in.(${ids})&select=project_id,image_url,alt_text,sort_order&order=sort_order.asc,created_at.asc`,
    {
      headers: { apikey: key },
      cache: "no-store",
    }
  );

  const images = imageResponse.ok ? ((await imageResponse.json()) as ImageRow[]) : [];

  return rows
    .filter((row) => Boolean(row.cover_image_url || images.some((image) => image.project_id === row.id)))
    .map((row) => {
      const galleryRows = images.filter((image) => image.project_id === row.id);
      const coverImage = row.cover_image_url || galleryRows[0]?.image_url || "";
      const year = row.project_date ? row.project_date.slice(0, 4) : String(new Date().getFullYear());
      const summary = row.summary || row.description;

      return {
        slug: row.slug,
        locale,
        client: row.client_name || "Vault Studio",
        title: row.title,
        category: row.category || (locale === "sw" ? "Mradi" : "Project"),
        year,
        summary,
        location: row.location || "Dar es Salaam, Tanzania",
        services: row.category || (locale === "sw" ? "Picha na filamu" : "Photography & film"),
        coverImage,
        gallery: galleryRows.map((image) => ({
          src: image.image_url,
          alt: image.alt_text || row.title,
          caption: image.alt_text || row.title,
        })),
        video: { poster: coverImage },
      } satisfies Project;
    });
}
