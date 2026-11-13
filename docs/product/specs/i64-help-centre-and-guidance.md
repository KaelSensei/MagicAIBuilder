# I-64: A Help Centre And In-Product Guidance

> **Initiative:** I-64, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for the content model, the glossary, the help pages, the info button, the first articles in English and French, help search and the path into I-52's report (slices 0 to 9), and for the subscription articles, which ship with I-30's billing (slice 13); Later for the rest; slice 15 waits on the owner · **Paid:** never · **Written 2026-11-10**
> **Research:** one dated note, not committed. Every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice, and go to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through [I-38](i38-trust-safety-and-user-rights.md)'s slice 0.
> **Owns:** the help centre (`/help`), its articles and the tests that fail when an article outlives the interface it describes; the shared glossary and its registry; the info button (`HelpTip`) and the registry that maps each statistic to its definition; "what's this" panels and the help link in every empty state; help search and the help row in card search; the "still stuck" path into I-52's report; the rule that no model writes a support answer. **Does not own:** rules text, rulings, rule addresses and keyword links ([I-47](i47-rules-answers-for-this-deck.md)); explanations attached to warnings ([I-27](i27-learning-while-building.md)); bracket guidance, bracket names and `BracketRule` ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); metric methods, `/methods` and its anchors ([I-34](i34-commander-data-reports.md)); the first-run panel, first-run empty states, sample decks and the event store ([I-39](i39-first-run-activation-and-measurement.md)); the bug report, release notes and status page ([I-52](i52-feedback-loop-players-can-see.md)); legal pages, the DSA contact page and privacy text ([I-38](i38-trust-safety-and-user-rights.md)); the AI-use disclosure page ([I-02](i02-checkable-ai-copilot.md)); the subscription lifecycle ([I-30](i30-business-model-and-paid-tier.md)); the choice of a third locale ([I-25](i25-a-third-locale.md)); importers ([I-10](i10-interoperability-and-integrations.md)).

## Overview

A player who wonders what "Game Changer" means, why the deck shows "2 owned · 1 proxy · 3 missing", or why the first mulligan in playtest cost nothing has nowhere to look inside the product. None of the 16 page routes is a help, FAQ, glossary or about page. The only user guide is a developer document dated 2026-04-06 that describes a landing page that no longer exists and four brackets instead of five. The product itself names bracket 1 two ways: "Exhibition" in the target-bracket picker and "Casual" in the bracket indicator.

A cheap paid tier cannot answer those questions by hand. [I-30](i30-business-model-and-paid-tier.md) puts a living wage at about 1,200 to 1,800 paying subscribers and 30,000 to 60,000 active accounts (line 15), with a €3.99 monthly plan netting €2.63 (line 111). **Estimate, every input an assumption:** if 0.5 to 1% of active accounts wrote once a month, the owner would receive 150 to 600 messages a month; at 10 minutes each, that is 25 to 100 hours, or a sixth to two thirds of a 151-hour working month (35 hours a week). I-52's report counts replace these assumptions once they exist.

Self-help reduces contacts only under a condition. In a field study at a health insurer's call centre, web self-service cut calls about information that was "unambiguous and easily retrievable" by 29%, raised calls about ambiguous information, and raised calls overall by 14% [13]. In a 2024 Gartner survey of 5,728 customers, only 14% of issues were fully resolved in self-service, and 43% of customers could not find content relevant to their issue [14]. The design follows from that: **one definition per term, reachable from the place the term appears, versioned with the code that shows it.**

The initiative has five parts:

1. **A help centre** in English and French, written as files in the app's repository and tested against the interface.
2. **A glossary** shared with the [I-28](i28-commander-deckbuilding-guide-by-bracket.md) guide, the [I-47](i47-rules-answers-for-this-deck.md) rules pages and the [I-27](i27-learning-while-building.md) explanations.
3. **Contextual help:** an "i" button next to a statistic or term, a help link in every empty state and short "what's this" panels.
4. **Search** that finds articles and glossary terms, from `/help` and from card search.
5. **A path to a person:** "Still stuck? Report a problem" opens [I-52](i52-feedback-loop-players-can-see.md)'s report with the article attached.

One boundary covers all five: **no language model writes a support answer.** A model may at most choose which articles to show, and the product shows their reviewed text.

### Overlaps with other initiatives

| Initiative                                             | What it already says                                                                                                                                                                                                                          | How this spec resolves it                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [I-27](i27-learning-while-building.md)                 | Owns "authored explanations attached to warnings" (line 4), one per warning class (32), never model text (34), never a gate (36), a coverage test (49); asks whether vocabulary should be shared with I-15 (72)                               | I-27 keeps its explanations and coverage test. They are stored in this spec's content model as kind `warning` and name terms through the glossary, so "colour identity" has one definition. I-27 slice 1 can depend on slice 1 here instead of building its own model                                                                                                  |
| [I-28](i28-commander-deckbuilding-guide-by-bracket.md) | Owns "the bracket vocabulary shown to players" (line 5), the French form "Catégorie N — Nom (bracket N)" (66), `BracketRule` as single source with prose "as MDX or JSON per locale" (98), and asks for one shared vocabulary (141)           | I-28 keeps bracket names and `BracketRule`. Glossary entries for bracket terms render names from `BracketRule` and link the guide's sections; they hold no bracket number of their own. One MDX pipeline serves both. Single owner decided 2026-11-10 (coordinator call, the owner may override): I-64 slice 1 builds it, and I-28 slice 3 and I-68 slice 1 consume it |
| [I-34](i34-commander-data-reports.md)                  | Owns "the public methods page" (line 6): one versioned anchor per metric (20) with definition, numerator, denominator and biases (116–118); slice 3 builds it (193)                                                                           | A metric's method lives at `/methods#anchor`. Its glossary entry is a plain paragraph that links there. The info button on a computed figure shows the plain definition and "How it is computed". Until I-34 slice 3 ships, it links the glossary only                                                                                                                 |
| [I-39](i39-first-run-activation-and-measurement.md)    | Owns empty states and the onboarding replacement (line 5): an inline first-run panel (93) whose copy describes only its screen (95), the empty `/decks` page and samples (100–101), a checklist linking I-28 and I-27 (109), no streaks (124) | I-39 keeps the first-run surfaces: the empty builder, the guest builder and `/decks`. This spec adds one help link to every empty state, I-39's included, and owns the guidance line of all the others. No tour, modal or coach mark is added                                                                                                                          |
| [I-47](i47-rules-answers-for-this-deck.md)             | Owns rule addresses and keyword links (lines 5, 105 and 113); no model writes a rules statement (82); "No reviewed answer here" (86); a model may return identifiers only (132–134); no chatbot (177)                                         | Glossary entries that are game terms cite the rule through I-47's citation contract and link its address. Keyword abilities are not glossary entries; they keep I-47's links. Requirement 7 reuses I-47 6.1–6.3 for articles                                                                                                                                           |
| [I-52](i52-feedback-loop-players-can-see.md)           | Owns "Report a problem" on every page (line 99), the context allowlist (109) and what is never attached (112); excludes "live chat, a support desk or a promised response time" (189); slice 3 builds the form (212)                          | No second channel. This spec adds one allowlisted field, the help article id, and shows matching articles before the form is sent, without blocking it                                                                                                                                                                                                                 |
| [I-25](i25-a-third-locale.md)                          | No locale on machine translation alone (line 32); "the review is the work" (39); every future feature adds review permanently (65)                                                                                                            | Help articles add to that review. A third locale needs the glossary and the account and subscription articles reviewed; other articles may be labelled "available in English" (8.3)                                                                                                                                                                                    |

## What the market does

All rows were read on 2026-11-10 unless dated otherwise.

| Product           | Help surface                                                                                                                                                                                                                 | Search, languages                    | Contested terms explained                                                           | When help fails                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Archidekt** [1] | One FAQ page: Site Wide, Deck Editor, Playtester, Social Features, about 29 "How do I…" questions; no date                                                                                                                   | No search on the FAQ; English only   | None of bracket, Game Changer or salt; defines its own "loyalty" score              | Contact page and Discord                                  |
| **EDHREC** [2]    | One FAQ page of six questions, among them "Are EDHREC articles written by AI?"; long-form guides such as "How to Use EDHREC" (John Sherwood, 2025-06-03), which explains salt and mentions inclusion without defining it [3] | No search on the FAQ; English only   | Salt Score (0–4, annual survey) and inclusion and Lift, inside answers; no glossary | Contact page                                              |
| **ManaBox** [4]   | A guides site: General, Decks, Collection, Cloud Sync, Card scanner, Search, each with "Getting started" and an FAQ; `_astro` assets suggest Starlight                                                                       | Search (Ctrl+K); English and Español | Guides on card prices and subscriptions; none on Commander vocabulary               | E-mail address, Discord, social accounts                  |
| **Moxfield** [5]  | `moxfield.com/help` answered HTTP 403. Its public GitHub wiki holds two pages; Home was last edited 2020-10-14                                                                                                               | Not verified                         | Not verified                                                                        | Discord, per [I-52](i52-feedback-loop-players-can-see.md) |
| **Scryfall** [6]  | "Scryfall FAQs & Help" and "Scryfall Search Reference" appear in search listings; both answered HTTP 403 to a direct read                                                                                                    | Not verified                         | Search syntax, per the listing                                                      | Not verified                                              |

Three findings:

1. **Help is a page of questions, not a layer of the product.** No product read links a statistic or a term on screen to its definition. EDHREC explains Lift inside an FAQ answer, away from the figure.
2. **Commander's contested vocabulary has no reference home.** Brackets, Game Changers, the free mulligan and "owned" are defined nowhere in the help read. Only ManaBox, which has no Commander vocabulary, ships a second language.
3. **The reference site disclaims AI.** EDHREC's FAQ answers its AI question with "EDHREC does not under any circumstances approve of or publish AI-generated articles" [2]. The roadmap records the same mood on r/EDH: a December 2025 post, "Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time.", reached 729 points, and "was AI used?" is a top comment under launches ([roadmap](../roadmap.md#owner-ambition-and-business-model-2026-11-09), [7]).

**Docs-as-code options.** Versions were read from the npm registry and GitHub on 2026-11-10. The app runs Next.js 15.5.28 with next-intl and has no MDX dependency.

| Option                        | Version, licence                                                      | Fit here                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fumadocs** [8]              | `fumadocs-core` 16.18.4, 2026-11-09, MIT; peer dependency `next` 16.x | Needs a Next.js 16 upgrade first. Search runs as a route or a static index; its multilingual mode "doesn't apply language-specific stemming" [8] |
| **Nextra** [9]                | 4.6.1, 2025-12-04, MIT                                                | No release for eleven months. Search is Pagefind, indexing built HTML after the build, in the browser                                            |
| **Docusaurus** [10]           | 3.10.2, 2026-07-10, MIT                                               | A second React site with its own build, theme and i18n; it would not share the app's message catalogue                                           |
| **Pagefind** [11]             | 1.6.0, 2026-11-01, MIT                                                | Indexes HTML files after the build; the documented setup does not cover pages rendered per request                                               |
| **Plain MDX in the app** [12] | `@next/mdx` 15.5.28, matching the app's Next.js, MIT                  | Same header, theme, locales, CSP and message catalogue; articles can quote interface labels by key, which the drift test needs                   |

**Decision: plain MDX in the app.** Only it lets an article name an interface label through the same catalogue the interface uses (requirement 1.3), and it adds no service, host or second build.

**Does self-help cut support load?** Partly, and only for clear answers.

- **Peer-reviewed, causal:** the call-centre study above: −29% for unambiguous, easy-to-find information; more calls for ambiguous information; +14% overall [13].
- **Analyst survey, reported by trade press:** 14% fully resolved in self-service, 36% of "very simple" issues, 43% unable to find relevant content [14]. Gartner's own release answered HTTP 403.
- **Consultancy survey:** "fully 81% of all customers attempt to take care of matters themselves" before contacting a person; the article gives no sample size [15].
- **Vendor claim:** Zendesk defines a "self-service score", help-centre sessions divided by users who opened tickets, gives 4:1 as an example and calls it the "ticket deflection ratio" [16]. It is a ratio, not a measured reduction. Zendesk-attributed preference figures of 67–76% appear only on third-party blogs and were not verified.

**Accessibility.** WCAG 2.2 criterion 3.2.6 Consistent Help (level A) requires that help mechanisms repeated across pages keep the same relative order; it does not require help to exist [17]. Its understanding document says a chatbot should offer human contact after three unsatisfactory attempts. Criterion 1.4.13 (AA) requires content shown on hover or focus to be dismissible, hoverable and persistent [18]. The HTML standard says relying on the `title` attribute "is currently discouraged", because it can exclude "keyboard-only users and touch-only users" [19].

**French practice.** Microsoft's French (France) style guide addresses the user as "vous", puts a non-breaking space before `; ! : ?` and inside « », and prefers wording that avoids gendered forms [20]. The loi Toubon makes French compulsory in "la désignation, l'offre, la présentation, le mode d'emploi ou d'utilisation" of a product or service [21]. Whether help articles for a paid service count as its "mode d'emploi" is a lawyer question (research, not legal advice).

**Why no answering chatbot.** In February 2024 a Canadian tribunal held Air Canada liable for its website chatbot's wrong answer on bereavement fares. It rejected the argument that the chatbot was "a separate legal entity responsible for its own actions", and found that the airline "failed to take reasonable care to ensure the accuracy of its chatbot". Air Canada had argued that the correct policy sat on a page the chatbot's answer linked [22]. A link beside a wrong answer did not cure it. [I-38](i38-trust-safety-and-user-rights.md) requirement 1.2 (line 58) already says users reach "a person, not only a bot". On r/EDH, an undisclosed model is a reason to dismiss a tool ([roadmap](i02-checkable-ai-copilot.md)).

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **No help route.** The 16 page routes under `src/app/[locale]/` are sign-in, sign-up, builder, collection, commander decks, public deck, decks, moderation reports, home, the two rules pages, saved decks, two settings pages, share and profile. No help, FAQ, about, glossary, guide or methods route exists. `PUBLIC_PAGE_PREFIXES` in `src/lib/auth/public-paths.ts` lists `/auth/signin`, `/auth/signup`, `/share`, `/deck`, `/u`, `/commanders` and `/rules`.
- **A stale developer guide.** `docs/product/user-guide.md` (495 lines) says "Last updated: 2026-04-06". Its landing section describes "ARCHITECT" and "RECRUIT" glyphs that appear nowhere in `src/`. Its statistics section says "Bracket score (1–4)" and calls the two-card combo override an "RC rule". The app does not serve it.
- **Two names for bracket 1.** `src/lib/constants/brackets.ts` types `BracketLevel` as `1 | 2 | 3 | 4` and names bracket 1 "Casual". `BracketIndicator.tsx` renders that name, untranslated, at line 169 and as a `title` at line 244. `src/messages/en/deck.json` names it "Exhibition". [I-28](i28-commander-deckbuilding-guide-by-bracket.md) slices 1 and 2 own the fix.
- **Tooltips are native or ad hoc.** `@radix-ui/react-tooltip` is in `package.json` and imported nowhere. `OnboardingTooltip` is imported nowhere. Components hold 89 `title={…}` props in 43 files. The one info popover, `CardRoleExplanation` in `src/components/card/CardListItem.tsx` (line 74), is a `CircleHelp` button with `aria-expanded` and a `role="note"` panel, without an Escape handler. `ManaCurve` shows a count on hover or focus.
- **Statistics without definitions.** `DeckStats`, `BracketIndicator`, `ManaCurve` and `CollectionStatsPanel` link to nothing. `collection.json` shows "{owned} owned · {proxy} proxy · {missing} missing". `playtest.json` shows "free: new seven" for the free mulligan, which `src/lib/playtest/engine.ts` implements (CR 103.5c, #1301) without explaining. The rules page lists Game Changers without saying what one is (`rules.json`).
- **Empty states.** About 30 empty-state strings in the message catalogues. Most state an absence ("No cards yet", "No public packages yet."). Some name an action, such as the collection hint, the sideboard drop zone, the companion hint and the API-keys page. None links to help.
- **No global search.** Card search sits in the builder; there is no command palette or site search.
- **Import sources are typed.** `ImportSource` in `src/lib/import/url-import.ts` lists Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, AetherHub and EDHREC, so an article can be checked against it.
- **Locales.** `SUPPORTED_LOCALES` is `en` and `fr`, eight catalogues are dormant (`src/i18n/routing.ts`), and `src/i18n/messages.test.ts` checks key parity, while its own comment says a value may "still be English".
- **Dependencies.** No MDX, Markdown or search library. Header links: decks, collection, Game Changers. `Footer.tsx` holds the Wizards and Scryfall notices and the keyboard-shortcuts trigger, and nothing else.

## Functional requirements

### 1. Articles are code, versioned with the feature

1.1 One folder per article under `src/content/help/<slug>/`: `meta.ts` and one `<locale>.mdx` per reviewed locale. Articles are compiled with the app and rendered as server components.
1.2 `meta.ts` is validated by a schema: `slug`, `kind` (`howTo`, `concept`, `format`, `account`, `subscription`, `troubleshooting`, `warning`), `area`, `owner` (the initiative id), `terms`, `ui` (message keys), `routes`, `anchors`, an optional feature `flag`, and per locale a review record (`reviewer`, `reviewedAt`, `uiHash`).
1.3 **Interface labels are quoted by key.** An article names a button or field only through `<Ui k="builder.zones.considering" />`, which renders the catalogue's current text in the article's locale. Links into the product use `<Route href="/collection" />`, and pointers to a control use `<Anchor id="…" />`, matching a `data-help-anchor` attribute in a component.
1.4 **Drift fails a test.** The test fails, naming the article, when a referenced key, route or anchor no longer exists, or when the text of a referenced key changed since `uiHash` was recorded. The pull request that renames or removes the interface updates the article and its review record.
1.5 An article whose `flag` is off is not served, not listed and not searched. An article never describes a feature that has not shipped.
1.6 An article stating a fact about the game cites it through I-47's citation contract (a rule number and the rules version) or a dated Wizards source. An article about a product definition names the owning initiative.
1.7 **Format articles are checked against code.** The import article has one section per `ImportSource` value and per pasted-text format; the export article one per export format. A test fails when either list differs from the code.
1.8 `docs/product/user-guide.md` is retired once slice 5 ships: its verified sections become articles, and the file is replaced by a link to `/help`.

### 2. A shared glossary

2.1 One registry, `src/content/glossary/terms.ts`, holds each term: `id`, a name and aliases per locale, a short definition per locale (at most 280 characters), a `basis` (`official`, `product`, `community`, `computed`), a source, an optional article and an optional I-34 methods anchor.
2.2 The first terms are the ones players argue about: bracket, Game Changer, two-card combo, mass land denial, extra turns, cEDH, free mulligan, London mulligan, colour identity, commander, companion, singleton, banned list, owned, proxy, missing, printing, printing preference ([I-57](i57-printing-preferences-everywhere.md)), build ([I-55](i55-one-deck-several-builds.md)), snapshot, package, considering, inclusion, Lift and Salt Score.
2.3 **A product definition says so.** "Owned" is labelled as this product's definition, says whether a copy committed to another deck counts ([I-16](i16-decks-buildable-from-a-collection.md)), and links the owning initiative.
2.4 Bracket terms render names and limits from `BracketRule` (I-28) and hold no number of their own. In French: "Catégorie N — Nom (bracket N)" (I-28 line 66).
2.5 Game terms link I-47's rule address. Keyword abilities are not glossary entries.
2.6 **One definition.** The I-28 guide, the I-47 rules pages, I-27 explanations and [I-15](i15-rule-zero-sheets-and-pod-profiles.md) sheets render a registered term through `<Term id>`. A test fails if one of those surfaces defines a registered term inline.
2.7 `/help/glossary` lists every term with an anchor per term, in both locales.

### 3. Help pages

3.1 `/help`, `/help/[slug]` and `/help/glossary` are public, work signed out and are added to `PUBLIC_PAGE_PREFIXES`. They carry localised metadata and alternates, and follow I-34's index policy.
3.2 Areas: getting started, building, brackets and vocabulary, collection and ownership, playtest, import and export, sharing and visibility, account and privacy, subscription (once I-30 ships), troubleshooting.
3.3 Each article shows its title, a one-sentence summary, the date it was last reviewed in that locale, its terms and related articles.
3.4 Account and privacy articles link I-38's pages and never restate their text. Subscription articles link I-30's cancellation and withdrawal flows and quote prices and periods from I-30's plan registry, never from prose.
3.5 Each article ends with "Did this help? Yes / No" (counts only, no free text) and "Still stuck? Report a problem" (requirement 7).
3.6 A "Help" entry sits in the header menu and both footers, always in the same order relative to "Report a problem" (WCAG 3.2.6 [17]).

### 4. The info button

4.1 `HelpTip` is a button labelled "About {term}" ("À propos de {term}") next to a figure or term. It opens on click, Enter or Space, sets `aria-expanded`, and closes on Escape, an outside click or a second press, returning focus to the button. Hover alone never opens it [18][19].
4.2 Its panel shows the term's short definition, its basis, and "Read more" to the article or "How it is computed" to the I-34 anchor. It loads no data when opened, so it also works in I-19's offline view.
4.3 A registry, `Record<StatId, Target>`, maps every statistic the product shows to a glossary term or a methods anchor. A test fails when a registered statistic renders without a `HelpTip` with a valid target. The first set covers `BracketIndicator`, `DeckStats`, `ManaCurve`, `CollectionStatsPanel`, playtest evidence and the combo panel; I-28's check and [I-31](i31-deck-lab.md) add theirs.
4.4 `CardRoleExplanation` moves to `HelpTip`.
4.5 **No new informational `title`.** A test counts `title=` props on non-frame elements and fails when the count grows. Existing ones that carry information become a `HelpTip` or visible text; those that repeat a visible label are removed. This works with [I-24](i24-decks-a-screen-reader-can-play-from.md)'s accessibility bundle 3.

### 5. Empty states and "what's this" panels

5.1 Every empty state outside I-39's first-run surfaces says in one sentence what the area is for, offers one action, and carries one help link. I-39's empty states gain the help link only.
5.2 A "what's this" panel is an inline, collapsible block at the top of a feature area (collection, packages, snapshots, playtest evidence, API keys). It never opens a modal, never takes focus and never blocks input.
5.3 Dismissal is stored in `User.dismissedHelpPanels` for accounts. For guests it is kept in browser storage, wrapped so that a refused storage simply shows the panel. A "Show help panels again" switch sits in settings.
5.4 No tour, coach mark, auto-opening help or progress reward, as I-27 (line 36) and I-39 (lines 93, 124) require.

### 6. Search

6.1 `/help` has a search box. `GET /api/help/search` matches articles and glossary terms of the request's locale, and I-28 guide sections once published, from an index generated at build time. No third-party search service is used and the CSP gains no host.
6.2 Matching folds case and accents, strips French elisions (l', d'), handles simple plurals and expands glossary aliases ("GC" to Game Changer, "catégorie" to bracket, "mull" to mulligan).
6.3 Results show the article title, its summary and the matched term, with an English-only label where it applies (8.3).
6.4 **Card search finds help too.** When a builder card search exactly matches a glossary term or alias, one "Help: {term}" row appears above the card results. It never replaces or reorders card results, and never changes the Scryfall query shown ([I-14](i14-verifiable-natural-language-search.md)).
6.5 Searches with no result are counted per week as normalised text, scrubbed with I-52's scrubber (requirement 3.5 there), without an account, IP address or session, and deleted after 90 days.

### 7. When help fails: a person, not a model

7.1 Every article and the `/help` index end with "Still stuck? Report a problem", which opens I-52's form with `helpArticleId` added to its allowlist. Account and legal questions also link I-38's DSA contact page.
7.2 While the player types into I-52's form, up to three matching articles appear beside it, chosen by 6.1's search. Sending stays one action and needs no click on an article. The report records whether articles were shown and whether one was opened, as two booleans.
7.3 **No model writes a support answer.** No route of this initiative calls a language model, except the optional slice 15. A dependency test enforces it, as in I-47 (line 88).
7.4 **Optional retrieval (slice 15, owner decision).** A model may map a typed question to article slugs and anchors only. Invalid identifiers are dropped. The product shows the articles' reviewed summaries and sections verbatim, under "A language model chose these articles. It wrote nothing on this page." If nothing valid remains, the player sees search results and the report link. This is I-47 requirements 6.1 to 6.3 applied to help, and I-02's disclosure page lists it.
7.5 Slice 15 never handles account, billing, privacy, rules or legality questions; those show search results and the report link. It ships only after a golden set built from real I-52 reports shows the right article among those returned at a rate the owner sets.

### 8. Locales and accessibility

8.1 English and French articles and terms are written and reviewed by people. No machine translation is published unreviewed (I-25 line 32, I-52 requirement 1.6).
8.2 French copy uses "vous" and non-breaking spaces before `; : ! ?` and inside « » [20]. It gives the official Wizards French term with the players' word beside it, as I-28 does for brackets (line 66): "Cartes à impact (Game Changers)". A lint test checks the spaces in `fr.mdx` files and glossary entries.
8.3 An article not reviewed in French is not shown as French. The French index lists it as "Disponible en anglais" with a link, rather than switching language silently, as I-25 requirement 4 asks.
8.4 A third locale ([I-25](i25-a-third-locale.md)) needs the glossary and the account and subscription articles reviewed before routing. Other articles follow 8.3.
8.5 Pages have one `h1`, headings in order, alt text on every image, no text inside images, captions on any video, and reflow at 320 CSS pixels. `/help`, one article and the glossary meet the existing Lighthouse and axe budgets.

### 9. Measurement

9.1 First-party aggregates only, under I-39 requirement 8.1 (line 128): views per article per locale per day, helpful and unhelpful counts, `HelpTip` opens per term per day, zero-result queries (6.5), and the two booleans of 7.2. No per-player reading history is stored.
9.2 Owner view: most-read articles, unhelpful share with its n, zero-result queries, and I-52 reports per area beside article views in that area. The view says that these figures are observational and that self-help can raise contacts overall [13].
9.3 An article with at least 30 votes and more than a third unhelpful is flagged for rewrite. Below 30 votes, counts are shown, not rates.

### 10. Never paid

10.1 Everything here is free for everyone, signed in or not. Help explains card data, fan content and the evidence the product shows, which the [strategic boundaries](../roadmap.md#strategic-boundaries) keep free. There is no paid help tier, no priority support and no promised response time (I-52 line 189).
10.2 It serves the paid tier anyway. Free competitors publish an FAQ page; none links a figure on screen to its definition. Contextual help is what keeps a solo owner's support load bounded as subscribers grow. A paid feature cannot ship without its article: a test maps every I-30 entitlement to a `subscription` or `howTo` article.

## Data model / API

```
src/content/help/<slug>/meta.ts       slug, kind, area, owner, terms[], ui[], routes[], anchors[], flag?,
                                      reviews { en: Review, fr?: Review }   Review = { reviewer, reviewedAt, uiHash }
src/content/help/<slug>/<locale>.mdx  body; components <Ui k>, <Route href>, <Anchor id>, <Term id>, <Rule n> (I-47), <Methods anchor> (I-34)
src/content/glossary/terms.ts         Term { id, name{en,fr}, aliases{en[],fr[]}, short{en,fr}, basis, source, article?, methodsAnchor?, seeAlso[] }
src/lib/help/stat-registry.ts         Record<StatId, { term } | { methodsAnchor }>
HelpArticleDay   slug, locale, day, views, helpfulYes, helpfulNo, tipOpens   -- primary key (slug, locale, day)
HelpSearchMiss   locale, query, week, count                               -- deleted after 90 days
User             + dismissedHelpPanels String[]
BugReport (I-52) + helpArticleId?, suggestionsShown Boolean, suggestionOpened Boolean
```

Routes: `/help`, `/help/[slug]`, `/help/glossary`; `GET /api/help/search?q=&locale=` (public, rate-limited with `checkRateLimit`, cacheable); `POST /api/help/feedback` with `{ slug, locale, helpful }` (public, rate-limited, increments a counter); `POST /api/help/ask` only if slice 15 ships.

## Non-goals

- A chatbot, assistant or model that writes support answers, and articles written or translated by a model and published unreviewed.
- A hosted help desk, widget or search service (Zendesk, Intercom, Algolia), or any new CSP host.
- Live chat, phone support, priority support for payers or a promised response time.
- A separate documentation site or framework while the app's own MDX suffices.
- Product tours, coach marks, modals or auto-opening help.
- Restating rules (I-47), bracket guidance (I-28), methods (I-34), legal text (I-38) or release notes (I-52).
- A wiki that players edit. Suggested corrections arrive through I-52's report.
- Video as the primary medium. An article may embed a captioned clip.

## Testing strategy

- **Drift:** removing a referenced message key, route file or `data-help-anchor` fails with the article's slug; changing a referenced label's text without a new review record fails; an article behind an off flag is absent from pages, lists and search.
- **Schema:** both locales or an explicit English-only state; summary length; game facts carry a rule number and version; the owner initiative exists; import and export articles cover every `ImportSource` and export format.
- **Glossary:** the guide, rules pages, explanations and sheets render registered terms through `<Term>`; bracket entries hold no literal number; every alias resolves to one term.
- **Info button:** keyboard open and close, Escape returns focus, `aria-expanded` follows state, no hover-only path, no request on open (solitary component tests plus axe); every `StatId` rendered has a valid target; the `title=` count does not grow.
- **Search:** a golden set in both locales, including "categorie" without its accent, "GC", "mull" and plural forms; card search keeps its results and query unchanged when a help row appears; zero-result storage drops e-mail-like strings and holds no account, IP or session.
- **No model:** a dependency test fails if a help route imports the AI client, slice 15 excepted.
- **French:** the typography lint; an unreviewed French article renders the "Disponible en anglais" entry, never English under a French title.
- **End to end:** signed-out `/help` and `/fr/help`; a search; the info button on the bracket indicator; "Report a problem" from an article attaches its id.

## Delivery slices

| #   | Slice                                                                                                                                                                        | Depends on                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 0   | Decisions: who writes and reviews each locale; lawyer questions added to I-30 7.2 through I-38 slice 0                                                                       | — (owner; no code)                          |
| 1   | Content model: MDX pipeline, `meta.ts` schema, `<Ui>`, `<Route>`, `<Anchor>`, drift and schema tests                                                                         | —                                           |
| 2   | Glossary registry, `<Term>`, `/help/glossary` in English with the first terms (2.2)                                                                                          | 1; I-28 slices 1–2 for bracket names        |
| 3   | `/help` index and article pages, public paths, metadata, helpful counter, header and footer entries; the "Still stuck?" line arrives with slice 9                            | 1                                           |
| 4   | `HelpTip`, stat registry and coverage test; `CardRoleExplanation` migrated; tips on the four statistics components                                                           | 2                                           |
| 5   | First English articles: getting started, brackets, Game Changers, free mulligan, ownership, printings, import, export, sharing, account, troubleshooting; user guide retired | 3                                           |
| 6   | French review of slices 2, 3 and 5; typography lint; "Disponible en anglais" entries                                                                                         | 5                                           |
| 7   | Help search: build-time index, folding and aliases, golden set, zero-result counts                                                                                           | 2, 3                                        |
| 8   | Help links in every empty state and "what's this" panels with dismissal                                                                                                      | 3; I-39 slice 5 for the first-run surfaces  |
| 9   | "Still stuck?" into I-52: article id allowlisted, matching articles beside the form                                                                                          | 7; I-52 slice 3                             |
| 10  | Help row in builder card search                                                                                                                                              | 7                                           |
| 11  | `title=` ratchet and migration of informational titles                                                                                                                       | 4                                           |
| 12  | Owner measurement view (9.2, 9.3)                                                                                                                                            | 3, 7; I-39 slice 10                         |
| 13  | Subscription articles and the entitlement-to-article test                                                                                                                    | 5; I-30 slices 7 and 8                      |
| 14  | Glossary links from the I-28 guide, I-47 rules pages and I-27 explanations                                                                                                   | 2; I-28 slice 4; I-47 slice 2; I-27 slice 1 |
| 15  | Optional model retrieval of article identifiers, with its golden set and disclosure _(the disclosure page re-pointed 2026-11-10 to I-30 slice 5)_                            | 9; I-30 slice 5; owner decision             |

Slices 1 and 3 can start today and need no decision. Slice 2 can start with the terms that do not depend on bracket names. Slice 13 must ship in the same release as I-30's billing, so that cancellation and withdrawal are explained the day a player can pay. Scheduled agents must not pick slice 15.

## Open questions

- **Who writes and reviews?** Content without an owner dates, as I-27's open question says and `docs/product/user-guide.md` shows. An agent can draft articles in the feature's pull request; the owner or a French speaker approves each locale. If nobody owns the French review, slice 6 does not start and French pages list English articles.
- **Is a failing drift test too strict?** Failing a pull request because a label's text changed keeps articles honest but slows copy edits. The alternative is a list of articles to review in each `chore/docs` pull request. The owner chooses after slice 1 shows how often it fires.
- **Should slice 15 ever be built?** Players' hostility to AI answers is documented, and EDHREC's FAQ disclaims AI content. Search, the glossary and the info button may make it unnecessary; I-52's reports will show whether players fail to find articles.
- **Indexing.** Help articles could bring search traffic, but short definitions are thin pages. Should glossary anchors stay on one page and only full articles be indexable, under I-34's policy?
- **For the lawyer** (research, not legal advice; add to I-30 7.2 through I-38 slice 0):
  - Do help articles for a paid service sold in France count as its "mode d'emploi" under the loi Toubon [21], so that French articles become mandatory for paid features?
  - If slice 15 shows the wrong article for a cancellation or withdrawal question, could that engage the publisher's liability under French consumer law, as the Air Canada decision did under Canadian law [22]?
  - Which lawful basis covers storing zero-result queries (6.5), given that a player may type personal data despite the scrubber?

## Sources

All read on 2026-11-10 unless stated.

1. Archidekt, [FAQ](https://archidekt.com/faq), undated.
2. EDHREC, [Frequently Asked Questions](https://edhrec.com/faq), undated.
3. EDHREC, [How to Use EDHREC](https://edhrec.com/guides/how-to-use-edhrec), John Sherwood, 2025-06-03.
4. ManaBox, [Guides: General F.A.Q.](https://manabox.app/guides/general/faq/), undated.
5. Moxfield, [`moxfield-public` wiki](https://github.com/moxfield/moxfield-public/wiki), Home last edited 2020-10-14; `https://moxfield.com/help` answered HTTP 403.
6. Scryfall, [FAQs & Help](https://scryfall.com/docs/faqs) and [Search Reference](https://scryfall.com/docs/syntax): titles from search listings; both answered HTTP 403.
7. r/EDH, ["Do not use AI to make deck suggestions or clarify rules. It's wrong most of the time."](https://www.reddit.com/r/EDH/comments/1q0epg2/), 2025-12-31, 729 points; read 2026-11-09 for the roadmap and [I-47](i47-rules-answers-for-this-deck.md); Reddit refused an automated read on 2026-11-10.
8. Fumadocs, [Built-in search](https://www.fumadocs.dev/docs/headless/search/orama); `fumadocs-core` 16.18.4 published 2026-11-09, peer `next` 16.x (npm registry); [repository](https://github.com/fuma-nama/fumadocs), MIT.
9. Nextra, [Search](https://nextra.site/docs/guide/search); [repository](https://github.com/shuding/nextra), MIT; 4.6.1 released 2025-12-04 (GitHub API).
10. Docusaurus, [repository](https://github.com/facebook/docusaurus), MIT; v3.10.2 released 2026-07-10 (GitHub API).
11. Pagefind, [repository](https://github.com/Pagefind/pagefind), MIT; v1.6.0 released 2026-11-01 (GitHub API).
12. `@next/mdx`, [npm package](https://www.npmjs.com/package/@next/mdx): 15.5.28 is published, MIT (npm registry).
13. A. Kumar, R. Telang, "Does the Web Reduce Customer Service Cost? Empirical Evidence from a Call Center", _Information Systems Research_ 23(3-1), 2012, 721–737, [abstract](https://ideas.repec.org/a/inm/orisre/v23y2012i3-part-1p721-737.html), [doi:10.1287/isre.1110.0390](https://doi.org/10.1287/isre.1110.0390). Abstract read; full text not read.
14. CX Today, ["Only 1 in 7 Customer Service Queries Resolved with Self-Service, Gartner Study Finds"](https://www.cxtoday.com/contact-centre/only-1-in-7-customer-service-queries-resolved-with-self-service-gartner-study-finds/), 2024-08-19. Gartner's [press release](https://www.gartner.com/en/newsroom/press-releases/2024-08-19-gartner-survey-finds-only-14-percent-of-customer-service-issues-are-fully-resolved-in-self-service) answered HTTP 403.
15. M. Dixon, L. Ponomareff, S. Turner, R. DeLisi, ["Kick-Ass Customer Service"](https://hbr.org/2017/01/kick-ass-customer-service), _Harvard Business Review_, January–February 2017.
16. Zendesk (vendor), [Getting started with self-service, Part 6: Tracking essential self-service metrics](https://support.zendesk.com/hc/en-us/articles/4408894139930-Getting-started-with-self-service-Part-6-Tracking-essential-self-service-metrics), undated.
17. W3C, [Understanding SC 3.2.6 Consistent Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html), WCAG 2.2.
18. W3C, [Understanding SC 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), WCAG 2.2.
19. WHATWG, [HTML Living Standard: the `title` attribute](https://html.spec.whatwg.org/multipage/dom.html#the-title-attribute).
20. Microsoft, [French (France) Localization Style Guide](https://download.microsoft.com/download/c/7/9/c7921dbd-4531-4a4e-8490-e4656d739f3d/fra-fra-StyleGuide.pdf), undated; its inclusive-language section cites a Microsoft France position of September 2022.
21. [Loi n° 94-665 du 4 août 1994 relative à l'emploi de la langue française](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000349929), art. 2, Légifrance.
22. WeirFoulds LLP, ["Moffatt v Air Canada: Bot Betrayal and Negligent Misrepresentation"](https://www.weirfoulds.com/moffatt-v-air-canada-bot-betrayal-and-negligent-misrepresentation), 2024-03-06, on _Moffatt v. Air Canada_, 2024 BCCRT 149 ([CanLII](https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html), which answered HTTP 403). The decision date, 2024-02-14, comes from search results, not from the decision itself.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

### Goals

- A signed-out visitor opens `/fr/help`, finds "GC" through search and reads the Game Changer definition that the bracket indicator's info button shows; a pull request that renames a label an article quotes fails until the article follows; and an article's "Still stuck?" opens I-52's report with the article attached, with no model writing a word.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-64-01

As a player stuck in the editor, I want a short article that matches the screen I am on, so that I do not have to write to the owner.

#### US-64-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-64-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-64-01 Happy path

Given a signed-in player and the English locale
When an article's controls exist in the interface. A renamed control fails the article's check.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-64-02 Happy path

Given a signed-in player and the English locale
When the first articles exist in English and French.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-64-03 Happy path

Given a signed-in player and the English locale
When a dead end offers the bug report, not a claim that the problem was already sent.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-64-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-64-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-64-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Public, signed-out. No flag. A model that only picks article ids stays Later and off.

#### AC-64-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-64-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-64-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The help control is an info button on the surface, opening the article. Search is over titles and headings.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Authored content through the pipeline this initiative owns. No chatbot. The old user guide is retired rather than left to contradict the product.

### Analytics and telemetry

`help_opened {found: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Public, signed-out. No flag. A model that only picks article ids stays Later and off.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Who writes the French articles is open. Slice 6 does not start without a reviewer.

### Sources

- https://doi.org/10.1287/isre.1110.0390
- https://edhrec.com/faq
- https://www.weirfoulds.com/moffatt-v-air-canada-bot-betrayal-and-negligent-misrepresentation

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-64-101

As a player, I want the product to slice 0, no code: who writes and reviews each locale; the lawyer questions join I-30 requirement 7.2 through I-38 slice 0., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slice 0, no code: who writes and reviews each locale; the lawyer questions join I-30 requirement 7.2 through I-38 slice 0.

#### AC-64-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-102 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-64-102

As a player, I want the product to a content model: MDX articles under src/content/help/<slug>/ with a validated meta.ts, and <Ui>, <Route> and <Anchor> components., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A content model: MDX articles under src/content/help/<slug>/ with a validated meta.ts, and <Ui>, <Route> and <Anchor> components. A test fails, naming the article, when a quoted key, route or anchor disappears or a quoted label changes after its review (slice 1). One MDX pipeline serves I-28's guide and I-68's style guides too. Single owner decided 2026-11-10 (coordinator call, the owner may override): I-64 slice 1; I-28 slice 3 and I-68 slice 1 consume it.

#### AC-64-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-64-103

As a player, I want the product to one glossary registry rendered through <Term>, with /help/glossary and the first terms players argue about (slice 2)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: One glossary registry rendered through <Term>, with /help/glossary and the first terms players argue about (slice 2). Bracket terms take their names from I-28's BracketRule, game terms cite I-47's rule addresses, and metrics link I-34's /methods.

#### AC-64-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-108 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-64-104

As a player, I want the product to public /help and article pages with a helpful counter, and a "Help" entry in the header and both footers, in the same order relative to "Report a problem" (slice 3)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Public /help and article pages with a helpful counter, and a "Help" entry in the header and both footers, in the same order relative to "Report a problem" (slice 3).

#### AC-64-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-64-105

As a player, I want the product to helpTip, an "i" button that opens on click, Enter or Space, closes on Escape and never opens on hover alone, and a registry that maps every statistic to its definition, with a test that fails when one renders without it (slice 4)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: HelpTip, an "i" button that opens on click, Enter or Space, closes on Escape and never opens on hover alone, and a registry that maps every statistic to its definition, with a test that fails when one renders without it (slice 4). Today @radix-ui/react-tooltip is installed and imported nowhere, 43 files carry 89 title= props, and DeckStats, BracketIndicator, ManaCurve and CollectionStatsPanel link to no definition.

#### AC-64-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-114 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-64-106

As a player, I want the product to the first English articles, from getting started to troubleshooting, and the retirement of docs/product/user-guide.md (slice 5)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The first English articles, from getting started to troubleshooting, and the retirement of docs/product/user-guide.md (slice 5). Checked on origin/dev at 72fbfc1: the guide says "Last updated: 2026-04-06", describes "ARCHITECT" and "RECRUIT" glyphs that appear nowhere in src/, and gives a "Bracket score (1–4)". Its verified sections become articles and the file becomes a link to /help; this roadmap does not edit it in the meantime.

#### AC-64-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-117 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-64-107

As a player, I want the product to bracket 1 named once., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Bracket 1 named once. BracketIndicator.tsx shows "Casual" from BRACKET_DEFINITIONS (src/lib/constants/brackets.ts), in its label and its title, while the wizard's target-bracket picker shows "Exhibition" (src/messages/en/deck.json), checked on origin/dev at 72fbfc1. I-28's open bracket-definitions item owns the fix; slice 2's bracket terms wait for it, and slice 4's tip on the indicator reads the corrected name.

#### AC-64-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-120 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-64-108

As a player, I want the product to the French review, with a typography lint and "Disponible en anglais" entries for articles not yet reviewed (slice 6); help search from a build-time index that folds accents and expands aliases such as "GC", with searches that found nothing counted per week and deleted after 90 days (slice 7); a help link in every empty state and dismissible "what's this" panels, with no tour (slice 8); and "Still stuck? Report a problem" into I-52's form with the article attached (slice 9)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-121 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The French review, with a typography lint and "Disponible en anglais" entries for articles not yet reviewed (slice 6); help search from a build-time index that folds accents and expands aliases such as "GC", with searches that found nothing counted per week and deleted after 90 days (slice 7); a help link in every empty state and dismissible "what's this" panels, with no tour (slice 8); and "Still stuck? Report a problem" into I-52's form with the article attached (slice 9).

#### AC-64-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-123 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-64-109

As a player, I want the product to subscription articles and a test that maps every I-30 entitlement to an article, in the same release as I-30's billing (slice 13)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Subscription articles and a test that maps every I-30 entitlement to an article, in the same release as I-30's billing (slice 13).

#### AC-64-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-64-110

As a player, I want the product to later: a help row above builder card search results (slice 10), the title= ratchet (slice 11), the owner's measurement view (slice 12) and glossary links from I-28, I-47 and I-27 (slice 14)., so that a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

#### AC-64-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: a help row above builder card search results (slice 10), the title= ratchet (slice 11), the owner's measurement view (slice 12) and glossary links from I-28, I-47 and I-27 (slice 14). Only if the owner decides: a model that maps a question to article identifiers and writes nothing (slice 15).

#### AC-64-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-64-129 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

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

## I-64: A Help Centre And In-Product Guidance

**Spec:** [`specs/i64-help-centre-and-guidance.md`](i64-help-centre-and-guidance.md)

**Outcome:** a player who wonders what "Game Changer", "2 owned · 1 proxy · 3 missing" or "free: new seven" means presses an "i" button beside it, or opens a help centre in English or French, and reads one reviewed definition. An article that outlives the interface it describes fails a test, and a player whom help does not answer reaches I-52's report, never a model.

**Status:** Next
**Priority:** Next for slices 0 to 9, and for slice 13, which ships with I-30's billing; Later for the rest; slice 15 waits for the owner. Never paid
**Impact / effort:** Medium / medium
**Depends on:** nothing for slices 1 and 3; the owner's choice of writers and reviewers for slice 6; I-28 slices 1 and 2 for bracket names in the glossary (slice 2); I-39 slice 5 for the first-run surfaces (slice 8); I-52 slice 3 for the report (slice 9); I-30 slices 7 and 8 for slice 13; I-28 slice 4, I-47 slice 2 and I-27 slice 1 for glossary links (slice 14); I-30 slice 5's AI-use disclosure page (re-pointed 2026-11-10) and the owner's decision for slice 15.

None of the 16 page routes is a help, FAQ, glossary or about page, and the product names Bracket 1 two ways. I-30's case needs about 1,200 to 1,800 subscribers. On the spec's assumptions, if 0.5 to 1% of 30,000 to 60,000 active accounts wrote once a month, the owner would spend 25 to 100 hours a month answering. Self-service helps only when the answer is clear and easy to find: in a field study, web self-service cut calls about "unambiguous and easily retrievable" information by 29% and raised calls overall by 14% ([Kumar and Telang, 2012](https://doi.org/10.1287/isre.1110.0390)). Archidekt and EDHREC publish one FAQ page each, and no product read links a figure on screen to its definition. EDHREC's FAQ says it "does not under any circumstances approve of or publish AI-generated articles" ([FAQ](https://edhrec.com/faq)), and in 2024 a Canadian tribunal held Air Canada liable for its chatbot's wrong answer, although the answer linked the correct policy ([WeirFoulds](https://www.weirfoulds.com/moffatt-v-air-canada-bot-betrayal-and-negligent-misrepresentation)). So articles are MDX inside the app, quoting interface labels through the message catalogue, and no model writes an answer. Fumadocs needs Next.js 16, and the app runs 15.5.28.

### Scope

- [ ] Slice 0, no code: who writes and reviews each locale; the lawyer questions join I-30 requirement 7.2 through I-38 slice 0.
- [ ] A content model: MDX articles under `src/content/help/<slug>/` with a validated `meta.ts`, and `<Ui>`, `<Route>` and `<Anchor>` components. A test fails, naming the article, when a quoted key, route or anchor disappears or a quoted label changes after its review (slice 1). One MDX pipeline serves I-28's guide and I-68's style guides too. Single owner decided 2026-11-10 (coordinator call, the owner may override): I-64 slice 1; I-28 slice 3 and I-68 slice 1 consume it.
- [ ] One glossary registry rendered through `<Term>`, with `/help/glossary` and the first terms players argue about (slice 2). Bracket terms take their names from I-28's `BracketRule`, game terms cite I-47's rule addresses, and metrics link I-34's `/methods`.
- [ ] Public `/help` and article pages with a helpful counter, and a "Help" entry in the header and both footers, in the same order relative to "Report a problem" (slice 3).
- [ ] `HelpTip`, an "i" button that opens on click, Enter or Space, closes on Escape and never opens on hover alone, and a registry that maps every statistic to its definition, with a test that fails when one renders without it (slice 4). Today `@radix-ui/react-tooltip` is installed and imported nowhere, 43 files carry 89 `title=` props, and `DeckStats`, `BracketIndicator`, `ManaCurve` and `CollectionStatsPanel` link to no definition.
- [ ] The first English articles, from getting started to troubleshooting, and the retirement of `docs/product/user-guide.md` (slice 5). Checked on `origin/dev` at `72fbfc1`: the guide says "Last updated: 2026-04-06", describes "ARCHITECT" and "RECRUIT" glyphs that appear nowhere in `src/`, and gives a "Bracket score (1–4)". Its verified sections become articles and the file becomes a link to `/help`; this roadmap does not edit it in the meantime.
- [ ] Bracket 1 named once. `BracketIndicator.tsx` shows "Casual" from `BRACKET_DEFINITIONS` (`src/lib/constants/brackets.ts`), in its label and its `title`, while the wizard's target-bracket picker shows "Exhibition" (`src/messages/en/deck.json`), checked on `origin/dev` at `72fbfc1`. [I-28](i28-commander-deckbuilding-guide-by-bracket.md)'s open bracket-definitions item owns the fix; slice 2's bracket terms wait for it, and slice 4's tip on the indicator reads the corrected name.
- [ ] The French review, with a typography lint and "Disponible en anglais" entries for articles not yet reviewed (slice 6); help search from a build-time index that folds accents and expands aliases such as "GC", with searches that found nothing counted per week and deleted after 90 days (slice 7); a help link in every empty state and dismissible "what's this" panels, with no tour (slice 8); and "Still stuck? Report a problem" into I-52's form with the article attached (slice 9).
- [ ] Subscription articles and a test that maps every I-30 entitlement to an article, in the same release as I-30's billing (slice 13).
- [ ] Later: a help row above builder card search results (slice 10), the `title=` ratchet (slice 11), the owner's measurement view (slice 12) and glossary links from I-28, I-47 and I-27 (slice 14). Only if the owner decides: a model that maps a question to article identifiers and writes nothing (slice 15).
- [ ] Added 2026-11-12 (thirteenth pass): glossary terms for [I-99](i99-a-pilot-sheet-and-how-heavy-this-deck-is-to-pilot.md) (upkeep, trigger, replacement effect, optional trigger, pilot load) and [I-100](i100-cards-that-work-against-each-other.md) (symmetric effect, payoff, enabler), each reached from the info button beside the class, in English and French.

### Engineering enablers

- Removing a quoted message key, route file or `data-help-anchor`, or changing a quoted label without a new review record, fails with the article's slug; an article behind an off flag is absent from pages, lists and search.
- I-28's guide, I-47's rules pages, I-27's explanations and I-15's sheets render registered terms through `<Term>`, and no bracket entry holds a literal number.
- A dependency test fails if a help route imports the AI client, slice 15 excepted, and the CSP gains no host.
- The count of `title=` props never grows.

**Paid-tier angle:** none. Help explains card data, fan content and the evidence the product shows, which stay free, and there is no paid help, priority support or promised response time. It serves I-30 anyway: contextual help keeps a solo owner's support load bounded as subscribers grow, and a paid feature cannot ship without its article.

### Enrichment (2026-11-11)

**User story.** As a player stuck in the editor, I want a short article that matches the screen I am on, so that I do not have to write to the owner.

**Acceptance.**
- An article's controls exist in the interface. A renamed control fails the article's check.
- The first articles exist in English and French.
- A dead end offers the bug report, not a claim that the problem was already sent.

**UX.** The help control is an info button on the surface, opening the article. Search is over titles and headings.

**Data and API.** Authored content through the pipeline this initiative owns. No chatbot. The old user guide is retired rather than left to contradict the product.

**i18n and access.** Articles ship in both served locales or they do not ship. A missing French article is not filled with English under a French URL.

**Telemetry.** `help_opened {found: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Public, signed-out. No flag. A model that only picks article ids stays Later and off.

**Open questions.** Who writes the French articles is open. Slice 6 does not start without a reviewer.

### Definition of done

A signed-out visitor opens `/fr/help`, finds "GC" through search and reads the Game Changer definition that the bracket indicator's info button shows; a pull request that renames a label an article quotes fails until the article follows; and an article's "Still stuck?" opens I-52's report with the article attached, with no model writing a word.

---

