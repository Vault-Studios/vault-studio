"use client";

import { FormEvent, useState } from "react";
import { readApiError } from "../../../lib/api-response";

export default function GalleryPinForm({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/gallery/${encodeURIComponent(slug)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: form.get("pin") }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Unable to open this gallery."));
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to reach the gallery. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="clientGalleryGate">
      <div className="clientGalleryGlow" />
      <section className="clientGalleryGateCard">
        <img src="/vault-logo-light.png" alt="Vault" />
        <p className="eyebrow">Private client gallery</p>
        <h1>Your photographs are ready.</h1>
        <p>Enter the access PIN supplied by Vault Studio.</p>
        <form onSubmit={unlock}>
          <label htmlFor="gallery-pin">Gallery PIN</label>
          <input
            id="gallery-pin"
            name="pin"
            type="password"
            inputMode="numeric"
            minLength={4}
            maxLength={32}
            autoComplete="one-time-code"
            required
            autoFocus
          />
          {error ? <p className="clientGalleryError" role="alert">{error}</p> : null}
          <button disabled={busy} type="submit">{busy ? "Opening…" : "Open gallery"}</button>
        </form>
        <small>Private delivery · Vault Studio</small>
      </section>
    </main>
  );
}
