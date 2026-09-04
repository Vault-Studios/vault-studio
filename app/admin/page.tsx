import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../lib/supabase";
import LogoutButton from "./LogoutButton";

async function getCount(table: string, accessToken: string): Promise<number> {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/${table}?select=id`, {
    method: "HEAD",
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!response.ok) return 0;
  const range = response.headers.get("content-range");
  if (!range) return 0;
  const count = Number(range.split("/")[1]);
  return Number.isFinite(count) ? count : 0;
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [projects, images] = await Promise.all([
    getCount("projects", session.accessToken),
    getCount("project_images", session.accessToken),
  ]);

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px, 5vw, 72px)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 48 }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", opacity: .55 }}>Vault Studio</p>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 500 }}>Studio Admin</h1>
        </div>
        <LogoutButton />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 36 }}>
        <Stat label="Projects" value={projects} />
        <Stat label="Project images" value={images} />
        <Stat label="Bookings" value="Next" />
        <Stat label="Reviews" value="Next" />
      </section>

      <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 28, background: "rgba(255,255,255,.025)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", opacity: .5 }}>Portfolio CMS</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 500 }}>Project management is live.</h2>
        <p style={{ margin: "0 0 20px", maxWidth: 700, lineHeight: 1.7, opacity: .7 }}>
          Create portfolio entries, keep them as drafts, publish them, edit details and remove projects from one protected workspace.
        </p>
        <Link href="/admin/projects" style={{ display: "inline-block", background: "white", color: "black", padding: "12px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}>
          Manage projects →
        </Link>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <article style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 22, background: "rgba(255,255,255,.025)" }}>
      <p style={{ margin: "0 0 18px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>{label}</p>
      <strong style={{ fontSize: 34, fontWeight: 500 }}>{value}</strong>
    </article>
  );
}
