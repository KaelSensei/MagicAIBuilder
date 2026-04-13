"use client";

import { useTranslations } from "next-intl";

const RICH_TAGS = {
  em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  br: () => <br />,
};

/** Pain section -- 4 problem cards that resonate with MTG players */
export function PainSection() {
  const t = useTranslations("landing");

  const pains = [
    { icon: "\u231B", title: t("pain.hoursTitle"), text: t("pain.hoursText") },
    { icon: "\uD83C\uDFB2", title: t("pain.synergyTitle"), text: t("pain.synergyText") },
    { icon: "\uD83D\uDCB8", title: t("pain.expensiveTitle"), text: t("pain.expensiveText") },
    { icon: "\uD83D\uDCC9", title: t("pain.curveTitle"), text: t("pain.curveText") },
  ];

  return (
    <section className="landing-pain">
      <div className="pain-inner">
        <div className="section-label">{t("pain.sectionLabel")}</div>
        <h2>
          {t.rich("pain.heading", RICH_TAGS)}
        </h2>
        <ul className="pain-list reveal">
          {pains.map((p) => (
            <li key={p.title} className="pain-item">
              <div className="pain-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
