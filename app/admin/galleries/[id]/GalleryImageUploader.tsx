"use client";

import { useState } from "react";

export default function GalleryImageUploader({ galleryId }: { galleryId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true); setMessage("Authorizing private upload…");
    try {
      const sign = await fetch(`/api/admin/galleries/${galleryId}/images/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }) });
      const signed = await sign.json() as { path?: string; filename?: string; signedUrl?: string; token?: string; error?: string };
      if (!sign.ok || !signed.path || !signed.filename || !signed.signedUrl) throw new Error(signed.error || "Upload authorization failed.");

      setMessage("Uploading directly to private storage…");
      const target = signed.signedUrl.startsWith("http") ? signed.signedUrl : signed.signedUrl;
      const headers: Record<string, string> = { "Content-Type": file.type };
      if (signed.token) headers["x-upsert"] = "false";
      const put = await fetch(target, { method: "PUT", headers, body: file });
      if (!put.ok) throw new Error("Private Storage upload failed.");

      const complete = await fetch(`/api/admin/galleries/${galleryId}/images/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: signed.path, filename: signed.filename }) });
      const completed = await complete.json() as { error?: string };
      if (!complete.ok) throw new Error(completed.error || "Could not register image.");
      setMessage("Photo added. Refreshing…");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="adminUploadBox">
      <label>
        <strong>Add private photo</strong>
        <span>JPEG, PNG or WebP · maximum 15 MB</span>
        <input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      </label>
      {message ? <p aria-live="polite">{message}</p> : null}
    </div>
  );
}
