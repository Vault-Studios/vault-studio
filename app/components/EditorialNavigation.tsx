"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dictionaries, localizedPath, type Locale } from "../../lib/i18n";

export default function EditorialNavigation({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const { nav } = dictionary;
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    // Safari does not focus buttons on tap, so Escape must not depend on
    // keyboard focus already being inside the header.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="editorialNav">
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
        ref={toggleRef}
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
  );
}
