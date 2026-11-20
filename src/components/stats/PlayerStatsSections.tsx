"use client";
/**
 * The sections of the `/stats` page for one year (I-60 requirement 2.2):
 * colours, colour identities, commanders, cards used most, shared cards and
 * brackets over the Commander-family decks (3.2), then decks added and
 * changed and decks per format over every deck. A section with no
 * denominator is left out rather than shown empty (1.2).
 *
 * @module components/stats/PlayerStatsSections
 */
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { IdentityColor, PlayerStats } from "@/lib/deck/player-stats";
import type { PlayerStatsReport } from "@/lib/deck/player-stats-report";
import { StatsBracketsTable } from "./StatsBracketsTable";
import { StatsFigureTable, type FigureRow } from "./StatsFigureTable";

/** What the sections show. */
export interface PlayerStatsSectionsProps {
  readonly report: PlayerStatsReport;
}

const NOTE = "text-sm text-[var(--text-secondary)]";

/** Every section of one year's statistics. */
export function PlayerStatsSections({ report }: PlayerStatsSectionsProps) {
  const t = useTranslations("stats");
  const { stats, year } = report;
  const deckNames = useMemo(
    () => new Map(report.decks.map((deck) => [deck.id, deck.name])),
    [report.decks]
  );

  if (stats.activeDeckIds.length === 0) {
    return <p className={NOTE}>{t("empty", { year })}</p>;
  }
  return (
    <div className="flex flex-col gap-10">
      {stats.commanderDeckIds.length > 0 ? (
        <CommanderSections stats={stats} deckNames={deckNames} />
      ) : (
        <p className={NOTE}>{t("noCommanderDecks", { year })}</p>
      )}
      <ActivitySections
        stats={stats}
        deckCount={report.decks.length}
        deckNames={deckNames}
      />
    </div>
  );
}

/** What the section groups read. */
interface SectionGroupProps {
  readonly stats: PlayerStats;
  readonly deckNames: ReadonlyMap<string, string>;
}

/** The sections counted over Commander-family decks (requirement 3.2). */
function CommanderSections({ stats, deckNames }: SectionGroupProps) {
  const t = useTranslations("stats");
  const colorName = (color: IdentityColor) => t(`colors.${color}`);
  const total = stats.commanderDeckIds.length;
  const table = { total, deckNames };
  return (
    <>
      <StatsFigureTable
        {...table}
        caption={t("colors.caption")}
        header={t("colors.header")}
        rows={stats.colors.map(({ color, deckIds }) => ({
          key: color,
          label: colorName(color),
          deckIds,
        }))}
      />
      <StatsFigureTable
        {...table}
        caption={t("identities.caption")}
        header={t("identities.header")}
        rows={stats.colorIdentities.map(({ identity, deckIds }) => ({
          key: identity.join("") || "colorless",
          label:
            identity.length > 0
              ? identity.map(colorName).join(", ")
              : t("colors.colorless"),
          deckIds,
        }))}
      />
      <StatsFigureTable
        {...table}
        caption={t("commanders.caption")}
        header={t("commanders.header")}
        rows={stats.commanders.map(({ names, deckIds, isNew }) => ({
          key: names.join("\n"),
          label: <CommanderLabel names={names} isNew={isNew} />,
          deckIds,
        }))}
      />
      <StatsFigureTable
        {...table}
        caption={t("cardsUsedMost.caption")}
        header={t("cardsUsedMost.header")}
        note={t("cardsUsedMost.note")}
        rows={stats.cardsUsedMost.map(cardRow)}
      />
      <StatsFigureTable
        {...table}
        caption={t("shared.caption")}
        header={t("shared.header")}
        note={t("shared.summary", { count: stats.sharedCards.count, total })}
        rows={stats.sharedCards.mostShared.map(cardRow)}
      />
      <StatsBracketsTable brackets={stats.brackets} {...table} />
    </>
  );
}

/** What the activity sections read on top of the counts. */
interface ActivitySectionsProps extends SectionGroupProps {
  /** Every deck the player has: the denominator of added and changed */
  readonly deckCount: number;
}

/** Decks added and changed, and active decks per format, over every format. */
function ActivitySections({
  stats,
  deckCount,
  deckNames,
}: ActivitySectionsProps) {
  const t = useTranslations("stats");
  const formatName = useTranslations("deck.format.name");
  const activity: readonly FigureRow[] = [
    { key: "added", label: t("activity.added"), deckIds: stats.addedDeckIds },
    {
      key: "changed",
      label: t("activity.changed"),
      deckIds: stats.changedDeckIds,
      atLeast: true,
    },
  ];
  return (
    <>
      <StatsFigureTable
        caption={t("activity.caption")}
        header={t("activity.header")}
        note={t("activity.note")}
        rows={activity}
        total={deckCount}
        deckNames={deckNames}
      />
      <StatsFigureTable
        caption={t("formats.caption")}
        header={t("formats.header")}
        rows={stats.formats.map(({ format, deckIds }) => ({
          key: format,
          label: formatName(format),
          deckIds,
        }))}
        total={stats.activeDeckIds.length}
        deckNames={deckNames}
      />
    </>
  );
}

/** A card's row: its Oracle name and its decks. */
function cardRow({
  name,
  deckIds,
}: {
  readonly name: string;
  readonly deckIds: readonly string[];
}): FigureRow {
  return { key: name, label: name, deckIds };
}

/** What a commander's label shows. */
interface CommanderLabelProps {
  readonly names: readonly string[];
  readonly isNew: boolean;
}

/** A commander or partner pair, marked when no earlier deck was led by it. */
function CommanderLabel({ names, isNew }: CommanderLabelProps) {
  const t = useTranslations("stats");
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{names.join(" + ")}</span>
      {isNew && (
        <span className="rounded border border-[var(--accent)] px-1.5 text-xs text-[var(--accent-text)]">
          {t("commanders.new")}
        </span>
      )}
    </span>
  );
}
