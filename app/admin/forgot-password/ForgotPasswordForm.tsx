"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/password-recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Unable to send recovery email.");
      return;
    }

    setMessage(data.message || "If that account exists, a recovery email has been sent.");
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Email</span>
        <input name="email" type="email" autoComplete="email" required style={inputStyle} />
      </label>
      {message ? <p style={{ margin: 0, color: "#a7f3d0", fontSize: 14, lineHeight: 1.5 }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: "#ff8b8b", fontSize: 14 }}>{error}</p> : null}
      <button disabled={loading} type="submit" style={buttonStyle}>
        {loading ? "Sending…" : "Send recovery email"}
      </button>
      <a href="/admin/login" style={{ color: "white", opacity: .72, fontSize: 14, textAlign: "center" }}>
        Back to sign in
      </a>
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
