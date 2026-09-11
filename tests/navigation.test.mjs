import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const home = read("app/components/VaultHome.tsx");
const hero = read("app/components/DepthHero.tsx");
const navigation = read("app/components/EditorialNavigation.tsx");
const css = read("app/globals.css");
const navRule = css.match(/\.editorialNav \{([^}]+)\}/)[1];

test("fixed navigation lives outside the isolated animated hero and page content", () => {
  assert.match(home, /<EditorialNavigation locale=\{locale\} \/>\s*<main/);
  assert.doesNotMatch(hero, /<header|editorialNav|menuOpen/);
  assert.match(navRule, /position: fixed/);
  assert.match(navRule, /top: 0/);
  assert.match(navRule, /z-index: 100/);
  assert.match(navRule, /pointer-events: auto/);
  assert.match(navRule, /background: rgba\(8, 8, 7, \.96\)/);
  assert.doesNotMatch(navRule, /(?:opacity|transform|animation|will-change):/);
  assert.doesNotMatch(navigation, /data-scroll-story|--hero-progress|addEventListener\("scroll"/);
});

test("navigation preserves localized booking links, keyboard escape and visible focus", () => {
  assert.match(navigation, /<Link className="editorialBookLink" href=\{localizedPath\(locale, "\/book"\)\}/);
  assert.match(navigation, /href=\{dictionary.alternateHref\}/);
  assert.match(navigation, /aria-expanded=\{menuOpen\}/);
  assert.match(navigation, /aria-controls="editorial-mobile-menu"/);
  assert.match(navigation, /event.key === "Escape"/);
  assert.match(navigation, /toggleRef.current\?\.focus\(\)/);
  assert.match(navigation, /document.addEventListener\("keydown", closeOnEscape\)/);
  assert.match(navigation, /document.removeEventListener\("keydown", closeOnEscape\)/);
  assert.match(css, /\.editorialNav button:focus-visible \{\s*outline: 2px solid/);
});

test("mobile navigation opens only below desktop breakpoint and fits short viewports", () => {
  const mobile = css.slice(css.indexOf("@media (max-width: 980px) {"));
  assert.match(css, /\.editorialNav \.menuToggle,\s*\.editorialNav \.editorialMobileMenu \{\s*display: none/);
  assert.match(mobile, /\.editorialNav \.desktopNav \{\s*display: none/);
  assert.match(mobile, /\.editorialNav \.editorialMobileMenu.isOpen \{\s*display: flex/);
  assert.match(mobile, /max-height: calc\(100svh - 84px\);\s*overflow-y: auto/);
  assert.match(navigation, /matchMedia\("\(min-width: 981px\)"\)/);
  assert.match(navigation, /if \(desktop.matches\) setMenuOpen\(false\)/);
  assert.doesNotMatch(mobile, /\.editorialBookLink \{\s*display: none/);
});
