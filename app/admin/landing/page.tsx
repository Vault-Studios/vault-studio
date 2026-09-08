import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import type { LandingMediaSlot } from "../../../lib/landing-media";
import { getSupabasePublicConfig } from "../../../lib/supabase";
import LandingMediaManager, { type LandingImageOption, type LandingProjectOption } from "./LandingMediaManager";

async function adminJson<T>(path: string, accessToken: string, fallback: T): Promise<T> {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return fallback;
  return (await response.json()) as T;
}

export default async function LandingAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const projects = await adminJson<LandingProjectOption[]>(
    "projects?is_published=eq.true&select=id,title,client_name,cover_image_url&order=project_date.desc.nullslast,created_at.desc",
    session.accessToken,
    [],
  );
  const projectIds = projects.map((project) => project.id).join(",");
  const [slots, images] = await Promise.all([
    adminJson<LandingMediaSlot[]>(
      "site_media_slots?select=slot_key,project_id,image_id,alt_text_en,alt_text_sw,sort_order,active,updated_at&order=sort_order.asc,slot_key.asc",
      session.accessToken,
      [],
    ),
    projectIds
      ? adminJson<LandingImageOption[]>(
          `project_images?project_id=in.(${projectIds})&select=id,project_id,image_url,alt_text,sort_order&order=project_id.asc,sort_order.asc,created_at.asc`,
          session.accessToken,
          [],
        )
      : Promise.resolve([]),
  ]);

  return (
    <main className="landingAdmin">
      <header className="landingAdminHeader">
        <div>
          <Link href="/admin">← Dashboard</Link>
          <p>Homepage art direction</p>
          <h1>Landing Page</h1>
          <span>Choose published Vault imagery for each editorial position. The cinematic motion stays unchanged.</span>
        </div>
        <Link className="landingViewSite" href="/" target="_blank">View live site ↗</Link>
      </header>
      <LandingMediaManager initialSlots={slots} projects={projects} images={images} />
    </main>
  );
}
