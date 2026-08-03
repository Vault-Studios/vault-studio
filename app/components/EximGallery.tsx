"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectGalleryItem } from "../../lib/content/types";

export default function EximGallery({ slides }: { slides: ProjectGalleryItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const show = (index: number) => setActive((index + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="projectGallery" aria-roledescription="carousel" aria-label="Project photo gallery" tabIndex={0}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onKeyDown={(event) => { if (event.key === "ArrowLeft") show(active - 1); if (event.key === "ArrowRight") show(active + 1); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 45) show(active + (distance < 0 ? 1 : -1)); touchStart.current = null; }}>
      <div className="galleryViewport" aria-live="polite">
        {slides.map(({ src, alt }, index) => (
          <figure className={index === active ? "isActive" : ""} aria-hidden={index !== active} key={`${src}-${index}`}>
            <img src={src} alt={index === active ? alt : ""} loading={index === 0 ? "eager" : "lazy"} />
          </figure>
        ))}
        <div className="galleryShade" />
        <div className="galleryCaption"><span>{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span><p>{slides[active].caption}</p></div>
        <div className="galleryArrows"><button type="button" onClick={() => show(active - 1)} aria-label="Previous photo">←</button><button type="button" onClick={() => show(active + 1)} aria-label="Next photo">→</button></div>
      </div>
      <div className="galleryDots" aria-label="Choose a photo">
        {slides.map(({ alt }, index) => <button type="button" className={index === active ? "isActive" : ""} aria-label={`Show photo ${index + 1}: ${alt}`} aria-current={index === active ? "true" : undefined} onClick={() => show(index)} key={`${alt}-${index}`} />)}
      </div>
    </section>
  );
}
