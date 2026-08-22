"use client";
/**
 * MetaPanel — commander meta analysis.
 * EDHRec popular cards, MTGTop8 tournament decks, and community decks.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart2,
  RefreshCw,
  Loader2,
  Check,
  Plus,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetaAnalysis } from "@/hooks/useMetaAnalysis";
import { useMetaShifts } from "@/hooks/useMetaShifts";
import { cn } from "@/components/ui/utils";
import { Link } from "@/i18n/navigation";
import { commanderToSlug, type MetaCard, type TournamentDeck } from "@/lib/meta/fetch";
import { shiftMagnitude, type MetaShift } from "@/lib/meta/history";

/** Movements shown in the panel; the report itself is not truncated. */
const MAX_SHIFTS_SHOWN = 8;

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
  const t = useTranslations("deck");
  const [added, setAdded] = useState(false);
  const pct = Math.round(card.inclusion * 100);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
          {card.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)]/60 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
            {pct}%
          </span>
        </div>
      </div>
      {inDeck || added ? (
        <span className="shrink-0 w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-400" />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            onAdd(card.name);
            setAdded(true);
          }}
          className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)] flex items-center justify-center text-[var(--accent-text)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          aria-label={t("meta.addNamedCard", { name: card.name })}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function TournamentDeckRow({ deck }: { readonly deck: TournamentDeck }) {
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
          <p className="text-[10px] text-[var(--text-secondary)]/70 truncate">{deck.format}</p>
        )}
      </div>
      <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

/**
 * One card's movement between the two compared snapshots.
 *
 * The four variants are rendered differently on purpose. `rose` and `fell`
 * carry a measured delta; `entered` and `left` carry a **bound**, because the
 * card is listed at only one end and EDHRec's list is truncated at 20 — the
 * unseen end is somewhere below that snapshot's cut-off and was never recorded.
 * Printing "−78 pts" for a card that merely dropped out would report a collapse
 * that the data cannot support, so those two read "≤" / "≥" and say why on hover.
 */
function MetaShiftRow({ shift }: { readonly shift: MetaShift }) {
  const t = useTranslations("deck");
  const points = Math.round(shiftMagnitude(shift) * 100);

  switch (shift.kind) {
    case "rose":
    case "fell": {
      const up = shift.kind === "rose";
      const Icon = up ? ArrowUpRight : ArrowDownRight;
      return (
        <ShiftLine
          name={shift.name}
          tone={up ? "up" : "down"}
          icon={<Icon className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.points", { points: up ? `+${points}` : `-${points}` })}
        />
      );
    }
    case "entered":
      return (
        <ShiftLine
          name={shift.name}
          tone="up"
          icon={<Sparkles className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.atLeast", { points: `+${points}` })}
          note={t("meta.shifts.entered")}
          title={t("meta.shifts.enteredHint")}
        />
      );
    case "left":
      return (
        <ShiftLine
          name={shift.name}
          tone="down"
          icon={<ArrowDownRight className="w-3 h-3" aria-hidden="true" />}
          label={t("meta.shifts.atMost", { points: `-${points}` })}
          note={t("meta.shifts.left")}
          title={t("meta.shifts.leftHint")}
        />
      );
    case "steady":
      // Filtered out before the list is built; handled here so the guard below
      // is a real exhaustiveness check and not a `default` that swallows a
      // variant added later.
      return null;
    default: {
      const exhaustive: never = shift;
      return exhaustive;
    }
  }
}

function ShiftLine({
  name,
  tone,
  icon,
  label,
  note,
  title,
}: {
  readonly name: string;
  readonly tone: "up" | "down";
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly note?: string;
  readonly title?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
      title={title}
    >
      <span
        className={cn(
          "shrink-0 flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
          tone === "up" ? "text-green-400" : "text-red-400"
        )}
      >
        {icon}
        {label}
      </span>
      <span className="flex-1 min-w-0 text-xs text-[var(--text-primary)] truncate">
        {name}
      </span>
      {note && (
        <span className="shrink-0 text-[10px] text-[var(--text-secondary)]">{note}</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MetaPanel({
  commanderName,
  deckCardNames,
  onAddCard,
  className,
}: MetaPanelProps) {
  const t = useTranslations("deck");
  const [expanded, setExpanded] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const fetched = useRef(false);

  const {
    edhrec,
    tournament,
    isLoadingEdhrec,
    isLoadingTournament,
    errorEdhrec,
    errorTournament,
    fetchAll,
  } = useMetaAnalysis(commanderName);

  const {
    report: shiftReport,
    snapshotCount,
    isLoading: isLoadingShifts,
    error: errorShifts,
    fetchShifts,
    reset: resetShifts,
  } = useMetaShifts(commanderName);

  // Auto-fetch when expanded for the first time
  useEffect(() => {
    if (expanded && !fetched.current && commanderName) {
      fetched.current = true;
      fetchAll();
    }
  }, [expanded, commanderName, fetchAll]);

  // Read the history only once the EDHRec call has returned. That call is what
  // *writes* today's snapshot, so firing both together would race: on a
  // commander recorded once before, the read could land first and report no
  // history on the very visit that completed it.
  useEffect(() => {
    if (edhrec) void fetchShifts();
  }, [edhrec, fetchShifts]);

  // Reset when commander changes
  useEffect(() => {
    fetched.current = false;
    resetShifts();
  }, [commanderName, resetShifts]);

  const edhrecCards = (edhrec?.cards ?? []) as MetaCard[];
  const filteredCards = showOnlyMissing
    ? edhrecCards.filter((c) => !deckCardNames.has(c.name))
    : edhrecCards;
  const tournamentDecks = (tournament?.decks ?? []) as TournamentDeck[];

  // `steady` is dropped: a card holding its inclusion within a point is the
  // normal state of most of the list, and printing twenty of them would bury
  // the handful that actually moved. The report still carries them for any
  // caller that wants the full picture.
  const movements = (shiftReport?.shifts ?? [])
    .filter((shift) => shift.kind !== "steady")
    .slice(0, MAX_SHIFTS_SHOWN);

  const staleEdhrec = edhrec?._meta?.stale;
  const cachedAt = edhrec?._meta?.cachedAt;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <BarChart2 className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
          {t("meta.title")}
        </span>
        {(isLoadingEdhrec || isLoadingTournament) && (
          <Loader2 className="w-3.5 h-3.5 text-[var(--accent-text)] animate-spin" />
        )}
        <TrendingUp
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            expanded ? "rotate-180" : ""
          )}
        />
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
              {commanderName ? (
                <>
                  {/* Refresh + stale notice */}
                  <div className="flex items-center justify-between">
                    {staleEdhrec && cachedAt && (
                      <p className="text-[10px] text-amber-400">
                        {t("meta.staleData", {
                          date: new Date(cachedAt).toLocaleDateString(),
                        })}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        fetched.current = true;
                        fetchAll(true);
                      }}
                      disabled={isLoadingEdhrec || isLoadingTournament}
                      className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t("meta.refresh")}
                    </button>
                  </div>

                  {/* ─ Community decks ─ */}
                  <Link
                    href={`/commanders/${commanderToSlug(commanderName)}/decks`}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--accent-text)] hover:underline"
                  >
                    <Users className="w-3 h-3" aria-hidden="true" />
                    {t("meta.communityDecks")}
                  </Link>

                  {/* ─ EDHRec link-out — same slug the data above is fetched with ─ */}
                  <a
                    href={`https://edhrec.com/commanders/${commanderToSlug(commanderName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-[var(--accent-text)] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    {t("meta.viewOnEdhrec")}
                  </a>

                  {/* ─ EDHRec section ─ */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                        {t("meta.popularEdhrec")}
                      </p>
                      {edhrecCards.length > 0 && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showOnlyMissing}
                            onChange={(e) =>
                              setShowOnlyMissing(e.target.checked)
                            }
                            className="w-3 h-3 accent-[var(--accent)]"
                          />
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {t("meta.notInDeck")}
                          </span>
                        </label>
                      )}
                    </div>

                    {isLoadingEdhrec && !edhrecCards.length && (
                      <div className="space-y-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <SkeletonRow key={i} />
                        ))}
                      </div>
                    )}

                    {errorEdhrec && (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorEdhrec}
                      </div>
                    )}

                    {!isLoadingEdhrec &&
                      !errorEdhrec &&
                      edhrecCards.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                          {t("meta.noEdhrecData")}
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
                            {t("meta.allPopularInDeck")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ─ Meta shifts ─ */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                        {t("meta.shifts.title")}
                      </p>
                      {shiftReport && (
                        <span className="text-[10px] text-[var(--text-secondary)]/70 shrink-0">
                          {t("meta.shifts.since", {
                            date: new Date(
                              shiftReport.baselineCapturedOn
                            ).toLocaleDateString(),
                          })}
                        </span>
                      )}
                    </div>

                    {isLoadingShifts && !shiftReport && (
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <SkeletonRow key={i} />
                        ))}
                      </div>
                    )}

                    {errorShifts && (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {t("meta.shifts.error")}
                      </div>
                    )}

                    {!isLoadingShifts && !errorShifts && !shiftReport && (
                      <p className="text-xs text-[var(--text-secondary)] py-1">
                        {snapshotCount > 0
                          ? t("meta.shifts.pending")
                          : t("meta.shifts.empty")}
                      </p>
                    )}

                    {shiftReport && movements.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] py-1">
                        {t("meta.shifts.steadyOnly")}
                      </p>
                    )}

                    {movements.length > 0 && (
                      <div className="space-y-0.5">
                        {movements.map((shift) => (
                          <MetaShiftRow key={`${shift.kind}:${shift.name}`} shift={shift} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─ Tournament section ─ */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                      {t("meta.competitive")}
                    </p>

                    {isLoadingTournament && !tournamentDecks.length && (
                      <div className="space-y-1">
                        {[1, 2].map((i) => (
                          <SkeletonRow key={i} />
                        ))}
                      </div>
                    )}

                    {errorTournament && (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorTournament}
                      </div>
                    )}

                    {!isLoadingTournament &&
                      !errorTournament &&
                      tournamentDecks.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                          {t("meta.noTournamentDecks")}
                        </p>
                      )}

                    {tournamentDecks.length > 0 && (
                      <div className="space-y-0.5">
                        {tournamentDecks.map((deck) => (
                          <TournamentDeckRow key={deck.url} deck={deck} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  {t("meta.selectCommander")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
