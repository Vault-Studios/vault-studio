import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import GalleryAdminNav from "../GalleryAdminNav";

export default async function NewGalleryPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="galleryAdminPage">
      <GalleryAdminNav />
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
          <fieldset className="adminFormGroup">
            <legend><span>01</span> Client & gallery</legend>
            <p>Name the private delivery and record who it belongs to.</p>
            <div className="adminFormGrid">
              <label>Gallery title<input required name="title" placeholder="Amina & Joseph" /></label>
              <label>Client name<input required name="client_name" placeholder="Amina Joseph" /></label>
              <label>Client email<input name="client_email" type="email" placeholder="client@example.com" /></label>
              <label>Event date<input name="event_date" type="date" /></label>
              <label className="adminFieldFull">Description<textarea name="description" rows={4} placeholder="Wedding proofs — final retouch selection" /></label>
            </div>
          </fieldset>
          <fieldset className="adminFormGroup">
            <legend><span>02</span> Access & selection</legend>
            <p>Set the secure client link, PIN, selection allowance and expiry.</p>
            <div className="adminFormGrid">
              <label>Gallery slug<span className="adminFieldHint">vault.studio/gallery/</span><input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="amina-joseph" /></label>
              <label>Access PIN<input required name="pin" minLength={4} maxLength={32} type="password" inputMode="numeric" autoComplete="new-password" /><small>4–32 characters. Share outside email where possible.</small></label>
              <label>Selection limit<input name="selection_limit" min="1" type="number" placeholder="40" /><small>Leave empty for unlimited selections.</small></label>
              <label>Expires at<input name="expires_at" type="datetime-local" /><small>Leave empty for no automatic expiry.</small></label>
              <label className="adminCheckbox adminFieldFull"><input name="allow_downloads" type="checkbox" /> <span>Allow approved image downloads</span></label>
            </div>
          </fieldset>
          <div className="adminActions">
            <button className="adminPrimaryButton" type="submit">Create gallery</button>
            <Link href="/admin/galleries">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
