import type { Locale } from "../i18n";
import type { Project } from "./types";

const images = [
  ["exim-townhall-stage.webp", "Speaker presenting at the Exim Bank Town Hall", "Ideas on stage"],
  ["exim-townhall-speaker.webp", "Exim Bank team member speaking into a microphone", "Voices from the team"],
  ["exim-townhall-audience.webp", "Attendee standing among guests", "Inside the audience"],
  ["exim-townhall-arrival.webp", "Guest walking through the Town Hall audience", "A shared moment"],
  ["exim-townhall-awards.webp", "Exim Bank award recipients on stage", "Recognition"],
  ["exim-townhall-presentation.webp", "Business presentation at the Town Hall", "Progress in focus"],
  ["exim-townhall-presentation-wide.webp", "Wide view of the Town Hall presentation", "The wider picture"],
  ["exim-townhall-celebration.webp", "Guests celebrating during the Town Hall", "Celebration"],
] as const;

export function localProjects(locale: Locale): Project[] {
  const sw = locale === "sw";
  return [{
    slug: "exim-bank-h1-2026-town-hall",
    locale,
    client: "Exim Bank",
    title: "Exim Bank H1 2026 Town Hall",
    category: sw ? "Tukio la kampuni" : "Corporate event",
    year: "2026",
    summary: sw
      ? "Hadithi ya filamu na picha inayofuata watu, mawazo na matukio yaliyoshirikishwa katika mkutano wa katikati ya mwaka wa Exim Bank."
      : "A film and photography story following the people, ideas and shared moments behind Exim Bank's mid-year gathering.",
    location: "Dar es Salaam",
    services: sw ? "Picha za tukio · Filamu fupi" : "Event photography · Highlight film",
    coverImage: "/work/exim-bank/exim-townhall-stage.webp",
    gallery: images.map(([file, alt, caption]) => ({ src: `/work/exim-bank/${file}`, alt, caption })),
    video: {
      streamUid: process.env.CLOUDFLARE_STREAM_EXIM_UID,
      mp4: "https://b13219.github.io/vault/assets/work/exim-bank/exim-bank-highlight.mp4",
      poster: "/work/exim-bank/exim-townhall-stage.webp",
      duration: "01:56",
    },
  }];
}

