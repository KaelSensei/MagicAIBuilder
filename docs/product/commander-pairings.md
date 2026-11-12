# Commander pairings (Partner / Background / Doctor’s Companion)

MagicAIBuilder supports “two-slot” commander configurations using a single model:

- `commander`: the primary commander slot
- `partner`: the secondary slot (label depends on pairing type)

This applies to every partner ability of CR 702.124:

- Partner (702.124h)
- Partner—[text]: Character select, Father & son, Friends forever, Survivors (702.124i)
- Partner with [name] (702.124j)
- Choose a Background + a legendary Background (702.124k)
- Doctor’s companion + a legendary Time Lord Doctor with no other creature types (702.124m)

---

## One rule, one place

`pairCommanders(a, b)` in `src/lib/deck/pairing.ts` decides whether two cards can share
the command zone and which pairing they use. The deck store (`setCommander`, `setPartner`),
the bulk editor, the AI build check and `PATCH /api/decks/[id]/command-zone` all call it.
The deck metadata route, `PATCH /api/decks/[id]`, refuses the command fields outright.

- Abilities are read from each card’s **Oracle text**, line by line
  (`src/lib/deck/partner-abilities.ts`). Scryfall’s keyword list is not used: it tags
  “Partner with” and every “Partner—[text]” card with plain “Partner” too.
- Abilities never combine (702.124f). A card with two, such as Amy Pond, may use either
  (702.124g).
- A Time Lord Doctor and a Background have no partner ability, but either one opens the
  second slot for the card that can join it.
- The deck stores the pairing a pair uses in `pairingType`. A lone commander stores its first
  pairing in Oracle order; it only sets the slot label.

## Partner-slot search

The search is built from the commander’s partner abilities, one query per ability, joined
with `or`: Pir searches `!"Toothy, Imaginary Friend"`, Clara Oswald searches Time Lord Doctors,
and Amy Pond searches Rory Williams or a Time Lord Doctor.

---

## Backgrounds are not commanders (important)

Background cards are **legendary enchantments** with subtype **Background**.

Because they are not commanders, the partner-slot search behaves differently:

- For `background` pairing type we query **Background cards** (`t:background`) instead of commanders.

This prevents the common UX failure mode where you can’t find a Background unless you use Commander search.

---

## UI flow

1. Set a commander using **Commander** mode.
2. If the commander supports a second slot, a second button appears:
   - Partner / Friends Forever / … / Background
3. Enable the second button and click a search result to set the secondary slot.

Safety guard:

- If pairing type is **Background** and the user clicks a Background while **Commander** mode is enabled, the app treats it as the **Background slot** (so it won’t replace the commander).

---

## Acceptance criteria

- When a deck’s pairing type is `background`, the “partner slot” search results must include Background cards.
- Selecting a Background must not replace the commander.
- Commander/partner selection should remain stable across refresh (persisted via deck API).
