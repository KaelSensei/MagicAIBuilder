"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Fish, Layers, Library, Share2, Sparkles } from "lucide-react";
import { CapabilityCard, type CapabilityEntry } from "./CapabilityCard";

/**
 * Renders the public map of confirmed Commander workflows.
 *
 * @returns the capability section
 */
export function CapabilityAtlas() {
  const t = useTranslations("landing");
  const entries: readonly CapabilityEntry[] = useMemo(
    () => [
      {
        index: "01",
        title: t("atlas.build.title"),
        description: t("atlas.build.description"),
        detail: t("atlas.build.detail"),
        primaryAction: t("atlas.build.primaryAction"),
        primaryHref: "/builder/guest",
        icon: <Layers className="h-5 w-5" aria-hidden="true" />,
      },
      {
        index: "02",
        title: t("atlas.collect.title"),
        description: t("atlas.collect.description"),
        detail: t("atlas.collect.detail"),
        primaryAction: t("atlas.collect.primaryAction"),
        primaryHref: "/collection",
        icon: <Library className="h-5 w-5" aria-hidden="true" />,
      },
      {
        index: "03",
        title: t("atlas.playtest.title"),
        description: t("atlas.playtest.description"),
        detail: t("atlas.playtest.detail"),
        primaryAction: t("atlas.playtest.primaryAction"),
        primaryHref: "/decks",
        icon: <Fish className="h-5 w-5" aria-hidden="true" />,
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
        icon: <Share2 className="h-5 w-5" aria-hidden="true" />,
      },
    ],
    [t]
  );

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20"
      id="capabilities"
      aria-labelledby="atlas-title"
    >
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[var(--accent-text)] uppercase">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("atlas.eyebrow")}
        </p>
        <h2
          id="atlas-title"
          className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl"
        >
          {t("atlas.heading")}
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
          {t("atlas.introduction")}
        </p>
      </div>
      <ol
        className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label={t("atlas.listLabel")}
      >
        {entries.map((entry) => (
          <CapabilityCard key={entry.index} entry={entry} />
        ))}
      </ol>
    </section>
  );
}
