import Link from "next/link";
import { getProjects } from "../../lib/content";
import type { Locale } from "../../lib/i18n";
import { dictionaries, localizedPath } from "../../lib/i18n";
import { getPublicLandingMediaSlots, resolveLandingImage, resolveLandingProject } from "../../lib/landing-media";
import AvailabilityBand from "./AvailabilityBand";
import CinematicParallax from "./CinematicParallax";
import DepthHero from "./DepthHero";
import EditorialScrollStory from "./EditorialScrollStory";
import EximCaseStudy from "./EximCaseStudy";
import ReviewStories from "./ReviewStories";

const serviceCopy = {
  en: [
    ["01", "Photography", "Portraits, documentary coverage and defining campaign images."],
    ["02", "Film", "Human-led films, interviews and motion shaped with cinematic restraint."],
    ["03", "Commercial & Campaigns", "Visual systems that carry a brand from launch to long-term memory."],
  ],
  sw: [
    ["01", "Picha", "Picha za watu, nyaraka na kampeni zinazobeba wazo kuu."],
    ["02", "Filamu", "Filamu za watu, mahojiano na mwendo uliotengenezwa kwa ubora wa sinema."],
    ["03", "Biashara na Kampeni", "Mfumo wa picha unaobeba chapa kutoka uzinduzi hadi kumbukumbu ya muda mrefu."],
  ],
} as const;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default async function VaultHome({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const copy = dictionary.home;
  const [projects, landingSlots] = await Promise.all([getProjects(locale), getPublicLandingMediaSlots()]);
  const sw = locale === "sw";
  const heroProject = projects[2] || projects[0];
  const storyProject = projects[1] || projects[0];
  const featuredProject = projects[0];
  const defaultImage = "/work/exim-bank/exim-townhall-stage.webp";
  const imageFallback = (src: string | undefined, alt: string, sourceLabel?: string) => ({
    src: src || defaultImage,
    alt,
    sourceLabel,
  });
  const heroImage = resolveLandingImage(
    landingSlots,
    projects,
    "hero",
    locale,
    imageFallback(heroProject?.coverImage, heroProject ? `${heroProject.title} photographed by Vault` : "Vault production in Dar es Salaam", heroProject?.client),
  );
  const serviceSlotKeys = ["service_photography", "service_film", "service_commercial"] as const;
  const serviceImages = serviceSlotKeys.map((key, index) => {
    const project = projects[index % Math.max(1, projects.length)];
    return resolveLandingImage(
      landingSlots,
      projects,
      key,
      locale,
      imageFallback(project?.gallery[index]?.src || project?.coverImage, project?.gallery[index]?.alt || project?.title || "Vault project", project?.client),
    );
  });
  const parallaxImages = (["parallax_1", "parallax_2", "parallax_3"] as const).map((key, index) => {
    const project = projects[index];
    return resolveLandingImage(
      landingSlots,
      projects,
      key,
      locale,
      imageFallback(project?.gallery[0]?.src || project?.coverImage, project?.gallery[0]?.alt || project?.title || "Vault project", project?.client),
    );
  });
  const storyImage = resolveLandingImage(
    landingSlots,
    projects,
    "studio_story",
    locale,
    imageFallback(storyProject?.gallery[1]?.src || storyProject?.coverImage || "/work/exim-bank/exim-townhall-audience.webp", storyProject ? `${storyProject.title}, photographed by Vault` : "Vault project detail", storyProject?.client),
  );
  const selectedFeaturedProject = resolveLandingProject(landingSlots, projects, featuredProject);
  const takeoverImage = resolveLandingImage(
    landingSlots,
    projects,
    "featured_takeover_image",
    locale,
    imageFallback(selectedFeaturedProject?.gallery[4]?.src || selectedFeaturedProject?.coverImage, selectedFeaturedProject?.title || "Featured Vault project", selectedFeaturedProject?.client),
  );
  const closingImage = resolveLandingImage(
    landingSlots,
    projects,
    "closing_background",
    locale,
    { src: "", alt: "" },
  );

  return (
    <main className="editorialHome">
      <EditorialScrollStory />
      <DepthHero
        locale={locale}
        image={heroImage.src}
        imageAlt={heroImage.alt}
      />

      <section className="brandStatement shell storySequence" data-scroll-story aria-labelledby="brand-statement-title">
        <div className="storyPin brandStatementPin">
          <p className="editorialKicker">{sw ? "Tunachoamini" : "What we believe"}</p>
          <h2 id="brand-statement-title">
            {sw ? "Kamera huona tukio. Sisi tunatafuta kinacholifanya libaki." : "The camera sees the moment. We find what makes it stay."}
          </h2>
          <p>{sw ? "Vault ni studio ya picha na filamu ya Dar es Salaam, inayotengeneza hadithi za watu, chapa na taasisi kote Afrika." : "Vault is a Dar es Salaam photography and film studio creating human stories for brands, organisations and culture across Africa."}</p>
          <span className="storyGhostWord" aria-hidden="true">{sw ? "HADITHI" : "STORIES"}</span>
        </div>
      </section>

      <section className="editorialWork" id="work" data-scroll-story aria-labelledby="selected-work-title">
        <div className="editorialSectionHead shell">
          <div>
            <p className="editorialKicker">{copy.selectedWork}</p>
            <h2 id="selected-work-title">{sw ? "Hadithi tulizochagua." : "Selected stories."}</h2>
          </div>
          <p>{copy.disciplines}</p>
        </div>
        <div className="editorialProjectList shell">
          {projects.map((project, index) => (
            <div className={`editorialProjectItem item-${(index % 3) + 1}`} key={project.slug}>
              <EximCaseStudy project={project} locale={locale} index={index} total={projects.length} />
            </div>
          ))}
        </div>
        <p className="editorialArchiveNote shell">{copy.growing} — {copy.growingNote}</p>
      </section>

      <section className="editorialServices shell" id="services" data-scroll-story aria-labelledby="services-title">
        <div className="editorialSectionHead">
          <div>
            <p className="editorialKicker">{copy.servicesEyebrow}</p>
            <h2 id="services-title">{sw ? "Tunachotengeneza." : "What we create."}</h2>
          </div>
          <p>{copy.servicesCopy}</p>
        </div>
        <div className="editorialServiceList">
          {serviceCopy[locale].map(([number, title, description], index) => {
            const image = serviceImages[index];
            return (
              <article className="editorialService" key={number}>
                <div className="editorialServiceMedia">
                  <img src={image.src} alt={image.alt} loading="lazy" />
                </div>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CinematicParallax projects={projects} locale={locale} curatedImages={parallaxImages} />

      <section className="studioStory shell storySequence" id="studio" data-scroll-story aria-labelledby="studio-story-title">
        <div className="storyPin studioStoryPin">
          <div className="studioStoryMedia">
            <img src={storyImage.src} alt={storyImage.alt} loading="lazy" />
          </div>
          <div className="studioStoryCopy">
            <p className="editorialKicker">{sw ? "Studio" : "The studio"}</p>
            <h2 id="studio-story-title">{sw ? "Uwepo kabla ya vifaa." : "Presence before equipment."}</h2>
            <p>{sw ? "Tunafanya kazi kwa karibu, kwa utulivu na kwa umakini. Kila uzalishaji huanza kwa kusikiliza—kisha tunaunda mwanga, mwendo na mazingira bila kupoteza ukweli wa wakati huo." : "We work closely, quietly and with intent. Every production begins by listening—then we shape light, movement and atmosphere without losing the truth of the moment."}</p>
            <Link href={localizedPath(locale, "/book")}>{sw ? "Ongea na studio" : "Talk to the studio"} <Arrow /></Link>
          </div>
        </div>
      </section>

      {selectedFeaturedProject && (
        <section className="featuredTakeover" aria-label={sw ? "Mradi maalum" : "Featured project"}>
          <EximCaseStudy project={{ ...selectedFeaturedProject, coverImage: takeoverImage.src }} locale={locale} featured />
        </section>
      )}

      <ReviewStories locale={locale} />
      <AvailabilityBand locale={locale} />

      <section className={`editorialClosing${closingImage.src ? " hasMedia" : ""}`} aria-labelledby="closing-title">
        {closingImage.src && <img className="editorialClosingMedia" src={closingImage.src} alt="" loading="lazy" />}
        {closingImage.src && <span className="editorialClosingVeil" aria-hidden="true" />}
        <div className="shell">
          <p className="editorialKicker">{sw ? "Una mradi akilini?" : "Have a project in mind?"}</p>
          <h2 id="closing-title">{sw ? "Tuanzishe mazungumzo." : "Start a conversation."}</h2>
          <Link href={localizedPath(locale, "/book")}>{copy.start} <Arrow /></Link>
        </div>
      </section>

      <footer className="editorialFooter shell">
        <Link className="brand" href="#top" aria-label="Vault home">
          <img className="brandLogo" src="/vault-logo-dark.png" alt="Vault" />
        </Link>
        <p>Photography & Film<br />Dar es Salaam, Tanzania</p>
        <div>
          <a href="mailto:rirovault@gmail.com">rirovault@gmail.com</a>
          <Link href={dictionary.alternateHref}>{dictionary.alternateLanguage} · {dictionary.languageName}</Link>
        </div>
        <p>© 2026 Vault Studio</p>
      </footer>
    </main>
  );
}
