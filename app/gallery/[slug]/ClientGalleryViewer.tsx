"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryImage = {
  id: string;
  filename: string;
  alt_text: string;
  sort_order: number;
};

type Props = {
  slug: string;
  title: string;
  clientName: string;
  description: string;
  eventDate: string | null;
  images: GalleryImage[];
  initialSelections: string[];
  selectionLimit: number | null;
  submittedAt: string | null;
};

export default function ClientGalleryViewer(props: Props) {
  const [selected, setSelected] = useState(() => new Set(props.initialSelections));
  const [pending, setPending] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(props.submittedAt);
  const [message, setMessage] = useState("");
  const selectedImages = useMemo(
    () => props.images.filter((image) => selected.has(image.id)),
    [props.images, selected]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((value) => value === null ? null : (value + 1) % props.images.length);
      if (event.key === "ArrowLeft") setActiveIndex((value) => value === null ? null : (value - 1 + props.images.length) % props.images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, props.images.length]);

  async function toggle(imageId: string) {
    if (submittedAt || pending) return;
    const nextSelected = !selected.has(imageId);
    setPending(imageId);
    setMessage("");
    try {
      const response = await fetch(`/gallery/${encodeURIComponent(props.slug)}/selections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, selected: nextSelected }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to update your selection.");
      setSelected((current) => {
        const updated = new Set(current);
        if (nextSelected) updated.add(imageId); else updated.delete(imageId);
        return updated;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update your selection.");
    } finally {
      setPending(null);
    }
  }

  async function finalize() {
    setPending("finalize");
    setMessage("");
    try {
      const response = await fetch(`/gallery/${encodeURIComponent(props.slug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body = await response.json() as { error?: string; submittedAt?: string };
      if (!response.ok || !body.submittedAt) throw new Error(body.error || "Unable to submit selections.");
      setSubmittedAt(body.submittedAt);
      setReviewing(false);
      setMessage("Your final selection has been sent to Vault Studio.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit selections.");
    } finally {
      setPending(null);
    }
  }

  const activeImage = activeIndex === null ? null : props.images[activeIndex];

  return (
    <main className="clientGallery">
      <header className="clientGalleryHeader">
        <img src="/vault-logo-light.png" alt="Vault" />
        <span>{submittedAt ? "Selection submitted" : "Private gallery"}</span>
      </header>

      <section className="clientGalleryIntro">
        <p className="eyebrow">Curated for {props.clientName}</p>
        <h1>{props.title}</h1>
        <div>
          {props.description ? <p>{props.description}</p> : <p>Review the collection and mark your final photographs.</p>}
          <span>{props.eventDate ? new Date(`${props.eventDate}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }) : `${props.images.length} photographs`}</span>
        </div>
      </section>

      <aside className="clientGallerySelectionBar">
        <div><strong>{selected.size}{props.selectionLimit === null ? "" : ` / ${props.selectionLimit}`}</strong><span>selected</span></div>
        <p aria-live="polite">{message || (submittedAt ? "Your final choices are locked." : "Tap the heart on every photograph you want to keep.")}</p>
        <button disabled={Boolean(submittedAt) || selected.size === 0} onClick={() => setReviewing(true)}>
          {submittedAt ? "Submitted" : "Review selection"}
        </button>
      </aside>

      {props.images.length ? (
        <section className="clientGalleryGrid" aria-label="Gallery photographs">
          {props.images.map((image, index) => {
            const isSelected = selected.has(image.id);
            return (
              <article className="clientGalleryImage" key={image.id}>
                <button className="clientGalleryOpen" onClick={() => setActiveIndex(index)} aria-label={`View ${image.alt_text || image.filename} full screen`}>
                  <img loading="lazy" src={`/gallery/${encodeURIComponent(props.slug)}/images/${encodeURIComponent(image.id)}`} alt={image.alt_text || image.filename} />
                </button>
                <button
                  className={`clientGallerySelect${isSelected ? " isSelected" : ""}`}
                  disabled={Boolean(submittedAt) || pending === image.id}
                  aria-pressed={isSelected}
                  onClick={() => void toggle(image.id)}
                  aria-label={isSelected ? `Remove ${image.filename} from selection` : `Select ${image.filename}`}
                >
                  <span aria-hidden="true">{isSelected ? "♥" : "♡"}</span>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                </button>
              </article>
            );
          })}
        </section>
      ) : <section className="clientGalleryEmpty"><h2>Collection in preparation</h2><p>Vault Studio is finishing this private delivery.</p></section>}

      {activeImage ? (
        <div className="clientGalleryLightbox" role="dialog" aria-modal="true" aria-label="Full-screen photograph">
          <button className="clientGalleryClose" onClick={() => setActiveIndex(null)} aria-label="Close full-screen view">×</button>
          <button className="clientGalleryPrevious" onClick={() => setActiveIndex((activeIndex! - 1 + props.images.length) % props.images.length)} aria-label="Previous photograph">←</button>
          <img src={`/gallery/${encodeURIComponent(props.slug)}/images/${encodeURIComponent(activeImage.id)}`} alt={activeImage.alt_text || activeImage.filename} />
          <button className="clientGalleryNext" onClick={() => setActiveIndex((activeIndex! + 1) % props.images.length)} aria-label="Next photograph">→</button>
          <span>{String(activeIndex! + 1).padStart(2, "0")} / {String(props.images.length).padStart(2, "0")}</span>
        </div>
      ) : null}

      {reviewing ? (
        <div className="clientGalleryReviewBackdrop" role="presentation">
          <section className="clientGalleryReview" role="dialog" aria-modal="true" aria-labelledby="selection-review-title">
            <p className="eyebrow">Final review</p>
            <h2 id="selection-review-title">Submit {selected.size} photograph{selected.size === 1 ? "" : "s"}?</h2>
            <p>After confirmation your choices are locked. Vault Studio can reopen them if a change is needed.</p>
            <ol>{selectedImages.map((image) => <li key={image.id}>{image.filename}</li>)}</ol>
            <div><button onClick={() => setReviewing(false)}>Keep editing</button><button disabled={pending === "finalize"} onClick={() => void finalize()}>{pending === "finalize" ? "Submitting…" : "Confirm final selection"}</button></div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
