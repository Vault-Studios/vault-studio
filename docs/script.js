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

addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("is-open");
});

const supabaseUrl = "https://hxqsnztxokfemmysyjyw.supabase.co";
const supabaseKey = "sb_publishable_eu-_vai9eG2R89we1eIlxw_Quzds9c9";
const bookingSubmitApi = `${supabaseUrl}/rest/v1/booking_submissions`;

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
    message.textContent = "Thank you. Your enquiry has been received.";
    form.reset();
    return;
  }

  const id = crypto.randomUUID();
  button.disabled = true;
  message.textContent = "Saving your project enquiry…";

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

    message.textContent = `Received — reference VLT-${id.slice(0, 8).toUpperCase()}. The studio will reply within one working day.`;
    form.reset();
  } catch {
    message.replaceChildren(
      document.createTextNode("We could not save this enquiry. "),
      Object.assign(document.createElement("a"), {
        href: fallback,
        textContent: "Email the brief instead.",
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
    reviewMessage.textContent =
      "Thank you. Your words are with the studio and will appear after approval.";
    reviewForm.reset();
    button.disabled = false;
    return;
  }
  reviewMessage.textContent = "Sending your review to the studio…";

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
      throw new Error(
        "We could not save your review. Please check the form and try again."
      );
    }
    reviewMessage.textContent =
      "Thank you. Your words are with the studio and will appear after approval.";
    reviewForm.reset();
  } catch (error) {
    reviewMessage.textContent =
      error.message || "We could not save your review. Please try again.";
  } finally {
    button.disabled = false;
  }
});
