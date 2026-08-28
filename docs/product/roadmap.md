# MagicAIBuilder: Product Roadmap

> **Updated:** 2026-08-26
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

---

## Status And Priorities

| Status | Meaning |
| --- | --- |
| **Shipped** | Available in the product and covered by the current test strategy |
| **In progress** | Partially available or actively being completed |
| **Next** | High-value work for the next delivery batches |
| **Later** | Valuable, but not a near-term commitment |
| **Blocked** | Do not implement until the stated external condition changes |
| **Parked** | Deliberately deferred; not a product priority right now |

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
- [ ] Preserve zone and quantity when changing a card printing.
- [ ] Complete cross-zone drag and drop with clear drop targets and no layout jump.
- [ ] Keep optimistic updates, undo and failed-save recovery consistent.
- [ ] Add Docker-backed E2E coverage for add, move, reload and recovery flows.
- [ ] Add keyboard and mobile alternatives for every drag action.
- [ ] Add a compact activity indicator instead of blocking the whole editor during saves.

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

### Next slice

- [ ] Conversational brief: commander, theme, play pattern, budget, power target and dislikes.
- [ ] Structured plan before card generation: gameplan, win conditions, roles and constraints.
- [ ] Explain every suggestion with evidence: role, synergy, curve, color identity, legality and price.
- [ ] Offer alternatives by budget, power and play pattern instead of one opaque answer.
- [ ] Diff a proposed change against the current deck before applying it.
- [ ] Support "why is this card here?" and "what is the weakest card?" questions.
- [ ] Add a deterministic post-generation validator; the LLM never decides legality.
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
- Mana alignment and per-color land recommendations.
- Turn-one playability odds.
- Combo detection through Commander Spellbook.
- Budget, missing-card and deck-size warnings.

### Remaining scope

- [ ] Replace long persistent warning blocks with dismissible, grouped and actionable warnings.
- [ ] Show the rule or calculation behind each warning on demand.
- [ ] Separate hard legality errors from strategic suggestions and optional advice.
- [ ] Add confidence and freshness labels to external recommendations.
- [ ] Let the player compare analysis before and after a proposed change.
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
- [ ] Use route-level skeletons and cached session/profile data where safe.
- [ ] Remove React refresh loops, hover jitter, layout shifts and unstable card previews.
- [ ] Make warning panels collapsible and dismissible, with accessible close controls.
- [ ] Keep the color identity banner subtle: official mana symbols, restrained background and stable dimensions.
- [ ] Make card zoom intentional in "View all cards" contexts, not a global hover effect.
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

### Remaining scope

- [ ] Track the actual owned printing, not only the oracle card.
- [ ] Prefer owned printings when adding or importing cards.
- [ ] Reconcile a deck against the collection without mutating ownership accidentally.
- [ ] Add region-aware price providers, starting with a clearly selected market.
- [ ] Support a deliberate "proxy now / buy later" workflow.
- [ ] Consider mobile scanning only after the web data model supports printing-level ownership.

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

### Remaining scope

- [ ] Compare playtest results between deck snapshots.
- [ ] Surface evidence such as mulligans, missing colors, dead opening hands and turn progression.
- [ ] Let the player attach a short note to a result and a proposed deck change.
- [ ] Feed playtest evidence into AI prompts only as user-owned context, never as unexplained training data.
- [ ] Keep the solitaire limitation explicit: recorded results are self-reported and are not tournament win rates.

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

### Remaining scope

- [ ] Compare two public or owned decks side by side.
- [ ] Fork a public deck with clear attribution and a clean ownership boundary.
- [ ] Show "why this deck differs" using roles, curve, budget and color identity.
- [ ] Add moderation and abuse-reporting primitives before opening broader social features.
- [ ] Build a lightweight following feed only if discovery data shows repeated use.
- [ ] Keep private decks and share tokens out of search indexes.

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

### Remaining scope

- [ ] Make the source, timestamp and sample window visible beside every external recommendation.
- [ ] Separate "popular", "high synergy", "tournament observed" and "AI suggested".
- [ ] Add source-health telemetry and contract tests for every scraper or external feed.
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
- Exports for Moxfield, MTG Arena, MTGO, TappedOut, Archidekt, ManaBox, MTGGoldfish, EDHREC and plain text.
- Versioned read-only external API under /api/v1.

### Remaining scope

- [ ] Treat import/export formats as versioned contracts with fixtures.
- [ ] Add an import preview that shows zones, commanders, missing cards and duplicate decisions.
- [ ] Improve round-trip fidelity for categories, printings, companions and sideboards.
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

- Feature and fix branches target staging.
- Promotion order is always staging -> dev -> main.
- A PR is not ready without typecheck, lint, unit tests, the agreed Docker E2E strategy and SonarCloud verification.
- Roadmap status changes only when the feature is present in code and its acceptance evidence exists.
- Product initiatives may be split into small PRs, but their definition of done remains the source of truth.
