"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!confirm("Delete this project permanently?")) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not delete project.");
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <div style={{ marginTop: 28 }}>
      <button type="button" onClick={remove} disabled={busy} style={{ background: "transparent", color: "#ff9d9d", border: "1px solid rgba(255,120,120,.35)", borderRadius: 999, padding: "11px 18px", cursor: "pointer" }}>
        {busy ? "Deleting…" : "Delete project"}
      </button>
      {error ? <p style={{ color: "#ff9d9d" }}>{error}</p> : null}
    </div>
  );
}
