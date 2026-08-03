export const locales = ["en", "sw"] as const;
export type Locale = (typeof locales)[number];

export const dictionaries = {
  en: {
    languageName: "English",
    alternateLanguage: "SW",
    alternateHref: "/sw",
    nav: { work: "Work", reviews: "Reviews", services: "Services", studio: "Studio", book: "Book a project" },
    hero: {
      eyebrow: "Photography & film · Dar es Salaam",
      title: "Stories should",
      emphasis: "move you.",
      note: "Scroll slowly. We'll take it from here.",
      result: "The result",
      resultTitle: "Work that stays with you.",
      archive: "Enter the archive",
      availability: "Available for select projects",
      scenes: [
        { number: "01", kicker: "Listen first", title: "The story starts before the camera arrives.", copy: "We find the people, tension and truth inside the brief—then build the visual direction around what matters." },
        { number: "02", kicker: "Step inside", title: "Close enough to feel it.", copy: "Small crews, shaped light and a documentary instinct leave room for the unscripted moment to happen." },
        { number: "03", kicker: "Find the frame", title: "One image can hold the whole story.", copy: "Gesture, shadow, sound and silence become work that can be understood before it is explained." },
      ],
    },
    home: {
      selectedWork: "Selected work", insideStory: "Inside the story.", disciplines: "Film · Photography · Corporate culture · Events",
      growing: "The archive is growing", growingNote: "More commissioned stories will be added over time",
      servicesEyebrow: "What we make", servicesTitle: "One visual partner. Every frame considered.", servicesCopy: "Small senior team, flexible production and a trusted network across Tanzania and beyond.",
      status: "Current status", statusTitle: "Now booking new commissions.", statusCopy: "Share your dates, scope and location. We will confirm availability and the best production approach within one working day.", checkDates: "Check dates",
      closing: "Have a story in mind?", closingTitle: "Let's make work people remember.", start: "Start a project",
    },
  },
  sw: {
    languageName: "Kiswahili",
    alternateLanguage: "EN",
    alternateHref: "/",
    nav: { work: "Kazi", reviews: "Maoni", services: "Huduma", studio: "Studio", book: "Weka nafasi" },
    hero: {
      eyebrow: "Picha na filamu · Dar es Salaam",
      title: "Hadithi zinapaswa",
      emphasis: "kukugusa.",
      note: "Sogeza taratibu. Tutakuongoza.",
      result: "Matokeo",
      resultTitle: "Kazi inayobaki akilini.",
      archive: "Ingia kwenye maktaba",
      availability: "Tunapokea miradi maalum",
      scenes: [
        { number: "01", kicker: "Sikiliza kwanza", title: "Hadithi huanza kabla kamera haijafika.", copy: "Tunatafuta watu, msisimko na ukweli ndani ya wazo—kisha tunajenga mwelekeo wa picha kuzunguka kilicho muhimu." },
        { number: "02", kicker: "Ingia ndani", title: "Karibu kiasi cha kuisikia.", copy: "Timu ndogo, mwanga ulioundwa na mtazamo wa kihalisi huacha nafasi kwa matukio ya kweli kutokea." },
        { number: "03", kicker: "Pata fremu", title: "Picha moja inaweza kubeba hadithi nzima.", copy: "Ishara, kivuli, sauti na ukimya hugeuka kuwa kazi inayoeleweka kabla haijaelezwa." },
      ],
    },
    home: {
      selectedWork: "Kazi tulizochagua", insideStory: "Ndani ya hadithi.", disciplines: "Filamu · Picha · Utamaduni wa kampuni · Matukio",
      growing: "Maktaba inakua", growingNote: "Hadithi nyingine tulizopewa zitajumuishwa kadri zinavyokamilika",
      servicesEyebrow: "Tunachotengeneza", servicesTitle: "Mshirika mmoja wa picha. Kila fremu imezingatiwa.", servicesCopy: "Timu ndogo yenye uzoefu, uzalishaji unaobadilika na mtandao wa kuaminika Tanzania na nje.",
      status: "Hali ya sasa", statusTitle: "Tunapokea kazi mpya.", statusCopy: "Tueleze tarehe, ukubwa wa kazi na eneo. Tutathibitisha upatikanaji na njia bora ya uzalishaji ndani ya siku moja ya kazi.", checkDates: "Angalia tarehe",
      closing: "Una hadithi akilini?", closingTitle: "Tutengeneze kazi ambayo watu wataikumbuka.", start: "Anzisha mradi",
    },
  },
} as const;

export function localizedPath(locale: Locale, path: string) {
  if (locale === "en") return path;
  if (path === "/") return "/sw";
  return `/sw${path}`;
}
