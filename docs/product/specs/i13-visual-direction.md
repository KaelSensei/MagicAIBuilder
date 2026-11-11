# Spec: Visual Direction (I-13)

> **Initiative:** [I-13 in the roadmap](../roadmap.md) · **Status:** Next · **Audited:** 2026-11-08
> **Owns:** the visual direction, its tokens and its acceptance thresholds. **Does not own:** the functional surfaces being restyled.

## Overview

The roadmap's first I-13 slice asks for an audit and an agreed direction before implementation. This spec is that deliverable: what the audit measured, what it found, the direction chosen, and the thresholds each redesigned slice must meet.

## What the audit found

Measured on 2026-11-08 from a local dev server at 1440×900 and 390×844, with contrast computed from the real values in `src/styles/globals.css`.

### Blocking

1. **No card art anywhere.** The hero's product preview is four empty rounded rectangles and an unlabelled bar chart. On mobile the preview is hidden entirely, so a phone visitor sees no product visual at all. Magic's own art is the one visual asset the category gives away free, and every incumbent leads with it.

2. **The documented identity does not exist in the code.** `docs/design/design-system.md` describes Cinzel Decorative, a `--gold` family, a noise overlay and floating mana. `grep --gold src/` returns **0 results**. The doc claims `--background: #0a0a0f` and `--accent: #6366f1`; the code says `#1b1628` and `#7c3aed`, plus a "lumen" token layer the doc never mentions.

### To fix

3. **A dead 3D stack is still declared.** `three`, `gsap`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` and `@types/three` have **0 imports** in `src/`. `public/textures/` ships leather, paper and stone maps nothing references. The README still advertises a "3D landing experience".

4. **Borders fail WCAG 1.4.11**, which requires 3:1 for component boundaries:

| Pair                                    | Ratio  | Required |
| --------------------------------------- | ------ | -------- |
| `--border #443a5e` / surface (dark)     | 1.51:1 | 3:1      |
| `--border #e4dcf2` / white (light)      | 1.33:1 | 3:1      |
| `--accent #7c3aed` as text / background | 3.09:1 | 4.5:1    |

`src/components/deck/MoxfieldProfileResults.tsx:102` applies `text-[var(--accent)]` to a `text-xs` link — the failing pair, on the smallest text in the interface.

5. **Brackets are encoded by hue alone.** Green, blue, amber, red each pass 3:1 individually, but a deuteranopic player cannot separate bracket 1 from bracket 4 — exhibition from optimized.

### To tighten

6. The first screen carries a headline, a paragraph and a button, then roughly 150 px of nothing. 7. The same action appears four times under two labels ("Start a guest deck" ×3, "Guest deck" in the nav). 8. "Commander field guide" appears three times in one viewport. 9. Three always-visible theme buttons compete with the only call to action on a 390 px screen.

### What works, and must survive

Text contrast is **excellent** — 16.09:1 primary, 8.06:1 secondary. The light theme is better balanced than the dark one. The hero headline states the product in one sentence. The capability copy describes real functions without inflation.

## The direction

**Two registers, one token set.**

- **The instrument** for the application — editor, analysis, acquisition. Dense, tabular, calm. Monospace tabular figures wherever digits compare in a column. One signal hue. A provenance chip on every piece of external data. This register _is_ the "AI you can check" positioning made visible, and it is what no competitor's UI expresses.
- **Paper and ink** for everything public — landing, public decks, discovery. The interface recedes and card art carries the colour. The five mana colours, already in the token set, are the only semantic palette.

They are not two designs. They share neutrals, type scale and spacing, and differ in density and in how much imagery is allowed. One system, two settings.

**Rejected:** a fantasy-serif "grimoire" register. It is what the current documentation describes, it photographs well on one mockup, and it degrades fastest under the density of a 100-card editor. Choosing it would require a discipline no one sustains, and it dates quickly. Keep Cinzel out of the product.

## Token requirements

1. **Every token is defined in the base `:root`.** A colour whose only definition sits inside a media query or a `[data-theme]` block never applies in the unstamped default state.
2. **Borders meet 3:1** against the surface behind them, in both themes. This is a correction, not a preference.
3. **`--accent` is never a text colour.** Dark themes use `--accent-text`, which already measures 9.54:1. The failing call site above is the first fix.
4. **No status is encoded by hue alone.** Bracket, severity and legality each carry a shape, a glyph or a number in addition to colour.
5. **One accent.** Semantic colours — good, warning, critical — are separate from the accent and do not become a second brand hue.
6. **Tabular numerals** wherever figures align in columns.

## Non-goals

- A native mobile application. Narrow web widths are in scope; an app is not.
- Rewriting working functionality for visual reasons.
- Copying Moxfield's or EDHREC's layout, artwork or interaction details.
- Reviving the 3D landing. The direction above replaces it; the dependencies should be removed rather than reconnected.

## Acceptance thresholds per slice

A redesigned slice is not done until all of these hold:

- Every text pair meets 4.5:1; every component boundary meets 3:1; measured, not estimated.
- No information is conveyed by colour alone.
- Keyboard focus is visible on every interactive element; the slice is operable by screen reader.
- The slice renders correctly in all **three** theme states: explicit light, explicit dark, and unstamped system default.
- No horizontal body scroll at 390 px; wide content scrolls inside its own container.
- Visual regression coverage exists for the slice.
- Lighthouse performance does not regress against the pre-slice measurement.

## Delivery slices

| #   | Slice                                                                                                      | Depends on |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Token corrections** — borders to 3:1, accent-as-text removed, non-colour status encoding                 | —          |
| 2   | **Remove the dead 3D stack** and align the README with reality                                             | —          |
| 3   | **Rewrite `design-system.md` from the code**, including the lumen layer                                    | 1          |
| 4   | **Card art in the hero** — a real commander, its colour identity, three cards, with a designed empty state | 1          |
| 5   | Deck library and navigation in the instrument register                                                     | 1, 3       |
| 6   | Deck editor: card views, warnings, analytics, at density                                                   | 5          |
| 7   | Public decks and discovery in the paper-and-ink register                                                   | 4          |
| 8   | Responsive, accessibility, visual-regression and performance validation across the redesigned journey      | 5, 6, 7    |

Slices 1, 2 and 3 are corrections with no aesthetic debate attached, and should land before any restyling begins. Slice 4 is the highest visible return for the least effort in the whole initiative.

## Open questions

- Which card art appears in the hero for a visitor with no deck? A fixed curated commander is predictable and legally safe; a rotating one is livelier and harder to keep looking deliberate.
- Does the instrument register survive the landing page, or does the split confuse the brand? The shared token set is the mitigation, but it needs one side-by-side review before slice 7.
- `public/textures/` is 32 KB of unused leather, paper and stone. Delete with slice 2, or keep for the paper-and-ink register? Keeping unused assets is how the 3D stack survived this long.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

### Goals

- The deck-library-to-editor-to-share journey is visually coherent and remains at least as usable as before; accessibility, responsive, performance and regression checks pass, and each redesigned slice has QA acceptance evidence before promotion.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-13-01

As a player opening the editor, I want the same deck to be readable in both themes and at a phone width, so that a visual change does not hide a control I used yesterday.

#### US-13-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-13-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-13-01 Happy path

Given a signed-in player and the English locale
When a changed default view keeps the previous view selectable for at least one release.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-13-02 Happy path

Given a signed-in player and the English locale
When light and dark both keep text that meets the contrast bar I-49 measures.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-13-03 Happy path

Given a signed-in player and the English locale
When narrow, tablet and wide widths are checked for the journeys this initiative restyles.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-13-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-13-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-13-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for everyone once a surface ships. A half-restyled page is not released. Guests and signed-in players see the same skin.

#### AC-13-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-13-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-13-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Tokens, not one-off colours. Tooltips do not cover the card. The mobile grid does not become a stack unless a stacks view already exists beside it.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

No schema change. Visual tokens live in the stylesheet. I-37 owns the editor behaviours this skin wraps.

### Analytics and telemetry

`view_selected {surface: editor or library, width: narrow, tablet or wide}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for everyone once a surface ships. A half-restyled page is not released. Guests and signed-in players see the same skin.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether I-49 takes the non-colour status work out of this initiative's first slice is still an owner question.

### Sources

- https://edhrec.com/articles/changelog-edhrec-redesign
- https://edhrec.com/articles/changelog-redesign-follow-up
- https://edhrec.com/articles/changelog-big-performance-upgrades
- https://www.reddit.com/r/EDH/comments/1x7v653/
- https://www.reddit.com/r/magicTCG/comments/1x56apg/
- https://www.reddit.com/r/EDH/comments/1vzwh0m/
- https://www.reddit.com/r/Moxfield/comments/1xdtnlo/

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-13-101

As a player, I want the product to audit the current dark/light surfaces and agree a visual direction, typography, spacing, color, elevation, motion and component tokens in a reusable design reference., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Audit the current dark/light surfaces and agree a visual direction, typography, spacing, color, elevation, motion and component tokens in a reusable design reference. Lumen tokens are implemented (#1259); the written reference and the audit it records are still open.

#### AC-13-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-13-102

As a player, I want the product to refine navigation and the deck library so search, deck state, commander identity and next actions are immediately scannable., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Refine navigation and the deck library so search, deck state, commander identity and next actions are immediately scannable. Library controls, keyboard-visible actions and a loaded-list name filter shipped in #1269. Commander identity and next-action hierarchy remain open.

#### AC-13-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-13-103

As a player, I want the product to refine the deck editor's dense workspace: card views, commander context, actions, warnings and analytics, without hiding existing workflows or introducing layout jumps., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Refine the deck editor's dense workspace: card views, commander context, actions, warnings and analytics, without hiding existing workflows or introducing layout jumps.

#### AC-13-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-13-104

As a player, I want the product to refine public decks, discovery and recommendations around card imagery, source-aware evidence, clear filters and consistent detail panels., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-109 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Refine public decks, discovery and recommendations around card imagery, source-aware evidence, clear filters and consistent detail panels. Imagery, category chips, a name filter and restyled panels shipped in #1267. Source-aware evidence and recommendation filters remain open.

#### AC-13-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-13-105

As a player, I want the product to validate the redesigned journeys at narrow, tablet and wide web widths, with keyboard and screen-reader access, light/dark contrast, visual regression coverage and measured loading/interaction performance., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Validate the redesigned journeys at narrow, tablet and wide web widths, with keyboard and screen-reader access, light/dark contrast, visual regression coverage and measured loading/interaction performance. Include tooltips that do not cover the card, and image loading that keeps already seen images available. Run code validation on the VPS. #1270 covers banner and preview stability in the editor and does not close this slice.

#### AC-13-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-13-106

As a player, I want the product to acceptance threshold: a change to a default view keeps the previous view selectable for at least one release and stores the player's choice., so that a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

#### AC-13-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Acceptance threshold: a change to a default view keeps the previous view selectable for at least one release and stores the player's choice. Moxfield's Visual Grid change showed one card at a time on phones, and its developer apologised and pointed to a per-account setting (r/Moxfield, 2026-10-23/24). Added 2026-11-11.

#### AC-13-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-13-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-13: Product Visual Redesign

**Spec:** [`specs/i13-visual-direction.md`](i13-visual-direction.md)

**Outcome:** a player can find, build, understand and share a Commander deck in an interface that feels coherent, distinctive and calm even when card data is dense.

**Status:** Building
**Priority:** Next

Lumen foundations and several surfaces shipped and were promoted to `main` on 2026-11-06 (#1272, #1273). That promotion is not acceptance of the definition of done. The five delivery slices below stay open.

### Already shipped

- Lumen light and dark foundations: shared tokens, radii, soft shadows, an explicit theme choice, and a header that can follow the system (#1259).
- The landing page uses the shared Lumen type, accent, pills and raised cards in both themes (#1265).
- The collection page uses the shared field, button and card primitives, with the acquisition plan beside the card list on wide screens (#1266).
- Public decks and discovery show card imagery, category chips and a name filter on the loaded list, with restyled detail panels (#1267). Source-aware recommendation evidence is unchanged.
- Import, export, collection, review, comment and settings forms use the shared field and button primitives (#1268).
- Deck library controls use Lumen pills and fields, deck actions stay available to the keyboard, and the loaded list filters by deck or commander name (#1269).
- The dead 3D stack (three, React Three Fiber, gsap) and its unused textures are removed (#1331, 2026-11-10; spec slice 2).

No separate design-reference document was added with these slices. Screenshot regression, tablet layout and the full accessibility and performance matrix remain open.

### Inspiration and boundaries

- Take inspiration from Moxfield's efficient deck workflow and presentation, and from EDHREC's October–November 2026 redesign and follow-up: visible card context, legible evidence, purposeful filters, configurable views, tooltips that leave the art usable, image loading that keeps already seen images, and layouts that hold up on tablet widths. Sources: [redesign](https://edhrec.com/articles/changelog-edhrec-redesign), [follow-up](https://edhrec.com/articles/changelog-redesign-follow-up), [performance](https://edhrec.com/articles/changelog-big-performance-upgrades).
- Do not copy either product's layout, artwork, branding or interaction details. Keep MagicAIBuilder's explainable AI, legality, playtest and ownership workflows recognizable.
- Keep source attribution and statistical uncertainty readable. A prettier recommendation must not look more certain than its data supports.
- Treat narrow and tablet web widths as part of responsive quality. A native mobile application is not in scope.
- **Design constraint (2026-11-09): do not look AI-made, and do not bury power-user flows.** EDHREC's October 2026 redesign drew a backlash on r/EDH: under ["New EDHREC Design"](https://www.reddit.com/r/EDH/comments/1x7v653/) the top replies were "I think its trash and is worse for building decks" (394 points) and "vibe coded crap" (233). Under the r/magicTCG announcement, an AI-use question was the top reply (311) and "How do I switch back to the old one?" reached 116 ([thread](https://www.reddit.com/r/magicTCG/comments/1x56apg/)). Commenters under BlueprintMTG's launch listed rounded icon and box edges, hollow coloured icons, the header and the font as tells of an LLM-generated site ([thread](https://www.reddit.com/r/EDH/comments/1vzwh0m/)). Treat the click depth of filters, sorts and grouping as a regression metric, and review each Lumen surface for generic AI-template styling before acceptance.
- The cheapest visible wins against Archidekt found on 2026-11-09 are a Stacks view, collapsible and sticky category headers, a static card panel with printing and category controls, a mobile editing toolbar and statistics that focus the cards behind a chart. They are tracked in [I-37](i37-editor-depth.md); this initiative owns their visual layer. "Faster than Moxfield" is the bar players notice first and no reviewer has measured it, so the performance validation below should include a timed comparison with a Moxfield deck page of the same size.

### Delivery slices

- [ ] Audit the current dark/light surfaces and agree a visual direction, typography, spacing, color, elevation, motion and component tokens in a reusable design reference. Lumen tokens are implemented (#1259); the written reference and the audit it records are still open.
- [ ] Refine navigation and the deck library so search, deck state, commander identity and next actions are immediately scannable. Library controls, keyboard-visible actions and a loaded-list name filter shipped in #1269. Commander identity and next-action hierarchy remain open.
- [ ] Refine the deck editor's dense workspace: card views, commander context, actions, warnings and analytics, without hiding existing workflows or introducing layout jumps.
- [ ] Refine public decks, discovery and recommendations around card imagery, source-aware evidence, clear filters and consistent detail panels. Imagery, category chips, a name filter and restyled panels shipped in #1267. Source-aware evidence and recommendation filters remain open.
- [ ] Validate the redesigned journeys at narrow, tablet and wide web widths, with keyboard and screen-reader access, light/dark contrast, visual regression coverage and measured loading/interaction performance. Include tooltips that do not cover the card, and image loading that keeps already seen images available. Run code validation on the VPS. #1270 covers banner and preview stability in the editor and does not close this slice.
- [ ] Acceptance threshold: a change to a default view keeps the previous view selectable for at least one release and stores the player's choice. Moxfield's Visual Grid change showed one card at a time on phones, and its developer apologised and pointed to a per-account setting ([r/Moxfield](https://www.reddit.com/r/Moxfield/comments/1xdtnlo/), 2026-10-23/24). Added 2026-11-11.

**2026-11-10:** the [I-13 spec](i13-visual-direction.md#delivery-slices)'s slice 1 lists "non-colour status encoding" beside the border and accent-text corrections. [I-49](i49-colour-vision-and-low-vision-display.md) proposes to take that part into its slices 4 to 10, with status tokens for both themes, an icon shape per status and a lint rule against raw status colours, and to leave I-13 slice 1 with borders and accent text. This is an owner question in the status note; until the owner answers, the item stays in I-13. I-49 also found I-13's finding that brackets are encoded by hue alone partly out of date: the bracket's number and name now sit beside its colour, and only its light-theme contrast still fails.

### Enrichment (2026-11-11)

**User story.** As a player opening the editor, I want the same deck to be readable in both themes and at a phone width, so that a visual change does not hide a control I used yesterday.

**Acceptance.**
- A changed default view keeps the previous view selectable for at least one release.
- Light and dark both keep text that meets the contrast bar I-49 measures.
- Narrow, tablet and wide widths are checked for the journeys this initiative restyles.

**UX.** Tokens, not one-off colours. Tooltips do not cover the card. The mobile grid does not become a stack unless a stacks view already exists beside it.

**Data and API.** No schema change. Visual tokens live in the stylesheet. I-37 owns the editor behaviours this skin wraps.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `view_selected {surface: editor or library, width: narrow, tablet or wide}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for everyone once a surface ships. A half-restyled page is not released. Guests and signed-in players see the same skin.

**Open questions.** Whether I-49 takes the non-colour status work out of this initiative's first slice is still an owner question.

### Definition of done

The deck-library-to-editor-to-share journey is visually coherent and remains at least as usable as before; accessibility, responsive, performance and regression checks pass, and each redesigned slice has QA acceptance evidence before promotion.

---

