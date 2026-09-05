"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";

function subscribeToHashChange(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getRecoveryHash() {
  return window.location.hash;
}

export default function ResetPasswordForm() {
  const recoveryHash = useSyncExternalStore(
    subscribeToHashChange,
    getRecoveryHash,
    () => null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const params = new URLSearchParams((recoveryHash ?? "").replace(/^#/, ""));
  const type = params.get("type");
  const accessToken = !type || type === "recovery" ? params.get("access_token") || "" : "";
  const ready = recoveryHash !== null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!accessToken) {
      setError("This recovery link is missing or expired. Request a new one.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, password }),
    });

    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Unable to update password.");
      return;
    }

    setMessage("Password updated. Redirecting to sign in…");
    window.history.replaceState(null, "", window.location.pathname);
    window.setTimeout(() => window.location.assign("/admin/login"), 900);
  }

  if (!ready) {
    return <p style={{ margin: 0, opacity: .68 }}>Checking recovery link…</p>;
  }

  if (!accessToken) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <p style={{ margin: 0, color: "#ff8b8b", lineHeight: 1.5 }}>This recovery link is missing or expired.</p>
        <a href="/admin/forgot-password" style={{ color: "white" }}>Request a new recovery email</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>New password</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Confirm password</span>
        <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} style={inputStyle} />
      </label>
      {message ? <p style={{ margin: 0, color: "#a7f3d0", fontSize: 14 }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: "#ff8b8b", fontSize: 14 }}>{error}</p> : null}
      <button disabled={loading} type="submit" style={buttonStyle}>
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  padding: "14px 15px",
  borderRadius: 10,
  outline: "none",
};

const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "14px 20px",
  background: "white",
  color: "#0a0a0a",
  fontWeight: 700,
  cursor: "pointer",
};
