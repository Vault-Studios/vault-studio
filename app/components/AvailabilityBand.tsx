"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { dictionaries, localizedPath } from "../../lib/i18n";

type Availability = {
  status?: "available" | "limited" | "engaged" | "unavailable";
  message_en?: string;
  message_sw?: string;
  next_available_date?: string | null;
};

export default function AvailabilityBand({ locale }: { locale: Locale }) {
  const copy = dictionaries[locale].home;
  const [availability, setAvailability] = useState<Availability>({ status: "available" });

  useEffect(() => {
    fetch("/api/availability").then((response) => response.ok ? response.json() : null).then((data) => { if (data) setAvailability(data); }).catch(() => undefined);
  }, []);

  const statusTitle = (locale === "sw" ? availability.message_sw : availability.message_en) || copy.statusTitle;
  const statusCopy = availability.status === "engaged"
    ? (locale === "sw" ? "Kwa sasa tuko kwenye mradi, lakini tunapokea maombi ya tarehe zijazo." : "The studio is currently engaged, but future project enquiries are welcome.")
    : availability.status === "limited"
      ? (locale === "sw" ? "Tarehe chache za uzalishaji bado zinapatikana." : "A small number of production dates remain available.")
      : availability.status === "unavailable"
        ? (locale === "sw" ? "Kwa sasa hatupokei miradi mipya. Tafadhali rudi kuangalia tarehe zijazo." : "We are not accepting new commissions at the moment. Please check back for the next opening.")
        : copy.statusCopy;
  const nextDate = availability.next_available_date
    ? new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-TZ", {
        day: "numeric", month: "long", year: "numeric",
      }).format(new Date(`${availability.next_available_date}T12:00:00`))
    : null;
  const datedStatusCopy = nextDate && availability.status !== "available"
    ? `${statusCopy} ${locale === "sw" ? "Tarehe inayofuata" : "Next opening"}: ${nextDate}.`
    : statusCopy;

  return <section className={`availabilityBand status-${availability.status ?? "available"}`}>
    <div className="shell"><div className="statusOrb"><i /></div><div><p className="eyebrow">{copy.status}</p><h2>{statusTitle}</h2><p>{datedStatusCopy}</p></div><Link className="lightButton" href={localizedPath(locale, "/book")}>{copy.checkDates} <span aria-hidden="true">↗</span></Link></div>
  </section>;
}

