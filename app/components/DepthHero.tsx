"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { dictionaries, localizedPath } from "../../lib/i18n";

const motionStops = [0, 0.16, 0.32, 0.5, 0.68, 0.84, 1];

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function between(progress: number, start: number, end: number) {
  return smooth((progress - start) / (end - start));
}

function interpolate(progress: number, values: number[]) {
  const last = motionStops.length - 1;
  if (progress <= motionStops[0]) return values[0];
  if (progress >= motionStops[last]) return values[last];

  const index = motionStops.findIndex((stop) => stop >= progress);
  const start = index - 1;
  const local = smooth(
    (progress - motionStops[start]) /
      (motionStops[index] - motionStops[start])
  );

  return values[start] + (values[index] - values[start]) * local;
}

function sceneOpacity(progress: number, start: number, end: number) {
  return (
    between(progress, start, start + 0.055) *
    (1 - between(progress, end - 0.055, end))
  );
}

export default function DepthHero({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const { hero, nav } = dictionary;
  const sectionRef = useRef<HTMLElement>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const animationRef = useRef(0);
  const reducedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const measure = () => {
      const section = sectionRef.current;
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    };

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const next = reducedRef.current
        ? target
        : current + (target - current) * 0.095;

      currentRef.current = Math.abs(target - next) < 0.0003 ? target : next;
      setProgress(currentRef.current);

      if (currentRef.current !== target) {
        animationRef.current = window.requestAnimationFrame(animate);
      } else {
        animationRef.current = 0;
      }
    };

    const update = () => {
      targetRef.current = measure();
      if (!animationRef.current) {
        animationRef.current = window.requestAnimationFrame(animate);
      }
    };

    targetRef.current = measure();
    currentRef.current = targetRef.current;
    setProgress(currentRef.current);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const x = interpolate(progress, [30, 19, 26, 0, -25, 0, 0]);
  const y = interpolate(progress, [64, 6, -4, 0, 5, 0, -8]);
  const scale = interpolate(progress, [0.52, 0.76, 0.9, 2.45, 0.78, 1.5, 2.65]);
  const rotate = reducedRef.current
    ? 0
    : interpolate(progress, [-13, -4, 7, 0, -7, 2, 0]);
  const radius = interpolate(progress, [44, 36, 28, 2, 34, 18, 0]);
  const introExit = between(progress, 0.08, 0.2);
  const finalIn = between(progress, 0.83, 0.93);
  const objectStyle = {
    "--motion-x": `${x}vw`,
    "--motion-y": `${y}vh`,
    "--motion-scale": scale,
    "--motion-rotate": `${rotate}deg`,
    "--motion-radius": `${radius}px`,
  } as CSSProperties;

  return (
    <section className="motionStory" id="top" ref={sectionRef}>
      <div className="motionSticky">
        <div className="motionWash" aria-hidden="true" />

        <header className="nav motionNav shell">
          <Link className="brand" href="#top" aria-label="Vault home">
            <img
              className="brandLogo"
              src="/vault-logo-dark.png"
              alt="Vault"
            />
          </Link>
          <nav aria-label="Main navigation">
            <Link href="#work">{nav.work}</Link>
            <Link href="#reviews">{nav.reviews}</Link>
            <Link href="#services">{nav.services}</Link>
            <Link href="#process">{nav.studio}</Link>
            <Link href={localizedPath(locale, "/book")}>{nav.book}</Link>
          </nav>
          <button
            className="menuToggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span className="srOnly">Toggle navigation</span>
          </button>
          <Link className="languageSwitch" href={dictionary.alternateHref} hrefLang={locale === "en" ? "sw" : "en"}>
            {dictionary.alternateLanguage}
          </Link>
          <Link className="availability" href={localizedPath(locale, "/book")}>
            <i />
            {hero.availability}
          </Link>
          <nav
            className={`mobileMenu${menuOpen ? " isOpen" : ""}`}
            id="mobile-menu"
            aria-label="Mobile navigation"
          >
            <Link href="#work" onClick={() => setMenuOpen(false)}>{nav.work}</Link>
            <Link href="#reviews" onClick={() => setMenuOpen(false)}>{nav.reviews}</Link>
            <Link href="#services" onClick={() => setMenuOpen(false)}>{nav.services}</Link>
            <Link href="#process" onClick={() => setMenuOpen(false)}>{nav.studio}</Link>
            <Link href={localizedPath(locale, "/book")} onClick={() => setMenuOpen(false)}>{nav.book}</Link>
            <Link href={dictionary.alternateHref} onClick={() => setMenuOpen(false)}>{dictionary.alternateLanguage}</Link>
          </nav>
        </header>

        <div
          className="motionIntro shell"
          style={{
            opacity: 1 - introExit,
            transform: `translateY(calc(-50% - ${introExit * 48}px))`,
          }}
        >
          <p className="eyebrow dark">{hero.eyebrow}</p>
          <h1>
            {hero.title}
            <br />
            <em>{hero.emphasis}</em>
          </h1>
          <p className="motionIntroNote">
            {hero.note}
            <span>↓</span>
          </p>
        </div>

        <div
          className="motionObject"
          style={objectStyle}
          role="img"
          aria-label="A participant speaking at the Digital Rights Academy"
        >
          <div className="motionImage" style={{ backgroundImage: 'url("https://live.staticflickr.com/65535/55352364856_1ac80df2a9_b.jpg")', backgroundPosition: "center center" }} />
          <div className="motionObjectShade" />
          <div className="motionObjectTop">
            <span>VAULT / FIELD NOTES</span>
            <span>REC <i /></span>
          </div>
          <span className="viewCorner cornerOne" />
          <span className="viewCorner cornerTwo" />
          <span className="viewCorner cornerThree" />
          <span className="viewCorner cornerFour" />
          <div className="focusRing"><i /></div>
          <div className="motionObjectBottom">
            <span>DSM — TZ</span>
            <span>00:24:08</span>
          </div>
        </div>

        <div className="motionScenes shell" id="process">
          {hero.scenes.map((scene, index) => {
            const start = 0.2 + index * 0.2;
            const end = start + 0.2;
            return (
              <article
                className={`motionScene motionScene${index + 1}`}
                key={scene.number}
                style={{
                  opacity: sceneOpacity(progress, start, end),
                  transform: `translateY(calc(-50% + ${
                    (1 - between(progress, start, start + 0.07)) * 42 -
                    between(progress, end - 0.06, end) * 32
                  }px))`,
                }}
              >
                <p>
                  <span>{scene.number}</span>
                  {scene.kicker}
                </p>
                <h2>{scene.title}</h2>
                <div>{scene.copy}</div>
              </article>
            );
          })}
        </div>

        <div
          className="motionFinal shell"
          style={{
            opacity: finalIn,
            transform: `translateY(${(1 - finalIn) * 35}px)`,
          }}
        >
          <p className="eyebrow">{hero.result}</p>
          <h2>{hero.resultTitle}</h2>
          <Link href="#work">{hero.archive} <span>↘</span></Link>
        </div>

        <div className="motionProgress" aria-hidden="true">
          <span>01</span>
          <i><b style={{ transform: `scaleX(${progress})` }} /></i>
          <span>04</span>
        </div>
      </div>
    </section>
  );
}
