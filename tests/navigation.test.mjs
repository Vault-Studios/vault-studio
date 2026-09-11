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

test("mobile selected work uses one shrinkable track without desktop gutters or implicit columns", () => {
  const mobile = css.slice(css.indexOf("@media (max-width: 640px) {", css.indexOf(".editorialNav {")));
  const grid = mobile.match(/\.editorialProjectList \{([^}]+)\}/)[1];
  assert.match(grid, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(grid, /gap: 70px 0;/);
  assert.match(mobile, /\.editorialProjectItem,\s*\.editorialProjectItem.item-2,\s*\.editorialProjectItem.item-3 \{\s*grid-column: 1 \/ -1;/);
  assert.match(css, /\.editorialProjectItem \{\s*min-width: 0;/);
  assert.match(css, /\.editorialProjectItem \.projectCardMeta strong \{\s*overflow-wrap: anywhere;/);
  assert.match(css, /\.editorialSectionHead > \* \{\s*min-width: 0;/);
  assert.match(css, /\.editorialSectionHead h2 \{\s*overflow-wrap: anywhere;/);
  assert.match(mobile, /\.editorialNav \{[^}]*--nav-edge: clamp\(16px, 4vw, 20px\)/);
});

test("moving decorative story text is clipped independently of essential content", () => {
  assert.match(home, /<span className="storyGhostLayer" aria-hidden="true">\s*<span className="storyGhostWord">/);
  assert.match(css, /\.storyGhostLayer \{[^}]*inset: 0;[^}]*overflow: clip;[^}]*pointer-events: none;/);
  assert.doesNotMatch(css.match(/\.editorialHome \{([^}]+)\}/)[1], /overflow(?:-x)?:/);
});

test("navigation spans the viewport independently of capped content shells", () => {
  assert.match(navigation, /<header className="editorialNav">/);
  assert.match(navRule, /width: 100%;/);
  assert.match(navRule, /padding-inline: var\(--nav-edge\)/);
  assert.match(navRule, /--nav-edge: clamp\(20px, 2.5vw, 48px\)/);
  assert.match(navRule, /grid-template-columns: auto minmax\(0, 1fr\) auto auto/);
  assert.doesNotMatch(navRule, /max-width:/);
  assert.match(css, /\.editorialNav \.desktopNav \{[^}]*justify-content: center/);
});

test("animated section headings stay within their viewport gutters", () => {
  assert.ok(css.includes("translate3d(clamp(calc((100% - 100vw) / 2), var(--story-shift), calc((100vw - 100%) / 2)), 0, 0)"));
});
