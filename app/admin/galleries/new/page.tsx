import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";

export default async function NewGalleryPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Private gallery</p>
          <h1>Create gallery</h1>
          <p>Set the client details and access rules first. Photos are uploaded after the gallery is created.</p>
        </div>
        <Link href="/admin/galleries">Back to galleries</Link>
      </section>

      <section className="adminPanel">
        <form className="adminForm" method="post" action="/api/admin/galleries">
          <label>Gallery title<input required name="title" placeholder="Amina & Joseph" /></label>
          <label>Client name<input required name="client_name" placeholder="Amina Joseph" /></label>
          <label>Client email<input name="client_email" type="email" placeholder="client@example.com" /></label>
          <label>Gallery slug<input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="amina-joseph" /></label>
          <label>Access PIN<input required name="pin" minLength={4} maxLength={32} type="password" autoComplete="new-password" /></label>
          <label>Event date<input name="event_date" type="date" /></label>
          <label>Selection limit<input name="selection_limit" min="1" type="number" placeholder="40" /></label>
          <label>Expires at<input name="expires_at" type="datetime-local" /></label>
          <label>Description<textarea name="description" rows={4} placeholder="Wedding proofs — final retouch selection" /></label>
          <label className="adminCheckbox"><input name="allow_downloads" type="checkbox" /> Allow approved image downloads</label>
          <div className="adminActions">
            <button className="adminPrimaryButton" type="submit">Create gallery</button>
            <Link href="/admin/galleries">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
