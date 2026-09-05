import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../lib/supabase";
import ReviewActions from "./ReviewActions";

type ReviewSubmission = {
  id: string;
  name: string;
  company: string;
  email: string;
  project: string;
  rating: number;
  review: string;
  status: string;
  created_at: string;
};

async function loadReviews(accessToken: string): Promise<ReviewSubmission[]> {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/review_submissions?select=*&order=created_at.desc&limit=100`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return await response.json() as ReviewSubmission[];
}

export default async function AdminReviewsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const reviews = await loadReviews(session.accessToken);

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <Link href="/admin" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Dashboard</Link>
      <div style={{ margin: "10px 0 30px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>Social proof</p>
        <h1 style={{ margin: 0, fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>Reviews</h1>
      </div>
      <section style={{ display: "grid", gap: 16 }}>
        {reviews.length === 0 && <p style={{ opacity: .6 }}>No review submissions yet.</p>}
        {reviews.map((item) => (
          <article key={item.id} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 22, background: "rgba(255,255,255,.025)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, opacity: .5 }}>{new Date(item.created_at).toLocaleString()} · {item.status}</p>
                <h2 style={{ margin: 0, fontWeight: 500 }}>{item.name}{item.company ? ` · ${item.company}` : ""}</h2>
                <p style={{ margin: "6px 0 0", opacity: .62 }}>{item.project} · {"★".repeat(Math.max(1, Math.min(5, item.rating)))}</p>
              </div>
              <ReviewActions id={item.id} status={item.status} />
            </div>
            <p style={{ lineHeight: 1.75, fontSize: 18, margin: "0 0 12px" }}>“{item.review}”</p>
            <a href={`mailto:${item.email}`} style={{ color: "inherit", opacity: .55 }}>{item.email}</a>
          </article>
        ))}
      </section>
    </main>
  );
}
