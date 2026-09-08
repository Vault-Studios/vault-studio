"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";

type Review = {
  id: string;
  name: string;
  company: string;
  project: string;
  rating: number;
  review: string;
};

export default function ReviewStories({ locale }: { locale: Locale }) {
  const sw = locale === "sw";
  const copy = sw ? {
    verification: "Barua pepe yako hutumika kwa uthibitisho tu na haitaonyeshwa.",
    received: "Asante. Maoni yako yamefika studio na yataonekana baada ya kuthibitishwa.",
    sending: "Tunatuma maoni yako studio...",
    error: "Hatukuweza kuhifadhi maoni yako. Kagua fomu kisha ujaribu tena.",
    retry: "Hatukuweza kuhifadhi maoni yako. Tafadhali jaribu tena.",
  } : {
    verification: "Your email is used for verification only and is never displayed.",
    received: "Thank you. Your words are with the studio and will appear after approval.",
    sending: "Sending your review to the studio...",
    error: "We could not save your review. Please check the form and try again.",
    retry: "We could not save your review. Please try again.",
  };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState(copy.verification);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/reviews")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (data.get("website")) {
      setMessage(copy.received);
      form.reset();
      return;
    }

    setSubmitting(true);
    setMessage(copy.sending);

    try {
      const response = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.get("name"),
            company: data.get("company") || "",
            email: data.get("email"),
            project: data.get("project"),
            rating: Number(data.get("rating")),
            review: data.get("review"),
            consent: data.get("consent") === "on",
            website: data.get("website") || "",
          }),
        });

      if (!response.ok) {
        throw new Error(
          copy.error
        );
      }

      setMessage(copy.received);
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copy.retry
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviewStories" id="reviews">
      <a className="reviewFloatingEntry" href="#leave-review">
        {sw ? "Acha maoni" : "Leave a review"}
      </a>
      <div className="reviewLayout shell">
        <div className="reviewLead">
          <p className="eyebrow">{sw ? "Ushahidi nyuma ya fremu" : "Proof between the frames"}</p>
          <h2>{sw ? "Kazi ni muhimu. Na uzoefu wa kuitengeneza pia." : "The work matters. So does how it felt to make."}</h2>
          <p>
            {sw ? "Maneno haya yanatoka moja kwa moja kwa wateja. Kila maoni yanathibitishwa na kuchapishwa kwa sauti ya mteja." : "These words come directly from clients. Every review is verified and published in the client's own voice."}
          </p>
          <a className="reviewEntry" href="#leave-review">
            {sw ? "Acha maoni" : "Leave a review"} <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="reviewStack">
          <div className="reviewCards" aria-live="polite">
            {reviews.length ? (
              reviews.map((item, index) => (
                <article
                  className="reviewCard reviewCardText"
                  key={item.id}
                  style={{ top: `${96 + index * 14}px` }}
                >
                  <div className="reviewGlow" />
                  <div className="reviewNumber">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="reviewRating"
                    aria-label={`${item.rating} out of 5 stars`}
                  >
                    {"★".repeat(item.rating)}
                  </div>
                  <div className="reviewCopy">
                    <blockquote>“{item.review}”</blockquote>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {[item.company, item.project].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="reviewEmpty">
                <span>{sw ? "Maktaba ya wateja itafunguliwa hivi karibuni" : "Client archive opening soon"}</span>
                <p>
                  {sw ? "Tunawaalika washirika wetu wa awali kutuma maoni ya kwanza yaliyothibitishwa." : "We are inviting past collaborators to leave the first verified reflections."}
                </p>
              </div>
            )}
          </div>

          <div className="reviewInvite" id="leave-review">
            <div>
              <p className="eyebrow">{sw ? "Umefanya kazi na Vault?" : "Worked with Vault?"}</p>
              <h3>{sw ? "Eleza hadithi kwa maneno yako." : "Leave the story in your own words."}</h3>
              <p>
                {sw ? "Maoni yako yatakaguliwa kwa ufupi ili kuthibitisha uhalisi kabla hayajaonekana hapa. Hatubadilishi maneno yako." : "Your review is held for a quick authenticity check before it appears here. We never rewrite your words."}
              </p>
            </div>

            <form className="reviewForm" onSubmit={submitReview}>
              <label>
                {sw ? "Jina lako *" : "Your name *"}
                <input name="name" autoComplete="name" required maxLength={120} />
              </label>
              <label>
                {sw ? "Kampuni / shirika" : "Company / organisation"}
                <input
                  name="company"
                  autoComplete="organization"
                  maxLength={160}
                />
              </label>
              <label>
                {sw ? "Barua pepe ya uthibitisho *" : "Email for verification *"}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                {sw ? "Mradi tuliofanya pamoja *" : "Project we made together *"}
                <input name="project" required maxLength={160} />
              </label>
              <label>
                {sw ? "Tathmini yako *" : "Your rating *"}
                <select name="rating" required defaultValue="5">
                  <option value="5">5 — {sw ? "Bora sana" : "Exceptional"}</option>
                  <option value="4">4 — {sw ? "Nzuri sana" : "Very good"}</option>
                  <option value="3">3 — {sw ? "Nzuri" : "Good"}</option>
                  <option value="2">2 — {sw ? "Wastani" : "Fair"}</option>
                  <option value="1">1 — {sw ? "Inahitaji kuboreshwa" : "Needs improvement"}</option>
                </select>
              </label>
              <label className="reviewFieldFull">
                {sw ? "Maoni yako *" : "Your review *"}
                <textarea
                  name="review"
                  rows={5}
                  required
                  minLength={30}
                  maxLength={1600}
                  placeholder={sw ? "Ni nini kilichokuvutia kuhusu mchakato na kazi iliyokamilika?" : "What stood out about the process and the finished work?"}
                />
              </label>
              <label className="reviewHoneypot" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="reviewConsent reviewFieldFull">
                <input name="consent" type="checkbox" required />
                <span>
                  {sw ? "Ninathibitisha kuwa haya ni maoni yangu halisi na ninairuhusu Vault kuchapisha jina, shirika na maoni yangu." : "I confirm this reflects my genuine experience and allow Vault to publish my name, organisation and review."}
                </span>
              </label>
              <div className="reviewAction reviewFieldFull">
                <p>{message}</p>
                <button type="submit" disabled={submitting}>
                  {submitting ? (sw ? "Inatuma..." : "Sending...") : (sw ? "Tuma maoni" : "Submit review")} <span>↗</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
