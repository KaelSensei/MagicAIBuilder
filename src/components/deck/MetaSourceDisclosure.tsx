"use client";

import { useFormatter, useTranslations } from "next-intl";

type MetaDisclosureSource = "edhrec" | "tournament";

interface MetaSourceDisclosureProps {
  readonly source: MetaDisclosureSource;
  readonly observedAt: string;
  readonly stale?: boolean;
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
}: MetaSourceDisclosureProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const observedDate = new Date(observedAt);
  const label = sourceLabel(source);

  if (Number.isNaN(observedDate.getTime())) {
    return (
      <p className="text-[10px] text-[var(--text-secondary)]">
        {t("meta.sourceDisclosureUnavailable", { source: label })}
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
      })}
    </p>
  );
}
