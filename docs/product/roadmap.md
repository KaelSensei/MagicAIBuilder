# MagicAIBuilder: Product Roadmap

> **Updated:** 2026-10-03
> **North star:** help a Commander player go from an idea to a legal, explainable, testable and enjoyable deck.

This roadmap is organized by **product initiatives**, not by an arbitrary split between functional and technical work. Every initiative contains the user outcome, the product scope, the engineering enablers, and its definition of done.

---

## Product Direction

MagicAIBuilder is an **AI-first Commander deckbuilding companion**.

It should not try to beat every competitor at their strongest specialty:

- **Moxfield** is the benchmark for a fast deck workflow, sharing and deck presentation.
- **Archidekt** is the benchmark for a visual editor, custom organization and playtesting.
- **EDHREC** is the benchmark for aggregate Commander data and statistical recommendations.
- **ManaBox** is the benchmark for mobile collection management, scanning and marketplace pricing.
- **Commander Spellbook** is the benchmark for structured Commander combo discovery.

Our opportunity is the workflow between those products:

1. The player states an intention, budget and desired power level.
2. MagicAIBuilder turns it into a legal and coherent deck proposal.
3. Every important choice is explained with card data and Commander rules.
4. The player tests the deck, sees what is weak, and iterates.
5. The final list is easy to own, print, share and export.

**Positioning sentence:**

> Build the deck you mean, understand why it works, test it before game night.

### Strategic boundaries

- Do not become a generic card database; Scryfall already owns that job.
- Do not copy EDHREC's popularity rankings as if popularity were advice.
- Do not call an LLM for deterministic legality, color identity, quantities or bracket rules.
- Do not expand formats, languages or integrations faster than their tests and data contracts can support.
- Do not add a new external service unless it solves a user-visible problem and has an exit path.

### Competitive functional benchmark — 2026-09-19

The comparison below tracks user workflows rather than trying to match feature counts. It is based on the current public product and help surfaces of Moxfield, Archidekt and TappedOut.

| Competitor strength                                                                                                               | MagicAIBuilder today                                                                                                                                            | Product response                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Moxfield: fast editing, detailed primers, deck history, tokens, social notifications and rich sandbox controls                    | Editing, snapshots, required-token checklists, a guided primer template, comments and playtesting exist; rich published primers and notification inboxes do not | Complete public deck guides and add relevant notifications without copying a generic social feed |
| Archidekt: visual organization, folders, deck comparison, reusable card packages, deck-help requests and exportable playtest logs | Owned-deck folders and comparison now exist; packages, public comparison, help requests and downloadable logs remain incomplete                                 | Prioritize reusable packages, public comparison and evidence-rich playtest logs                  |
| TappedOut: acquireboard, inventory usage map, wishlist checkout, deck folders and explicit feedback-seeking workflows             | Collection reconciliation and shopping lists exist; cross-deck card usage, acquire state and structured help requests do not                                    | Connect collection, decks and acquisition planning, then add a focused request-for-feedback flow |

#### Deliberate non-goals from the benchmark

- Do not build a draft simulator, cube platform, venue directory or full card-trading marketplace in the current roadmap.
- Do not add paid deck promotion, deck-cycling mechanics or engagement loops that rank visibility by spend.
- Do not duplicate Scryfall's card database or pursue every format before the Commander workflow is excellent.

Sources reviewed: [Moxfield public feature guide](https://github.com/moxfield/moxfield-public/wiki/Features), [Archidekt product navigation and updates](https://archidekt.com/news), [TappedOut deck help](https://tappedout.net/help-desk/decks/) and [TappedOut inventory and wishlist help](https://tappedout.net/help-desk/ownership/). Product behavior must be revalidated before implementation because competitor capabilities can change.

---

## Status And Priorities

| Status          | Meaning                                                           |
| --------------- | ----------------------------------------------------------------- |
| **Shipped**     | Available in the product and covered by the current test strategy |
| **In progress** | Partially available or actively being completed                   |
| **Next**        | High-value work for the next delivery batches                     |
| **Later**       | Valuable, but not a near-term commitment                          |
| **Blocked**     | Do not implement until the stated external condition changes      |
| **Parked**      | Deliberately deferred; not a product priority right now           |

Priority is expressed as **Now**, **Next** and **Later**. A priority is not a promise of a release date.

---

## Portfolio View

### Now

1. **I-01 Deck Editor workflow**
   Finish zone persistence and make editing feel stable, fast and predictable.

2. **I-02 AI deck copilot**
   Turn the existing AI suggestions into a constrained, explainable deckbuilding conversation.

3. **I-03 Trustworthy feedback loop**
   Make every warning, score and recommendation understandable and actionable.

4. **I-04 UX stability and visual quality**
   Remove loading stalls, layout shifts, hover jitter and persistent warnings that damage trust.

5. **I-05 Production safety**
   Keep CI, unit tests, Docker E2E, SonarCloud and health monitoring aligned with the staging flow.

### Next

6. **I-06 Collection and purchase planning**
   Connect deck decisions to owned printings, prices and a realistic acquisition plan.

7. **I-07 Playtest and iteration**
   Turn goldfishing into useful evidence for improving a deck version.

8. **I-08 Share, compare and learn**
   Make public decks useful as learning material, not just static lists.

9. **I-09 Meta and evidence**
   Combine EDHREC trends, tournament context and deck-specific reasoning without pretending incomplete data is certainty.

### Later

10. **I-10 Interoperability and integrations**
    Make MagicAIBuilder a good starting point and a good destination for deck data.

11. **I-11 Localization and regional experience**
    Expand beyond English and French only when translations and prices are genuinely supported.

12. **I-12 Local AI**
    Explore local inference only after the cloud copilot has a measurable product fit.

---

# Initiatives

## I-01: Deck Editor Workflow

**Outcome:** a player can build, reorganize and refine a deck without losing cards, context or intent.

**Status:** In progress
**Priority:** Now

### Already shipped

- Search by name, set, color and advanced filters.
- Main deck, commander, companion, sideboard and considering zones.
- List and grid presentations.
- Categories, quantities, notes, tags and bulk actions.
- Card printing selection and card hover previews.
- Snapshots, undo, import/export and color identity validation.
- Bracket, Game Changers, banlist and deck warnings.

### Remaining scope

- [ ] Persist main, sideboard and maybeboard zones as the single database source of truth.
- [x] Preserve zone and quantity when changing a card printing.
- [x] Restore the previous card printing and notify the player when its save fails.
- [ ] Complete cross-zone drag and drop with clear drop targets and no layout jump.
- [ ] Keep optimistic updates, undo and failed-save recovery consistent.
- [ ] Add Docker-backed E2E coverage for add, move, reload and recovery flows.
- [ ] Add keyboard and mobile alternatives for every drag action.
- [ ] Add a compact activity indicator instead of blocking the whole editor during saves.
- [x] Organize decks into user-defined folders, with move, filter and bulk-move actions.
- [x] Save reusable card packages such as mana bases, interaction suites or tribal cores and preview their legal additions before applying them.
- [x] Add a required-token and emblem summary derived from the current deck, with export support.

### Engineering enablers

- One canonical DeckCard.zone model; compatibility mirrors must not become a second source of truth.
- Fine-grained Zustand selectors so card movements do not refresh the whole editor.
- Serialized writes per deck and idempotent zone updates.
- Tests for hydration, duplicate prevention, failed writes and reload persistence.

### Definition of done

A user can move a card between every legal zone, reload the page, change its printing, undo a move and recover from a failed request without a lost or duplicated card.

---

## I-02: AI Deck Copilot

**Outcome:** a player can describe what they want and receive a legal, budget-aware and explainable plan.

**Status:** In progress
**Priority:** Now

### Already shipped

- Claude/OpenAI provider support.
- Archetype detection and manual override.
- Ten archetype templates.
- Budget constraints, cuts and additions.
- Per-card reasoning, one-click add and ignore actions.
- Server-side secrets, validation, rate limiting and prompt-injection protections.
- Optional player brief covering theme, desired play pattern and dislikes, combined with the existing commander, budget and power target.
- A small regression set for generated deck structure and recommendation evidence; broader usefulness evaluation remains open.

### Next slice

- [x] Conversational brief: commander, theme, play pattern, budget, power target and dislikes.
- [x] Structured plan before card generation: gameplan, win conditions, roles and constraints.
- [x] Explain every suggestion with evidence: role, synergy, curve, color identity, legality and price.
- [x] Offer alternatives by budget, power and play pattern instead of one opaque answer.
- [x] Diff a proposed change against the current deck before applying it.
- [x] Support "why is this card here?" and "what is the weakest card?" questions.
- [x] Add a deterministic post-generation validator; the LLM never decides legality.
- [ ] Build a small golden evaluation set for valid cards, useful explanations and regression checks.

### Definition of done

For a fixed brief and deck, the copilot produces reproducible structured output that passes deterministic Commander validation, stays within constraints, and explains its recommendations well enough for a player to accept or reject them.

---

## I-03: Trustworthy Deck Feedback

**Outcome:** the player understands what is wrong with a deck and what action would improve it.

**Status:** Shipped foundation, next refinement
**Priority:** Now

### Already shipped

- Commander color identity and format legality.
- Banlist and Game Changers detection.
- Bracket scoring across six dimensions.
- Mana curve, color distribution and format-specific statistics.
- Exported statistics count card copies, not distinct rows, including type percentages (#838); the existing export scope is unchanged.
- Mana alignment and per-color land recommendations.
- Turn-one playability odds.
- Combo detection through Commander Spellbook.
- Budget, missing-card and deck-size warnings.
- Explanations and next actions for legality warnings.

### Remaining scope

- [x] Replace long persistent warning blocks with dismissible, grouped and actionable warnings.
- [x] Show the rule or calculation behind legality warnings on demand.
- [x] Separate hard legality errors from strategic suggestions and optional advice.
- [x] Add source and freshness labels to external recommendations.
- [x] Let the player compare analysis before and after a proposed change.
- [ ] Keep warning calculations deterministic and independent from AI output.

### Definition of done

A player can answer three questions from the editor: "What is invalid?", "Why is it flagged?" and "What should I do next?"

---

## I-04: UX Stability And Visual Quality

**Outcome:** the product feels as reliable and polished as the tools players already use.

**Status:** Next
**Priority:** Now

### Product work

- [ ] Fix profile and deck loading states so no request appears to hang indefinitely.
  - [x] Abort stalled deck-list requests after 15 seconds so the existing error and retry state can appear.
  - [x] Keep the user initialization eight-second deadline active through response-body loading and JSON validation, not only until headers arrive. Database latency and broader profile loading work remain open.
- [ ] Use route-level skeletons and cached session/profile data where safe.
- [ ] Remove React refresh loops, hover jitter, layout shifts and unstable card previews.
  - [x] Ignore superseded meta-history responses and invalidate pending results on reset, preventing old trend data or errors from resurfacing.
- [x] Make warning panels collapsible and dismissible, with accessible close controls.
- [x] Keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions.
- [x] Make card zoom intentional in "View all cards" contexts, not a global hover effect.
- [x] Explain the empty EDHREC missing-card filter when all popular cards are already in the deck; removing the filter restores the list.
- [ ] Preserve the established dark/light design language while improving hierarchy, spacing and responsive behavior.
- [ ] Add visual regression coverage for the Deck Editor, banner, warning panel and card hover states.

### Definition of done

The editor remains visually stable while the user searches, hovers, moves cards, saves and navigates between zones on desktop and mobile.

---

## I-05: Production Safety

**Outcome:** a broken deployment or regression is detected before users depend on it.

**Status:** In progress
**Priority:** Now

### Already shipped

- Vercel deployment, Sentry, health endpoint and structured logging.
- CI quality gates, Dependabot, Lighthouse CI and SonarCloud workflow.
- Unit test suite with broad coverage.
- Staging-first branch policy.

### Remaining scope

- [ ] Add UptimeRobot or an equivalent monitor for /api/health.
- [ ] Run Playwright E2E in Docker as the authoritative integration environment.
- [ ] Keep the gate order explicit: typecheck, lint, unit tests, E2E policy, SonarCloud.
- [ ] Require SonarCloud open issues to be zero before PR creation or merge.
- [ ] Record the E2E Docker strategy and required environment variables.
- [ ] Upgrade Prisma only after the local Node toolchain is at least 22.12.
- [ ] Add request latency and failure visibility for profile, deck and Scryfall paths before adopting heavier observability.

### Blocked or conditional work

- **Prisma 7:** blocked locally by Node 22.11; revisit at Node 22.12+.
- **Cloudflare R2:** only when avatars, deck media or generated artifacts need durable object storage.
- **Advanced observability:** Datadog, Better Uptime, Grafana, OpenTelemetry and PagerDuty stay parked until usage justifies their operational cost.
- **Analytics:** choose one privacy-conscious product analytics tool only after defining the product questions it must answer.

### Definition of done

A staging PR cannot merge while type safety, tests, E2E policy, SonarCloud or production health checks are silently bypassed.

---

## I-06: Collection And Purchase Planning

**Outcome:** the player knows which cards they own, which printing to use and what the deck will cost to build.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Collection tracking and ownership badges.
- Missing-card list, budget checks and shopping list.
- Basic-land defaults, bulk ownership actions and CSV export.
- Card prices and multi-format exports.
- Quantity-aware deck reconciliation that preserves surplus collection copies.
- Shopping-list prioritization, line totals, copied budget summaries and safe CSV escaping.
- Bulk collection additions now count each missing printing once across duplicate deck rows.
- Deck collection summaries allocate owned copies and proxies once per printing, so remaining quantities and costs stay accurate.
- The deck sidebar no longer offers a misleading Reset action that subtracts shared, globally owned cards; ownership changes are made from collection management.
- Deck collection and shopping-list totals now distinguish known-price subtotals from missing copies without a price instead of presenting an incomplete zero-dollar estimate.
- The shopping list remembers buy-now versus buy-later choices in the same browser per signed-in player and deck, without mutating deck or collection ownership; buy-now copy and CSV exclude deferred cards.
- A private, read-only acquisition-plan API aggregates required copies across owned decks and subtracts collection quantities without changing ownership.
- The collection page now displays that cross-deck acquisition plan on demand, including missing quantities, contributing decks, a known-price subtotal, unpriced-copy disclosure, and refresh/retry states.
- The cross-deck plan exports a generic CSV of missing quantities with Scryfall printing IDs and known prices; owned copies are excluded.
- Collection cards now link to private decks using that exact printing, including the deck zone and quantity, without loading usage for every card up front.
- The collection acquisition plan can focus on one owned deck or all decks, keeping its summary and CSV export scoped to the selected view.
- The printing selector now puts exact owned editions first and shows combined regular and foil quantities; choosing an edition remains an explicit action.
- The acquisition plan now shows a known-price subtotal for each missing printing and marks unpriced printings on their own rows.
- Each missing printing in the acquisition plan now links to the player's contributing decks, so the player can inspect where it is needed.

### Remaining scope

- [ ] Track the actual owned printing, not only the oracle card.
- [ ] Prefer owned printings during direct add and import flows; the shared printing selector now prioritizes owned editions, but automatic import matching remains open.
- [ ] Complete deck/collection reconciliation without mutating ownership accidentally; the unsafe deck-sidebar Reset action has been removed.
- [ ] Add region-aware price providers, starting with a clearly selected market.
- [ ] Support a synchronized "proxy now / buy later" workflow across devices; the shopping-list buy-later choice currently persists only in the same browser and does not track proxies.
- [ ] Consider mobile scanning only after the web data model supports printing-level ownership.
- [ ] Extend exact-printing usage beyond private decks to saved lists or acquisition plans; deck usage is now visible from the collection.
- [ ] Add explicit, persistent acquire state; the read-only cross-deck plan is now visible in the collection UI.
- [ ] Export or deep-link the acquisition plan to supported regional sellers while preserving printing, condition and finish choices.

### Definition of done

Importing or editing a deck produces a trustworthy owned, missing and estimated-cost view without conflating card identity with printing identity.

---

## I-07: Playtest And Iteration

**Outcome:** testing a deck teaches the player what to change.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Opening hand, London mulligan and goldfishing.
- Turn phases, life tracking, undo, battlefield, graveyard and exile.
- Session recording, result history, mulligan data and opponent-strength labels.
- Player-authored evidence notes and explicit self-reported methodology.
- Snapshot-linked sessions, a deterministic comparison engine, a private comparison API and an in-product snapshot evidence comparison with cohort-size disclosure and early-signal guidance.
- Recorded sessions now persist deterministic cards-seen and additional-draw evidence from the goldfish engine for later version analysis.
- Opening-hand evidence now distinguishes land balance from immediate castability, exposing missing mana colors and dead hands before the mulligan decision.
- Playtest results can link a separate proposed deck change to the player-authored evidence note, keeping observation and next experiment distinct in history.
- AI deck suggestions can use the latest private, user-owned playtest observations as bounded anecdotal context, scoped server-side by deck and account.

### Remaining scope

- [x] Present playtest comparison between deck snapshots in the product UI.
- [x] Surface missing-color and dead-opening-hand evidence alongside persisted mulligan and draw-progression signals.
- [x] Let the player attach a short evidence note to a result.
- [x] Associate a note with a proposed deck change.
- [x] Feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data.
- [x] Keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates.
- [x] Record a chronological, editable action log for zone moves, draws, casts, mana production, counters and life changes.
- [x] Summarize playtest logs into turn-by-turn draw, mana and cards-seen evidence, then export the human-readable log and structured data.
- [x] Let players add required tokens, counters, dice and card copies during a goldfish session without mutating the decklist.

### Definition of done

A player can test two versions of a deck and see evidence that helps choose between them.

---

## I-08: Share, Compare And Learn

**Outcome:** public decks help players learn and improve while owners keep control of their work.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- Public profiles and public/private decks.
- Shareable read-only deck pages.
- Community discovery by commander.
- Ratings, reviews, votes, follows and threaded comments.
- Deck duplication and snapshots.
- Side-by-side comparison for two owned decks, including card and summary differences.

### Remaining scope

- [x] Extend side-by-side comparison from owned decks to public decks.
- [x] Fork a public deck with clear attribution and a clean ownership boundary.
- [x] Show "why this deck differs" using curve, budget and color identity.
- [x] Extend the comparison explanation with card-role differences.
- [x] Persist authenticated, deduplicated abuse reports for public decks without exposing moderation data publicly.
- [x] Provide a restricted moderation review queue API with auditable decisions.
- [x] Add the public-deck report action and moderator review interface before opening broader social features.
- [ ] Build a lightweight following feed only if discovery data shows repeated use.
- [x] Keep private decks and share tokens out of search indexes.
- [x] Provide a structured primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives.
- [x] Render published primers with safe Markdown headings, lists and navigation.
- [x] Add explicit sequencing guidance to the structured primer template.
- [x] Let an owner mark a public deck as "seeking feedback" and ask a focused question instead of only exposing a generic comment box.
- [ ] Add in-product notifications for replies, mentions, follows and changes to explicitly watched decks, with per-event controls.
- [x] Persist private folders for saved public decks without claiming ownership or exposing decks that later become private.
- [x] Add folder management to the community UI.
- [ ] Decide whether decks from followed builders should share the saved-deck folder model.
- [x] Persist reusable community card packages with stable author attribution and private-by-default publishing controls.
- [x] Preview package additions against deck color identity, singleton and ban rules.
- [x] Apply a reviewed package diff without silently replacing existing cards.

### Definition of done

A user can discover, inspect, compare and safely fork a deck without leaking private data or losing attribution.

---

## I-09: Meta And Evidence

**Outcome:** recommendations combine community patterns and competitive evidence without hiding uncertainty.

**Status:** Shipped foundation, next refinement
**Priority:** Next

### Already shipped

- EDHREC popular-card recommendations in the builder.
- Tournament deck imports and commander meta context.
- Player, event, date, placement and event-level context.
- Meta snapshots over time.
- Commander Spellbook combo data.
- Recommendation source and freshness disclosure.
- EDHREC recommendation rows disclose validated per-card sample counts when the source provides them.
- EDHREC feed contract checks reject malformed card lists so a source change does not overwrite reliable cached recommendations with a false empty result.
- EDHREC popular-card recommendations now rank distinct cards by observed inclusion across source categories before applying the top-20 limit; category order no longer hides more widely played cards.
- Meta trend comparisons now withhold reports when either endpoint snapshot is empty, rather than treating missing source data as a rise from zero or fall to zero. Non-empty snapshot bounds remain unchanged; broader trend disclosure work remains open.
- Meta trend cutoffs now use the same retained first entry per card name as measured shifts, so discarded duplicate values cannot distort entry and exit bounds.

### Remaining scope

- [ ] Complete source, timestamp and sample-window disclosure across every external recommendation surface; EDHREC sample counts are shown where available, but the source does not provide a trustworthy sampling date range.
- [ ] Separate "popular", "high synergy", "tournament observed" and "AI suggested".
- [ ] Add source-health telemetry and contract tests for every scraper or external feed; EDHREC card-list shape now has focused regression coverage.
- [ ] Add trend views that respect EDHREC top-20 truncation bounds.
- [ ] Revisit richer tournament statistics only with a source that publishes match-level data.

### Blocked

- **Goldfish import:** blocked by its Cloudflare managed challenge; do not ship a parser that cannot work reliably.
- **Tournament win rate:** not derivable from MTGTop8 deck standings alone.

### Definition of done

A recommendation is never presented as universal truth: the user can see where it came from, how fresh it is and what its limitations are.

---

## I-10: Interoperability And Integrations

**Outcome:** users can bring existing decks in, work on them here, and take the result wherever they play.

**Status:** Shipped foundation
**Priority:** Later

### Already shipped

- Imports from Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks and EDHREC.
- Plain-text exports mark every card-note line with an explicit comment prefix, so multiline notes and reserved section names cannot introduce cards or change zones during reimport. Notes remain readable in the export; note rehydration remains separate scope.
- Text URL imports recognize partner and Main, Sideboard and Considering headers when the source provides them.
- Downloaded text lists also recognize colon-terminated section headings, including counted and commented headings, without losing commander, partner or secondary zones (#844).
- Exports for Moxfield, MTG Arena, MTGO, TappedOut, Archidekt, ManaBox, MTGGoldfish, EDHREC and plain text.
- Goldfish and EDHREC plain-list exports keep Sideboard and Considering cards out of the playable main deck.
- Archidekt exports now count and list only main-zone cards as Mainboard, preserving commander, partner and category tags. Dedicated secondary-zone Archidekt export remains open.
- Arena text exports preserve the selected companion in a dedicated section and include its sideboard copy only when absent, without changing the stored deck. Companion metadata and secondary-zone quantities are covered by local-parser round-trip tests; live Arena client import remains unverified.
- The Moxfield text exporter now retains companion, Sideboard and Considering headings instead of flattening zones. Our text parser round trip preserves roles and quantities; live Moxfield comment-header compatibility remains unverified, so external fidelity is still open.
- Versioned read-only external API under /api/v1.
- The URL import preview now discloses Scryfall-unresolved card names before confirmation, alongside names ignored by the source; front-face names of double-faced cards still resolve.
- Pasted decklists preserve Unicode names, accept commented or colon-terminated section headings, and recognize uppercase set codes without collector numbers. Scryfall lookup also handles copied smart apostrophes.
- URL imports accept supported addresses without a scheme and preserve zones from count-labelled headings. EDHREC average imports keep distinct cards across categories; previews warn about normalized duplicate lines and commanders repeated in the main list.

### Remaining scope

- [ ] Treat import/export formats as versioned contracts with fixtures.
  - [x] Retain printing-specific Scryfall IDs and application categories in simple and full deck CSV exports (#842). Missing printing IDs remain blank; CSV reimport and external category mapping remain open.
  - [x] Include a trailing Zone column in simple and full deck CSV exports, preserving main, sideboard and maybeboard values without changing existing column positions (#840). CSV reimport and command-zone rows remain separate scope.
- [x] Add an import preview that shows zones, commanders, missing cards and duplicate decisions.
- [x] Preserve partner, companion, sideboard and Considering cards when a deck is exported, bulk-edited and reimported as plain text.
- [x] Export MTGO sideboard quantities as sideboard cards without including Considering cards in the playable list.
- [x] Keep MTGO XML valid and card names intact when names contain XML-reserved characters.
- [ ] Improve round-trip fidelity for categories, printings, companions and sideboards across external formats.
  - [x] Preserve commander, quantities and secondary zones in downloaded plain-text lists using CR, CRLF or LF line endings (#836).
  - Import parsing and preview are more resilient, but exact printing and category round trips remain open; preserving a localized name does not guarantee that Scryfall resolves that language.
- [ ] Offer opt-in integrations only when authentication, rate limits and ownership are clear.
- [ ] Prefer a stable public API over brittle scraping whenever a partner provides one.

### Definition of done

A deck can make a round trip through supported tools without silently changing commander, zone, quantity or ownership meaning.

---

## I-11: Localization And Regional Experience

**Outcome:** users can understand the interface and card data in a language and market they actually use.

**Status:** English and French shipped
**Priority:** Later

### Already shipped

- English and French UI routing.
- Locale switcher and catalog parity guard.
- Localized card names, type lines, rules text and card images where Scryfall provides them.
- Localized deck rows, tooltips, playtest zones and proxies.

### Remaining scope

- [ ] Finish and review one additional locale end to end before activating it.
- [ ] Keep dormant catalogs out of routing until human review is complete.
- [ ] Complete locale-aware currency formatting without implying that USD data is a local-market quote.
- [ ] Test dates, numbers, pluralization, mana symbols and card text together.

### Definition of done

A locale is activated only when its navigation, warnings, dates, prices and card surfaces are translated and tested as one experience.

---

## I-12: Local AI

**Outcome:** explore private or offline deck assistance without compromising the core product.

**Status:** Experimental / parked
**Priority:** Later

### Guardrails

- [ ] Define a real user need first: privacy, offline use, cost or latency.
- [ ] Benchmark local models against the golden evaluation set from I-02.
- [ ] Keep deterministic card data and legality services outside the model.
- [ ] Make model choice and data retention explicit.
- [ ] Do not add local inference infrastructure before cloud AI usage and quality are measured.

### Definition of done

A local model is only promoted if it matches the required quality for a clearly defined workflow at an acceptable cost and latency.

---

# Completed Foundation

These capabilities are not future bets. They are part of the product baseline:

- Scryfall search, filters, printing selection and localized card data.
- Commander, Brawl, Oathbreaker, Standard, Pioneer, Modern, Legacy, Vintage and Pauper rules.
- Deck CRUD, snapshots, annotations, tags, import/export and sharing.
- Commander pairing, Ikoria Companion, Sideboard and Considering zones.
- Bracket scoring, Game Changers, banlists, mana alignment and deck statistics.
- AI archetypes, budget-aware suggestions and explanations.
- Collection tracking, shopping lists and proxy PDF export.
- Playtest engine and session analytics.
- Community profiles, public decks, ratings, votes, follows and comments.
- EDHREC, tournament and Commander Spellbook integrations.
- Sentry, health checks, structured logging, CI, Lighthouse CI and Dependabot.

---

# Explicitly Parked Or Blocked

These items remain visible so they are not forgotten, but they are not part of the next delivery order:

- **Prisma 7:** wait for Node 22.12+ locally.
- **Cloudflare R2:** wait for a concrete durable-media use case.
- **Custom domain and DNS:** do after the product URL and production ownership are settled.
- **PostHog, Plausible or LogRocket:** choose after defining measurable product questions.
- **Chromatic:** adopt when the component surface and visual regression budget justify it.
- **Datadog, Better Uptime, Grafana, OpenTelemetry and PagerDuty:** scale operations only when traffic and incident cost justify them.
- **Goldfish import:** wait for a supported access path.
- **Tournament win rate:** wait for match-level data from a suitable source.
- **Local MageZero model:** revisit after the cloud AI copilot has measurable usage and evaluation data.

---

# Delivery Rules

- Feature and fix branches target `dev`.
- Promotion order is always `dev` -> `staging` -> `main`.
- `staging` is the QA alpha candidate; `main` receives only code validated by QA and colleagues.
- A PR is not ready without typecheck, lint, unit tests, the agreed Docker E2E strategy and SonarCloud verification.
- Roadmap status changes only when the feature is present in code and its acceptance evidence exists.
- Product initiatives may be split into small PRs, but their definition of done remains the source of truth.
