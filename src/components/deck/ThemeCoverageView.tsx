"use client";
/**
 * The Theme panel's reading of the deck: the coverage as a count, the
 * on-theme cards under the handle that matched, and the off-theme cards under
 * their stored category.
 *
 * Deck analysis (ui), I-102 requirements 1.2, 1.3 and 3.2. The coverage is a
 * count and never a grade: no template rates the deck. On and off theme are
 * told apart by their heading's word and icon, not by colour alone.
 * Not responsible for: the count (`themeCoverage`) or the grouping
 * (`theme-panel-groups.ts`).
 *
 * @module components/deck/ThemeCoverageView
 */
import { useId, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleDashed } from "lucide-react";
import type { ThemeCoverage } from "@/lib/deck/theme-coverage";
import type {
  DeckTheme,
  ThemeEvidence,
  ThemeHandle,
} from "@/lib/deck/theme-match";
import { ThemeCardGroup, ThemeCardRow } from "./ThemeCardGroup";
import { offThemeGroups, onThemeGroups } from "./theme-panel-groups";

/** A titled region of the panel: on theme or off theme. */
function ThemeSection({
  icon,
  title,
  children,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3
        id={headingId}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
      >
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A handle as the player named it: "Creature type: Dragon". */
function HandleName({ handle }: { readonly handle: ThemeHandle }) {
  const t = useTranslations("builder.theme");
  const values = { kind: t(`kinds.${handle.kind}`), value: handle.value };

  return handle.kind === "firstLetter" && handle.ignoreLeadingThe
    ? t("handleIgnoringThe", values)
    : t("handle", values);
}

interface ThemeCoverageViewProps {
  /** The theme the coverage read */
  readonly theme: DeckTheme;
  readonly coverage: ThemeCoverage;
}

/** Shows how many cards are on theme, and which, with why. */
export function ThemeCoverageView({ theme, coverage }: ThemeCoverageViewProps) {
  const t = useTranslations("builder.theme");
  const onGroups = useMemo(
    () => onThemeGroups(coverage, theme),
    [coverage, theme]
  );
  const offGroups = useMemo(() => offThemeGroups(coverage), [coverage]);
  const tBuilder = useTranslations("builder");
  const evidenceText = (evidence: ThemeEvidence) =>
    t("evidence", {
      field: t(`fields.${evidence.field}`),
      excerpt: evidence.excerpt,
    });
  const offThemeReason = (matched: number) =>
    matched === 0
      ? t("noMatch")
      : t("partialMatch", { matched, total: theme.handles.length });

  return (
    <div className="flex flex-col gap-3">
      <output className="text-sm font-semibold text-[var(--text-primary)]">
        {t("coverage", {
          onTheme: coverage.onTheme,
          denominator: coverage.denominator,
        })}
      </output>
      <ThemeSection
        icon={<CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />}
        title={t("onTheme")}
      >
        {onGroups.map((group) => (
          <ThemeCardGroup
            key={group.handleIndex}
            title={<HandleName handle={group.handle} />}
            emptyText={t("noCardForHandle")}
          >
            {group.cards.map((entry) => (
              <ThemeCardRow
                key={entry.key}
                entry={entry}
                reason={evidenceText(entry.evidence)}
              />
            ))}
          </ThemeCardGroup>
        ))}
      </ThemeSection>
      <ThemeSection
        icon={<CircleDashed aria-hidden="true" className="h-3.5 w-3.5" />}
        title={t("offTheme")}
      >
        {offGroups.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {t("noOffTheme")}
          </p>
        ) : null}
        {offGroups.map((group) => (
          <ThemeCardGroup
            key={group.category}
            title={tBuilder(`categories.${group.category}`)}
            emptyText={t("noOffTheme")}
          >
            {group.cards.map((entry) => (
              <ThemeCardRow
                key={entry.key}
                entry={entry}
                reason={offThemeReason(entry.matchedHandles)}
              />
            ))}
          </ThemeCardGroup>
        ))}
      </ThemeSection>
    </div>
  );
}
