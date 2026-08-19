"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "../../lib/content/types";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";
import EximGallery from "./EximGallery";

export default function EximCaseStudy({ project, locale, index = 0, total = 1 }: { project: Project; locale: Locale; index?: number; total?: number }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const number = String(index + 1).padStart(2, "0");
  const count = String(total).padStart(2, "0");
  const sw = locale === "sw";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); opener.current?.focus(); };
  }, [open]);

  return <>
    <button className="projectCard portfolioCard" style={{ minHeight: "min(68vh, 660px)" }} type="button" ref={opener} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <img src={project.coverImage} alt={`${project.title} preview`} loading={index > 1 ? "lazy" : "eager"} />
      <span className="projectCardShade" />
      <span className="projectCardNumber">{number} / {count}</span>
      <span className="projectCardOpen" aria-hidden="true">↗</span>
      <span className="projectCardMeta">
        <small>{project.category} · {project.year}</small>
        <strong style={{ fontSize: "clamp(2.65rem, 5vw, 5.8rem)" }}>{project.client}<br />{project.title.replace(`${project.client} `, "")}</strong>
        <em>{sw ? "Fungua mradi kamili" : "View the full project"}</em>
      </span>
    </button>
    <div className={`caseStudy${open ? " isOpen" : ""}`} aria-hidden={!open}>
      <div className="caseStudyBackdrop" onClick={() => setOpen(false)} />
      <article className="caseStudyPanel" role="dialog" aria-modal="true" aria-labelledby={`project-title-${project.slug}`}>
        <div className="caseStudyBar">
          <span>Vault / {sw ? "Kazi" : "Selected work"} / {number}</span>
          <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="Close project">{sw ? "Funga" : "Close"} <i aria-hidden="true">×</i></button>
        </div>
        <div className="caseStudyIntro shell">
          <div><span>{number} / {project.category}</span><h3 id={`project-title-${project.slug}`}>{project.client}<br />{project.title.replace(`${project.client} `, "")}</h3></div>
          <div className="caseStudyCopy">
            <p>{project.summary}</p>
            <dl>
              <div><dt>{sw ? "Eneo" : "Location"}</dt><dd>{project.location}</dd></div>
              <div><dt>{sw ? "Mwaka" : "Year"}</dt><dd>{project.year}</dd></div>
              <div><dt>{sw ? "Huduma" : "Services"}</dt><dd>{project.services}</dd></div>
            </dl>
            {project.sourceUrl && <p style={{ marginTop: 24 }}><a href={project.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#d5a545", textDecoration: "underline" }}>{sw ? "Tazama albamu ya chanzo ↗" : "View source album ↗"}</a></p>}
          </div>
        </div>
        {(project.video.streamUid || project.video.mp4) && <div className="featuredFilm">
          {project.video.streamUid ? <iframe src={`https://customer-${project.video.streamUid}.cloudflarestream.com/${project.video.streamUid}/iframe`} title={`${project.title} highlight film`} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video controls loop muted playsInline preload="metadata" poster={project.video.poster} aria-label={`${project.title} highlight film`}><source src={project.video.mp4} type="video/mp4" /></video>}
          <span className="featuredFilmLabel">{sw ? "Filamu fupi" : "Highlight film"}{project.video.duration ? ` · ${project.video.duration}` : ""}</span>
        </div>}
        <EximGallery slides={project.gallery} />
        <div className="caseStudyCta shell"><div><span>{sw ? "Una hadithi yako?" : "Have a story of your own?"}</span><h4>{sw ? "Tutengeneze inayofuata." : "Let's create the next one."}</h4></div><a href={localizedPath(locale, "/book")}>{sw ? "Anzisha mradi" : "Start a project"} <span aria-hidden="true">↗</span></a></div>
      </article>
    </div>
  </>;
}
