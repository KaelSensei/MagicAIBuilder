# Commander pairings (Partner / Background / Doctor’s Companion)

MagicAIBuilder supports “two-slot” commander configurations using a single model:

- `commander`: the primary commander slot
- `partner`: the secondary slot (label depends on pairing type)

This applies to:

- Partner
- Partner With
- Friends Forever
- Doctor + Doctor’s Companion
- Choose a Background + Background

---

## Pairing types (how we detect them)

Pairing type is derived from the **commander’s** oracle text / keywords (via Scryfall data):

- Partner → `partner`
- Partner with … → `partner_with`
- Friends forever → `friends_forever`
- Doctor’s companion → `doctor`
- Choose a Background → `background`

The “partner slot” label in the UI changes accordingly (Partner / Background / …).

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
