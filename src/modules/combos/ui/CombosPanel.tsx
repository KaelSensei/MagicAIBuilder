"use client";
/**
 * The combo panel of the deck builder: the combos the deck holds, infinite
 * ones marked, each with what it still needs and a link to Commander
 * Spellbook.
 *
 * The UI of the combos context. It renders what `useCombos` returns and is
 * imported by path from the builder page (ADR 0002). It holds no lookup logic:
 * the page tells it whether the lookup is enabled, loading or unavailable, and
 * the panel's one rule is to never read an unavailable lookup as "no combos".
 *
 * @module combos/ui/CombosPanel
 */
import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import type { Combo, ComboPrerequisites } from "@/modules/combos/domain/combo";
import { Zap, Loader2 } from "lucide-react";

const SPELLBOOK_URL = "https://commanderspellbook.com/";

/**
 * The `<link>` tag of the Spellbook credit line.
 *
 * Built outside the component so no render function is declared during render.
 *
 * @param label - the link's accessible name, which carries the observation date
 * @returns the renderer `t.rich` calls with the link text
 */
function spellbookCreditLink(label: string) {
  return function SpellbookCreditLink(chunks: ReactNode) {
    return (
      <a
        href={SPELLBOOK_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        className="underline-offset-2 hover:underline"
      >
        {chunks}
      </a>
    );
  };
}

interface CombosPanelProps {
  /** The combos the lookup found, in the order the server sent them (infinite first). */
  readonly combos?: readonly Combo[];
  readonly isLoading?: boolean;
  /** False while the deck is under the ten-card minimum; the panel then asks for cards. */
  readonly isEnabled?: boolean;
  /** True when the lookup failed, so the panel must not claim the deck has no combos. */
  readonly isUnavailable?: boolean;
  readonly className?: string;
  /** When the shown result was fetched; the credit line is shown only with it. */
  readonly observedAt?: Date;
}

function hasPrerequisites({
  otherPieces,
  conditions,
  manaNeeded,
}: ComboPrerequisites): boolean {
  return (
    otherPieces.length > 0 || conditions.length > 0 || manaNeeded.length > 0
  );
}

function PrerequisiteList({
  prerequisites,
}: {
  readonly prerequisites: ComboPrerequisites;
}) {
  const t = useTranslations("deck");
  if (!hasPrerequisites(prerequisites)) return null;
  const { otherPieces, conditions, manaNeeded } = prerequisites;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        {t("combos.prerequisites")}
      </p>
      <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--text-primary)] leading-relaxed">
        {otherPieces.map((piece) => (
          <li key={`piece:${piece}`}>{t("combos.otherPiece", { piece })}</li>
        ))}
        {conditions.map((condition) => (
          <li key={`condition:${condition}`}>{condition}</li>
        ))}
        {manaNeeded.length > 0 && (
          <li>{t("combos.manaNeeded", { mana: manaNeeded })}</li>
        )}
      </ul>
    </div>
  );
}

function ComboCard({ combo }: { readonly combo: Combo }) {
  const t = useTranslations("deck");

  return (
    <li className="rounded bg-[var(--surface-hover)] border border-[var(--border)] p-3 space-y-2">
      {/* Cards involved */}
      <div className="flex flex-wrap gap-1">
        {combo.cards.map((cardName) => (
          <span
            key={cardName}
            className="px-1.5 py-0.5 text-xs rounded bg-[var(--accent)]/10 text-[var(--accent-text)] border border-[var(--accent)]/20 font-medium"
          >
            {cardName}
          </span>
        ))}
      </div>

      {/* Effects */}
      <div className="flex flex-wrap gap-1">
        {combo.effects.map((effect) => (
          <span
            key={effect}
            className={cn(
              "px-1.5 py-0.5 text-xs rounded border font-medium",
              combo.isInfinite
                ? "bg-red-500/15 text-red-300 border-red-500/30"
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
            )}
          >
            {combo.isInfinite && "♾ "}
            {effect}
          </span>
        ))}
      </div>

      <PrerequisiteList prerequisites={combo.prerequisites} />

      {/* Description */}
      {combo.description && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {combo.description}
        </p>
      )}

      <a
        href={`${SPELLBOOK_URL}combo/${encodeURIComponent(combo.id)}/`}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-[10px] text-[var(--text-secondary)] underline underline-offset-2"
      >
        {t("combos.viewOnSpellbook")}
      </a>
    </li>
  );
}

/**
 * The builder's combo panel.
 *
 * Shows one of: a request for ten cards, a loading line, the unavailable
 * notice, "no known combos", or the combo list headed "Infinite combos" when
 * one is infinite. The Spellbook credit with its observation date appears
 * only on a settled result, so the panel never credits data it is not showing.
 * All text comes from the `deck.combos` messages.
 */
export function CombosPanel({
  combos,
  isLoading,
  isEnabled = true,
  isUnavailable = false,
  className,
  observedAt,
}: CombosPanelProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const observedDate = observedAt
    ? format.dateTime(observedAt, { dateStyle: "medium", timeZone: "UTC" })
    : null;
  const isSettled = isEnabled && !isLoading && !isUnavailable;

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
          {t("combos.title")}
        </p>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-[var(--text-secondary)] animate-spin" />
        )}
        {!isLoading && combos && combos.length > 0 && (
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {t("combos.found", { count: combos.length })}
          </span>
        )}
      </div>

      {!isEnabled && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          {t("combos.minCards")}
        </p>
      )}

      {isSettled && observedDate && (
        <p className="text-[10px] text-[var(--text-secondary)]">
          {t.rich("combos.credit", {
            link: spellbookCreditLink(
              t("combos.observedLabel", { date: observedDate })
            ),
          })}
        </p>
      )}

      {isEnabled && isLoading && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          {t("combos.checking")}
        </p>
      )}

      {isEnabled && !isLoading && isUnavailable && (
        <output className="block text-xs text-[var(--text-secondary)] italic">
          {t("combos.unavailable")}
        </output>
      )}

      {isSettled && (combos?.length ?? 0) === 0 && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          {t("combos.noKnown")}
        </p>
      )}

      {isSettled && combos && combos.length > 0 && (
        <div className="space-y-2">
          {/* Infinite combos first */}
          {combos.some((c) => c.isInfinite) && (
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">
                {t("combos.infinite")}
              </span>
            </div>
          )}
          <ul className="space-y-2">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
