"use client";

import { useTranslations } from "next-intl";

/** How it works -- 3 steps with connecting gradient line */
export function HowItWorks() {
  const t = useTranslations("landing");

  const steps = [
    { num: "I", title: t("how.step1Title"), text: t("how.step1Text") },
    { num: "II", title: t("how.step2Title"), text: t("how.step2Text") },
    { num: "III", title: t("how.step3Title"), text: t("how.step3Text") },
  ];

  return (
    <section className="landing-how" id="how">
      <div className="how-inner">
        <div className="section-label">{t("how.sectionLabel")}</div>
        <h2 className="reveal">
          {t.rich("how.heading", {
            br: () => <br />,
          })}
        </h2>
        <p className="how-subtitle reveal">
          {t("how.subtitle")}
        </p>
        <div className="steps reveal">
          {steps.map((s) => (
            <div key={s.num} className="step">
              <div className="step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
