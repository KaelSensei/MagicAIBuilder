"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { MetaEvidenceKind } from "@/lib/meta/evidence-label";

type MetaDisclosureSource = "edhrec" | "tournament";

interface MetaSourceDisclosureProps {
  readonly source: MetaDisclosureSource;
  readonly observedAt: string;
  readonly stale?: boolean;
  readonly kind?: MetaEvidenceKind;
}

function sourceLabel(source: MetaDisclosureSource): string {
  switch (source) {
    case "edhrec":
      return "EDHREC";
    case "tournament":
      return "MTGTop8 / MTGDecks";
  }
  const exhaustive: never = source;
  return exhaustive;
}

/** Shows where external recommendations came from and when they were observed. */
export function MetaSourceDisclosure({
  source,
  observedAt,
  stale = false,
  kind,
}: MetaSourceDisclosureProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const observedDate = new Date(observedAt);
  const label = sourceLabel(source);
  const evidenceKind = kind ?? (source === "edhrec" ? "popular" : "tournament");

  if (Number.isNaN(observedDate.getTime())) {
    return (
      <p className="text-[10px] text-[var(--text-secondary)]">
        {t("meta.sourceDisclosureUnavailable", { source: label })} {t("meta.evidenceType", { type: t(`meta.evidence.${evidenceKind}`) })}
      </p>
    );
  }

  const date = format.dateTime(observedDate, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <p
      className={
        stale
          ? "text-[10px] text-amber-400"
          : "text-[10px] text-[var(--text-secondary)]"
      }
    >
      {t(stale ? "meta.staleSourceDisclosure" : "meta.sourceDisclosure", {
        source: label,
        date,
      })} {t("meta.evidenceType", { type: t(`meta.evidence.${evidenceKind}`) })}
    </p>
  );
}
