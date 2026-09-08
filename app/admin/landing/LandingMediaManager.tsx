"use client";

import { useMemo, useState } from "react";
import type { LandingMediaSlot, LandingSlotKey } from "../../../lib/landing-media";
import { LANDING_SLOT_KEYS } from "../../../lib/landing-media";

export type LandingProjectOption = {
  id: string;
  title: string;
  client_name: string;
  cover_image_url: string | null;
};

export type LandingImageOption = {
  id: string;
  project_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

const slotCopy: Record<LandingSlotKey, { name: string; description: string }> = {
  hero: { name: "Hero image", description: "Main image at the top of the homepage." },
  service_photography: { name: "Service — Photography", description: "Image beside the photography service." },
  service_film: { name: "Service — Film", description: "Image beside the film service." },
  service_commercial: { name: "Service — Commercial", description: "Image beside commercial and campaigns." },
  parallax_1: { name: "Parallax — Frame 01", description: "First layer in the cinematic scroll sequence." },
  parallax_2: { name: "Parallax — Frame 02", description: "Second layer in the cinematic scroll sequence." },
  parallax_3: { name: "Parallax — Frame 03", description: "Third layer in the cinematic scroll sequence." },
  studio_story: { name: "Studio story", description: "Image paired with the studio story." },
  featured_project: { name: "Featured project", description: "Project opened from the full-width feature." },
  featured_takeover_image: { name: "Featured takeover image", description: "Cover image used for the featured project treatment." },
  closing_background: { name: "Closing background", description: "Optional image behind the final booking invitation." },
};

export default function LandingMediaManager({ initialSlots, projects, images }: { initialSlots: LandingMediaSlot[]; projects: LandingProjectOption[]; images: LandingImageOption[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [chooser, setChooser] = useState<LandingSlotKey | null>(null);
  const [busy, setBusy] = useState<LandingSlotKey | null>(null);
  const [message, setMessage] = useState("");
  const [altDrafts, setAltDrafts] = useState<Record<string, { en: string; sw: string }>>(() => Object.fromEntries(
    initialSlots.map((slot) => [slot.slot_key, { en: slot.alt_text_en || "", sw: slot.alt_text_sw || "" }]),
  ));
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const imagesById = useMemo(() => new Map(images.map((image) => [image.id, image])), [images]);

  function current(key: LandingSlotKey) {
    return slots.find((slot) => slot.slot_key === key);
  }

  async function save(key: LandingSlotKey, choiceId: string) {
    setBusy(key);
    setMessage("");
    const existing = current(key);
    const response = await fetch("/api/admin/landing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_key: key,
        project_id: key === "featured_project" ? choiceId : null,
        image_id: key === "featured_project" ? null : choiceId,
        alt_text_en: altDrafts[key]?.en || existing?.alt_text_en || null,
        alt_text_sw: altDrafts[key]?.sw || existing?.alt_text_sw || null,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setSlots((value) => [...value.filter((slot) => slot.slot_key !== key), result as LandingMediaSlot]);
      setAltDrafts((value) => ({ ...value, [key]: { en: result.alt_text_en || "", sw: result.alt_text_sw || "" } }));
      setChooser(null);
      setMessage(`${slotCopy[key].name} updated.`);
    } else {
      setMessage(result.error || "Could not save that choice.");
    }
    setBusy(null);
  }

  async function reset(key: LandingSlotKey) {
    setBusy(key);
    setMessage("");
    const response = await fetch(`/api/admin/landing?slot_key=${encodeURIComponent(key)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setSlots((value) => value.filter((slot) => slot.slot_key !== key));
      setAltDrafts((value) => ({ ...value, [key]: { en: "", sw: "" } }));
      setMessage(`${slotCopy[key].name} now uses automatic selection.`);
    } else {
      setMessage(result.error || "Could not reset that choice.");
    }
    setBusy(null);
  }

  return (
    <>
      {message && <p className="landingAdminMessage" role="status">{message}</p>}
      <section className="landingSlotList" aria-label="Landing page media slots">
        {LANDING_SLOT_KEYS.map((key) => {
          const slot = current(key);
          const image = slot?.image_id ? imagesById.get(slot.image_id) : undefined;
          const project = slot?.project_id ? projectsById.get(slot.project_id) : undefined;
          const thumbnail = key === "featured_project" ? project?.cover_image_url || "" : image?.image_url || "";
          const validCuratedChoice = key === "featured_project" ? Boolean(project) : Boolean(image && (!slot?.project_id || image.project_id === slot.project_id));
          const source = validCuratedChoice && project
            ? `${project.client_name || "Vault"} · ${project.title}`
            : slot
              ? "Reference unavailable · automatic fallback"
              : "Automatic CMS selection";
          return (
            <article className="landingSlot" key={key}>
              <div className="landingSlotCopy">
                <p>{slotCopy[key].name}</p>
                <span>{slotCopy[key].description}</span>
              </div>
              <div className={`landingSlotThumb${thumbnail ? " hasImage" : ""}`}>
                {thumbnail ? <img src={thumbnail} alt="" /> : <span>Auto</span>}
              </div>
              <div className="landingSlotSource">
                <strong>{source}</strong>
                <span>{validCuratedChoice ? "Curated" : "Uses the current homepage fallback"}</span>
              </div>
              <div className="landingSlotActions">
                <button type="button" onClick={() => setChooser(key)} disabled={busy === key}>
                  {key === "featured_project" ? "Change project" : "Change image"}
                </button>
                <button className="quiet" type="button" onClick={() => reset(key)} disabled={!slot || busy === key}>
                  Use automatic
                </button>
              </div>
              {slot?.image_id && (
                <div className="landingAltFields">
                  <label>
                    English alt text
                    <input
                      type="text"
                      maxLength={300}
                      value={altDrafts[key]?.en || ""}
                      placeholder={image?.alt_text || "Use the image library description"}
                      onChange={(event) => setAltDrafts((value) => ({ ...value, [key]: { en: event.target.value, sw: value[key]?.sw || "" } }))}
                    />
                  </label>
                  <label>
                    Kiswahili alt text
                    <input
                      type="text"
                      maxLength={300}
                      value={altDrafts[key]?.sw || ""}
                      placeholder="Tumia maelezo ya picha"
                      onChange={(event) => setAltDrafts((value) => ({ ...value, [key]: { en: value[key]?.en || "", sw: event.target.value } }))}
                    />
                  </label>
                  <button type="button" onClick={() => save(key, slot.image_id!)} disabled={busy === key}>Save descriptions</button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {chooser && (
        <div className="landingChooser" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setChooser(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="landing-chooser-title">
            <header>
              <div>
                <p>Media library</p>
                <h2 id="landing-chooser-title">{slotCopy[chooser].name}</h2>
              </div>
              <button type="button" onClick={() => setChooser(null)} aria-label="Close media chooser">×</button>
            </header>
            {chooser === "featured_project" ? (
              <div className="landingChoiceGrid">
                {projects.map((project) => (
                  <button key={project.id} type="button" onClick={() => save(chooser, project.id)} disabled={busy === chooser}>
                    {project.cover_image_url ? <img src={project.cover_image_url} alt="" /> : <span className="landingChoiceBlank">No cover</span>}
                    <strong>{project.title}</strong>
                    <small>{project.client_name || "Vault Studio"}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="landingChoiceGrid">
                {images.map((image) => {
                  const project = projectsById.get(image.project_id);
                  return (
                    <button key={image.id} type="button" onClick={() => save(chooser, image.id)} disabled={busy === chooser}>
                      <img src={image.image_url} alt={image.alt_text || "Vault project image"} />
                      <strong>{image.alt_text || project?.title || "Untitled image"}</strong>
                      <small>{project ? `${project.client_name || "Vault"} · ${project.title}` : "Published project"}</small>
                    </button>
                  );
                })}
              </div>
            )}
            {((chooser === "featured_project" && projects.length === 0) || (chooser !== "featured_project" && images.length === 0)) && (
              <p className="landingChoiceEmpty">Publish a project with gallery images before curating this slot.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
