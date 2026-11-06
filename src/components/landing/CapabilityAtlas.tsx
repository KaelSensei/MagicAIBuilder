"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface CapabilityEntry {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly detail: string;
  readonly primaryAction: string;
  readonly primaryHref: string;
  readonly secondaryAction?: string;
  readonly secondaryHref?: string;
}

/** Renders the public map of confirmed Commander workflows. */
export function CapabilityAtlas() {
  const t = useTranslations("landing");
  const entries: readonly CapabilityEntry[] = [
    {
      index: "01",
      title: t("atlas.build.title"),
      description: t("atlas.build.description"),
      detail: t("atlas.build.detail"),
      primaryAction: t("atlas.build.primaryAction"),
      primaryHref: "/builder/guest",
    },
    {
      index: "02",
      title: t("atlas.collect.title"),
      description: t("atlas.collect.description"),
      detail: t("atlas.collect.detail"),
      primaryAction: t("atlas.collect.primaryAction"),
      primaryHref: "/collection",
    },
    {
      index: "03",
      title: t("atlas.playtest.title"),
      description: t("atlas.playtest.description"),
      detail: t("atlas.playtest.detail"),
      primaryAction: t("atlas.playtest.primaryAction"),
      primaryHref: "/decks",
    },
    {
      index: "04",
      title: t("atlas.share.title"),
      description: t("atlas.share.description"),
      detail: t("atlas.share.detail"),
      primaryAction: t("atlas.share.primaryAction"),
      primaryHref: "/rules/game-changers",
      secondaryAction: t("atlas.share.secondaryAction"),
      secondaryHref: "/rules/comprehensive",
    },
  ];

  return (
    <section className="capability-atlas" id="capabilities" aria-labelledby="atlas-title">
      <div className="atlas-intro">
        <p className="section-label">{t("atlas.eyebrow")}</p>
        <h2 id="atlas-title">{t("atlas.heading")}</h2>
        <p>{t("atlas.introduction")}</p>
      </div>
      <ol className="capability-atlas-list" aria-label={t("atlas.listLabel")}>
        {entries.map((entry) => (
          <li key={entry.index} className="capability-entry">
            <p className="capability-index" aria-hidden="true">{entry.index}</p>
            <div>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <p className="capability-detail">{entry.detail}</p>
            </div>
            <div className="capability-actions">
              <Link href={entry.primaryHref}>{entry.primaryAction}</Link>
              {entry.secondaryAction && entry.secondaryHref ? (
                <Link href={entry.secondaryHref}>{entry.secondaryAction}</Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
