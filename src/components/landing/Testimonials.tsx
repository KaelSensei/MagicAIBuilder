"use client";

import { useTranslations } from "next-intl";

/** Testimonials -- 3 player review cards */
export function Testimonials() {
  const t = useTranslations("landing");

  const reviews = [
    { text: t("testimonials.review1Text"), author: t("testimonials.review1Author"), role: t("testimonials.review1Role") },
    { text: t("testimonials.review2Text"), author: t("testimonials.review2Author"), role: t("testimonials.review2Role") },
    { text: t("testimonials.review3Text"), author: t("testimonials.review3Author"), role: t("testimonials.review3Role") },
  ];

  return (
    <section className="landing-testimonials">
      <h2 className="reveal">{t("testimonials.heading")}</h2>
      <div className="testi-grid reveal">
        {reviews.map((r) => (
          <div key={r.author} className="testi-card">
            <div className="testi-stars">{"\u2605\u2605\u2605\u2605\u2605"}</div>
            <p className="testi-text">&ldquo;{r.text}&rdquo;</p>
            <div className="testi-author">{r.author}</div>
            <div className="testi-role">{r.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
