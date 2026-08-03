import Link from "next/link";
import { getProjects } from "../../lib/content";
import type { Locale } from "../../lib/i18n";
import { dictionaries, localizedPath } from "../../lib/i18n";
import DepthHero from "./DepthHero";
import EximCaseStudy from "./EximCaseStudy";
import ReviewStories from "./ReviewStories";
import AvailabilityBand from "./AvailabilityBand";

const services = {
  en: [
    ["01", "Campaigns", "Concept-to-delivery photography for brands, launches and people."],
    ["02", "Documentary", "Human stories told with restraint, intimacy and a clear point of view."],
    ["03", "Events", "Fast, atmospheric coverage built for press, social and long-term archives."],
    ["04", "Motion", "Short-form films, interviews and cinematic brand stories."],
  ],
  sw: [
    ["01", "Kampeni", "Picha kutoka wazo hadi uwasilishaji kwa chapa, uzinduzi na watu."],
    ["02", "Nyaraka", "Hadithi za watu zinazosimuliwa kwa ukaribu na mtazamo ulio wazi."],
    ["03", "Matukio", "Picha za haraka zenye hisia kwa vyombo vya habari, mitandao na kumbukumbu."],
    ["04", "Filamu", "Filamu fupi, mahojiano na hadithi za chapa zenye ubora wa sinema."],
  ],
};

function Arrow() { return <span aria-hidden="true">↗</span>; }

export default async function VaultHome({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const copy = dictionary.home;
  const projects = await getProjects(locale);

  return <main>
    <DepthHero locale={locale} />
    <section className="workSection" id="work">
      <div className="sectionHead shell"><div><p className="eyebrow dark">{copy.selectedWork}</p><h2>{copy.insideStory}</h2></div><p>{copy.disciplines}</p></div>
      {projects[0] && <EximCaseStudy project={projects[0]} locale={locale} />}
      <div className="archiveLabel shell"><p className="eyebrow dark">{copy.growing}</p><span>{copy.growingNote}</span></div>
    </section>
    <ReviewStories locale={locale} />
    <section className="services shell" id="services">
      <div className="servicesLead"><p className="eyebrow">{copy.servicesEyebrow}</p><h2>{copy.servicesTitle}</h2><p>{copy.servicesCopy}</p></div>
      <div className="serviceList">{services[locale].map(([number, title, description]) => <div className="serviceRow" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><Arrow /></div>)}</div>
    </section>
    <AvailabilityBand locale={locale} />
    <section className="closing"><div className="shell"><p className="eyebrow">{copy.closing}</p><h2>{copy.closingTitle}</h2><Link className="goldButton" href={localizedPath(locale, "/book")}>{copy.start} <Arrow /></Link></div></section>
    <footer className="footer shell"><div className="brand"><img className="brandLogo" src="/vault-logo-light.png" alt="Vault" /></div><div><p>Dar es Salaam, Tanzania</p><a href="mailto:rirovault@gmail.com">rirovault@gmail.com</a></div><div><Link href={dictionary.alternateHref}>{dictionary.alternateLanguage} · {dictionary.languageName}</Link></div><p>© 2026 Vault Studio</p></footer>
  </main>;
}
