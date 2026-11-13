/**
 * One tournament deck of the meta panel: a link to its page on the source site,
 * with its placement, name, event context and format.
 *
 * Meta-insights context, `ui/`. Presentational: the tournament section decides
 * which decks to list.
 *
 * @module meta-insights/ui/TournamentDeckRow
 */
import { ExternalLink } from "lucide-react";
import type { TournamentDeck } from "@/modules/meta-insights/domain/types";

/** The deck one row links to. */
export interface TournamentDeckRowProps {
  readonly deck: TournamentDeck;
}

/**
 * A deck row that opens the source page in a new tab. The placement badge and
 * the format line appear only when the source gave them; the badge's hover
 * title rates the event with one star per level, as MTGTop8 does.
 */
export function TournamentDeckRow({ deck }: TournamentDeckRowProps) {
  return (
    <a
      href={deck.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 px-2 py-2 rounded hover:bg-[var(--surface-hover)] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
          {deck.placement && (
            <span
              className="shrink-0 px-1 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold tabular-nums"
              title={deck.eventLevel ? "★".repeat(deck.eventLevel) : undefined}
            >
              #{deck.placement}
            </span>
          )}
          <span className="truncate">{deck.name}</span>
        </p>
        <p className="text-[10px] text-[var(--text-secondary)] truncate">
          {[deck.player, deck.event, deck.date].filter(Boolean).join(" · ")}
        </p>
        {deck.format && (
          <p className="text-[10px] text-[var(--text-secondary)]/70 truncate">
            {deck.format}
          </p>
        )}
      </div>
      <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
