"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";

type SubmitState = "idle" | "sending" | "success" | "error";

export default function BookPage({ locale = "en" }: { locale?: Locale } = {}) {
  const sw = locale === "sw";
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; reference?: string };

      if (!response.ok) {
        throw new Error(result.error || "We could not send your request.");
      }

      form.reset();
      setState("success");
      setMessage(
        `Brief received. Your reference is ${result.reference}. We will reply within one business day.`
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <main className="bookPage">
      <header className="nav bookNav shell">
        <Link className="brand" href={localizedPath(locale, "/")} aria-label="Vault home">
          <img
            className="brandLogo"
            src="/vault-logo-light.png"
            alt="Vault"
          />
        </Link>
        <Link className="backLink" href={localizedPath(locale, "/")}>
          ← {sw ? "Rudi studio" : "Back to the studio"}
        </Link>
      </header>

      <div className="bookLayout shell">
        <section className="bookIntro">
          <div>
            <p className="eyebrow">{sw ? "Maombi ya miradi" : "Project enquiries"}</p>
            <h1>
              {sw ? "Tuambie unachotaka" : "Tell us what"}
              <br />
              {sw ? "watu" : "you want people"}
              <br />
              {sw ? <><em>wahisi.</em></> : <>to <em>feel.</em></>}
            </h1>
          </div>
          <div className="bookingStatus">
            <i />
            <div>
              <strong>{sw ? "Kalenda ya miradi iko wazi" : "Project calendar open"}</strong>
              <p>
                {sw ? "Tarehe zinathibitishwa baada ya kupitia maelezo ya mradi. Kazi za haraka na safari huzingatiwa kivyake." : "Dates are confirmed after a quick brief review. Rush and travel enquiries are considered individually."}
              </p>
            </div>
          </div>
        </section>

        <section className="bookFormWrap">
          <div className="bookFormHead">
            <h2>{sw ? "Anza na mambo muhimu." : "Start with the essentials."}</h2>
            <span>{sw ? "Kwa kawaida tunajibu ndani ya siku 1" : "Usually replies in 1 day"}</span>
          </div>

          <form className="bookingForm" onSubmit={submitBooking}>
            <div className="field">
              <label htmlFor="name">{sw ? "Jina lako *" : "Your name *"}</label>
              <input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="company">{sw ? "Kampuni / taasisi" : "Company / organisation"}</label>
              <input id="company" name="company" autoComplete="organization" />
            </div>
            <div className="field">
              <label htmlFor="email">{sw ? "Barua pepe *" : "Email address *"}</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone / WhatsApp</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <div className="field">
              <label htmlFor="service">{sw ? "Unahitaji nini? *" : "What do you need? *"}</label>
              <select id="service" name="service" defaultValue="" required>
                <option value="" disabled>Select a service</option>
                <option value="campaign">Brand campaign</option>
                <option value="documentary">Documentary / editorial</option>
                <option value="event">Event coverage</option>
                <option value="portrait">Portrait session</option>
                <option value="motion">Film / motion</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">{sw ? "Tarehe unayopendelea kuanza" : "Preferred start date"}</label>
              <input id="date" name="date" type="date" />
            </div>
            <div className="field">
              <label htmlFor="budget">{sw ? "Bajeti inayokadiriwa" : "Estimated budget"}</label>
              <select id="budget" name="budget" defaultValue="">
                <option value="">Prefer to discuss</option>
                <option value="under-1m">Under TZS 1m</option>
                <option value="1m-3m">TZS 1m – 3m</option>
                <option value="3m-8m">TZS 3m – 8m</option>
                <option value="8m-plus">TZS 8m+</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="location">{sw ? "Eneo la mradi" : "Project location"}</label>
              <input id="location" name="location" placeholder="City / country" />
            </div>
            <div className="field full">
              <label htmlFor="brief">{sw ? "Maelezo ya mradi *" : "The brief *"}</label>
              <textarea
                id="brief"
                name="brief"
                required
                placeholder="What are we making, who is it for, and where will it be seen?"
              />
            </div>
            <div className="reviewHoneypot" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {message && (
              <p
                className={`formMessage ${state === "error" ? "error" : ""}`}
                role="status"
              >
                {message}
              </p>
            )}

            <div className="formAction">
              <p>
                By sending this brief, you agree that Vault may contact you
                about this project.
              </p>
              <button className="submitButton" type="submit" disabled={state === "sending"}>
                {state === "sending" ? (sw ? "Inatuma…" : "Sending…") : (sw ? "Tuma maelezo" : "Send the brief")}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
