"use client";
/**
 * DeckWizard — 4-step AI-guided Commander deck builder.
 *
 * Step 1: Budget
 * Step 2: Colors
 * Step 3: Strategy / Archetype
 * Step 4: Commander (optional)
 * Step 5: Loading / streaming results
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Loader2, Sparkles, Check } from "lucide-react";
import {
  autocompleteCardName,
  getCardByNameFuzzy,
  getCardCollection,
} from "@/lib/scryfall/client";
import { logger } from "@/lib/logger";
import { useAIDeckBuild, countCopies } from "@/hooks/useAIDeckBuild";
import type { BuildCard } from "@/hooks/useAIDeckBuild";
import { useLocalizedCardText } from "@/hooks/useLocalizedCardText";
import { useDeckStore } from "@/lib/deck/store";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { categorizeCard } from "@/lib/deck/categories";
import { getCardImageUri } from "@/lib/scryfall/images";
import type { CardCategory, DeckCard } from "@/lib/deck/types";
import { formatUsd } from "@/lib/i18n/currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DeckWizardProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onComplete: (deckId: string) => void;
}

type Budget = null | 50 | 200 | 500;
type ColorKey = "W" | "U" | "B" | "R" | "G" | "C";

const COLORS: { key: ColorKey; label: string }[] = [
  { key: "W", label: "White" },
  { key: "U", label: "Blue" },
  { key: "B", label: "Black" },
  { key: "R", label: "Red" },
  { key: "G", label: "Green" },
  { key: "C", label: "Colorless" },
];

const STRATEGIES = [
  {
    value: "Aggro",
    emoji: "⚡",
    label: "Aggro",
    subtitle: "Fast and aggressive",
  },
  {
    value: "Control",
    emoji: "🧠",
    label: "Control",
    subtitle: "Counter and control",
  },
  {
    value: "Combo",
    emoji: "🔄",
    label: "Combo",
    subtitle: "Find the winning combo",
  },
  {
    value: "Midrange",
    emoji: "🤝",
    label: "Midrange",
    subtitle: "Balanced power",
  },
  {
    value: "Tokens",
    emoji: "🔁",
    label: "Tokens",
    subtitle: "Go wide with tokens",
  },
  {
    value: "Sacrifice",
    emoji: "💀",
    label: "Sacrifice",
    subtitle: "Death and reanimation",
  },
  {
    value: "Ramp",
    emoji: "🌿",
    label: "Ramp",
    subtitle: "Accelerate your mana",
  },
  {
    value: "Voltron",
    emoji: "🎯",
    label: "Voltron",
    subtitle: "Buff your commander",
  },
];

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: 50, label: "Budget" },
  { value: 200, label: "Moderate" },
  { value: 500, label: "Competitive" },
  { value: null, label: "No Limit" },
];

function formatBudgetSubtitle(locale: string, value: Budget): string {
  if (value === null) return "Spare no expense";
  if (value === 50) return `< ${formatUsd(locale, value)}`;

  const previousLimit = value === 200 ? 50 : 200;
  return `${formatUsd(locale, previousLimit)} – ${formatUsd(locale, value)}`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as number[] };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({
  step,
  total,
}: {
  readonly step: number;
  readonly total: number;
}) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }, (_, i) => i).map((stepIdx) => (
        <div
          key={`progress-${stepIdx}`}
          className="h-1 flex-1 rounded-full overflow-hidden bg-white/10"
        >
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            initial={false}
            animate={{ width: stepIdx < step ? "100%" : "0%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}

// Color symbol button using Scryfall SVG
function ColorButton({
  colorKey,
  selected,
  onToggle,
}: {
  readonly colorKey: ColorKey;
  readonly selected: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-14 h-14 rounded-full flex items-center justify-center transition-all border-2
        ${
          selected
            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-110"
            : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
        }
      `}
      title={COLORS.find((c) => c.key === colorKey)?.label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://svgs.scryfall.io/card-symbols/${colorKey}.svg`}
        alt={colorKey}
        className="w-9 h-9"
        draggable={false}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step screens
// ---------------------------------------------------------------------------

function StepBudget({
  value,
  onChange,
}: {
  readonly value: Budget;
  readonly onChange: (v: Budget) => void;
}) {
  const locale = useLocale();
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {BUDGET_OPTIONS.map((opt) => (
        <button
          type="button"
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`
            w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all
            ${
              value === opt.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
            }
          `}
        >
          <div className="text-left">
            <div className="font-semibold text-base">{opt.label}</div>
            <div className="text-sm opacity-70 mt-0.5">
              {formatBudgetSubtitle(locale, opt.value)}
            </div>
          </div>
          {value === opt.value && (
            <Check className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

function StepColors({
  selected,
  onToggle,
}: {
  readonly selected: ColorKey[];
  readonly onToggle: (c: ColorKey) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-xs mx-auto">
      {COLORS.map((c) => (
        <ColorButton
          key={c.key}
          colorKey={c.key}
          selected={selected.includes(c.key)}
          onToggle={() => onToggle(c.key)}
        />
      ))}
    </div>
  );
}

function StepStrategy({
  value,
  onChange,
}: {
  readonly value: string | null;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {STRATEGIES.map((s) => (
        <button
          type="button"
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`
            flex flex-col items-start px-4 py-3 rounded-xl border transition-all text-left
            ${
              value === s.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
            }
          `}
        >
          <span className="text-xl mb-1">{s.emoji}</span>
          <span className="font-semibold text-sm">{s.label}</span>
          <span className="text-xs opacity-60 mt-0.5">{s.subtitle}</span>
        </button>
      ))}
    </div>
  );
}

// Bracket options — consistent with BracketIndicator colors
const BRACKET_OPTIONS = [
  {
    value: 1 as const,
    label: "Bracket 1",
    subtitle: "Exhibition",
    description: "No interaction, no synergy — pure theme or storytelling",
    color: "text-green-400",
    border: "border-green-500/40",
    bg: "bg-green-500/10",
  },
  {
    value: 2 as const,
    label: "Bracket 2",
    subtitle: "Casual",
    description:
      "Precons and light upgrades, 0–1 game changers, no infinite combos",
    color: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
  },
  {
    value: 3 as const,
    label: "Bracket 3",
    subtitle: "Powered",
    description:
      "Optimised synergies, up to 3 game changers, some strong staples",
    color: "text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
  },
  {
    value: 4 as const,
    label: "Bracket 4",
    subtitle: "cEDH",
    description: "Fully optimised, fast combos, any legal card",
    color: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
  },
];

function StepBracket({
  value,
  onChange,
}: {
  readonly value: 1 | 2 | 3 | 4 | null;
  readonly onChange: (v: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      {BRACKET_OPTIONS.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left
            ${
              value === opt.value
                ? `${opt.border} ${opt.bg}`
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)]"
            }
          `}
        >
          <span
            className={`text-2xl font-bold w-8 shrink-0 ${value === opt.value ? opt.color : "text-[var(--text-secondary)]"}`}
          >
            {opt.value}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className={`font-semibold text-sm ${value === opt.value ? opt.color : "text-[var(--text-primary)]"}`}
            >
              {opt.label} — {opt.subtitle}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {opt.description}
            </div>
          </div>
          {value === opt.value && (
            <Check className="w-4 h-4 shrink-0 text-[var(--accent-text)]" />
          )}
        </button>
      ))}
    </div>
  );
}

function StepCommander({
  commanderName,
  commanderCard,
  onSelect,
  onSkip,
}: {
  readonly commanderName: string;
  readonly commanderCard: ScryfallCard | null;
  readonly onSelect: (name: string, card: ScryfallCard | null) => void;
  readonly onSkip: () => void;
}) {
  const t = useTranslations("deck");
  // Display only — the deck is always built from the English commanderName.
  const localizedCommander = useLocalizedCardText(commanderCard);
  const [query, setQuery] = useState(commanderName);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync query if parent name changes
  useEffect(() => {
    setQuery(commanderName);
  }, [commanderName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await autocompleteCardName(val);
        setSuggestions(results.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = async (name: string) => {
    setQuery(name);
    setSuggestions([]);
    try {
      const card = await getCardByNameFuzzy(name);
      onSelect(name, card);
    } catch {
      onSelect(name, null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Search input */}
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={t("wizard.searchCommander")}
          className="
            w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]
            text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30
            transition-all
          "
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        )}

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
            {suggestions.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => handleSelect(name)}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected commander preview */}
      {commanderCard && (
        <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5">
          {commanderCard.image_uris?.art_crop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={commanderCard.image_uris.art_crop}
              alt={localizedCommander?.name ?? commanderCard.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)]">
              {localizedCommander?.name ?? commanderCard.name}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {localizedCommander?.typeLine ?? commanderCard.type_line}
            </div>
          </div>
          <Check className="w-4 h-4 text-[var(--accent-text)] ml-auto" />
        </div>
      )}

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
      >
        {t("wizard.skipLetAI")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading step (step 5)
// ---------------------------------------------------------------------------
function StepLoading({
  statusMessages,
  commander,
  cardCount,
  totalCards,
  isDemoDeck,
  importedCount,
  importTotal,
  error,
}: {
  readonly statusMessages: string[];
  readonly commander: string | null;
  readonly cardCount: number;
  readonly totalCards: number | null;
  readonly isDemoDeck: boolean;
  readonly importedCount: number;
  readonly importTotal: number;
  readonly error: string | null;
}) {
  const t = useTranslations("deck");
  const isImporting = importTotal > 0;
  const lastMsg = isImporting
    ? t("wizard.addingCards")
    : (statusMessages.at(-1) ?? t("wizard.thinking"));

  // While streaming, measure against what the server said it would send; while
  // importing, against the copies actually being written to the deck.
  const done = isImporting ? importedCount : cardCount;
  const target = isImporting ? importTotal : (totalCards ?? 99);
  const percent = target > 0 ? Math.min((done / target) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto text-center">
      {error ? (
        <>
          <div className="text-4xl">⚠️</div>
          <p className="text-red-400 text-sm">{error}</p>
        </>
      ) : (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-[var(--accent-text)]" />
          </motion.div>

          <div>
            <p className="text-[var(--text-secondary)] text-sm">{lastMsg}</p>
            {commander && (
              <p className="text-[var(--text-primary)] font-semibold mt-1">
                {t("wizard.commanderLabel", { name: commander })}
              </p>
            )}
          </div>

          {isDemoDeck && (
            <p className="text-xs text-amber-400 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
              {t("wizard.demoDeckNotice")}
            </p>
          )}

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent)] rounded-full"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            {done > 0
              ? t("wizard.cardProgress", { count: done, total: target })
              : t("wizard.generatingDeck")}
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

const TOTAL_WIZARD_STEPS = 5;
/** Max cards per Scryfall collection lookup request */
const BATCH_SIZE = 75;

/** Tries to resolve a commander name and set it — non-fatal if it fails. */
async function tryResolveCommander(
  commanderName: string,
  setCommander: (card: ScryfallCard) => Promise<void>
): Promise<void> {
  try {
    const card = await getCardByNameFuzzy(commanderName);
    await setCommander(card);
  } catch {
    // Non-fatal — commander name might not resolve exactly
  }
}

const DECK_CATEGORIES: ReadonlySet<string> = new Set<CardCategory>([
  "commander",
  "companion",
  "creature",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
  "land",
  "ramp",
  "draw",
  "removal",
  "boardWipe",
  "winCondition",
  "protection",
  "other",
]);

/** Narrows an AI-provided category string without casting; unknown values fall back to Scryfall. */
function isDeckCategory(value: string | undefined): value is CardCategory {
  return value !== undefined && DECK_CATEGORIES.has(value);
}

/** One decklist entry, collapsed by name so quantities survive the import. */
interface ImportEntry {
  readonly name: string;
  readonly category: string;
  readonly quantity: number;
}

/**
 * Collapses the streamed cards by name, summing quantities.
 *
 * The previous version deduplicated with a Set and hardcoded `quantity: 1`,
 * which silently dropped every extra copy — a 99-card list arrived as ~65 cards
 * because the basic lands collapsed into singletons.
 */
export function collapseEntries(
  cards: readonly BuildCard[]
): readonly ImportEntry[] {
  const byName = new Map<string, ImportEntry>();
  for (const card of cards) {
    const existing = byName.get(card.name);
    byName.set(card.name, {
      name: card.name,
      category: existing?.category ?? card.category,
      quantity: (existing?.quantity ?? 0) + card.quantity,
    });
  }
  return [...byName.values()];
}

/** Fetches and imports cards from Scryfall in batches of BATCH_SIZE. */
async function importCardsInBatches(
  entries: readonly ImportEntry[],
  addDeckCard: (card: DeckCard) => Promise<void>,
  onProgress: (imported: number) => void
): Promise<void> {
  const byName = new Map(entries.map((e) => [e.name, e]));
  let imported = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      const result = await getCardCollection(
        batch.map((entry) => ({ name: entry.name }))
      );
      for (const sc of result.data) {
        const entry = byName.get(sc.name);
        const deckCard: DeckCard = {
          id: sc.id,
          scryfallId: sc.id,
          name: sc.name,
          manaCost: sc.mana_cost ?? "",
          cmc: sc.cmc,
          typeLine: sc.type_line,
          oracleText: sc.oracle_text ?? "",
          colorIdentity: sc.color_identity,
          isGameChanger: false,
          isBanned: false,
          price: sc.prices?.usd ? Number.parseFloat(sc.prices.usd) : null,
          imageUri: getCardImageUri(sc, "normal"),
          artCropUri: getCardImageUri(sc, "art_crop"),
          category: isDeckCategory(entry?.category)
            ? entry.category
            : categorizeCard(sc),
          quantity: entry?.quantity ?? 1,
          zone: "main",
        };
        await addDeckCard(deckCard);
        imported += deckCard.quantity;
        onProgress(imported);
      }
    } catch (err) {
      logger.error("Batch import error", "DeckWizard", err);
    }
  }
}

export function DeckWizard({ open, onClose, onComplete }: DeckWizardProps) {
  const t = useTranslations("deck");
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1); // animation direction

  // Step 1 — Budget
  const [budget, setBudget] = useState<Budget | "unset">("unset");

  // Step 2 — Colors
  const [colors, setColors] = useState<ColorKey[]>([]);

  // Step 3 — Strategy
  const [strategy, setStrategy] = useState<string | null>(null);

  // Step 4 — Bracket (power level)
  const [bracket, setBracket] = useState<1 | 2 | 3 | 4 | null>(null);

  // Step 5 — Commander
  const [commanderName, setCommanderName] = useState("");
  const [commanderCard, setCommanderCard] = useState<ScryfallCard | null>(null);
  const [commanderSkipped, setCommanderSkipped] = useState(false);

  // Build state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isDemoDeck, setIsDemoDeck] = useState(false);
  // Importing 99 cards is ~65 serialized round trips; without a counter the
  // dialog looks frozen for the whole minute.
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  const { state: buildState, build, reset: resetBuild } = useAIDeckBuild();
  const { createDeck, setActiveDeck, addDeckCard, setCommander } =
    useDeckStore();

  // Reset wizard on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setDir(1);
      setBudget("unset");
      setColors([]);
      setStrategy(null);
      setBracket(null);
      setCommanderName("");
      setCommanderCard(null);
      setCommanderSkipped(false);
      setIsBuilding(false);
      setBuildError(null);
      setIsDemoDeck(false);
      setImportedCount(0);
      setImportTotal(0);
      resetBuild();
    }
  }, [open, resetBuild]);

  const navigate = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  // Can the user proceed from current step?
  const canContinue = useCallback((): boolean => {
    switch (step) {
      case 1:
        return budget !== "unset";
      case 2:
        return colors.length > 0;
      case 3:
        return strategy !== null;
      case 4:
        return bracket !== null;
      case 5:
        return true; // commander is optional
      default:
        return false;
    }
  }, [step, budget, colors, strategy, bracket]);

  const toggleColor = (c: ColorKey) => {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSkipCommander = () => {
    setCommanderName("");
    setCommanderCard(null);
    setCommanderSkipped(true);
    // handleGenerate reads commanderSkipped via closure — pass explicit flag
    handleGenerateWith(true);
  };

  const handleGenerateWith = async (skipCommander = false) => {
    if (!strategy) return;
    setIsBuilding(true);
    setBuildError(null);

    try {
      const result = await build({
        budget: budget === "unset" ? null : budget,
        colors,
        strategy,
        bracket: bracket ?? 2,
        commanderName:
          skipCommander || commanderSkipped || !commanderName
            ? null
            : commanderName,
      });

      if (!result) {
        setBuildError(t("wizard.buildCancelled"));
        return;
      }

      setIsDemoDeck(result.source === "demo");

      const deckId = await createDeck(`AI Deck — ${strategy}`, {
        isAIGenerated: true,
      });
      setActiveDeck(deckId);

      // Read the commander off the build result, not off `buildState`: this
      // closure captured the render-time snapshot, where it is still null.
      if (result.commander) {
        await tryResolveCommander(result.commander, setCommander);
      }

      const entries = collapseEntries(result.cards);
      setImportTotal(countCopies(result.cards));
      setImportedCount(0);
      await importCardsInBatches(entries, addDeckCard, setImportedCount);

      onComplete(deckId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deck build failed";
      logger.error("Generate error", "DeckWizard", err);
      setBuildError(message);
      setIsBuilding(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step content
  // ---------------------------------------------------------------------------
  const stepTitles = [
    { title: t("wizard.budgetTitle"), subtitle: t("wizard.budgetSubtitle") },
    { title: t("wizard.colorsTitle"), subtitle: t("wizard.colorsSubtitle") },
    {
      title: t("wizard.strategyTitle"),
      subtitle: t("wizard.strategySubtitle"),
    },
    { title: t("wizard.bracketTitle"), subtitle: t("wizard.bracketSubtitle") },
    {
      title: t("wizard.commanderTitle"),
      subtitle: t("wizard.commanderSubtitle"),
    },
  ];

  const currentTitle = stepTitles[step - 1];

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

        <Dialog.Content
          className="
            fixed inset-0 z-50 flex items-center justify-center p-4
            focus:outline-none
          "
          aria-describedby={undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="
              relative w-full max-w-xl bg-[var(--bg-secondary,#1a1a2e)] border border-[var(--border)]
              rounded-2xl shadow-2xl overflow-hidden
            "
            style={{ minHeight: 520 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-text)]" />
                <Dialog.Title className="text-sm font-semibold text-[var(--text-secondary)]">
                  {t("wizard.title")}
                </Dialog.Title>
              </div>
              <Dialog.Close
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={t("wizard.closeWizard")}
              >
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {/* Progress bar */}
            {!isBuilding && (
              <div className="px-6 pb-5">
                <ProgressBar step={step} total={TOTAL_WIZARD_STEPS} />
              </div>
            )}

            {/* Body */}
            <div
              className="px-6 pb-8 flex flex-col gap-6"
              style={{ minHeight: 360 }}
            >
              {isBuilding ? (
                /* Loading / streaming step */
                <div className="flex flex-col items-center justify-center flex-1 py-8">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
                    {t("wizard.aiBuilding")}
                  </h2>
                  <StepLoading
                    statusMessages={buildState.statusMessages}
                    commander={buildState.commander}
                    cardCount={countCopies(buildState.cards)}
                    totalCards={buildState.totalCards}
                    isDemoDeck={isDemoDeck}
                    importedCount={importedCount}
                    importTotal={importTotal}
                    error={buildError}
                  />
                  {buildError && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsBuilding(false);
                        setBuildError(null);
                        resetBuild();
                      }}
                      className="mt-6 text-sm text-[var(--accent-text)] hover:underline"
                    >
                      {t("wizard.tryAgain")}
                    </button>
                  )}
                </div>
              ) : (
                /* Step content */
                <AnimatePresence custom={dir} mode="wait">
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                    className="flex flex-col gap-6"
                  >
                    {/* Step heading */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                        {currentTitle?.title}
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                        {currentTitle?.subtitle}
                      </p>
                    </div>

                    {/* Step body */}
                    {step === 1 && (
                      <StepBudget
                        value={budget === "unset" ? 50 : budget}
                        onChange={(v) => setBudget(v)}
                      />
                    )}
                    {step === 2 && (
                      <StepColors selected={colors} onToggle={toggleColor} />
                    )}
                    {step === 3 && (
                      <StepStrategy value={strategy} onChange={setStrategy} />
                    )}
                    {step === 4 && (
                      <StepBracket value={bracket} onChange={setBracket} />
                    )}
                    {step === 5 && (
                      <StepCommander
                        commanderName={commanderName}
                        commanderCard={commanderCard}
                        onSelect={(name, card) => {
                          setCommanderName(name);
                          setCommanderCard(card);
                          setCommanderSkipped(false);
                        }}
                        onSkip={handleSkipCommander}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer — navigation */}
            {!isBuilding && (
              <div className="flex items-center justify-between px-6 pb-6">
                {/* Back */}
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => navigate(step - 1)}
                    className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("wizard.back")}
                  </button>
                ) : (
                  <div />
                )}

                {/* Continue / Generate */}
                {step < TOTAL_WIZARD_STEPS ? (
                  <button
                    type="button"
                    onClick={() => navigate(step + 1)}
                    disabled={!canContinue()}
                    className="
                      px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                      bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {t("wizard.continue")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGenerateWith(false)}
                    disabled={!canContinue()}
                    className="
                      flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                      bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    <Sparkles className="w-4 h-4" />
                    {t("wizard.generateDeck")}
                  </button>
                )}
                {/* Hidden — handleGenerate wired to button above */}
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
