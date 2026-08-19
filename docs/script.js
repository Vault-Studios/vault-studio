const story = document.querySelector(".motion-story");
const motionObject = document.querySelector(".motion-object");
const intro = document.querySelector(".motion-intro");
const scenes = [...document.querySelectorAll(".motion-scene")];
const finalScene = document.querySelector(".motion-final");
const progressBar = document.querySelector(".motion-progress b");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const caseStudy = document.querySelector("#exim-case-study");
const caseStudyOpener = document.querySelector("[data-open-case-study]");
const caseStudyCloseButtons = [...document.querySelectorAll("[data-close-case-study]")];
let caseStudyPushedState = false;

function openCaseStudy(updateHistory = true) {
  if (!caseStudy) return;
  caseStudy.classList.add("is-open");
  caseStudy.setAttribute("aria-hidden", "false");
  document.body.classList.add("case-study-open");
  caseStudy.querySelector(".case-study-bar button")?.focus();
  if (updateHistory && window.location.hash !== "#exim-bank") {
    window.history.pushState({ caseStudy: true }, "", "#exim-bank");
    caseStudyPushedState = true;
  }
}

function closeCaseStudy(fromHistory = false) {
  if (!caseStudy?.classList.contains("is-open")) return;
  caseStudy.classList.remove("is-open");
  caseStudy.setAttribute("aria-hidden", "true");
  document.body.classList.remove("case-study-open");
  caseStudy.querySelector("video")?.pause();
  if (!fromHistory && caseStudyPushedState && window.location.hash === "#exim-bank") {
    caseStudyPushedState = false;
    window.history.back();
  } else if (!fromHistory && window.location.hash === "#exim-bank") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#work`);
  }
  caseStudyOpener?.focus();
}

caseStudyOpener?.addEventListener("click", () => openCaseStudy());
caseStudyCloseButtons.forEach((button) => button.addEventListener("click", () => closeCaseStudy()));
window.addEventListener("popstate", () => {
  if (window.location.hash === "#exim-bank") openCaseStudy(false);
  else closeCaseStudy(true);
});
document.addEventListener("keydown", (event) => {
  if (!caseStudy?.classList.contains("is-open")) return;
  if (event.key === "Escape") closeCaseStudy();
  if (event.key !== "Tab") return;
  const focusable = [...caseStudy.querySelectorAll('button, a[href], video[controls], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute("disabled"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
if (window.location.hash === "#exim-bank") openCaseStudy(false);

const gallery = document.querySelector(".project-gallery");
if (gallery) {
  const slides = [...gallery.querySelectorAll(".gallery-viewport figure")];
  const dots = gallery.querySelector(".gallery-dots");
  const counter = gallery.querySelector(".gallery-caption span");
  const caption = gallery.querySelector(".gallery-caption p");
  let active = 0;
  let paused = false;
  let touchStart = null;

  const showSlide = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === active;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      const image = slide.querySelector("img");
      image.alt = isActive ? (image.dataset.alt || image.alt) : "";
    });
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === active);
      dot.toggleAttribute("aria-current", dotIndex === active);
    });
    counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    caption.textContent = slides[active].dataset.caption;
  };

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show photo ${index + 1}: ${slide.dataset.caption}`);
    dot.addEventListener("click", () => showSlide(index));
    dots.append(dot);
  });

  gallery.querySelector("[data-gallery-prev]").addEventListener("click", () => showSlide(active - 1));
  gallery.querySelector("[data-gallery-next]").addEventListener("click", () => showSlide(active + 1));
  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showSlide(active - 1);
    if (event.key === "ArrowRight") showSlide(active + 1);
  });
  gallery.addEventListener("pointerenter", () => { paused = true; });
  gallery.addEventListener("pointerleave", () => { paused = false; });
  gallery.addEventListener("focusin", () => { paused = true; });
  gallery.addEventListener("focusout", (event) => {
    if (!gallery.contains(event.relatedTarget)) paused = false;
  });
  gallery.addEventListener("touchstart", (event) => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
  gallery.addEventListener("touchend", (event) => {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 45) showSlide(active + (distance < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  showSlide(0);
  if (!reducedMotion) {
    window.setInterval(() => { if (!paused) showSlide(active + 1); }, 6500);
  }
}

const stops = [0, 0.16, 0.32, 0.5, 0.68, 0.84, 1];
const tracks = {
  x: [30, 19, 26, 0, -25, 0, 0],
  y: [64, 6, -4, 0, 5, 0, -8],
  scale: [0.52, 0.76, 0.9, 2.45, 0.78, 1.5, 2.65],
  rotate: [-13, -4, 7, 0, -7, 2, 0],
  radius: [44, 36, 28, 2, 34, 18, 0],
};

let target = 0;
let current = 0;
let frame = 0;

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const between = (progress, start, end) =>
  smooth((progress - start) / (end - start));

function interpolate(progress, values) {
  if (progress <= stops[0]) return values[0];
  if (progress >= stops.at(-1)) return values.at(-1);
  const index = stops.findIndex((stop) => stop >= progress);
  const start = index - 1;
  const local = smooth(
    (progress - stops[start]) / (stops[index] - stops[start])
  );
  return values[start] + (values[index] - values[start]) * local;
}

function sceneOpacity(progress, start, end) {
  return (
    between(progress, start, start + 0.055) *
    (1 - between(progress, end - 0.055, end))
  );
}

function measure() {
  const rect = story.getBoundingClientRect();
  return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
}

function render(progress) {
  const x = interpolate(progress, tracks.x);
  const y = interpolate(progress, tracks.y);
  const scale = interpolate(progress, tracks.scale);
  const rotate = reducedMotion ? 0 : interpolate(progress, tracks.rotate);
  const radius = interpolate(progress, tracks.radius);
  const introExit = between(progress, 0.08, 0.2);
  const finalIn = between(progress, 0.83, 0.93);

  motionObject.style.setProperty("--x", `${x}vw`);
  motionObject.style.setProperty("--y", `${y}vh`);
  motionObject.style.setProperty("--scale", scale);
  motionObject.style.setProperty("--rotate", `${rotate}deg`);
  motionObject.style.setProperty("--radius", `${radius}px`);
  intro.style.opacity = 1 - introExit;
  intro.style.transform = `translateY(calc(-50% - ${introExit * 48}px))`;

  scenes.forEach((scene, index) => {
    const start = 0.2 + index * 0.2;
    const end = start + 0.2;
    const enter = between(progress, start, start + 0.07);
    const exit = between(progress, end - 0.06, end);
    scene.style.opacity = sceneOpacity(progress, start, end);
    scene.style.transform = `translateY(calc(-50% + ${
      (1 - enter) * 42 - exit * 32
    }px))`;
  });

  finalScene.style.opacity = finalIn;
  finalScene.style.transform = `translateY(${(1 - finalIn) * 35}px)`;
  progressBar.style.transform = `scaleX(${progress})`;
}

function animate() {
  const next = reducedMotion ? target : current + (target - current) * 0.095;
  current = Math.abs(target - next) < 0.0003 ? target : next;
  render(current);
  if (current !== target) {
    frame = requestAnimationFrame(animate);
  } else {
    frame = 0;
  }
}

function update() {
  target = measure();
  if (!frame) frame = requestAnimationFrame(animate);
}

target = measure();
current = target;
render(current);
addEventListener("scroll", update, { passive: true });
addEventListener("resize", update);

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  mobileMenu.classList.toggle("is-open", !open);
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
  });
});

const stickyNav = document.querySelector(".nav");
const darkNavSections = ".review-stories, .services, .booking, .closing, .footer";
let navThemeFrame = 0;

function updateNavTheme() {
  navThemeFrame = 0;
  const sampleY = Math.min(stickyNav.offsetHeight / 2, innerHeight / 2);
  const activeSection = [...document.querySelectorAll("section, footer")].find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= sampleY && rect.bottom > sampleY;
  });
  stickyNav.classList.toggle("is-dark", Boolean(activeSection?.matches(darkNavSections)));
}

function requestNavThemeUpdate() {
  if (!navThemeFrame) navThemeFrame = requestAnimationFrame(updateNavTheme);
}

updateNavTheme();
addEventListener("scroll", requestNavThemeUpdate, { passive: true });
addEventListener("resize", requestNavThemeUpdate);

addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("is-open");
});

const languageToggle = document.querySelector(".language-toggle");
const originalTranslations = new WeakMap();
let currentLocale = (() => {
  try { return localStorage.getItem("vault-locale") === "sw" ? "sw" : "en"; }
  catch { return "en"; }
})();
let currentAvailability = { status: "available" };
const galleryCaptions = {
  en: ["Ideas on stage", "Voices from the team", "Inside the audience", "A shared moment", "Recognition", "Progress in focus", "The wider picture", "Celebration"],
  sw: ["Mawazo jukwaani", "Sauti za timu", "Ndani ya hadhira", "Wakati wa pamoja", "Kutambua mafanikio", "Maendeleo yakionekana", "Picha pana", "Sherehe"],
};

const translationTargets = [
  { s: ".nav > nav:not(.mobile-menu) a:nth-child(1), .mobile-menu a:nth-child(1)", sw: "Kazi" },
  { s: ".nav > nav:not(.mobile-menu) a:nth-child(2), .mobile-menu a:nth-child(2)", sw: "Maoni" },
  { s: ".nav > nav:not(.mobile-menu) a:nth-child(3), .mobile-menu a:nth-child(3)", sw: "Huduma" },
  { s: ".nav > nav:not(.mobile-menu) a:nth-child(4), .mobile-menu a:nth-child(4)", sw: "Studio" },
  { s: ".nav > nav:not(.mobile-menu) a:nth-child(5), .mobile-menu a:nth-child(5)", sw: "Weka nafasi" },
  { s: ".motion-intro .eyebrow", sw: "Picha na filamu · Dar es Salaam" },
  { s: ".motion-intro h1", sw: "Hadithi zinapaswa<br><em>kukugusa.</em>", mode: "html" },
  { s: ".motion-intro-note", sw: "Sogeza taratibu. Tutakuongoza. ", mode: "lead" },
  { s: ".motion-scene-1 p", sw: "Sikiliza kwanza", mode: "tail" },
  { s: ".motion-scene-1 h2", sw: "Hadithi huanza kabla kamera haijafika." },
  { s: ".motion-scene-1 > div", sw: "Tunatafuta watu, msisimko na ukweli ndani ya wazo—kisha tunajenga mwelekeo wa picha kuzunguka kilicho muhimu." },
  { s: ".motion-scene-2 p", sw: "Ingia ndani", mode: "tail" },
  { s: ".motion-scene-2 h2", sw: "Karibu kiasi cha kuisikia." },
  { s: ".motion-scene-2 > div", sw: "Timu ndogo, mwanga ulioundwa na mtazamo wa kihalisi huacha nafasi kwa matukio ya kweli kutokea." },
  { s: ".motion-scene-3 p", sw: "Pata fremu", mode: "tail" },
  { s: ".motion-scene-3 h2", sw: "Picha moja inaweza kubeba hadithi nzima." },
  { s: ".motion-scene-3 > div", sw: "Ishara, kivuli, sauti na ukimya hugeuka kuwa kazi inayoeleweka kabla haijaelezwa." },
  { s: ".motion-final .eyebrow", sw: "Matokeo" },
  { s: ".motion-final h2", sw: "Kazi inayobaki akilini." },
  { s: ".motion-final a", sw: "Ingia kwenye maktaba ", mode: "lead" },
  { s: ".section-head .eyebrow", sw: "Kazi tulizochagua" },
  { s: ".section-head h2", sw: "Ndani ya hadithi." },
  { s: ".section-head > p", sw: "Filamu · Picha · Utamaduni wa kampuni · Matukio" },
  { s: ".project-card-meta small", sw: "Tukio la kampuni · Filamu na picha · 2026" },
  { s: ".project-card-meta em", sw: "Tazama mradi mzima" },
  { s: ".case-study-bar > span", sw: "Vault / Kazi tulizochagua / 01" },
  { s: ".case-study-bar button", sw: "Funga ", mode: "lead" },
  { s: ".case-study-intro > div:first-child > span", sw: "01 / Tukio la kampuni" },
  { s: ".case-study-copy > p", sw: "Hadithi ya filamu na picha inayofuata watu, mawazo na nyakati walizoshiriki katika mkutano wa katikati ya mwaka wa Exim Bank." },
  { s: ".case-study-copy dl div:nth-child(1) dt", sw: "Eneo" },
  { s: ".case-study-copy dl div:nth-child(2) dt", sw: "Mwaka" },
  { s: ".case-study-copy dl div:nth-child(3) dt", sw: "Huduma" },
  { s: ".case-study-copy dl div:nth-child(3) dd", sw: "Picha za tukio · Filamu ya muhtasari" },
  { s: ".featured-film-label", sw: "Filamu ya muhtasari · 01:56" },
  { s: ".case-study-cta > div > span", sw: "Una hadithi yako?" },
  { s: ".case-study-cta h4", sw: "Tutengeneze inayofuata." },
  { s: ".case-study-cta a", sw: "Anzisha mradi ", mode: "lead" },
  { s: ".archive-label .eyebrow", sw: "Maktaba inakua" },
  { s: ".archive-label > span", sw: "Hadithi nyingine tulizopewa zitaongezwa kadri muda unavyokwenda" },
  { s: ".review-lead .eyebrow", sw: "Ushahidi nyuma ya fremu" },
  { s: ".review-lead h2", sw: "Kazi ni muhimu. Na namna tulivyoifanya pia." },
  { s: ".review-lead > p:last-child", sw: "Maneno haya yanatoka moja kwa moja kwa wateja. Kila maoni yanathibitishwa na kuchapishwa kwa sauti ya mteja mwenyewe." },
  { s: ".review-empty span", sw: "Maktaba ya wateja inafunguliwa hivi karibuni" },
  { s: ".review-empty p", sw: "Tunawaalika washirika wa zamani kuacha maoni ya kwanza yaliyothibitishwa." },
  { s: ".review-invite-head .eyebrow", sw: "Uliwahi kufanya kazi na Vault?" },
  { s: ".review-invite-head h3", sw: "Eleza hadithi kwa maneno yako mwenyewe." },
  { s: ".review-invite-head > p:last-child", sw: "Maoni yako yatakaguliwa kwa ufupi ili kuthibitisha uhalisia kabla ya kuonekana hapa. Hatubadilishi maneno yako." },
  { s: ".review-form label:nth-of-type(1)", sw: "Jina lako *", mode: "lead" },
  { s: ".review-form label:nth-of-type(2)", sw: "Kampuni / shirika", mode: "lead" },
  { s: ".review-form label:nth-of-type(3)", sw: "Barua pepe ya uthibitisho *", mode: "lead" },
  { s: ".review-form label:nth-of-type(4)", sw: "Mradi tuliofanya pamoja *", mode: "lead" },
  { s: ".review-form label:nth-of-type(5)", sw: "Ukadiriaji wako *", mode: "lead" },
  { s: ".review-form select option:nth-child(1)", sw: "5 — Bora sana" },
  { s: ".review-form select option:nth-child(2)", sw: "4 — Nzuri sana" },
  { s: ".review-form select option:nth-child(3)", sw: "3 — Nzuri" },
  { s: ".review-form select option:nth-child(4)", sw: "2 — Wastani" },
  { s: ".review-form select option:nth-child(5)", sw: "1 — Inahitaji kuboreshwa" },
  { s: ".review-form label:nth-of-type(6)", sw: "Maoni yako *", mode: "lead" },
  { s: ".review-form textarea", sw: "Ni nini kilikuvutia kuhusu mchakato na kazi iliyokamilika?", mode: "placeholder" },
  { s: ".review-consent span", sw: "Ninathibitisha kuwa haya ni maoni ya kweli kuhusu uzoefu wangu na ninaruhusu Vault kuchapisha jina, shirika na maoni yangu." },
  { s: "#review-message", sw: "Barua pepe yako hutumika kwa uthibitisho tu na haitaonyeshwa." },
  { s: ".review-action button", sw: "Tuma maoni ", mode: "lead" },
  { s: ".services-lead .eyebrow", sw: "Tunachotengeneza" },
  { s: ".services-lead h2", sw: "Mshirika mmoja wa picha. Kila fremu imezingatiwa." },
  { s: ".services-lead > p:last-child", sw: "Timu ndogo yenye uzoefu, uzalishaji unaobadilika na mtandao wa kuaminika Tanzania na nje." },
  { s: ".service-list article:nth-child(1) h3", sw: "Kampeni" },
  { s: ".service-list article:nth-child(1) p", sw: "Picha kutoka wazo hadi kukamilika kwa chapa, uzinduzi na watu." },
  { s: ".service-list article:nth-child(2) h3", sw: "Nyaraka" },
  { s: ".service-list article:nth-child(2) p", sw: "Hadithi za watu zinazosimuliwa kwa utulivu, ukaribu na mtazamo ulio wazi." },
  { s: ".service-list article:nth-child(3) h3", sw: "Matukio" },
  { s: ".service-list article:nth-child(3) p", sw: "Uandishi wa haraka wenye hisia kwa vyombo vya habari, mitandao na kumbukumbu za muda mrefu." },
  { s: ".service-list article:nth-child(4) h3", sw: "Filamu" },
  { s: ".service-list article:nth-child(4) p", sw: "Filamu fupi, mahojiano na hadithi za chapa zenye mvuto wa sinema." },
  { s: ".availability-band .eyebrow", sw: "Hali ya sasa" },
  { s: ".availability-band .light-button", sw: "Angalia tarehe ", mode: "lead" },
  { s: ".booking-intro > .eyebrow", sw: "Maombi ya miradi" },
  { s: ".booking-intro > h2", sw: "Tuambie unachotaka watu <em>wahisi.</em>", mode: "html" },
  { s: ".form-heading h3", sw: "Anza na mambo muhimu." },
  { s: ".form-heading span", sw: "Kwa kawaida hujibu ndani ya siku 1" },
  { s: ".booking-form label:nth-of-type(1)", sw: "Jina lako *", mode: "lead" },
  { s: ".booking-form label:nth-of-type(2)", sw: "Kampuni / shirika", mode: "lead" },
  { s: ".booking-form label:nth-of-type(3)", sw: "Barua pepe *", mode: "lead" },
  { s: ".booking-form label:nth-of-type(4)", sw: "Simu / WhatsApp", mode: "lead" },
  { s: ".booking-form label:nth-of-type(5)", sw: "Unahitaji nini? *", mode: "lead" },
  { s: ".booking-form select option:nth-child(1)", sw: "Chagua huduma" },
  { s: ".booking-form select option:nth-child(2)", sw: "Kampeni ya chapa" },
  { s: ".booking-form select option:nth-child(3)", sw: "Nyaraka / uhariri" },
  { s: ".booking-form select option:nth-child(4)", sw: "Picha za tukio" },
  { s: ".booking-form select option:nth-child(5)", sw: "Picha binafsi" },
  { s: ".booking-form select option:nth-child(6)", sw: "Filamu / video" },
  { s: ".booking-form select option:nth-child(7)", sw: "Huduma nyingine" },
  { s: ".booking-form label:nth-of-type(6)", sw: "Tarehe unayopendelea kuanza", mode: "lead" },
  { s: ".booking-form label:nth-of-type(7)", sw: "Eneo la mradi", mode: "lead" },
  { s: ".booking-form label:nth-of-type(8)", sw: "Maelezo ya mradi *", mode: "lead" },
  { s: ".booking-form input[name='location']", sw: "Jiji / nchi", mode: "placeholder" },
  { s: ".booking-form textarea", sw: "Tunatengeneza nini, ni kwa ajili ya nani, na itaonekana wapi?", mode: "placeholder" },
  { s: "#form-message", sw: "Ombi lako litahifadhiwa kwa usalama na kutumwa studio." },
  { s: ".form-action button", sw: "Tuma maelezo ", mode: "lead" },
  { s: ".closing .eyebrow", sw: "Una hadithi akilini?" },
  { s: ".closing h2", sw: "Tutengeneze kazi ambayo watu wataikumbuka." },
  { s: ".closing a", sw: "Anzisha mradi ", mode: "lead" },
  { s: ".footer > div:nth-of-type(2) p", sw: "Mitandao ya kijamii inakuja hivi karibuni" },
];

function translationNode(element, mode) {
  if (mode === "tail") return [...element.childNodes].reverse().find((node) => node.nodeType === Node.TEXT_NODE);
  if (mode === "lead") return [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  return element;
}

function applyLocale(locale) {
  currentLocale = locale === "sw" ? "sw" : "en";
  document.documentElement.lang = currentLocale;
  document.title = currentLocale === "sw"
    ? "Vault — Studio ya Picha na Filamu"
    : "Vault — Photography & Film Studio";

  translationTargets.forEach(({ s, sw, mode = "text" }) => {
    document.querySelectorAll(s).forEach((element) => {
      const node = translationNode(element, mode);
      if (!node) return;
      if (!originalTranslations.has(node)) {
        originalTranslations.set(node, mode === "html" ? element.innerHTML
          : mode === "placeholder" ? element.getAttribute("placeholder") || ""
            : node.textContent);
      }
      const value = currentLocale === "sw" ? sw : originalTranslations.get(node);
      if (mode === "html") element.innerHTML = value;
      else if (mode === "placeholder") element.setAttribute("placeholder", value);
      else node.textContent = value;
    });
  });

  document.querySelectorAll(".language-toggle [data-language]").forEach((option) => {
    option.classList.toggle("is-active", option.dataset.language === currentLocale);
  });
  document.querySelectorAll(".project-gallery figure").forEach((slide, index) => {
    slide.dataset.caption = galleryCaptions[currentLocale][index] || slide.dataset.caption;
  });
  const activeSlide = document.querySelector(".project-gallery figure.is-active");
  const activeCaption = document.querySelector(".gallery-caption p");
  if (activeSlide && activeCaption) activeCaption.textContent = activeSlide.dataset.caption;
  languageToggle.setAttribute("aria-label", currentLocale === "en" ? "Badili kwenda Kiswahili" : "Switch to English");
  try { localStorage.setItem("vault-locale", currentLocale); } catch {}
  renderAvailability(currentAvailability);
}

const localeText = (english, swahili) => currentLocale === "sw" ? swahili : english;

languageToggle.addEventListener("click", () => applyLocale(currentLocale === "en" ? "sw" : "en"));

const supabaseUrl = "https://hxqsnztxokfemmysyjyw.supabase.co";
const supabaseKey = "sb_publishable_eu-_vai9eG2R89we1eIlxw_Quzds9c9";
const bookingSubmitApi = `${supabaseUrl}/rest/v1/booking_submissions`;
const availabilityReadApi =
  `${supabaseUrl}/rest/v1/availability_status?id=eq.studio&select=status,message_en,message_sw,next_available_date&limit=1`;

const availabilityPresets = {
  available: {
    en: { short: "Available", nav: "Available for select projects", title: "Now booking new commissions.", copy: "Share your dates, scope and location. We will confirm availability and the best production approach within one working day.", bookingTitle: "Project calendar open", bookingCopy: "Dates are confirmed after a quick brief review." },
    sw: { short: "Tunapatikana", nav: "Tunapokea miradi maalum", title: "Tunapokea kazi mpya.", copy: "Tueleze tarehe, ukubwa wa kazi na eneo. Tutathibitisha upatikanaji na njia bora ya uzalishaji ndani ya siku moja ya kazi.", bookingTitle: "Kalenda ya miradi iko wazi", bookingCopy: "Tarehe huthibitishwa baada ya kupitia maelezo kwa ufupi." },
  },
  limited: {
    en: { short: "Select dates", nav: "Limited dates available", title: "Limited availability for new commissions.", copy: "A small number of production dates remain open. Send the brief and we will confirm the best fit.", bookingTitle: "Limited dates available", bookingCopy: "Early enquiries are recommended for upcoming work." },
    sw: { short: "Tarehe chache", nav: "Tarehe chache zinapatikana", title: "Nafasi chache kwa kazi mpya.", copy: "Tarehe chache za uzalishaji bado ziko wazi. Tuma maelezo nasi tutathibitisha kama zinafaa.", bookingTitle: "Tarehe chache zinapatikana", bookingCopy: "Tunashauri uwasiliane mapema kwa kazi zijazo." },
  },
  engaged: {
    en: { short: "In production", nav: "Currently engaged", title: "Currently engaged on a project.", copy: "The studio is in production, but enquiries for future dates are welcome.", bookingTitle: "Currently in production", bookingCopy: "Future project enquiries are still welcome." },
    sw: { short: "Tuko kazini", nav: "Kwa sasa tuko kwenye mradi", title: "Kwa sasa tunatekeleza mradi.", copy: "Studio iko kwenye uzalishaji, lakini maombi ya tarehe zijazo yanakaribishwa.", bookingTitle: "Kwa sasa tuko kwenye uzalishaji", bookingCopy: "Maombi ya miradi ya baadaye bado yanakaribishwa." },
  },
  unavailable: {
    en: { short: "Bookings paused", nav: "Bookings temporarily paused", title: "Bookings are temporarily paused.", copy: "We are not accepting new commissions at the moment. Please check back for the next opening.", bookingTitle: "Project calendar paused", bookingCopy: "New dates will be announced here when bookings reopen." },
    sw: { short: "Nafasi zimesitishwa", nav: "Nafasi zimesitishwa kwa muda", title: "Upokeaji wa kazi umesitishwa kwa muda.", copy: "Kwa sasa hatupokei kazi mpya. Tafadhali rudi kuangalia nafasi inayofuata.", bookingTitle: "Kalenda ya miradi imesitishwa", bookingCopy: "Tarehe mpya zitatangazwa hapa nafasi zitakapofunguliwa tena." },
  },
};

function formatAvailabilityDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(currentLocale === "sw" ? "sw-TZ" : "en-TZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function renderAvailability(record = {}) {
  const status = availabilityPresets[record.status] ? record.status : "available";
  const preset = availabilityPresets[status][currentLocale];
  const nextDate = formatAvailabilityDate(record.next_available_date);
  const publicMessage = (currentLocale === "sw" ? record.message_sw : record.message_en)?.trim();
  const nextOpening = currentLocale === "sw" ? "Nafasi inayofuata" : "Next opening";
  const statusClasses = Object.keys(availabilityPresets).map((key) => `status-${key}`);
  const nav = document.querySelector("[data-availability-nav]");
  const band = document.querySelector("[data-availability-band]");
  const booking = document.querySelector("[data-booking-status]");

  [nav, band, booking].forEach((element) => {
    if (!element) return;
    element.classList.remove(...statusClasses);
    element.classList.add(`status-${status}`);
  });
  if (nav) {
    nav.dataset.statusShort = preset.short;
    nav.querySelector("[data-availability-nav-text]").textContent = preset.nav;
  }
  if (band) {
    band.querySelector("[data-availability-title]").textContent = publicMessage || preset.title;
    band.querySelector("[data-availability-copy]").textContent = nextDate && status !== "available"
      ? `${preset.copy} ${nextOpening}: ${nextDate}.`
      : preset.copy;
  }
  if (booking) {
    booking.querySelector("[data-booking-status-title]").textContent = preset.bookingTitle;
    booking.querySelector("[data-booking-status-copy]").textContent = nextDate && status !== "available"
      ? `${preset.bookingCopy} ${nextOpening}: ${nextDate}.`
      : preset.bookingCopy;
  }
}

fetch(availabilityReadApi, { headers: { apikey: supabaseKey } })
  .then((response) => (response.ok ? response.json() : []))
  .then(([availability]) => {
    if (!availability) return;
    currentAvailability = availability;
    renderAvailability(currentAvailability);
  })
  .catch(() => {});

applyLocale(currentLocale);

document.querySelector("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const message = document.querySelector("#form-message");
  const data = new FormData(form);
  const subject = encodeURIComponent(
    `Vault project enquiry — ${data.get("service") || "New project"}`
  );
  const body = encodeURIComponent(
    [
      `Name: ${data.get("name") || ""}`,
      `Company: ${data.get("company") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Phone / WhatsApp: ${data.get("phone") || ""}`,
      `Service: ${data.get("service") || ""}`,
      `Preferred date: ${data.get("date") || ""}`,
      `Location: ${data.get("location") || ""}`,
      "",
      "Brief:",
      data.get("brief") || "",
    ].join("\n")
  );
  const fallback = `mailto:rirovault@gmail.com?subject=${subject}&body=${body}`;

  if (data.get("website")) {
    message.textContent = localeText("Thank you. Your enquiry has been received.", "Asante. Ombi lako limepokelewa.");
    form.reset();
    return;
  }

  const id = crypto.randomUUID();
  button.disabled = true;
  message.textContent = localeText("Saving your project enquiry…", "Tunahifadhi ombi lako la mradi…");

  try {
    const response = await fetch(bookingSubmitApi, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id,
        name: data.get("name"),
        company: data.get("company") || "",
        email: data.get("email"),
        phone: data.get("phone") || "",
        service: data.get("service"),
        preferred_date: data.get("date") || null,
        location: data.get("location") || "",
        brief: data.get("brief"),
      }),
    });
    if (!response.ok) throw new Error("Unable to save enquiry");

    message.textContent = localeText(
      `Received — reference VLT-${id.slice(0, 8).toUpperCase()}. The studio will reply within one working day.`,
      `Tumepokea — kumbukumbu VLT-${id.slice(0, 8).toUpperCase()}. Studio itajibu ndani ya siku moja ya kazi.`
    );
    form.reset();
  } catch {
    message.replaceChildren(
      document.createTextNode(localeText("We could not save this enquiry. ", "Hatukuweza kuhifadhi ombi hili. ")),
      Object.assign(document.createElement("a"), {
        href: fallback,
        textContent: localeText("Email the brief instead.", "Tuma maelezo kwa barua pepe badala yake."),
      })
    );
  } finally {
    button.disabled = false;
  }
});

const reviewReadApi =
  `${supabaseUrl}/rest/v1/reviews_public?select=id,name,company,project,rating,review&order=approved_at.desc&limit=12`;
const reviewSubmitApi = `${supabaseUrl}/rest/v1/review_submissions`;
const reviewStack = document.querySelector("#review-stack");
const reviewInvite = document.querySelector(".review-invite");
const reviewEmpty = document.querySelector("#review-empty");
const reviewForm = document.querySelector("#review-form");
const reviewMessage = document.querySelector("#review-message");

function createReviewCard(review, index) {
  const card = document.createElement("article");
  const number = String(index + 1).padStart(2, "0");
  const stars = "★".repeat(Math.max(1, Math.min(5, Number(review.rating))));
  const attribution = [review.company, review.project].filter(Boolean).join(" · ");
  card.className = "review-card review-card-text";
  card.style.top = `${80 + index * 18}px`;

  const glow = document.createElement("div");
  glow.className = "review-glow";
  const count = document.createElement("div");
  count.className = "review-number";
  count.textContent = number;
  const rating = document.createElement("div");
  rating.className = "review-rating";
  rating.setAttribute("aria-label", `${review.rating} out of 5 stars`);
  rating.textContent = stars;
  const copy = document.createElement("div");
  copy.className = "review-copy";
  const quote = document.createElement("blockquote");
  quote.textContent = `“${review.review}”`;
  const meta = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = review.name;
  const project = document.createElement("span");
  project.textContent = attribution;
  meta.append(name, project);
  copy.append(quote, meta);
  card.append(glow, count, rating, copy);
  return card;
}

fetch(reviewReadApi, { headers: { apikey: supabaseKey } })
  .then((response) => (response.ok ? response.json() : []))
  .then((reviews = []) => {
    if (!reviews.length) return;
    reviewEmpty.remove();
    reviews.forEach((review, index) => {
      reviewStack.insertBefore(createReviewCard(review, index), reviewInvite);
    });
  })
  .catch(() => {});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = reviewForm.querySelector("button");
  const data = new FormData(reviewForm);
  button.disabled = true;

  if (data.get("website")) {
    reviewMessage.textContent = localeText(
      "Thank you. Your words are with the studio and will appear after approval.",
      "Asante. Maoni yako yamefika studio na yataonekana baada ya kuidhinishwa."
    );
    reviewForm.reset();
    button.disabled = false;
    return;
  }
  reviewMessage.textContent = localeText("Sending your review to the studio…", "Tunatuma maoni yako studio…");

  try {
    const response = await fetch(reviewSubmitApi, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: data.get("name"),
        company: data.get("company") || "",
        email: data.get("email"),
        project: data.get("project"),
        rating: Number(data.get("rating")),
        review: data.get("review"),
        consent: data.get("consent") === "on",
      }),
    });
    if (!response.ok) {
      throw new Error(localeText(
        "We could not save your review. Please check the form and try again.",
        "Hatukuweza kuhifadhi maoni yako. Kagua fomu kisha ujaribu tena."
      ));
    }
    reviewMessage.textContent = localeText(
      "Thank you. Your words are with the studio and will appear after approval.",
      "Asante. Maoni yako yamefika studio na yataonekana baada ya kuidhinishwa."
    );
    reviewForm.reset();
  } catch (error) {
    reviewMessage.textContent =
      error.message || localeText("We could not save your review. Please try again.", "Hatukuweza kuhifadhi maoni yako. Tafadhali jaribu tena.");
  } finally {
    button.disabled = false;
  }
});


/* Curated portfolio expansion — sourced from Vault's commissioned galleries. */
const curatedPortfolio = [{"client":"TMC · UNESCO","title":"World Press Freedom Day","meta":"Documentary event · 2026","summary":"Two days of conversations, movement and collective energy marking World Press Freedom Day in Dar es Salaam.","services":"Photography · Events · Documentary","cover":"https://live.staticflickr.com/65535/55237798523_90108110c4_b.jpg","source":"https://flic.kr/s/aHBqjCSjMN","images":[["https://live.staticflickr.com/65535/55237798523_90108110c4_b.jpg","World Press Freedom Day programme","Day one"],["https://live.staticflickr.com/65535/55237798488_9590332e74_b.jpg","Delegate at World Press Freedom Day","In conversation"],["https://live.staticflickr.com/65535/55237890084_34fb94355e_c.jpg","World Press Freedom Day gathering","The wider story"],["https://live.staticflickr.com/65535/55237306019_298a47ba83_b.jpg","Participants at the World Press Freedom Day fun run","Freedom in motion"]]},{"client":"TMC","title":"SASA CEO Learning Session","meta":"Leadership session · 2026","summary":"An intimate visual record of leaders exchanging knowledge, experience and practical ideas.","services":"Event photography · Portraiture","cover":"https://live.staticflickr.com/65535/55384019682_19466780a3_b.jpg","source":"https://flic.kr/s/aHBqjCYNdo","images":[["https://live.staticflickr.com/65535/55384019682_19466780a3_b.jpg","SASA CEO learning session group portrait","The cohort"],["https://live.staticflickr.com/65535/55384945476_aa52f5ae47_b.jpg","Leader speaking during the SASA session","Ideas shared"],["https://live.staticflickr.com/65535/55384945471_6e93b54287_b.jpg","Participants during the SASA session","Learning together"]]},{"client":"Paradigm Initiative · TMC","title":"Digital Rights Academy","meta":"Two-day academy · 2026","summary":"A two-day story of learning, debate and the people building a stronger culture of digital rights.","services":"Documentary · Photography · Events","cover":"https://live.staticflickr.com/65535/55352364856_1ac80df2a9_b.jpg","source":"https://flic.kr/s/aHBqjCXqVf","images":[["https://live.staticflickr.com/65535/55352364856_1ac80df2a9_b.jpg","Participant speaking at the Digital Rights Academy","A point of view"],["https://live.staticflickr.com/65535/55352364826_b18c837844_b.jpg","Digital Rights Academy participant","Listening closely"],["https://live.staticflickr.com/65535/55352788445_b713fb92d9_b.jpg","Discussion at the Digital Rights Academy","Exchange"],["https://live.staticflickr.com/65535/55350443115_5228e2694e_b.jpg","Speaker presenting at the Digital Rights Academy","Day one"],["https://live.staticflickr.com/65535/55350183338_831a788412_b.jpg","Academy participants in session","The room"],["https://live.staticflickr.com/65535/55350243544_02a6df5d24_b.jpg","Digital Rights Academy workshop moment","Working session"]]},{"client":"Africa Innotech Forum","title":"Africa Innotech Forum 2026","meta":"Innovation forum · 2026","summary":"From the press conference to the main forum, an energetic portrait of the people shaping Africa's technology future.","services":"Events · Campaign · Photography","cover":"https://live.staticflickr.com/65535/55338692865_14f87b66f8_b.jpg","source":"https://flic.kr/s/aHBqjCWz7n","images":[["https://live.staticflickr.com/65535/55338274351_0e7dc355f6_b.jpg","Africa Innotech Forum welcome stage","Opening frame"],["https://live.staticflickr.com/65535/55338692865_14f87b66f8_b.jpg","Africa Innotech Forum delegate","Inside the forum"],["https://live.staticflickr.com/65535/55337346942_9ee16e4c05_b.jpg","Africa Innotech Forum programme","Ideas in motion"],["https://live.staticflickr.com/65535/55247161202_d52d46bf93_b.jpg","Africa Innotech Forum press conference","Press room"],["https://live.staticflickr.com/65535/55248060161_7b9120d639_b.jpg","Speaker at the Innotech press conference","The announcement"],["https://live.staticflickr.com/65535/55248466340_c47a5417d4_b.jpg","Innotech press conference guests","Before the forum"]]},{"client":"Tech & Media Convergency","title":"Digital Policy Dialogues","meta":"Policy dialogues · 2026","summary":"A continuing series on AI, digital public infrastructure, creator financing and Tanzania's emerging digital revenue policy.","services":"Documentary · Portraiture · Events","cover":"https://live.staticflickr.com/65535/55301102055_997fe1102e_b.jpg","source":"https://thevault93.pixieset.com/fgdfundingwithoutframeworkstateandprivatefinancingofdigitalcreatorsintanzaniaanditsimplicationsformedia/","images":[["https://live.staticflickr.com/65535/55301102055_997fe1102e_b.jpg","Speaker at the inclusive digital futures dialogue","Digital futures"],["https://live.staticflickr.com/65535/55286181541_83e9490fed_b.jpg","Facilitator at the digital infrastructure dialogue","Beyond infrastructure"],["https://images.pixieset.com/854242311/e0aa9d134c32fbb5faaf9f7824a91975-cover.jpg","Funding without framework dialogue group","Creator financing"],["https://images.pixieset.com/854242311/891ebacd254544efb6b12e7f91d4a86c-large.jpg","Participant at the creator financing dialogue","Inside the dialogue"],["https://live.staticflickr.com/65535/55154847180_fd5c899c50_b.jpg","Digital revenue policy dialogue group","Taxing the clicks"],["https://live.staticflickr.com/65535/55154848130_aa315bf514_b.jpg","Participant at the digital revenue policy dialogue","Creator economy"]]}];
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".project-grid");
  const workSection = document.querySelector(".work-section");
  if (!grid || !workSection) return;
  const firstNumber = grid.querySelector(".project-card-number");
  if (firstNumber) firstNumber.textContent = "01 / 06";

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  curatedPortfolio.forEach((project, offset) => {
    const number = String(offset + 2).padStart(2, "0");
    const card = document.createElement("button");
    card.className = "project-card curated-project-card";
    card.type = "button";
    card.setAttribute("aria-haspopup", "dialog");
    card.innerHTML = `
      <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} preview" loading="lazy" />
      <span class="project-card-shade"></span><span class="project-card-number">${number} / 06</span>
      <span class="project-card-open" aria-hidden="true">↗</span>
      <span class="project-card-meta"><small>${escapeHtml(project.meta)}</small><strong>${escapeHtml(project.client)}<br />${escapeHtml(project.title)}</strong><em>View the full project</em></span>`;
    grid.appendChild(card);

    const modal = document.createElement("div");
    modal.className = "case-study curated-case-study";
    modal.setAttribute("aria-hidden", "true");
    const figures = project.images.map((image, imageIndex) => `
      <figure class="${imageIndex === 0 ? "is-active" : ""}" aria-hidden="${imageIndex ? "true" : "false"}" data-caption="${escapeHtml(image[2])}">
        <img src="${escapeHtml(image[0])}" alt="${imageIndex ? "" : escapeHtml(image[1])}" data-alt="${escapeHtml(image[1])}" loading="lazy" />
      </figure>`).join("");
    modal.innerHTML = `
      <div class="case-study-backdrop" data-curated-close></div>
      <article class="case-study-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(project.title)}">
        <div class="case-study-bar"><span>Vault / Selected work / ${number}</span><button type="button" data-curated-close>Close <i aria-hidden="true">×</i></button></div>
        <div class="case-study-intro shell"><div><span>${number} / ${escapeHtml(project.meta.split(" · ")[0])}</span><h3>${escapeHtml(project.client)}<br />${escapeHtml(project.title)}</h3></div>
        <div class="case-study-copy"><p>${escapeHtml(project.summary)}</p><dl><div><dt>Location</dt><dd>Dar es Salaam</dd></div><div><dt>Year</dt><dd>2026</dd></div><div><dt>Services</dt><dd>${escapeHtml(project.services)}</dd></div></dl><p class="source-album"><a href="${escapeHtml(project.source)}" target="_blank" rel="noreferrer">View source album ↗</a></p></div></div>
        <section class="project-gallery" aria-roledescription="carousel" aria-label="${escapeHtml(project.title)} gallery" tabindex="0">
          <div class="gallery-viewport" aria-live="polite">${figures}<div class="gallery-shade"></div>
          <div class="gallery-caption"><span>01 / ${String(project.images.length).padStart(2,"0")}</span><p>${escapeHtml(project.images[0][2])}</p></div>
          <div class="gallery-arrows"><button type="button" data-curated-prev aria-label="Previous photo">←</button><button type="button" data-curated-next aria-label="Next photo">→</button></div></div>
          <div class="gallery-dots" aria-label="Choose a photo"></div>
        </section>
        <div class="case-study-cta shell"><div><span>Have a story of your own?</span><h4>Let's create the next one.</h4></div><a href="#book" data-curated-close>Start a project <span aria-hidden="true">↗</span></a></div>
      </article>`;
    workSection.appendChild(modal);

    const close = () => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; card.focus(); };
    card.addEventListener("click", () => { modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; modal.querySelector("[data-curated-close]")?.focus(); });
    modal.querySelectorAll("[data-curated-close]").forEach((button) => button.addEventListener("click", close));
    let active = 0;
    const slides = [...modal.querySelectorAll(".project-gallery figure")];
    const captionCount = modal.querySelector(".gallery-caption span");
    const captionText = modal.querySelector(".gallery-caption p");
    const show = (next) => {
      active = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.classList.toggle("is-active", i === active); slide.setAttribute("aria-hidden", String(i !== active)); const image=slide.querySelector("img"); if(image) image.alt=i===active ? image.dataset.alt || "" : ""; });
      if (captionCount) captionCount.textContent = `${String(active+1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`;
      if (captionText) captionText.textContent = slides[active]?.dataset.caption || "";
    };
    modal.querySelector("[data-curated-prev]")?.addEventListener("click", () => show(active - 1));
    modal.querySelector("[data-curated-next]")?.addEventListener("click", () => show(active + 1));
    modal.addEventListener("keydown", (event) => { if(event.key==="Escape") close(); if(event.key==="ArrowLeft") show(active-1); if(event.key==="ArrowRight") show(active+1); });
  });
});
