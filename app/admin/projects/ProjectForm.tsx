"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id?: string;
  title: string;
  slug: string;
  client_name: string;
  category: string;
  location: string;
  project_date: string | null;
  summary: string;
  description: string;
  cover_image_url: string | null;
  is_published: boolean;
};

const fieldStyle = {
  width: "100%",
  background: "#111",
  color: "white",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  padding: "12px 14px",
} as const;

export default function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      slug: form.get("slug"),
      client_name: form.get("client_name"),
      category: form.get("category"),
      location: form.get("location"),
      project_date: form.get("project_date"),
      summary: form.get("summary"),
      description: form.get("description"),
      cover_image_url: form.get("cover_image_url"),
      is_published: form.get("is_published") === "on",
    };

    const url = project?.id ? `/api/admin/projects/${project.id}` : "/api/admin/projects";
    const response = await fetch(url, {
      method: project?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not save project.");
      return;
    }

    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18, maxWidth: 900 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        <Field label="Project title" name="title" defaultValue={project?.title} required />
        <Field label="Slug" name="slug" defaultValue={project?.slug} placeholder="auto-generated if blank" />
        <Field label="Client" name="client_name" defaultValue={project?.client_name} />
        <Field label="Category" name="category" defaultValue={project?.category} placeholder="Event, Campaign, Documentary..." />
        <Field label="Location" name="location" defaultValue={project?.location} />
        <Field label="Project date" name="project_date" type="date" defaultValue={project?.project_date || ""} />
      </div>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, opacity: .65 }}>Short summary</span>
        <textarea name="summary" defaultValue={project?.summary} rows={3} style={fieldStyle} />
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, opacity: .65 }}>Description</span>
        <textarea name="description" defaultValue={project?.description} rows={8} style={fieldStyle} />
      </label>

      <Field label="Cover image URL" name="cover_image_url" defaultValue={project?.cover_image_url || ""} placeholder="Temporary until Storage upload is added" />

      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input type="checkbox" name="is_published" defaultChecked={project?.is_published} />
        <span>Publish project</span>
      </label>

      {error ? <p style={{ color: "#ff9d9d", margin: 0 }}>{error}</p> : null}

      <div style={{ display: "flex", gap: 12 }}>
        <button disabled={saving} type="submit" style={{ background: "white", color: "black", border: 0, borderRadius: 999, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving…" : project?.id ? "Save changes" : "Create project"}
        </button>
        <button type="button" onClick={() => router.push("/admin/projects")} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "12px 20px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", required = false }: { label: string; name: string; defaultValue?: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 13, opacity: .65 }}>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} style={fieldStyle} />
    </label>
  );
}
