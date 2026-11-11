# I-11: Localization And Regional Experience

**Status:** Shipped  
**Priority:** Later  
**Depth:** Light

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Light, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.


This file is light because the initiative is Later or Parked and is not in I-80 to I-98. The scenarios below are the bar for when it is promoted. They are not a promise to build it next.

### Summary and problem

users can understand the interface and card data in a language and market they actually use.

### Goals

- A locale is activated only when its navigation, warnings, dates, prices and card surfaces are translated and tested as one experience.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-11-01

As a player, I want the outcome of I-11, so that the work in this file is the reason to build it.

#### US-11-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-11-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-11-01 Happy path

Given a signed-in player and the English locale
When a locale is activated only when its navigation, warnings, dates, prices and card surfaces are translated and tested as one experience.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-11-02 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-11-03 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-11-04 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

#### AC-11-05 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-11-06 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-11-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The flow is the one described in the moved record. Empty, loading and error states use a catalogue string, not a blank panel.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

See the moved record. No public route is added unless that record names one.

### Analytics and telemetry

No new event until the moved record names one.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Follows the initiative priority. Guest and signed-in behaviour is the moved record's.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

None beyond the moved record.

### Sources

- No external URL in the moved record. The record itself is the source for behaviour that is already in the code.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-11: Localization And Regional Experience

**Outcome:** users can understand the interface and card data in a language and market they actually use.

**Status:** Shipped
**Priority:** Later

### Already shipped

- English and French UI routing.
- Locale switcher and catalog parity guard.
- Localized card names, type lines, rules text and card images where Scryfall provides them.
- Localized deck rows, tooltips, playtest zones and proxies.
- Playtest action-log turn and phase labels and human-readable exports follow the active English or French locale; player-authored descriptions and JSON data remain unchanged (#1042).
- AI suggestion evidence formats Scryfall USD prices for the active locale without relabeling them as local-market quotes (#980).
- AI suggestion evidence displays known card roles in the active locale, with a readable fallback for unknown provider categories (#1038).
- AI suggestion impact formats average mana value and known USD price for the active locale without implying a currency conversion (#1015).
- Deck creation wizard budget choices use the active English or French catalog, retaining their USD-denominated limits (#1017).
- Deck creation color choices announce localized names to assistive technology and use localized tooltips, while retaining the same mana symbols (#1019).
- Deck creation strategy and bracket descriptions use the active English or French catalog, preserving the underlying strategy and bracket values (#1021).
- Public deck card counts use the active English or French locale with singular and plural forms; the shared deck-count label is consistent across public and share views (#982).

### Remaining scope

- [ ] Finish and review one additional locale end to end before activating it.
- [ ] Keep dormant catalogs out of routing until human review is complete.
- [ ] Complete locale-aware currency formatting without implying that USD data is a local-market quote.
- [ ] Test dates, numbers, pluralization, mana symbols and card text together.
- [ ] Localize page metadata and complete hreflang. `generateMetadata` in `src/app/[locale]/deck/[id]/page.tsx` and `src/app/[locale]/commanders/[slug]/decks/page.tsx` writes English titles and descriptions in both locales. Sitemap entries (`entryFor` in `src/lib/seo/sitemap.ts`) carry `en` and `fr` alternates but no `x-default`, which the pages themselves declare through `buildAlternates`. [I-34](i34-commander-data-reports.md) slice 1 adds `x-default` to the sitemap and requires localized metadata on every page it adds or touches.
- [x] Localize the editor's mobile controls. Below `lg`, the builder's tab labels "Search", "Deck" and "Stats" are hard-coded English in `src/app/[locale]/builder/[deckId]/page.tsx`, as are the search colour filter's tooltips, "White" to "Colorless". [I-37](i37-editor-depth.md) slice 7 replaces the tabs with a toolbar whose labels come from the message catalogues; I-13 owns its visual layer. Shipped in #1323: the tab bar and colour picker moved into `BuilderMobileTabBar` and `BuilderColorSearchPicker`, and they, the filters toggle, the title bar's action labels and the AI badge read `builder.*` keys, translated in French. Not checked in a browser.
- [ ] Translate the hard-coded English that the 2026-11-10 audit found on `dev` at `65e6230`: about 180 user-visible strings in five bundles. Several components hard-code a string that already has a catalog key.
  - [ ] Bundle 1, deck views and public pages: about 38 strings in 12 files, such as the "AI" badges, "Fork" and "Save" on a public deck (`src/components/profile/PublicDeckActions.tsx` has no `useTranslations`), the default name "New Deck", and an average rating shown as "4.5" in French. Fix branch in flight: `fix/i18n-public-deck-views`.
    - [x] Translate the public deck views and default deck names (#1341, 2026-11-11).
  - [ ] Bundle 2, builder, card, playtest and collection panels: about 45 strings in 20 files, such as the card flip and add labels, the playtest counter buttons, recommendation freshness and the companion rule text built in `src/lib/deck/companion.ts`. Averages and percentages are formatted with `toFixed` and `` `${n}%` `` instead of the locale.
  - [ ] Bundle 3, import, export and rules browsing: about 30 strings in 8 files: the Moxfield profile panel, proxy export, the set autocomplete hint, rules pagination and the rules effective date. Fix branch in flight: `fix/i18n-import-export-rules`.
    - [I-47](i47-rules-answers-for-this-deck.md) slice 2 also localises the rules page's date and its "No matching rules found." text; whichever lands second reuses the first.
    - [x] Translate import, export and rules browsing (#1335, 2026-11-10).
  - [ ] Bundle 4, API and thrown errors shown verbatim: sign-up, the sign-in `?error=` codes, API keys, meta, URL import, Scryfall, snapshots, deck creation, AI build progress and AI suggestions. Each route should return a stable `code` that the client maps to `t()`, as `/api/import/url` already does for a Moxfield refusal.
  - [ ] Bundle 5, deck-store toasts: 34 strings in `src/lib/deck/store.ts` and `src/lib/deck/commander-save-recovery.ts`. Let `useToastStore().add()` take a `{ key, values }` descriptor that `ToastContainer` translates, so the store stays free of React and locale.
- [ ] Translate the French keys still equal to English: the whole `deck.ratings.*` block (about 19 keys), `profile.followers`, `followingCount`, `signInToFollow`, `followFailed`, `badgeCommunityBuilder` and `badgeHighlyRated`, plus `deck.comparison.secondDeck` and `deck.stats.removal`. In all, 136 of 1,385 French values equal English, most of them legitimately (Foil, CSV).
- [ ] Type-check `t()` keys. next-intl has no `AppConfig` `Messages` augmentation in the repo, so a misspelt key is not a `tsc` error.
- [ ] Merge the two catalog parity tests. `src/i18n/catalog.test.ts` repeats for French the key-parity check that `src/i18n/messages.test.ts` runs for all ten locales, and neither compares values.
- [ ] Stop new hard-coded strings with lint: `react/jsx-no-literals` with an allowlist of about 36 punctuation and brand strings, plus a targeted `no-restricted-syntax` rule for literal `aria-label`, `title`, `placeholder` and `alt` text. The first comes from `eslint-plugin-react`, already installed through `eslint-config-next`, and the second is core ESLint, so no dependency is added. Land them with the last of bundles 1 to 3, so `pnpm lint` stays at zero warnings. Lint cannot see strings in `src/lib`; bundles 4 and 5 fix those at the source.

**Twelfth pass, 2026-11-11:** Archidekt's board has non-English card versions at 140 points, seen that day. Storing the printing's language is [I-37](i37-editor-depth.md) slice 12, not a new locale. This initiative still owns the interface language. Two labelled prices, with no conversion, are [I-96](i96-two-labelled-prices-and-no-conversion.md).

### Definition of done

A locale is activated only when its navigation, warnings, dates, prices and card surfaces are translated and tested as one experience.

---

