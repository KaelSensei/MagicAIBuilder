// Commander Spellbook API integration for combo detection

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface SpellbookVariant {
  id: string;
  uses: { card: { name: string } }[];
  produces: { feature: { name: string } }[];
  description: string;
  cards: string[]; // Resolved card names
  effects: string[]; // Resolved effect names
  isInfinite: boolean;
}

interface SpellbookApiVariant {
  id: string;
  uses: { card: { name: string } }[];
  produces: { feature: { name: string } }[];
  description?: string;
  notes?: string;
}

interface SpellbookApiResponse {
  count: number;
  results: SpellbookApiVariant[];
}

// In-memory cache: cardName → { variants, fetchedAt }
const cache = new Map<string, { variants: SpellbookVariant[]; fetchedAt: number }>();

function isInfiniteCombo(effects: string[]): boolean {
  const infiniteKeywords = [
    "infinite",
    "unlimited",
    "win the game",
    "lose the game",
    "draw all",
    "kills all",
    "infinite loop",
  ];
  return effects.some((effect) =>
    infiniteKeywords.some((kw) => effect.toLowerCase().includes(kw))
  );
}

function parseVariant(raw: SpellbookApiVariant): SpellbookVariant {
  const cards = raw.uses.map((u) => u.card.name);
  const effects = raw.produces.map((p) => p.feature.name);
  const description =
    raw.description ?? raw.notes ?? effects.join(" + ");

  return {
    id: raw.id,
    uses: raw.uses,
    produces: raw.produces,
    description,
    cards,
    effects,
    isInfinite: isInfiniteCombo(effects),
  };
}

/** Fetch combos for a single card name, with 1h cache */
export async function fetchCombosForCard(
  cardName: string
): Promise<SpellbookVariant[]> {
  const now = Date.now();
  const cached = cache.get(cardName);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.variants;
  }

  try {
    const url = `/api/combos?cards=${encodeURIComponent(cardName)}&format=json`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      // Don't throw — just return empty to avoid cascade failures
      cache.set(cardName, { variants: [], fetchedAt: now });
      return [];
    }

    const data: SpellbookApiResponse = await response.json();
    const variants = (data.results ?? []).map(parseVariant);

    cache.set(cardName, { variants, fetchedAt: now });
    return variants;
  } catch {
    cache.set(cardName, { variants: [], fetchedAt: now });
    return [];
  }
}

/** Fetch and deduplicate all combos for a list of card names */
export async function fetchCombosForDeck(
  cardNames: string[]
): Promise<SpellbookVariant[]> {
  // Fetch all in parallel
  const allVariantArrays = await Promise.all(
    cardNames.map((name) => fetchCombosForCard(name))
  );

  // Flatten and deduplicate by variant id
  const seen = new Map<string, SpellbookVariant>();
  for (const variants of allVariantArrays) {
    for (const variant of variants) {
      if (!seen.has(variant.id)) {
        seen.set(variant.id, variant);
      }
    }
  }

  // Only return combos where ALL required cards are in the deck
  const deckSet = new Set(cardNames.map((n) => n.toLowerCase()));
  const filteredCombos = Array.from(seen.values()).filter((variant) =>
    variant.cards.every((card) => deckSet.has(card.toLowerCase()))
  );

  // Sort: infinite first, then alphabetical
  return filteredCombos.sort((a, b) => {
    if (a.isInfinite && !b.isInfinite) return -1;
    if (!a.isInfinite && b.isInfinite) return 1;
    return a.cards.length - b.cards.length;
  });
}

/** Clear in-memory cache (for testing) */
export function clearSpellbookCache() {
  cache.clear();
}
