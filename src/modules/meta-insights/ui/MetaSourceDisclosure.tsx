"use client";
/**
 * The attribution line under a meta section: which source the cards or decks
 * come from, when it was observed, whether the answer is stale, the kind of
 * evidence, and the caveats the source carries.
 *
 * Meta-insights context, `ui/`. Presentational; the EDHREC and tournament
 * sections render it once an observation time exists. EDHREC's line says its
 * sample window is unavailable, because the site publishes counts without the
 * period they cover; the tournament line prints the span of the dated events
 * instead. The "unavailable" health line appears after a failed request so a
 * list kept from an earlier answer is not read as current.
 *
 * @module meta-insights/ui/MetaSourceDisclosure
 */
import { useFormatter, useTranslations } from "next-intl";
import type { MetaEvidenceKind } from "@/modules/meta-insights/domain/evidence-label";
import { RecommendationProvenance } from "./RecommendationProvenance";

type MetaDisclosureSource = "edhrec" | "tournament";

interface MetaSourceDisclosureProps {
  readonly source: MetaDisclosureSource;
  readonly observedAt: string;
  readonly stale?: boolean;
  readonly kind?: MetaEvidenceKind;
  readonly evidenceWindow?: {
    readonly start: string;
    readonly end: string;
  };
  readonly health?: {
    readonly status: "idle" | "available" | "unavailable";
    readonly attempts: number;
  };
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

/**
 * "Source: EDHREC · Observed <date>" (or "Last observed <date> · stale", in
 * amber) with the evidence badge, then the source's caveat lines. The date is
 * formatted in UTC so the same answer reads the same in every time zone. An
 * `observedAt` that is not a date still names the source, without a time.
 *
 * @param kind - the evidence kind to badge; defaults to `popular` for EDHREC and `tournament` otherwise
 */
export function MetaSourceDisclosure({
  source,
  observedAt,
  stale = false,
  kind,
  evidenceWindow,
  health,
}: MetaSourceDisclosureProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const observedDate = new Date(observedAt);
  const label = sourceLabel(source);
  const evidenceKind = kind ?? (source === "edhrec" ? "popular" : "tournament");

  if (Number.isNaN(observedDate.getTime())) {
    return (
      <p className="text-[10px] text-[var(--text-secondary)]">
        {t("meta.sourceDisclosureUnavailable", { source: label })}{" "}
        <RecommendationProvenance kind={evidenceKind} />
      </p>
    );
  }

  const date = format.dateTime(observedDate, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const evidenceStart = evidenceWindow
    ? format.dateTime(new Date(evidenceWindow.start), { dateStyle: "medium", timeZone: "UTC" })
    : null;
  const evidenceEnd = evidenceWindow
    ? format.dateTime(new Date(evidenceWindow.end), { dateStyle: "medium", timeZone: "UTC" })
    : null;

  return (
    <div className="space-y-0.5">
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
        })}{" "}
        <RecommendationProvenance kind={evidenceKind} />
      </p>
      {source === "edhrec" && (
        <p className="text-[10px] text-[var(--text-secondary)]">
          {t("meta.edhrecSampleWindowUnavailable")}
        </p>
      )}
      {source === "tournament" && evidenceStart && evidenceEnd && (
        <p className="text-[10px] text-[var(--text-secondary)]">
          {t("meta.tournamentEvidenceWindow", {
            start: evidenceStart,
            end: evidenceEnd,
          })}
        </p>
      )}
      {health?.status === "unavailable" && (
        <p className="text-[10px] text-amber-400">
          {t("meta.sourceHealthUnavailable", { attempts: health.attempts })}
        </p>
      )}
    </div>
  );
}
