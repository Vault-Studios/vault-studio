import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../../lib/admin-auth";
import ProjectForm from "../ProjectForm";

export default async function NewProjectPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", padding: "32px clamp(20px,5vw,72px)" }}>
      <Link href="/admin/projects" style={{ color: "inherit", opacity: .55, textDecoration: "none", fontSize: 13 }}>← Projects</Link>
      <h1 style={{ margin: "10px 0 28px", fontSize: "clamp(32px,5vw,52px)", fontWeight: 500 }}>New project</h1>
      <ProjectForm />
    </main>
  );
}
