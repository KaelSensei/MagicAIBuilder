/**
 * Writes the cards and commander of an AI build into a deck the store already created.
 *
 * Deck building context. The AI deck wizard streams a decklist of names; these helpers look the
 * names up on Scryfall and add the cards to the deck through the deck store, one at a time.
 *
 * @module deck/built-deck-import
 */
import { forEachSequential } from "@/lib/async/sequential";
import { getCardByNameFuzzy, getCardCollection } from "@/lib/scryfall/client";
import { logger } from "@/lib/logger";
import type { BuildCard } from "@/hooks/useAIDeckBuild";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { categorizeCard } from "@/lib/deck/categories";
import { getCardImageUri } from "@/lib/scryfall/images";
import { priceUsdOf } from "@/lib/scryfall/price";
import type { CardCategory, DeckCard } from "@/lib/deck/types";

/** Max cards per Scryfall collection lookup request */
const BATCH_SIZE = 75;

/** Tries to resolve a commander name and set it — non-fatal if it fails. */
export async function tryResolveCommander(
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
export interface ImportEntry {
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

/**
 * Fetches and imports cards from Scryfall in batches of BATCH_SIZE.
 *
 * A batch whose lookup or save fails is logged and skipped, so the import never throws.
 */
export async function importCardsInBatches(
  entries: readonly ImportEntry[],
  addDeckCard: (card: DeckCard) => Promise<void>,
  onProgress: (imported: number) => void
): Promise<void> {
  const byName = new Map(entries.map((e) => [e.name, e]));
  let imported = 0;

  const offsets = Array.from(
    { length: Math.ceil(entries.length / BATCH_SIZE) },
    (_, index) => index * BATCH_SIZE
  );
  await forEachSequential(offsets, async (i) => {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      const result = await getCardCollection(
        batch.map((entry) => ({ name: entry.name }))
      );
      await forEachSequential(result.data, async (sc) => {
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
          price: priceUsdOf(sc),
          imageUri: getCardImageUri(sc, "grid"),
          artCropUri: getCardImageUri(sc, "art"),
          category: isDeckCategory(entry?.category)
            ? entry.category
            : categorizeCard(sc),
          quantity: entry?.quantity ?? 1,
          zone: "main",
        };
        await addDeckCard(deckCard);
        imported += deckCard.quantity;
        onProgress(imported);
      });
    } catch (err) {
      logger.error("Batch import error", "DeckWizard", err);
    }
  });
}
