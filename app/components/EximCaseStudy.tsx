"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "../../lib/content/types";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";
import EximGallery from "./EximGallery";

export default function EximCaseStudy({ project, locale }: { project: Project; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); opener.current?.focus(); };
  }, [open]);

  const sw = locale === "sw";
  return <>
    <div className="projectGrid shell">
      <button className="projectCard" type="button" ref={opener} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <img src={project.coverImage} alt={`${project.title} preview`} />
        <span className="projectCardShade" /><span className="projectCardNumber">01 / 01</span><span className="projectCardOpen" aria-hidden="true">↗</span>
        <span className="projectCardMeta"><small>{project.category} · {project.services} · {project.year}</small><strong>{project.client}<br />{project.title.replace(`${project.client} `, "")}</strong><em>{sw ? "Fungua mradi kamili" : "View the full project"}</em></span>
      </button>
    </div>
    <div className={`caseStudy${open ? " isOpen" : ""}`} aria-hidden={!open}>
      <div className="caseStudyBackdrop" onClick={() => setOpen(false)} />
      <article className="caseStudyPanel" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <div className="caseStudyBar"><span>Vault / {sw ? "Kazi" : "Selected work"} / 01</span><button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="Close project">{sw ? "Funga" : "Close"} <i aria-hidden="true">×</i></button></div>
        <div className="caseStudyIntro shell"><div><span>01 / {project.category}</span><h3 id="project-title">{project.client}<br />{project.title.replace(`${project.client} `, "")}</h3></div><div className="caseStudyCopy"><p>{project.summary}</p><dl><div><dt>{sw ? "Eneo" : "Location"}</dt><dd>{project.location}</dd></div><div><dt>{sw ? "Mwaka" : "Year"}</dt><dd>{project.year}</dd></div><div><dt>{sw ? "Huduma" : "Services"}</dt><dd>{project.services}</dd></div></dl></div></div>
        <div className="featuredFilm">
          {project.video.streamUid ? <iframe src={`https://customer-${project.video.streamUid}.cloudflarestream.com/${project.video.streamUid}/iframe`} title={`${project.title} highlight film`} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video controls loop muted playsInline preload="metadata" poster={project.video.poster} aria-label={`${project.title} highlight film`}><source src={project.video.mp4} type="video/mp4" /></video>}
          <span className="featuredFilmLabel">{sw ? "Filamu fupi" : "Highlight film"}{project.video.duration ? ` · ${project.video.duration}` : ""}</span>
        </div>
        <EximGallery slides={project.gallery} />
        <div className="caseStudyCta shell"><div><span>{sw ? "Una hadithi yako?" : "Have a story of your own?"}</span><h4>{sw ? "Tutengeneze inayofuata." : "Let's create the next one."}</h4></div><a href={localizedPath(locale, "/book")}>{sw ? "Anzisha mradi" : "Start a project"} <span aria-hidden="true">↗</span></a></div>
      </article>
    </div>
  </>;
}
