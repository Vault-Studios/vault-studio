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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState(
    "Your email is used for verification only and is never displayed."
  );
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
      setMessage(
        "Thank you. Your words are with the studio and will appear after approval."
      );
      form.reset();
      return;
    }

    setSubmitting(true);
    setMessage("Sending your review to the studio...");

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
          "We could not save your review. Please check the form and try again."
        );
      }

      setMessage(
        "Thank you. Your words are with the studio and will appear after approval."
      );
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviewStories" id="reviews">
      <div className="reviewLayout shell">
        <div className="reviewLead">
          <p className="eyebrow">{sw ? "Ushahidi nyuma ya fremu" : "Proof between the frames"}</p>
          <h2>{sw ? "Kazi ni muhimu. Na uzoefu wa kuitengeneza pia." : "The work matters. So does how it felt to make."}</h2>
          <p>
            {sw ? "Maneno haya yanatoka moja kwa moja kwa wateja. Kila maoni yanathibitishwa na kuchapishwa kwa sauti ya mteja." : "These words come directly from clients. Every review is verified and published in the client's own voice."}
          </p>
        </div>

        <div className="reviewStack" aria-live="polite">
          {reviews.length ? (
            reviews.map((item, index) => (
              <article
                className="reviewCard reviewCardText"
                key={item.id}
                style={{ top: `${80 + index * 18}px` }}
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
              <span>Client archive opening soon</span>
              <p>
                We are inviting past collaborators to leave the first verified
                reflections.
              </p>
            </div>
          )}

          <div className="reviewInvite">
            <div>
              <p className="eyebrow">{sw ? "Umefanya kazi na Vault?" : "Worked with Vault?"}</p>
              <h3>{sw ? "Eleza hadithi kwa maneno yako." : "Leave the story in your own words."}</h3>
              <p>
                Your review is held for a quick authenticity check before it
                appears here. We never rewrite your words.
              </p>
            </div>

            <form className="reviewForm" onSubmit={submitReview}>
              <label>
                Your name *
                <input name="name" autoComplete="name" required maxLength={120} />
              </label>
              <label>
                Company / organisation
                <input
                  name="company"
                  autoComplete="organization"
                  maxLength={160}
                />
              </label>
              <label>
                Email for verification *
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Project we made together *
                <input name="project" required maxLength={160} />
              </label>
              <label>
                Your rating *
                <select name="rating" required defaultValue="5">
                  <option value="5">5 — Exceptional</option>
                  <option value="4">4 — Very good</option>
                  <option value="3">3 — Good</option>
                  <option value="2">2 — Fair</option>
                  <option value="1">1 — Needs improvement</option>
                </select>
              </label>
              <label className="reviewFieldFull">
                Your review *
                <textarea
                  name="review"
                  rows={5}
                  required
                  minLength={30}
                  maxLength={1600}
                  placeholder="What stood out about the process and the finished work?"
                />
              </label>
              <label className="reviewHoneypot" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="reviewConsent reviewFieldFull">
                <input name="consent" type="checkbox" required />
                <span>
                  I confirm this reflects my genuine experience and allow Vault
                  to publish my name, organisation and review.
                </span>
              </label>
              <div className="reviewAction reviewFieldFull">
                <p>{message}</p>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Submit review"} <span>↗</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
