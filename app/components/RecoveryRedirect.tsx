"use client";

import { useEffect } from "react";

export default function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname === "/admin/reset-password") return;

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    if (params.get("type") !== "recovery") return;

    window.location.replace(`/admin/reset-password${hash}`);
  }, []);

  return null;
}
