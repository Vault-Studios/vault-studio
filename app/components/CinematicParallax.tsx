"use client";

import { CSSProperties, useEffect, useRef } from "react";
import type { Project } from "../../lib/content/types";
import type { Locale } from "../../lib/i18n";
import type { ResolvedLandingImage } from "../../lib/landing-media";

export default function CinematicParallax({ projects, locale, curatedImages }: { projects: Project[]; locale: Locale; curatedImages?: ResolvedLandingImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const sw = locale === "sw";
  const automaticImages = projects.slice(0, 3).map((project) => ({
    src: project.gallery[0]?.src || project.coverImage,
    alt: project.gallery[0]?.alt || `${project.title} project`,
    sourceLabel: project.client,
  }));
  const images = curatedImages?.length ? curatedImages : automaticImages;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      section.style.setProperty("--parallax-progress", reduced ? "0" : String(progress));
    };
    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!images.length) return null;

  return (
    <section className="cinematicParallax" ref={sectionRef} aria-labelledby="parallax-title">
      <div className="cinematicParallaxSticky shell">
        <div className="cinematicParallaxCopy">
          <p className="editorialKicker">{sw ? "Ndani ya fremu" : "Inside the frame"}</p>
          <h2 id="parallax-title">{sw ? "Tunatafuta hisia, si picha pekee." : "We look for feeling, not just footage."}</h2>
          <p>{sw ? "Watu, mwanga na mazingira husogea kwa kasi zao. Tunaziunganisha kuwa hadithi moja iliyo wazi." : "People, light and atmosphere move at their own pace. We bring them together as one clear story."}</p>
        </div>
        <div className="cinematicParallaxRail" aria-hidden="true">
          {images.map((image, index) => (
            <figure
              className={`cinematicParallaxFrame frame-${index + 1}`}
              key={`${image.src}-${index}`}
              style={{ "--frame-index": index } as CSSProperties}
            >
              <img src={image.src} alt="" loading="lazy" />
              <figcaption>{String(index + 1).padStart(2, "0")} / {image.sourceLabel || "Vault Studio"}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
