"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { dictionaries, localizedPath } from "../../lib/i18n";

type DepthHeroProps = {
  locale: Locale;
  image: string;
  imageAlt: string;
};

export default function DepthHero({ locale, image, imageAlt }: DepthHeroProps) {
  const dictionary = dictionaries[locale];
  const { nav } = dictionary;
  const heroRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

      <header className="editorialNav shell">
        <Link className="brand" href={localizedPath(locale, "/")} aria-label="Vault home">
          <img className="brandLogo" src="/vault-logo-light.png" alt="Vault" />
        </Link>
        <nav className="desktopNav" aria-label="Main navigation">
          <Link href="#work">{nav.work}</Link>
          <Link href="#services">{nav.services}</Link>
          <Link href="#studio">{nav.studio}</Link>
          <Link href="#reviews">{nav.reviews}</Link>
        </nav>
        <Link className="languageSwitch" href={dictionary.alternateHref} hrefLang={locale === "en" ? "sw" : "en"}>
          {dictionary.alternateLanguage}
        </Link>
        <Link className="editorialBookLink" href={localizedPath(locale, "/book")}>
          {nav.book}
        </Link>
        <button
          className="menuToggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="editorial-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span className="srOnly">Toggle navigation</span>
        </button>
        <nav
          className={`mobileMenu editorialMobileMenu${menuOpen ? " isOpen" : ""}`}
          id="editorial-mobile-menu"
          aria-label="Mobile navigation"
        >
          <Link href="#work" onClick={() => setMenuOpen(false)}>{nav.work}</Link>
          <Link href="#services" onClick={() => setMenuOpen(false)}>{nav.services}</Link>
          <Link href="#studio" onClick={() => setMenuOpen(false)}>{nav.studio}</Link>
          <Link href="#reviews" onClick={() => setMenuOpen(false)}>{nav.reviews}</Link>
          <Link href={localizedPath(locale, "/book")} onClick={() => setMenuOpen(false)}>{nav.book}</Link>
          <Link href={dictionary.alternateHref} hrefLang={locale === "en" ? "sw" : "en"} onClick={() => setMenuOpen(false)}>
            {dictionary.alternateLanguage} · {dictionary.languageName}
          </Link>
        </nav>
      </header>

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
