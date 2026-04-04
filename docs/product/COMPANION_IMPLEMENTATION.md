# Companion Implementation in MagicAIBuilder

## Overview

**Companions** are a mechanic introduced in _Ikoria_ (2020) that allows a player to cast a spell from outside the game. Unlike Partners or Backgrounds, a Companion is not a commander — it's an _optional mechanic_ that adds strategic flexibility to the Commander format.

**Key rules:**

- A deck can have **at most 1 Companion**
- The Companion starts outside the game (not in hand, not in library)
- Each Companion has a specific condition: the deck must meet this condition to cast the Companion
- If the condition is no longer met, the Companion returns outside the game
- Each Companion can only be activated once per game

---

## Current System State

### ✅ What Already Exists

1. **Types and Interfaces** (`src/lib/deck/types.ts`)
   - `companion: DeckCard | null` → already in `Deck` interface
   - `CardCategory` includes `"companion"` → already defined

2. **Store** (`src/lib/deck/store.ts`)
   - Actions to set/remove a Companion
   - Logic for detecting Companions on import
   - Synchronization with the API

3. **Validation** (`src/lib/deck/validation.ts`)
   - Counts cards for the 100-card rule (Companion doesn't count)
   - Validates color identity against the Companion if present

4. **Pairing System** (`src/lib/deck/pairing.ts`)
   - Handles Partner, Background, Doctor's Companion, etc.
   - Ready to be extended for Companions

### ⚠️ What's Missing

1. **Companion Condition Detection**
   - No logic to identify a Companion's condition
   - No validation that the deck meets the condition

2. **Condition Validation**
   - No check that the deck fulfills the Companion's requirements
   - No tests for conditions

3. **UI/UX**
   - No display for the Companion (separate zone?)
   - No visual indication of the Companion's condition
   - No warning if the condition is not met

4. **Special Rules**
   - Distinction between Companion and Partner
   - Rule: "at most 1 Companion, even with multiple commanders"

---

## Proposed Architecture

### 1. Companion Detection and Parsing

**File to create:** `src/lib/deck/companion.ts`

```typescript
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { DeckCard } from "./types";

/**
 * Companion condition — determines if a deck can use this Companion
 * @param deckCards - Cards in the deck (without companion, without commander)
 * @param commander - The deck's commander
 * @param partner - The optional partner
 */
export type CompanionCondition =
  | { type: "none" }
  | { type: "max_cmc"; value: number }
  | { type: "singleton"; comment: string } // "each card appears exactly once"
  | { type: "mono_color"; color: string }
  | { type: "even_cmc" }
  | { type: "nonland_maximum"; value: number }
  | { type: "custom"; description: string };

/**
 * Detects the Companion type and its condition
 * @returns null if the card is not a Companion
 */
export function detectCompanionCondition(
  card: ScryfallCard
): CompanionCondition | null {
  const oracle = (card.oracle_text ?? "").toLowerCase();

  // Gyruda: even CMC
  if (card.name === "Gyruda, Doom of Depths") {
    return { type: "even_cmc" };
  }

  // Jegantha: no costs with multiple same mana symbols
  if (card.name === "Jegantha, the Wellspring") {
    return {
      type: "custom",
      description: "All mana costs contain at most 1 of each mana symbol",
    };
  }

  // Kaheera: creatures only
  if (card.name === "Kaheera, the Orphanage") {
    return {
      type: "custom",
      description: "Your deck contains only creatures and lands",
    };
  }

  // Lurrus: CMC ≤ 2
  if (card.name === "Lurrus of the Dream-Den") {
    return { type: "max_cmc", value: 2 };
  }

  // Obosh: odd CMC only
  if (card.name === "Obosh, the Preypiercer") {
    return {
      type: "custom",
      description: "All nonzero CMC values in your deck are odd",
    };
  }

  // Umori: one card type only
  if (card.name === "Umori, the Collector") {
    return {
      type: "custom",
      description: "Your deck contains only one card type (excluding lands)",
    };
  }

  // Yorion: 60+ cards in Commander
  if (card.name === "Yorion, Sky Nomad") {
    return {
      type: "custom",
      description: "Your deck contains 61+ cards (instead of 100)",
    };
  }

  // Zirda: activated abilities only
  if (card.name === "Zirda, the Dawnwaker") {
    return {
      type: "custom",
      description:
        "Your cards can only have activated abilities (no triggered abilities)",
    };
  }

  // Parse generic "Companion" keyword (if future)
  if (oracle.includes("companion")) {
    return { type: "custom", description: "Check the Companion's Oracle text" };
  }

  return null;
}

/**
 * Checks if a deck meets a Companion's condition
 * @returns { valid: boolean; reason?: string }
 */
export function validateCompanionCondition(
  companion: CompanionCondition,
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null
): { valid: boolean; reason?: string } {
  const allCards = [
    ...(commander ? [commander] : []),
    ...(partner ? [partner] : []),
    ...deckCards,
  ];

  switch (companion.type) {
    case "none":
      return { valid: true };

    case "max_cmc": {
      const violators = allCards.filter((c) => c.cmc > companion.value);
      if (violators.length > 0) {
        return {
          valid: false,
          reason: `Companion requires CMC ≤ ${companion.value}, but you have: ${violators
            .slice(0, 3)
            .map((c) => c.name)
            .join(", ")}${violators.length > 3 ? ", ..." : ""}`,
        };
      }
      return { valid: true };
    }

    case "even_cmc": {
      const violators = allCards.filter(
        (c) => !c.typeLine.toLowerCase().includes("land") && c.cmc % 2 !== 0
      );
      if (violators.length > 0) {
        return {
          valid: false,
          reason: `Companion requires even CMC only, but you have ${violators.length} cards with odd CMC`,
        };
      }
      return { valid: true };
    }

    case "singleton":
      // The entire deck is already singleton (except basic lands)
      // This check is redundant with validateDeck()
      return { valid: true };

    case "mono_color": {
      const violators = allCards.filter((c) => c.colorIdentity.length > 1);
      if (violators.length > 0) {
        return {
          valid: false,
          reason: `Companion requires mono-color, but you have ${violators.length} multi-color cards`,
        };
      }
      return { valid: true };
    }

    case "nonland_maximum": {
      const nonlands = allCards.filter(
        (c) => !c.typeLine.toLowerCase().includes("land")
      );
      if (nonlands.length > companion.value) {
        return {
          valid: false,
          reason: `Companion requires max ${companion.value} non-lands, you have ${nonlands.length}`,
        };
      }
      return { valid: true };
    }

    case "custom":
      // Requires manual validation
      return { valid: true };
  }
}

/**
 * Returns a human-readable description of the condition
 */
export function describeCompanionCondition(
  condition: CompanionCondition
): string {
  switch (condition.type) {
    case "none":
      return "No condition";
    case "max_cmc":
      return `Each card's CMC ≤ ${condition.value}`;
    case "even_cmc":
      return "All nonzero CMCs are even";
    case "mono_color":
      return "Mono-color only";
    case "nonland_maximum":
      return `Max ${condition.value} non-lands`;
    case "singleton":
      return "Singleton (already applied)";
    case "custom":
      return condition.description;
  }
}
```

---

### 2. Modify the Store to Handle Companions

**Modifications in:** `src/lib/deck/store.ts`

```typescript
import { validateCompanionCondition, detectCompanionCondition } from "./companion";

// In useDeckStore:
interface DeckStore {
  // ... existing fields ...

  // Add a getter for Companion validation
  validateCompanion: () => { valid: boolean; reason?: string } | null;

  // Add to setters
  setCompanion: (card: DeckCard | null) => Promise<void>;
}

// In create():
validateCompanion: () => {
  const { activeDeck } = get();
  if (!activeDeck?.companion) return null;

  const companionCondition = detectCompanionCondition(
    // Fetch from Scryfall API or cache
  );
  if (!companionCondition) return { valid: true }; // Not a Companion

  return validateCompanionCondition(
    companionCondition,
    activeDeck.cards,
    activeDeck.commander,
    activeDeck.partner
  );
},

setCompanion: async (card: DeckCard | null) => {
  const { activeDeck, deckApi } = get();
  if (!activeDeck) return;

  // Check Companion rules
  if (card) {
    // Max 1 Companion
    if (activeDeck.companion && activeDeck.companion.id !== card.id) {
      throw new Error("You can only have one Companion per deck");
    }

    // Must have a commander
    if (!activeDeck.commander) {
      throw new Error("You must have a commander to have a Companion");
    }
  }

  // Update
  const updatedDeck = { ...activeDeck, companion: card };
  set({ activeDeck: updatedDeck });

  if (activeDeckId) {
    await deckApi.updateDeck(activeDeckId, { companionId: card?.id ?? null });
  }
},
```

---

### 3. Extend the Validation System

**Modifications in:** `src/lib/deck/validation.ts`

```typescript
import {
  validateCompanionCondition,
  detectCompanionCondition,
} from "./companion";
import type { ScryfallCard } from "@/lib/scryfall/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  companionWarning?: string; // New
}

export async function validateDeck(
  deck: Deck,
  scryfallCache?: Map<string, ScryfallCard>
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let companionWarning: string | undefined;

  const allCards = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...deck.cards,
  ];

  checkCardCount(allCards, errors, warnings);

  if (!deck.commander) {
    errors.push("Deck must have a commander");
  }

  const bannedCards = allCards.filter((c) => c.isBanned);
  if (bannedCards.length > 0) {
    errors.push(
      `Banned cards in deck: ${bannedCards.map((c) => c.name).join(", ")}`
    );
  }

  checkColorIdentityViolations(deck, errors);
  checkGameChangers(allCards, warnings);
  checkSingleton(allCards, errors);

  // NEW: Validate the Companion
  if (deck.companion && scryfallCache) {
    const scryfallCard = scryfallCache.get(deck.companion.scryfallId ?? "");
    if (scryfallCard) {
      const companionCondition = detectCompanionCondition(scryfallCard);
      if (companionCondition) {
        const validation = validateCompanionCondition(
          companionCondition,
          deck.cards,
          deck.commander,
          deck.partner
        );
        if (!validation.valid) {
          companionWarning = validation.reason;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    companionWarning,
  };
}
```

---

### 4. Unit Tests

**File to create:** `src/lib/deck/companion.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  detectCompanionCondition,
  validateCompanionCondition,
  describeCompanionCondition,
} from "./companion";
import type { DeckCard } from "./types";

describe("companion conditions", () => {
  const lurrus: DeckCard = {
    id: "lurrus",
    name: "Lurrus of the Dream-Den",
    cmc: 3,
    typeLine: "Legendary Creature — Cat",
    colorIdentity: ["W", "B"],
    quantity: 1,
    zone: "main",
    // ... other fields
  } as DeckCard;

  const gyruda: DeckCard = {
    id: "gyruda",
    name: "Gyruda, Doom of Depths",
    cmc: 4,
    typeLine: "Legendary Creature — Leviathan",
    colorIdentity: ["U", "B"],
    quantity: 1,
    zone: "main",
  } as DeckCard;

  it("detects Lurrus (CMC ≤ 2)", () => {
    const condition = detectCompanionCondition(lurrus as any);
    expect(condition).toEqual({ type: "max_cmc", value: 2 });
  });

  it("detects Gyruda (even CMC)", () => {
    const condition = detectCompanionCondition(gyruda as any);
    expect(condition).toEqual({ type: "even_cmc" });
  });

  it("validates Lurrus with CMC ≤ 2", () => {
    const deckCards: DeckCard[] = [
      { name: "Lightning Bolt", cmc: 1 } as DeckCard,
      { name: "Counterspell", cmc: 2 } as DeckCard,
    ];

    const result = validateCompanionCondition(
      { type: "max_cmc", value: 2 },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(true);
  });

  it("rejects Lurrus with CMC > 2", () => {
    const deckCards: DeckCard[] = [
      { name: "Lightning Bolt", cmc: 1 } as DeckCard,
      { name: "Wrath of God", cmc: 4 } as DeckCard,
    ];

    const result = validateCompanionCondition(
      { type: "max_cmc", value: 2 },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Wrath of God");
  });

  it("validates Gyruda with even CMC", () => {
    const deckCards: DeckCard[] = [
      { name: "Island", cmc: 0, typeLine: "Land" } as DeckCard,
      { name: "Counterspell", cmc: 2 } as DeckCard,
      { name: "Mystic Reflection", cmc: 4 } as DeckCard,
    ];

    const result = validateCompanionCondition(
      { type: "even_cmc" },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(true);
  });

  it("rejects Gyruda with odd CMC", () => {
    const deckCards: DeckCard[] = [
      { name: "Counterspell", cmc: 2 } as DeckCard,
      { name: "Lightning Bolt", cmc: 1 } as DeckCard,
    ];

    const result = validateCompanionCondition(
      { type: "even_cmc" },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(false);
  });

  it("describes conditions", () => {
    expect(describeCompanionCondition({ type: "max_cmc", value: 2 })).toBe(
      "Each card's CMC ≤ 2"
    );

    expect(describeCompanionCondition({ type: "even_cmc" })).toBe(
      "All nonzero CMCs are even"
    );

    expect(
      describeCompanionCondition({
        type: "custom",
        description: "Test",
      })
    ).toBe("Test");
  });
});
```

---

### 5. UI Integration (Components)

**File to create or modify:** `src/app/builder/components/CompanionCard.tsx`

```typescript
"use client";

import { useDeckStore } from "@/lib/deck/store";
import { validateCompanionCondition, describeCompanionCondition } from "@/lib/deck/companion";
import { useEffect, useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall/types";

export function CompanionCard() {
  const { activeDeck, setCompanion } = useDeckStore((s) => ({
    activeDeck: s.activeDeck,
    setCompanion: s.setCompanion,
  }));

  const [companionCondition, setCompanionCondition] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (!activeDeck?.companion) {
      setCompanionCondition(null);
      setValidationResult(null);
      return;
    }

    // Fetch condition from Scryfall
    (async () => {
      const res = await fetch(
        `/api/scryfall?name=${encodeURIComponent(activeDeck.companion!.name)}`
      );
      const card: ScryfallCard = await res.json();

      // ... detect and validate
    })();
  }, [activeDeck?.companion]);

  if (!activeDeck?.companion) {
    return (
      <div className="border border-dashed border-gray-400 p-4 rounded">
        <p className="text-gray-400">No Companion</p>
      </div>
    );
  }

  return (
    <div className="border border-purple-500 p-4 rounded bg-purple-950">
      <div className="flex items-center gap-3">
        <img
          src={activeDeck.companion.imageUri}
          alt={activeDeck.companion.name}
          className="w-16 h-24 rounded object-cover"
        />
        <div className="flex-1">
          <h4 className="font-bold text-white">{activeDeck.companion.name}</h4>
          <p className="text-sm text-purple-200">
            {companionCondition && describeCompanionCondition(companionCondition)}
          </p>

          {validationResult && !validationResult.valid && (
            <div className="mt-2 p-2 bg-red-900 text-red-100 text-sm rounded">
              ⚠️ {validationResult.reason}
            </div>
          )}

          <button
            onClick={() => setCompanion(null)}
            className="mt-2 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Important Considerations

### MTG Rules to Respect

1. **Max 1 Companion per deck** — even with multiple commanders (Partner, Background, etc.)
2. **No Companion in the deck itself** — it starts outside the game
3. **Companion ≠ Partner** — a Partner counts toward singleton, a Companion does not
4. **Condition is optional** — you can cast a Companion even if the condition is no longer met (you just lose it)

### Companion vs Partner Differences

| Aspect                  | Companion           | Partner              |
| ----------------------- | ------------------- | -------------------- |
| Counts toward 100 cards | ❌ No               | ✅ Yes               |
| Can be multiple         | ❌ Max 1            | ✅ Up to 2           |
| Starts in game          | ❌ Outside the game | ✅ In commander zone |
| Activation condition    | ✅ Yes (optional)   | ❌ No                |
| Color identity          | ✅ Adds to it       | ✅ Adds to it        |

---

## Implementation Checklist

- [ ] Create `src/lib/deck/companion.ts` with detection and validation
- [ ] Add tests in `src/lib/deck/companion.test.ts`
- [ ] Modify `src/lib/deck/store.ts` to add `setCompanion` + validation
- [ ] Modify `src/lib/deck/validation.ts` to integrate Companion validation
- [ ] Create/modify UI component `CompanionCard.tsx`
- [ ] Add visual warnings in `DeckStats` if Companion is invalid
- [ ] Test with all 8 Companions from Ikoria+Future

---

## Resources

- [Fandom — Companion](https://mtg.fandom.com/wiki/Companion)
- [Official Rules](https://mtg.fandom.com/wiki/Companion#Rules)
- [List of Companions](https://scryfall.com/search?q=keyword%3Acompanion&unique=cards)
