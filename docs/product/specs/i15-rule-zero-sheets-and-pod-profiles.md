# Spec: Rule 0 Sheets And Pod Profiles (I-15)

> **Initiative:** [I-15 in the roadmap](../roadmap.md) · **Status:** Next · **Researched:** 2026-11-08
> **Owns:** stating and comparing playgroup intentions. **Does not own:** official bracket scoring, which stays in I-03.

## Overview

Before a game, a pod needs thirty seconds of shared context: how fast each deck wants to end, how it wins, whether it runs combos, extra turns or resource denial, how many proxies are in it, and which house rules apply. The sheet records that, keeps it private until the owner shares it, and never pretends to be the official rules.

## What the market does

Wizards shipped **Commander Brackets** in 2025 as the official vocabulary: five tiers — Exhibition, Core, Upgraded, Optimized, cEDH. The informal 1-to-10 scale it replaced meant something different in every playgroup. Brackets anchor the conversation to how quickly a deck expects to end a game.

| Product                                    | What it does                                                            | Limit                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **EDHREC salt**                            | Community survey scoring how much players dislike facing a card, 0 to 4 | A card-level opinion poll, not a deck agreement                                              |
| **ScrollVault**, **EDHcheck**, **castlog** | Read a list and return one of the five official tiers                   | They classify a deck; they do not record what a pod agreed                                   |
| **CommanderSalt**                          | Explains bracket, power, salt and synergies for an imported list        | A community thread from May 2026 calls the report entertaining but prone to overrating decks |
| **commandermatchup.online**                | Positions itself as a Rule 0 matchmaking hub                            | Matchmaking is a different product from a pod's own sheet                                    |
| **DeckCheck DTI**                          | A deck-tendency index inside the editor                                 | Proprietary scale, not the official brackets                                                 |

One number worth keeping: a published bracket calculator tested against **1,229 tournament decklists matched the organiser's bracket exactly 77.1 % of the time, and was within one bracket 99.5 %** of the time. That is the realistic accuracy ceiling for automatic classification, and the reason this initiative records stated intentions rather than inferring them.

**The gap.** Every tool classifies a deck. None records an agreement between four people, keeps it private by default, and keeps preference apart from rule.

## Current state in this codebase

- `src/lib/deck/bracket.ts` — bracket scoring across six dimensions, with the Game Changers list and banlist detection. This is the official-rules side and must not be mixed into the sheet.
- No salt data, no pod concept, no per-deck declaration of intent.
- Sharing today is public-or-private at deck level (I-08). There is no consented, scoped share.

## Functional requirements

### 1. The sheet

1.1 A sheet attaches to a deck, or to a pod of up to four decks.
1.2 Recorded fields: intended speed, how the deck wins, combos present, extra turns, resource denial (land destruction, stax), proxy count, and free-text house rules.
1.3 Every field is **player-stated**. Nothing on the sheet is inferred from the decklist.
1.4 The sheet shows the deck's computed bracket **beside** the stated intent, visibly separated, with the label that one is calculated and the other declared.

### 2. Privacy and consent

2.1 A sheet is private by default. Nobody sees it until the owner shares it.
2.2 Sharing is an explicit action scoped to one pod, and is revocable.
2.3 Revoking removes the sheet from the pod view immediately; it does not retroactively delete what other players already read.
2.4 A shared sheet never exposes the deck's collection or ownership data.

### 3. Comparison

3.1 Up to four consented sheets compare side by side on one screen.
3.2 The comparison highlights declared mismatches — a deck stating "ends on turn 5" in a pod stating "long games" — as a conversation prompt, never as a verdict.
3.3 Official data (bracket, Game Changers, banlist) renders in a separate column from declared preferences, with distinct styling.

### 4. Honesty

4.1 The sheet states, on screen, that it does not guarantee a balanced game.
4.2 Any salt-style score is labelled as community opinion with its source and date, never as a rule.

## Data model

```
PodSheet      id, ownerId, deckId?, podId?, createdAt, updatedAt
  speed              enum  (exhibition | core | upgraded | optimized | cedh | custom)
  winConditions      text[]
  hasCombos          bool + text
  hasExtraTurns      bool + text
  hasResourceDenial  bool + text
  proxyCount         int
  houseRules         text
Pod           id, name, ownerId, createdAt
PodShare      podSheetId, podId, consentedAt, revokedAt?
```

`PodShare` carries the consent, so revoking is a row update and never a delete of the player's own sheet.

## Non-goals

- Matchmaking, ranking or pairing players. That is a different product.
- Inferring intent from a decklist. Automatic classification stays in I-03, where it is already labelled as calculated.
- A public directory of sheets.
- Replacing the official bracket. The sheet sits beside it.

## Testing strategy

- **Solitary:** a sheet with declared fields renders them unchanged; no field is derived.
- **Boundary:** a revoked share disappears from the pod comparison on the next read; the owner's sheet survives.
- **Sociable:** four consented sheets compare, and the official column is present and visually distinct in both themes.
- **Privacy:** a sheet shared to pod A is unreachable from pod B, and from an unauthenticated request.

## Delivery slices

| #   | Slice                                                                | Depends on |
| --- | -------------------------------------------------------------------- | ---------- |
| 1   | Sheet model, per-deck create and edit, private only                  | —          |
| 2   | The computed bracket shown beside declared intent, visibly separated | 1          |
| 3   | Pod creation, explicit consent share, revoke                         | 1          |
| 4   | Four-way comparison with the mismatch prompts                        | 2, 3       |
| 5   | Salt-style score as a labelled, dated community signal               | 4          |

Slice 5 depends on I-09's source-and-freshness disclosure already being applied to EDHREC data; do not start it before that is true.

## Open questions

- Is the pod a durable object players reuse weekly, or a throwaway for one night? Durable implies membership and invitations, which is noticeably more product.
- Should the proxy count feed the acquisition plan in I-06? Tempting, but it couples a social declaration to a financial calculation; keep them apart until a player asks.
