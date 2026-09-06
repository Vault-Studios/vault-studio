"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export default function AdminSessionKeeper() {
  useEffect(() => {
    let stopped = false;

    async function refreshSession() {
      try {
        const response = await fetch("/api/admin/session", { method: "POST", credentials: "same-origin" });
        if (!response.ok && !stopped && (response.status === 401 || response.status === 403)) {
          window.location.assign("/admin/login");
        }
      } catch {
        // Keep the current page usable during transient network failures.
      }
    }

    const timer = window.setInterval(refreshSession, REFRESH_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
