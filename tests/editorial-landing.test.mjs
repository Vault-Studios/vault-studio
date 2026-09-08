import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("editorial landing remains connected to CMS projects and existing conversion flows", async () => {
  const home = await readFile(new URL("app/components/VaultHome.tsx", root), "utf8");

  assert.match(home, /getProjects\(locale\)/);
  assert.match(home, /getPublicLandingMediaSlots\(\)/);
  assert.match(home, /<ReviewStories locale=\{locale\}/);
  assert.match(home, /<AvailabilityBand locale=\{locale\}/);
  assert.match(home, /localizedPath\(locale, "\/book"\)/);
  assert.doesNotMatch(home, /service_role|sb_secret_/);
});

test("editorial motion is progressive and reduced-motion safe", async () => {
  const [hero, parallax, css] = await Promise.all([
    readFile(new URL("app/components/DepthHero.tsx", root), "utf8"),
    readFile(new URL("app/components/CinematicParallax.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(parallax, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.editorialHeroMedia/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.cinematicParallax \{[\s\S]*height: auto/);
});

test("featured and selected work open the existing project experience", async () => {
  const [home, caseStudy] = await Promise.all([
    readFile(new URL("app/components/VaultHome.tsx", root), "utf8"),
    readFile(new URL("app/components/EximCaseStudy.tsx", root), "utf8"),
  ]);

  assert.match(home, /<EximCaseStudy[\s\S]*featured/);
  assert.match(caseStudy, /aria-haspopup="dialog"/);
  assert.match(caseStudy, /role="dialog" aria-modal="true"/);
  assert.match(caseStudy, /event\.key === "Escape"/);
});
