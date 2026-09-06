"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["new", "contacted", "confirmed", "completed", "cancelled"];

export default function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(nextStatus: string) {
    setBusy(true);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this booking enquiry?")) return;
    setBusy(true);
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <select value={status} disabled={busy} onChange={(event) => updateStatus(event.target.value)} style={{ background: "#101010", color: "white", border: "1px solid rgba(255,255,255,.16)", borderRadius: 10, padding: "10px 12px" }}>
        {statuses.map((item) => <option value={item} key={item}>{item}</option>)}
      </select>
      <button type="button" disabled={busy} onClick={remove} style={{ background: "transparent", color: "#ff8c8c", border: "1px solid rgba(255,140,140,.3)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Delete</button>
    </div>
  );
}
