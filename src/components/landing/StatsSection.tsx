"use client";

import { useTranslations } from "next-intl";

/** Stats section -- 3 key metrics */
export function StatsSection() {
  const t = useTranslations("landing");

  const stats = [
    { number: t("stats.stat1Number"), label: t("stats.stat1Label") },
    { number: t("stats.stat2Number"), label: t("stats.stat2Label") },
    { number: t("stats.stat3Number"), label: t("stats.stat3Label") },
  ];

  return (
    <section className="landing-stats">
      <div className="stats-grid reveal">
        {stats.map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
