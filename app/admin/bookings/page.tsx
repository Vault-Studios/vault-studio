import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getSupabasePublicConfig } from "../../../lib/supabase";
import BookingActions from "./BookingActions";

type Booking = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  preferred_date: string | null;
  budget: string;
  location: string;
  brief: string;
  status: string;
  created_at: string;
};

async function loadBookings(accessToken: string): Promise<Booking[]> {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/booking_submissions?select=*&order=created_at.desc&limit=100`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return await response.json() as Booking[];
}

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const bookings = await loadBookings(session.accessToken);

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <Link href="/admin" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Dashboard</Link>
      <div style={{ margin: "10px 0 30px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>Client pipeline</p>
        <h1 style={{ margin: 0, fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>Bookings</h1>
      </div>
      <section style={{ display: "grid", gap: 16 }}>
        {bookings.length === 0 && <p style={{ opacity: .6 }}>No booking enquiries yet.</p>}
        {bookings.map((booking) => (
          <article key={booking.id} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 22, background: "rgba(255,255,255,.025)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, opacity: .5 }}>{new Date(booking.created_at).toLocaleString()}</p>
                <h2 style={{ margin: 0, fontWeight: 500 }}>{booking.name}{booking.company ? ` · ${booking.company}` : ""}</h2>
              </div>
              <BookingActions id={booking.id} status={booking.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 }}>
              <Info label="Service" value={booking.service} />
              <Info label="Preferred date" value={booking.preferred_date || "Not specified"} />
              <Info label="Budget" value={booking.budget || "Not specified"} />
              <Info label="Location" value={booking.location || "Not specified"} />
              <Info label="Email" value={booking.email} />
              <Info label="Phone" value={booking.phone || "Not specified"} />
            </div>
            <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", opacity: .82 }}>{booking.brief}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p style={{ margin: "0 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", opacity: .42 }}>{label}</p><p style={{ margin: 0 }}>{value}</p></div>;
}
