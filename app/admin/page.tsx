import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../lib/supabase";
import LogoutButton from "./LogoutButton";

async function getCount(table: string, accessToken: string, filter = ""): Promise<number> {
  const { url, key } = getSupabasePublicConfig();
  const query = filter ? `${filter}&select=id` : "select=id";
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
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

  const [projects, images, bookings, pendingReviews] = await Promise.all([
    getCount("projects", session.accessToken),
    getCount("project_images", session.accessToken),
    getCount("booking_submissions", session.accessToken, "status=in.(new,contacted)"),
    getCount("review_submissions", session.accessToken, "status=eq.pending"),
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
        <Stat label="Projects" value={projects} href="/admin/projects" />
        <Stat label="Project images" value={images} href="/admin/projects" />
        <Stat label="Open bookings" value={bookings} href="/admin/bookings" />
        <Stat label="Pending reviews" value={pendingReviews} href="/admin/reviews" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <AdminCard eyebrow="Portfolio CMS" title="Manage projects" copy="Create projects, upload galleries, choose covers and control what is published." href="/admin/projects" cta="Manage projects →" />
        <AdminCard eyebrow="Client pipeline" title="Manage bookings" copy="Review incoming briefs and move enquiries from new to confirmed or completed." href="/admin/bookings" cta="Open bookings →" />
        <AdminCard eyebrow="Social proof" title="Moderate reviews" copy="Approve client reviews for the public site, reject submissions or return them to pending." href="/admin/reviews" cta="Moderate reviews →" />
      </section>
    </main>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} style={{ color: "inherit", textDecoration: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 22, background: "rgba(255,255,255,.025)" }}>
      <p style={{ margin: "0 0 18px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>{label}</p>
      <strong style={{ fontSize: 34, fontWeight: 500 }}>{value}</strong>
    </Link>
  );
}

function AdminCard({ eyebrow, title, copy, href, cta }: { eyebrow: string; title: string; copy: string; href: string; cta: string }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 28, background: "rgba(255,255,255,.025)" }}>
      <p style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", opacity: .5 }}>{eyebrow}</p>
      <h2 style={{ margin: "0 0 12px", fontSize: 25, fontWeight: 500 }}>{title}</h2>
      <p style={{ margin: "0 0 20px", lineHeight: 1.7, opacity: .7 }}>{copy}</p>
      <Link href={href} style={{ display: "inline-block", background: "white", color: "black", padding: "11px 16px", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}>{cta}</Link>
    </section>
  );
}
