"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={logout} disabled={loading} style={{ border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "white", borderRadius: 999, padding: "10px 14px", cursor: "pointer" }}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
