"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";

type DepthHeroProps = {
  locale: Locale;
  image: string;
  imageAlt: string;
};

export default function DepthHero({ locale, image, imageAlt }: DepthHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const sw = locale === "sw";

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight)));
      hero.style.setProperty("--hero-progress", reduced ? "0" : String(progress));
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

  return (
    <section className="editorialHero" id="top" ref={heroRef}>
      <img className="editorialHeroMedia" src={image} alt={imageAlt} fetchPriority="high" />
      <div className="editorialHeroVeil" aria-hidden="true" />

      <div className="editorialHeroContent shell">
        <p className="editorialKicker">Vault</p>
        <h1>
          <span>{sw ? "Studio ya Picha" : "Photography"}</span>
          <span>{sw ? "na Filamu" : "& Film Studio"}</span>
        </h1>
        <div className="editorialHeroFoot">
          <p>Dar es Salaam<br />Tanzania</p>
          <Link href="#work">{sw ? "Tazama kazi teule" : "View selected work"} <span aria-hidden="true">↓</span></Link>
        </div>
      </div>

      <p className="editorialHeroIndex" aria-hidden="true">VAULT / 2026</p>
    </section>
  );
}
