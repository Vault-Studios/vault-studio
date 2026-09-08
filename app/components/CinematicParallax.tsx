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
      const effectiveProgress = reduced ? 0 : progress;
      section.style.setProperty("--parallax-progress", String(effectiveProgress));

      const layers = section.querySelectorAll<HTMLElement>("[data-parallax-layer]");
      layers.forEach((layer, index) => {
        const count = Math.max(1, layers.length - 1);
        const center = index / count;
        const radius = index === 0 || index === layers.length - 1 ? 0.58 : 0.48;
        const opacity = reduced
          ? (index === 0 ? 1 : 0)
          : Math.min(1, Math.max(0, 1 - Math.abs(effectiveProgress - center) / radius));
        const revealStart = Math.max(0, center - 0.34);
        const reveal = index === 0
          ? 1
          : Math.min(1, Math.max(0, (effectiveProgress - revealStart) / 0.3));
        const depth = [12, -18, 9][index % 3];
        const offset = reduced ? 0 : (effectiveProgress - center) * depth;
        const scale = reduced ? 1 : 1.07 + Math.abs(effectiveProgress - center) * 0.045;

        layer.style.setProperty("--frame-opacity", opacity.toFixed(3));
        layer.style.setProperty("--frame-reveal", `${((1 - reveal) * 100).toFixed(2)}%`);
        layer.style.setProperty("--frame-offset", `${offset.toFixed(2)}vh`);
        layer.style.setProperty("--frame-scale", scale.toFixed(3));
      });
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
    <section className="cinematicParallax" ref={sectionRef} data-scroll-story aria-labelledby="parallax-title">
      <div className="cinematicParallaxSticky shell">
        <div className="cinematicParallaxScene" aria-hidden="true">
          {images.map((image, index) => (
            <figure
              className={`cinematicParallaxFrame frame-${index + 1}`}
              data-parallax-layer
              key={`${image.src}-${index}`}
              style={{ "--frame-index": index } as CSSProperties}
            >
              <img src={image.src} alt="" loading="lazy" />
            </figure>
          ))}
          <span className="cinematicParallaxGrade" />
        </div>
        <div className="cinematicParallaxCopy">
          <p className="editorialKicker">{sw ? "Ndani ya fremu" : "Inside the frame"}</p>
          <h2 id="parallax-title">
            <span>{sw ? "Tunatafuta" : "We look for"}</span>
            <span>{sw ? "hisia," : "feeling,"}</span>
            <span>{sw ? "si picha pekee." : "not just footage."}</span>
          </h2>
          <p>{sw ? "Watu, mwanga na mazingira husogea kwa kasi zao. Tunaziunganisha kuwa hadithi moja iliyo wazi." : "People, light and atmosphere move at their own pace. We bring them together as one clear story."}</p>
        </div>
        <div className="cinematicParallaxTimeline" aria-hidden="true">
          {images.map((image, index) => (
            <span key={`${image.src}-label`}>{String(index + 1).padStart(2, "0")} <b>{image.sourceLabel || "Vault Studio"}</b></span>
          ))}
        </div>
      </div>
    </section>
  );
}
