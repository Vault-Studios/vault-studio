"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(nextStatus: "pending" | "approved" | "rejected") {
    setBusy(true);
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (!response.ok) alert((await response.json().catch(() => null))?.error ?? "Could not update review.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this review submission?")) return;
    setBusy(true);
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) alert("Could not delete review.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button disabled={busy || status === "approved"} onClick={() => setStatus("approved")} type="button" style={buttonStyle}>Approve</button>
      <button disabled={busy || status === "rejected"} onClick={() => setStatus("rejected")} type="button" style={buttonStyle}>Reject</button>
      {status !== "pending" && <button disabled={busy} onClick={() => setStatus("pending")} type="button" style={buttonStyle}>Reset</button>}
      <button disabled={busy} onClick={remove} type="button" style={{ ...buttonStyle, color: "#ff8c8c" }}>Delete</button>
    </div>
  );
}

const buttonStyle = {
  background: "transparent",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 10,
  padding: "9px 11px",
  cursor: "pointer",
} as const;
