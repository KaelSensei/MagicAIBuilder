"use client";
/**
 * MetaPanel — commander meta analysis.
 * Two sections: EDHRec popular cards + MTGTop8 tournament decks.
 */
import { useEffect, useRef, useState } from "react";
import { BarChart2, RefreshCw, Loader2, Check, Plus, ExternalLink, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetaAnalysis } from "@/hooks/useMetaAnalysis";
import { cn } from "@/components/ui/utils";
import type { MetaCard, TournamentDeck } from "@/lib/meta/fetch";

interface MetaPanelProps {
  readonly commanderName: string | null;
  readonly deckCardNames: ReadonlySet<string>;
  readonly onAddCard: (cardName: string) => void;
  readonly className?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 p-2 animate-pulse">
      <div className="w-8 h-11 rounded bg-[var(--border)] shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-2.5 bg-[var(--border)] rounded w-3/4" />
        <div className="h-2 bg-[var(--border)] rounded w-1/2" />
      </div>
    </div>
  );
}

function EdhrecCardRow({
  card,
  inDeck,
  onAdd,
}: {
  readonly card: MetaCard;
  readonly inDeck: boolean;
  readonly onAdd: (name: string) => void;
}) {
  const [added, setAdded] = useState(false);
  const pct = Math.round(card.inclusion * 100);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{card.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-[var(--accent)]/60 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] shrink-0">{pct}%</span>
        </div>
      </div>
      {inDeck || added ? (
        <span className="shrink-0 w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-400" />
        </span>
      ) : (
        <button
          onClick={() => { onAdd(card.name); setAdded(true); }}
          className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)] flex items-center justify-center text-[var(--accent)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Add ${card.name}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function TournamentDeckRow({ deck }: { readonly deck: TournamentDeck }) {
  return (
    <a
      href={deck.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 px-2 py-2 rounded hover:bg-[var(--surface-hover)] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{deck.name}</p>
        <p className="text-[10px] text-[var(--text-secondary)] truncate">
          {[deck.player, deck.event, deck.date].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MetaPanel({ commanderName, deckCardNames, onAddCard, className }: MetaPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const fetched = useRef(false);

  const {
    edhrec, tournament,
    isLoadingEdhrec, isLoadingTournament,
    errorEdhrec, errorTournament,
    fetchAll,
  } = useMetaAnalysis(commanderName);

  // Auto-fetch when expanded for the first time
  useEffect(() => {
    if (expanded && !fetched.current && commanderName) {
      fetched.current = true;
      fetchAll();
    }
  }, [expanded, commanderName, fetchAll]);

  // Reset when commander changes
  useEffect(() => {
    fetched.current = false;
  }, [commanderName]);

  const edhrecCards = (edhrec?.cards ?? []) as MetaCard[];
  const filteredCards = showOnlyMissing
    ? edhrecCards.filter((c) => !deckCardNames.has(c.name))
    : edhrecCards;
  const tournamentDecks = (tournament?.decks ?? []) as TournamentDeck[];

  const staleEdhrec = edhrec?._meta?.stale;
  const cachedAt = edhrec?._meta?.cachedAt;

  return (
    <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <BarChart2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
          Meta Analysis
        </span>
        {(isLoadingEdhrec || isLoadingTournament) && (
          <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
        )}
        <TrendingUp className={cn("w-3.5 h-3.5 transition-transform", expanded ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-4">
              {!commanderName ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  Select a commander to see meta data
                </p>
              ) : (
                <>
                  {/* Refresh + stale notice */}
                  <div className="flex items-center justify-between">
                    {staleEdhrec && cachedAt && (
                      <p className="text-[10px] text-amber-400">
                        Stale data from {new Date(cachedAt).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => { fetched.current = true; fetchAll(true); }}
                      disabled={isLoadingEdhrec || isLoadingTournament}
                      className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>

                  {/* ─ EDHRec section ─ */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                        Popular (EDHRec)
                      </p>
                      {edhrecCards.length > 0 && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showOnlyMissing}
                            onChange={(e) => setShowOnlyMissing(e.target.checked)}
                            className="w-3 h-3 accent-[var(--accent)]"
                          />
                          <span className="text-[10px] text-[var(--text-secondary)]">Not in deck</span>
                        </label>
                      )}
                    </div>

                    {isLoadingEdhrec && !edhrecCards.length && (
                      <div className="space-y-1">{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}</div>
                    )}

                    {errorEdhrec && (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorEdhrec}
                      </div>
                    )}

                    {!isLoadingEdhrec && !errorEdhrec && edhrecCards.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                        No EDHRec data for this commander
                      </p>
                    )}

                    {filteredCards.length > 0 && (
                      <div className="space-y-0.5">
                        {filteredCards.map((card) => (
                          <EdhrecCardRow
                            key={card.name}
                            card={card}
                            inDeck={deckCardNames.has(card.name)}
                            onAdd={onAddCard}
                          />
                        ))}
                        {showOnlyMissing && filteredCards.length === 0 && (
                          <p className="text-xs text-green-400 text-center py-2">
                            ✓ All popular cards already in your deck!
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ─ Tournament section ─ */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                      Competitive (Tournaments)
                    </p>

                    {isLoadingTournament && !tournamentDecks.length && (
                      <div className="space-y-1">{[1, 2].map((i) => <SkeletonRow key={i} />)}</div>
                    )}

                    {errorTournament && (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorTournament}
                      </div>
                    )}

                    {!isLoadingTournament && !errorTournament && tournamentDecks.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                        No recent tournament decks found
                      </p>
                    )}

                    {tournamentDecks.length > 0 && (
                      <div className="space-y-0.5">
                        {tournamentDecks.map((deck, i) => (
                          <TournamentDeckRow key={i} deck={deck} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
