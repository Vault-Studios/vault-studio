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
  const [hero, parallax, controller, css] = await Promise.all([
    readFile(new URL("app/components/DepthHero.tsx", root), "utf8"),
    readFile(new URL("app/components/CinematicParallax.tsx", root), "utf8"),
    readFile(new URL("app/components/EditorialScrollStory.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(parallax, /prefers-reduced-motion: reduce/);
  assert.match(parallax, /data-parallax-layer/);
  assert.match(parallax, /--frame-opacity/);
  assert.doesNotMatch(parallax, /carousel|cinematicParallaxRail/);
  assert.match(controller, /requestAnimationFrame/);
  assert.match(controller, /addEventListener\("scroll"[\s\S]*passive: true/);
  assert.doesNotMatch(controller, /wheel|preventDefault/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.editorialHeroMedia/);
  assert.match(css, /\.cinematicParallaxScene,[\s\S]*position: absolute/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.cinematicParallax \{[\s\S]*height: auto/);
});

test("approved reviews end before the reachable submission form", async () => {
  const [reviews, css] = await Promise.all([
    readFile(new URL("app/components/ReviewStories.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(reviews, /className="reviewCards"[\s\S]*className="reviewInvite" id="leave-review"/);
  assert.match(reviews, /className="reviewEntry" href="#leave-review"/);
  assert.match(reviews, /className="reviewFloatingEntry" href="#leave-review"/);
  assert.match(reviews, /Acha maoni/);
  assert.match(css, /\.reviewCards \{[\s\S]*position: relative/);
  assert.match(css, /\.reviewInvite \{[\s\S]*z-index: 12/);
  assert.match(css, /\.reviewEntry \{/);
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
