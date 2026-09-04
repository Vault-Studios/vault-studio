"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

export default function ProjectImages({ projectId, images }: { projectId: string; images: GalleryImage[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUploading(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/images`, { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(imageId: string) {
    if (!confirm("Delete this image from the project gallery?")) return;
    setDeletingId(imageId);
    setError("");
    try {
      const response = await fetch(`/api/admin/project-images/${imageId}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Delete failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section style={{ marginTop: 28, border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 24, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .5 }}>Media</p>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Project gallery</h2>
        </div>
        <span style={{ opacity: .55, fontSize: 13 }}>{images.length} image{images.length === 1 ? "" : "s"}</span>
      </div>

      <form onSubmit={upload} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 12, alignItems: "end", marginBottom: 24 }}>
        <label style={{ display: "grid", gap: 8, fontSize: 13 }}>
          Image
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 8, fontSize: 13 }}>
          Alt text
          <input name="alt_text" type="text" placeholder="Describe the image" style={inputStyle} />
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <input name="make_cover" type="checkbox" value="true" /> Set as cover
          </label>
          <button disabled={uploading} type="submit" style={buttonStyle}>{uploading ? "Uploading…" : "Upload image"}</button>
        </div>
      </form>

      {error && <p style={{ color: "#ff9b9b", margin: "0 0 18px" }}>{error}</p>}

      {images.length === 0 ? (
        <p style={{ margin: 0, opacity: .55 }}>No gallery images yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14 }}>
          {images.map((image) => (
            <article key={image.id} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, overflow: "hidden", background: "rgba(255,255,255,.02)" }}>
              <img src={image.image_url} alt={image.alt_text || "Project image"} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
              <div style={{ padding: 12 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, opacity: .6, minHeight: 34 }}>{image.alt_text || "No alt text"}</p>
                <button type="button" disabled={deletingId === image.id} onClick={() => remove(image.id)} style={{ ...buttonStyle, width: "100%", background: "transparent" }}>
                  {deletingId === image.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  background: "rgba(255,255,255,.04)",
  color: "white",
  padding: "12px 14px",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 12,
  background: "white",
  color: "#080808",
  padding: "12px 16px",
  cursor: "pointer",
};
