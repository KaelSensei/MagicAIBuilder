# Feature: Commander Power Meter (Offline Bracket & Power Analyzer)

## Overview

Add an **offline-first deck power analyzer** to MagicTheOfflining, inspired by
[commanderpowermeter.com](https://commanderpowermeter.com). Users open any deck
already stored in the app and instantly get:

- A **WotC Bracket rating (1–5)** — Exhibition, Core, Upgraded, Optimized, cEDH
- A **Power Level score (1–10)** derived from weighted sub-signals
- A **category breakdown** showing _why_ the deck landed in that bracket
- A **list of flagged cards** per category (Game Changers, tutors, fast mana,
  stax, MLD, extra turns, combo pieces)

Because the app is offline-first and the security rules only allow calls to
Moxfield and Scryfall, **all analysis runs locally against SQLite** using data
bundled with the app and refreshed opportunistically when the user is online.

---

## Reference: What commanderpowermeter.com Does

Reference screenshots captured from the site live under
`src/assets/competitor/`:

| File                        | Shows                                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commanderpowermeter_0.png` | Landing / "Know Your Power Level" + decklist paste box, Moxfield / Archidekt / Manabox inputs                                                                                                                                           |
| `commanderpowermeter_1.png` | Headline stats (**59 Game Changers tracked**, **109 rules patterns recognized**, **52 synergy archetypes**, **10k+ combo lines checked**) and the "What We Analyze" panel with Combo Detection / Synergy Analysis / Bracket Rating tabs |
| `commanderpowermeter_2.png` | "Common Questions" FAQ — bracket determination, accuracy, supported formats (Commander / EDH only)                                                                                                                                      |

| Feature                       | Description                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bracket rating                | Places the deck on the official WotC Brackets 1–5 scale                                                                                                        |
| Game Changer detection        | Flags any of the 53 cards on the official Game Changers list (Feb 9, 2026 update — the site currently tracks 59 including historical entries)                  |
| Infinite combo detection      | Uses the full Commander Spellbook database (10k+ lines) to find 2-card and multi-card combos, plus "near-combos" missing one piece                             |
| Synergy / archetype detection | Classifies the deck against 50+ archetypes: spellslinger, aristocrats, voltron, stax, tokens, reanimator, etc.                                                 |
| Tutor count                   | Counts unconditional, narrow, and creature tutors separately                                                                                                   |
| Fast mana                     | Flags Sol Ring, Mana Crypt, Mana Vault, LED, etc.                                                                                                              |
| Stax detection                | Flags resource-denial pieces (Winter Orb, Rule of Law, etc.)                                                                                                   |
| Mass land destruction         | Hard-forces Bracket 4+                                                                                                                                         |
| Extra turn spells             | Counted as a soft signal                                                                                                                                       |
| Hard floors vs. soft signals  | GCs, 2-card infinites, MLD set the **minimum** bracket; interaction density, tutor count, card popularity, and mana curve place the deck _within_ that bracket |
| Supported inputs              | Paste list, or import from Moxfield / Archidekt / Manabox                                                                                                      |
| Output                        | Free, no sign-up, paste-a-decklist UX                                                                                                                          |

---

## Current State in MagicTheOfflining

**Existing building blocks we can reuse:**

- ✅ Deck import from Moxfield with full card metadata (CMC, type, oracle text, colors)
- ✅ SQLite repository layer (`src/db/repositories.ts`)
- ✅ Scryfall integration for card data and pricing
- ✅ Deck view with filtering by CMC/type/rarity
- ✅ `mtg-commander-analysis` skill (encodes the domain knowledge)

**What's missing:**

- ❌ Bracket/Power score computation
- ❌ Bundled Game Changers list
- ❌ Bundled combo database (Commander Spellbook snapshot)
- ❌ Heuristic classifiers for tutors / fast mana / stax / MLD / extra turns
- ❌ UI screen to display the analysis

---

## Feature Requirements

### 1. Bundled Reference Data (Offline Source of Truth)

Ship the app with a read-only SQLite table (or JSON assets loaded at startup)
containing:

| Table           | Contents                                                                       | Refresh strategy                                                                      |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `game_changers` | 53-card WotC list                                                              | Bundled snapshot, updatable via in-app "Refresh reference data" (Scryfall tag search) |
| `combos`        | Commander Spellbook combos (card IDs + requires + produces + colors)           | Bundled snapshot, manual refresh                                                      |
| `card_tags`     | `is_tutor`, `is_fast_mana`, `is_stax`, `is_mld`, `is_extra_turn` per oracle ID | Bundled; derived heuristically at build time from oracle text                         |

All reference data lives under `src/data/reference/` as JSON and is loaded into
SQLite on first launch (or after a refresh).

### 2. Deck Analysis Engine (`src/analysis/`)

Pure TypeScript, no React dependencies, fully unit-tested.

```
src/analysis/
  bracketAnalyzer.ts        # orchestrator
  detectors/
    gameChangers.ts
    combos.ts
    tutors.ts
    fastMana.ts
    stax.ts
    massLandDestruction.ts
    extraTurns.ts
    interactionDensity.ts
  scoring/
    hardFloors.ts           # "any MLD => bracket >= 4", etc.
    softSignals.ts           # weighted score within a bracket
  types.ts
```

**Input:** `DeckId` (the engine reads the deck from SQLite itself, respecting
the single-source-of-truth rule from `security.mdc`).

**Output (discriminated union):**

```typescript
export type AnalysisResult = {
  deckId: string;
  bracket: 1 | 2 | 3 | 4 | 5;
  powerScore: number; // 1.0 - 10.0, one decimal
  hardFloorReasons: readonly HardFloorReason[];
  categories: {
    gameChangers: readonly FlaggedCard[];
    combos: readonly DetectedCombo[];
    tutors: { unconditional: number; narrow: number; creature: number };
    fastMana: readonly FlaggedCard[];
    stax: readonly FlaggedCard[];
    massLandDestruction: readonly FlaggedCard[];
    extraTurns: readonly FlaggedCard[];
    interactionCount: number;
    archetypes: readonly { name: string; confidence: number }[]; // spellslinger, aristocrats, voltron, stax, tokens, reanimator, etc.
  };
  computedAt: number; // unix ms
};
```

### 3. Hard Floors vs. Soft Signals

Mirror commanderpowermeter.com's two-layer model:

**Hard floors (set the minimum bracket):**

- ≥ 1 Game Changer → min Bracket 3
- ≥ 4 Game Changers, or any 2-card infinite combo → min Bracket 4
- Any MLD → min Bracket 4
- cEDH-tier fast mana stack (Mana Crypt + Mana Vault + LED + Sol Ring) → min Bracket 4

**Soft signals (place the deck within that bracket, feed the 1–10 score):**

- Tutor count (weighted by restrictiveness)
- Interaction density (counterspells + removal per 99)
- Average CMC
- Combo piece density (even without assembled combos)
- Extra turn count

### 4. UI — Power Meter Screen

Accessible from the deck detail screen via a new **"Power Meter"** action.

```
┌──────────────────────────────────────────┐
│  ← Bant Draw Counter            ⟳ Refresh│
├──────────────────────────────────────────┤
│                                          │
│            Bracket 3 — Upgraded          │
│                  ●●●○○                   │
│                                          │
│            Power Level  6.8 / 10         │
│                                          │
├──────────────────────────────────────────┤
│  ▸ Game Changers            2            │
│    • Smothering Tithe                    │
│    • Rhystic Study                       │
├──────────────────────────────────────────┤
│  ▸ Infinite Combos          1            │
│    • Thassa's Oracle + Demonic Consult.. │
├──────────────────────────────────────────┤
│  ▸ Tutors                   4            │
│    Unconditional: 2 · Narrow: 1 · Cre: 1 │
├──────────────────────────────────────────┤
│  ▸ Fast Mana                3            │
│  ▸ Stax                     0            │
│  ▸ Mass Land Destruction    0            │
│  ▸ Extra Turns              1            │
│  ▸ Interaction (removal+cx) 9            │
└──────────────────────────────────────────┘
```

- All copy goes through `src/i18n/translations.ts` (EN + FR).
- Results are cached in a new `deck_analysis` SQLite table keyed by
  `deck_id` + deck content hash, so re-opening the screen is instant.

### 5. Rule 0 Export

Add a **"Copy summary"** button that puts a short pre-game blurb on the
clipboard, e.g.:

> _Bant Draw Counter — Bracket 3 (Upgraded). 2 Game Changers, 1 two-card
> combo, 4 tutors, no MLD. Power 6.8/10._

This is what commanderpowermeter.com is effectively used for: table-talk
before a game.

---

## Non-Goals

- ❌ No online analysis API — everything runs on-device.
- ❌ No user accounts, no shared decks, no leaderboards.
- ❌ No live Commander Spellbook polling — only bundled snapshots with a
  manual refresh.
- ❌ No automatic deck edits or suggestions (a future feature could wrap this
  analyzer into a "suggest cuts" tool, but that's out of scope here).

---

## Security & Offline Constraints

Per `.claude/rules/security.mdc`:

- Reference data bundled in the app ships from our repo, not fetched at
  runtime from arbitrary domains.
- The optional "Refresh reference data" action only hits Scryfall
  (`is:gamechanger`, tag searches) — already on the allowlist.
- Commander Spellbook snapshot refresh is **not** auto-wired; it requires a
  manual release of the app containing the updated JSON, until/unless
  `spellbook.commanderspellbook.com` is added to the allowlist in a
  follow-up discussion.
- All oracle text used by heuristic detectors is read from SQLite, never
  `eval`'d.

---

## Testing Strategy

Per `CLAUDE.md` (Canon TDD, Jest):

1. Unit tests for each detector in `__tests__/analysis/detectors/*.test.ts`
   using fixture decks.
2. Integration test: golden-file tests for 5 sample decks (one per bracket)
   asserting the full `AnalysisResult` shape.
3. Snapshot tests for the Power Meter screen rendering.
4. No network in tests — reference data loaded from fixture JSON.

---

## Rollout Plan

1. **Phase 1 — Reference data & engine:** bundle Game Changers + Spellbook
   snapshot, implement detectors and scoring, ship behind a feature flag.
2. **Phase 2 — UI:** Power Meter screen + deck-detail entry point.
3. **Phase 3 — Rule 0 export & polish:** clipboard summary, i18n sweep,
   dark-mode pass.
4. **Phase 4 — Reference refresh UX:** in-app action to re-pull Game
   Changers from Scryfall tag search.

Each phase is a separate PR off its own `feature/power-meter-*` branch, per
`CLAUDE.md` branch discipline.

---

## Open Questions

1. Should the Power Level 1–10 score be exposed, or only the Bracket 1–5?
   (commanderpowermeter.com shows both; EDHREC-style users expect the 1–10.)
2. How often do we want to refresh the bundled Spellbook snapshot — every
   release, or on a cadence?
3. Do we want per-card "why this was flagged" tooltips in v1, or defer to v2?
