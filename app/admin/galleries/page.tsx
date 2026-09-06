import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";

export default async function AdminGalleriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Client delivery</p>
          <h1>Private galleries</h1>
          <p>Create secure client galleries, upload proofs, and review final photo selections.</p>
        </div>
        <Link className="adminPrimaryButton" href="/admin/galleries/new">New gallery</Link>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeader">
          <div>
            <p className="eyebrow">Gallery manager</p>
            <h2>Client galleries</h2>
          </div>
        </div>
        <div className="adminEmptyState">
          <h3>No galleries created yet</h3>
          <p>Your first private client gallery will appear here with its status and selection progress.</p>
          <Link href="/admin/galleries/new">Create first gallery</Link>
        </div>
      </section>
    </main>
  );
}
