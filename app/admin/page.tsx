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

  const [projects, images, openBookings, pendingReviews, drafts, published, totalGalleries, activeGalleries] = await Promise.all([
    getCount("projects", session.accessToken),
    getCount("project_images", session.accessToken),
    getCount("booking_submissions", session.accessToken, "status=in.(new,contacted)"),
    getCount("review_submissions", session.accessToken, "status=eq.pending"),
    getCount("projects", session.accessToken, "is_published=eq.false"),
    getCount("projects", session.accessToken, "is_published=eq.true"),
    getCount("client_galleries", session.accessToken),
    getCount("client_galleries", session.accessToken, "status=eq.active"),
  ]);

  const attention = openBookings + pendingReviews + drafts;

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px, 5vw, 72px)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", opacity: .55 }}>Vault Studio</p>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 500 }}>Studio Admin</h1>
          <p style={{ margin: "12px 0 0", opacity: .55, fontSize: 14 }}>{attention ? `${attention} item${attention === 1 ? "" : "s"} need attention.` : "Everything is clear right now."}</p>
        </div>
        <LogoutButton />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Stat label="Open bookings" value={openBookings} href="/admin/bookings" emphasis={openBookings > 0} />
        <Stat label="Pending reviews" value={pendingReviews} href="/admin/reviews" emphasis={pendingReviews > 0} />
        <Stat label="Draft projects" value={drafts} href="/admin/projects" emphasis={drafts > 0} />
        <Stat label="Published" value={published} href="/admin/projects" />
        <Stat label="Active galleries" value={activeGalleries} href="/admin/galleries" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 36 }}>
        <MiniStat label="Total projects" value={projects} />
        <MiniStat label="Project images" value={images} />
        <MiniStat label="Client galleries" value={totalGalleries} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <AdminCard eyebrow="Homepage" title="Curate landing media" copy="Choose the published projects and images used across the hero, services and cinematic parallax." href="/admin/landing" cta="Curate homepage →" />
        <AdminCard eyebrow="Portfolio CMS" title="Manage projects" copy="Create projects, upload galleries, choose covers and control what is published." href="/admin/projects" cta="Manage projects →" />
        <AdminCard eyebrow="Client delivery" title="Private client galleries" copy="Create secure proof galleries, upload private photographs, review client selections and manage delivery." href="/admin/galleries" cta="Manage galleries →" />
        <AdminCard eyebrow="Client pipeline" title="Manage bookings" copy="Review incoming briefs and move enquiries from new to confirmed or completed." href="/admin/bookings" cta="Open bookings →" />
        <AdminCard eyebrow="Social proof" title="Moderate reviews" copy="Approve client reviews for the public site, reject submissions or return them to pending." href="/admin/reviews" cta="Moderate reviews →" />
      </section>
    </main>
  );
}

function Stat({ label, value, href, emphasis = false }: { label: string; value: number; href: string; emphasis?: boolean }) {
  return (
    <Link href={href} style={{ color: "inherit", textDecoration: "none", border: emphasis ? "1px solid rgba(213,165,69,.55)" : "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 22, background: emphasis ? "rgba(213,165,69,.08)" : "rgba(255,255,255,.025)" }}>
      <p style={{ margin: "0 0 18px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .55 }}>{label}</p>
      <strong style={{ fontSize: 34, fontWeight: 500 }}>{value}</strong>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, opacity: .72 }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 18, fontWeight: 500 }}>{value}</strong>
    </div>
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
