"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Unable to sign in.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Email</span>
        <input name="email" type="email" autoComplete="email" required style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Password</span>
        <input name="password" type="password" autoComplete="current-password" required style={inputStyle} />
      </label>
      {error ? <p style={{ margin: 0, color: "#ff8b8b", fontSize: 14 }}>{error}</p> : null}
      <button disabled={loading} type="submit" style={buttonStyle}>
        {loading ? "Signing in…" : "Enter Vault Admin"}
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
