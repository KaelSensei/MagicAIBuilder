# Changelog

All notable changes to MagicAIBuilder are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### 2026-11-23: A restored snapshot puts its commander back on the deck, a signed-out player is told AI suggestions need an account, and a push that changes no file skips the E2E gate

- Restoring a snapshot puts its commander and partner back on the deck, not only in its cards. The deck's commander, commander name and partner are read from the restored command-zone rows and written in the same transaction as the cards, so they change together or not at all (I-55 requirement 5.6); a companion row is never taken for the commander. Before, a snapshot taken under another commander came back with its cards while the deck kept the old commander name, which community discovery matches. A snapshot with no commander row now clears the three fields, and a malformed snapshot still changes nothing. **Risk, from its body:** snapshots saved before commanders had their own rows hold no commander row, so restoring one now clears the commander fields to match the restored rows, where they used to keep stale values. The companion and the pairing type are not rewritten by a restore (I-37, #1668).
- A signed-out player who asks for AI suggestions, for example on the guest builder, reads "AI suggestions need an account. Everything else keeps working." with "Create account" and "Sign in" links that bring them back to the page they were on. Before, the panel showed the raw `AI request failed (401)` with a Retry that could never succeed. The allowance and spending-ceiling refusals keep their wording, and neither case shows Retry. English and French are written out; the eight dormant locales use the English wording (I-39 slice 2, #1881).
- Tooling: the pre-push E2E gate reads the commits a push sends and skips the Docker suite, saying why, when every pushed commit changes no file, such as an empty commit that claims a roadmap slice, or when the push only deletes a remote branch. Any file change runs the full suite as before, and every uncertain case keeps it: no ref lines from git, a root commit, or a commit the clone cannot read. `SKIP_E2E` is unchanged. `docs/engineering/quality-gate.md` and `docs/engineering/dx-ci-overview.md` describe the skip (I-74 slice 6, #1669).
- #1668: Red observed (the restored deck kept `"commanderId": "scryfall-kenrith-the-returned-king"` where the snapshot's `scryfall-atraxa-praetors-voice` was expected, `1 failed | 17 skipped`); the edge-case, contract and route tests were written after Green and passed when written; at `03be8f09`, 9,087 unit tests across 776 files passed; not replayed against a real PostgreSQL database (the adapter ran on the in-memory Prisma fake and the route on a Prisma stub), and no E2E spec covers a snapshot restore. #1881: Reds observed (`expected null to deeply equal { code: 'sign_in_required' }` for the hook, and `Objects are not valid as a React child (found: object with keys {code})` for the three panel tests, `4 failed | 8 passed`); the allowance and 500 tests passed unchanged, as guards; at `8036b21c`, 9,121 across 778 files; no screenshot at desktop or mobile widths. #1669: Reds observed (both skip tests, `expected [ { …(2) } ] to have a length of +0 but got 1`, `2 failed | 5 passed`); the three "runs the full suite" tests passed against the old script, as guards, and the unreadable-commit test was added after Green; at `e70547be`, 9,093 across 776 files; its own push changed files, so the new script ran the full suite (105 passed, 3.2 min); not verified: a real empty claim push through husky, and `shellcheck`, which is not installed. For all three, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI, and each was opened with `SONAR_GATE_OVERRIDE=1` because the two open issues sit in `src/lib/auth/config.ts`, a file none of them touches.

### 2026-11-23: Roadmap slices with no screen yet: a land classifier, a colour-identity project fill, the deck stages, a precon comparison and a palette checker

- `classifyLand` gives a land the colours it makes, the land types it can fetch and how it enters the battlefield: untapped, tapped, conditional with its condition, or paid with its cost (CR 614.1c, CR 119.4). A dated table keyed by Scryfall's 21 land-cycle keywords (checked on 2026-11-10, reviewed on 2026-11-20) sets the class of a cycle, so a shock land is paid with 2 life, a fast land is conditional and a pain land is paid although its text enters untapped; creature lands and lands outside a cycle read their own Oracle text, and a fetch land enters as the land it finds does. The colours come from Deck Lab's own land reader, so the two never disagree. Nothing reads it yet; the Mana base check is slice 3 (I-58 slice 2, #1635).
- `fillProject` fills a project's slots from the owner's decks: templates for the 32 colour identities (colourless included), the 10 pairs, the shards, the wedges and the four-colour identities. Each slot takes the earliest created deck of exactly its identity and lists the others as also fitting; a pinned deck stays in its slot and is flagged when it no longer fits; a skipped slot leaves the count ("2 of 28, 4 skipped"); a slot with a plan and no deck reads as planned. It reads no database and changes no deck, and no page shows it yet. **Choice to review, from its body:** a deck pinned to one slot is not placed again in its own identity's slot, a rule the spec does not state (I-113 slice 1, #1653).
- The deck stages, in rotation, resting and retired, are a pure table of what each counts for: a deck in rotation commits its copies, feeds the acquisition plan, is offered in deck pickers and counts as active; a resting deck keeps its copies committed and stays in pickers, but feeds no plan by default and does not count as active; a retired deck does none of these. A deck with no stage counts as in rotation, as every deck does today. Two cells are the PR's reading, not spec text: a resting deck stays in pickers, and only a deck in rotation counts as active. `CONTEXT.md` gains the "Deck stage" term. No deck has a stage yet: storing it and the readers that ask the table wait for owner decision D-107 (I-114 slice 1, #1654).
- `comparePrecons` puts one precon line's decks side by side on labelled signals: the colour identity and the sealed list size from I-17's catalogue and the bracket floors from I-77, each with its owner and date. Play styles, routes, pilot load, price against sealed and first-bundle cost read "not computed yet" with the initiative that owns them, never a blank or a zero, and no row is a power, a score, a rating or a win rate. A signal read from an older version of a corrected list is not shown. The line is the set code until I-17 names product lines. Nothing imports it yet; the signed-out page is slice 2 (I-106 slice 1, #1655).
- `src/lib/a11y/palette.ts` measures colours: WCAG 2.1 contrast, a colour-vision simulation for protan, deutan and tritan (Machado et al. 2009, severity 1.0), the OKLab distance × 100, and `validatePalette`, which names the pairs too close to tell apart (under ΔE 15 with normal vision, ΔE 8 simulated) and the marks under 3:1 against their surface. It measures today's mana red and green at ΔE 7.24 under protan and `--mana-black` on the dark surface at 1.24:1, the failures the I-49 spec reports. The two contrast test files now import its formula instead of each carrying a copy, with no assertion changed. No screen uses it yet (I-49 slice 2, #1872).
- #1635: Red observed against a skeleton returning `undefined` (`AssertionError: expected undefined to match object { Object (entry, cycle) }`, then `12 failed | 2 passed` for the file, the two passing being the table's shape and the non-land case); at `96955e7d`, 9,039 unit tests across 773 files passed; the cycle classes were written from the cards' rules text, not checked card by card against a Scryfall dump. #1653: Reds observed for nine cycles, from `Failed to resolve import "./project-fill"` to the tie-break (`expected { state: 'built', slotKey: 'WU', …(3) } to match object { deckId: 'alpha', …(1) }`); three tests passed when written (colour order, AC-113-07, the deleted pin) and stay as regression tests; at `96955e7d`, 9,040 across 773 files. #1654: Red observed (`Failed to resolve import "./deck-stage"`); 16 focused tests; at `21f52ccd`, 9,070 across 775 files. #1655: Red observed against a skeleton answering `unknownLine` (`Error: expected a line`, `1 failed | 8 skipped`); its first lint run failed `max-params` and a parameter object fixed it; at `25adc1c3`, 9,079 across 776 files. #1872: Red observed (`Failed to resolve import "./palette"`); the first Green failed one assertion (`expected 7.243152173494144 to be close to 7.3`), and the tolerance became ±0.5 because the spec prints the figure rounded and gives no method; its second commit is structural; at `e06b25b9`, 9,117 across 777 files. For all five, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI, and #1635, #1653, #1654 and #1655 were opened with `SONAR_GATE_OVERRIDE=1` for the two open issues in `src/lib/auth/config.ts`. Nothing user-visible exists yet, so no browser check was made.

### 2026-11-22: One SonarCloud finding on the promoted code is cleared and `dev` is promoted to `staging`

- One SonarCloud reliability finding on the code promoted from `dev` is cleared, with no behaviour change: the curve breakdown passes a wrapped callback to `reduce`, so a later optional parameter of its reducer could never receive the index (`typescript:S7727`, `src/lib/deck/curve-breakdown.ts`) (#1880).
- Promoted to `staging` (#1879): the 70 commits after #1606 through #1880, on a promotion branch built from `dev` rebased onto `staging` (`git rebase --onto origin/staging 0ce607f2`), with a tree equal to `dev`'s at `96955e7d`. Its first SonarCloud run failed the new-code gate on one condition, `new_reliability_rating` 3, from #1880's single finding; the branch was then rebuilt on `dev` and force-pushed with a lease on the old tip `8cd1d6ac`. The QA alpha cycle on the staging deployment, by the owner and colleagues at desktop and mobile widths, is not recorded yet. No `main` promotion has happened since #1607.
- Documentation: #1878 recorded the merges from #1667 to #1877 in this file and the progress tracker.
- **Owner actions.** No migration merged in the range: `git log 24919413..origin/dev -- prisma/migrations` is empty. No PR body names a new environment variable, and the range adds no `process.env` read. As #1879's body says, #1612's migration (`20261120120000_add_rule_zero_sheet`) must be applied to a deployment's database before `main` is promoted, because the Rule 0 sheet route and the account export read its table. #1654 leaves D-107 open: whether I-01 slice 13's archive is the same thing as "retired", and whether resting decks leave the plan by default, an answer that would change one cell of its table. #1653 asks for its pin rule to be reviewed. The owner actions recorded on 2026-11-22 stay open: the D-34 accuracy thresholds and benchmark photographs, whether a Commander deck's sideboard counts toward its copy limit (#1868), and whether the price total should count the companion (#1748).
- #1880: structural, no Red; the finding came from the SonarCloud API for #1879 (`ERROR new_reliability_rating 3 GT 1`); `curve-breakdown.test.ts` and the deck components, 80 files and 628 tests, passed unchanged; on the tip rebased onto `dev` at `09118545`, typecheck, lint and 9,025 unit tests across 772 files passed, and the pre-push Docker E2E gate passed on push; its own SonarCloud analysis passed the gate with no issue (read from the SonarCloud API for this entry, as are #1879's figures below). #1879: `HEAD^{tree}` equal to `dev`'s at `96955e7d`, and `git cherry origin/staging HEAD` lists no duplicate; the pre-push Docker E2E gate passed with 105 tests (3.2 min) on `8cd1d6ac` and again on the rebuilt tip `dcf70462`; SonarCloud's gate on its last analysis (2026-11-22 23:00 UTC) is OK, with 0 bugs, 0 vulnerabilities, 30 code smells and 95.2% coverage on new code; it was opened with the local Sonar PR-hook override, because the promotion adds no file of its own; the staging deployment was not checked by hand. #1878: docs only; on the tip rebased onto `24919413`, typecheck, lint and 9,025 unit tests across 772 files passed, and the pre-push Docker E2E gate passed on push.

### 2026-11-22: The deck price counts the deck you play, adding to another deck counts every zone, deleting a deck opens `/decks` without a flash, the share link draws the split curve, a dropped card at its copy limit says why, the update date hydrates cleanly, and the Collection switch stays in the List view

- The deck price total, the total without basic lands and the count of cards without a price now count the deck you play: the main deck and the command zone (commander and partner), as the shopping list already did. Sideboard and Considering rows are left out of them; their own group-heading subtotals (#1659) are unchanged. In its body's example, Sol Ring at $2 in the main deck, a $10 commander, a $5 Sideboard card and a $7 Considering card read $24 and now read $12. **A visible figure changes:** on a deck with Sideboard or Considering rows, the Deck Price panel's total, its "Without basic lands" line and its "cards without price" line, and the summary bar's total and missing count, are lower. A deck whose only cards are in Considering now hides the Deck Price panel, as an empty deck does, and its summary bar shows $0.00. The owner accepted the rule on 2026-11-22. **Existing test changed:** a characterization test pinned the old disagreement between this total and the deck statistics (83.25 against 33.25, plan row B2-40); this PR is the fix that row names, so the test now pins that both give 33.25. No total counts the companion (I-32, #1748).
- "Add to another deck…" (#1661) now counts a card's copies across the receiving deck's main deck and sideboard, plus a commander or partner of the same name, before it writes (CR 100.2a, CR 100.4a, CR 903.5b), with the exemptions the copy limit already applies: basic lands, "any number" cards, the capped multiples and a rulebreaker commander (CR 903.5e). Before, a Modern deck with 3 Lightning Bolt in Main and 1 in the Sideboard took a fifth, and a Commander deck took its own commander into the main deck. An add to Considering still counts that zone's row only, and the companion is not counted. A refused add shows the dialog's existing "already holds the most copies allowed" message. After an add, the deck list shows the receiving deck's new card count at once, read again from the server. **Existing test changed:** "writes a new row when only another zone holds the card" pinned the bug on a Commander deck; it keeps its intent on a Modern deck, and a new test pins the singleton refusal. A Commander deck with cards parked in its sideboard now refuses a second copy, which its body asks the owner to confirm (I-37, #1868).
- Deleting the open deck goes to `/decks` without the builder showing "Deck not found" on the way: the page marks itself as leaving before the store drops the deck, and shows "Deck deleted. Opening your decks…" meanwhile. A refused delete keeps the dialog's message and the deck, and a deck that goes away for another reason, such as a delete in another tab, still reads "Deck not found". English and French are written out; the eight dormant locales use the English wording (I-01, #1869).
- The share-link deck view draws the builder's mana curve: bars split into permanents and spells, the median with and without lands, the total mana value, and a mana value's cards on click, with nothing that edits the deck. Its bars now leave out the companion and Considering rows, as the builder's do. The share link now sends each card's type line, printed card text the public deck page already sends. **Existing tests changed:** two characterization tests pinned the old shared curve (B2-41); their curve assertions flip as those pins anticipated, and their Stats panel assertion stays pinned in its own test (I-37, #1870).
- A card dropped or pasted from a link (#1657) that its zone already holds at the copy limit adds nothing and says so: "Sol Ring is already at its copy limit for Commander. Nothing was added." The check uses the store's rule (CR 100.2a, CR 903.5b, CR 903.5e) and sums the zone's copies across printings. Before, nothing was added and nothing was said. English and French are written out; the eight dormant locales use the English wording (I-37, #1871).
- A deck's update date renders the same on the server and in the browser. **Choice, from its body:** the first render shows the update as a date ("Updated Nov 20, 2026"), which turns relative ("Updated 1 day ago"), on the viewer's clock, right after hydration; a render that is not a hydration shows the relative text at once. The hidden hydration warning is gone. The root layout gets no request-time `now`, so no page changes how it renders or caches (I-92, #1873).
- The "Collection" switch (#1665) shows only in the List view, where the Owned and Buy badges are; the Grid view, which shows no badge, has no switch. The hidden or shown choice is kept across view changes (I-37, #1874).
- Structural, no visible change: the opening-hand lands section and the Draw odds panel read one shared percentage format, one decimal in the reader's locale, instead of two copies (I-97, #1875).
- #1748: Reds observed (`expected 24 to be 12`, `expected 7 to be 2`, `expected 2 to be 1` and `expected { totalPrice: 7, …(3) } to deeply equal { totalPrice: +0, …(3) }`); its structural commit had no Red and ran green before the fix (15 files, 187 tests); on the tip rebased onto `dev` at `5ce05853`, 8,952 unit tests across 761 files passed; the builder was not replayed in a browser. #1868: Reds observed (`expected { kind: 'idle' } to deeply equal { kind: 'atLimit', deckName: 'Burn' }`, the commander's `expected { kind: 'idle' } to deeply equal { kind: 'atLimit', …(1) }`, and `expected 1 to be 2` for both count tests); the Mountains and Considering tests passed before and after, as guards; at `67f0c628`, 8,985 across 765 files; the dialog was not replayed in a browser. #1869: Red observed (`AssertionError: expected true to be false` at `page.delete-deck.test.tsx:137`, the "Deck not found" rendered on the way out); the two other page tests are guards; its own full run had two 5-second timeouts in ESLint meta-tests that passed alone; at `e554a99b`, 8,992 across 767 files; the real browser timing of the navigation was not checked. #1870: Red observed (`Unable to find an accessible element with the role "button" and name "Mana value 2: 1 permanent, 1 spell"`), then the two pinned curve tests failed as expected before they were flipped; its own full run had the same two ESLint meta-test timeouts, which passed alone; at `7f89e8cc`, 9,000 across 768 files; not seen in a browser. #1871: Reds observed (`expected "spy" to be called with arguments: [ 'info', …(1) ]`, `Number of calls: 0`, for the drop and then the paste against `dev`'s hook); the one-below-the-limit test is a boundary guard; at `20649a43`, 9,003 across 768 files; no real drop or paste in a browser. #1873: Reds observed (`Expected element to have text content: /^Updated Nov 20, 2026$/` and `/^Updated 1 day ago$/`, each `Received: Updated 22 hours ago`); the no-mismatch test passed while the warning was suppressed and failed without it (`Hydration failed because the server rendered text didn't match the client`); at `c47eb723`, 9,008 across 769 files; no real browser hydration. #1874: Red observed (`expected document not to contain element, found <button …>Collection</button>`); the toolbar and view-change tests were written after the fix; at `c47eb723`, 9,006 across 768 files; not seen in a browser. #1875: structural, no Red; the two components' 38 tests passed on the old code and again after, with 4 new tests on the shared format; at `cf03609f`, 9,015 across 770 files. For all eight, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI.

### 2026-11-22: The builder regains its keyboard quick-add palette, the import skips a `.dek` file's comments and resets its form only while it is open, and the owner answers D-34 and D-109

- Ctrl+K (⌘K on a Mac) or the toolbar's "Quick add" button opens a palette in the builder. It searches by card name, by a Commander role (an English or French word) or by rules text (Alt+R), shows the Scryfall query it runs (I-14), and adds with Enter to the main deck, Shift+Enter to the sideboard and Alt+Enter to Considering, staying open. The keyboard shortcut list shows it, and Ctrl+K pressed in the playtest does not open it. **Recovered:** #1620 built this palette on 2026-11-20, but it was merged into another PR's branch and never reached `dev`; #1867 brings its commit to `dev` with `git cherry-pick -x`, which keeps the original author. English and French are written out; the eight dormant locales use the English wording (I-37, #1867).
- A `.dek` file's XML comments are skipped, so a commented-out card is no longer imported. A comment over several lines keeps the line numbers after it; an unterminated comment hides the rest of the file, as in XML, and is listed among the unreadable lines; a file whose only cards are commented out is refused as not a `.dek` deck (I-62, #1877).
- Closing the import dialog no longer leaves its 200 ms form reset running after the dialog unmounts, and reopening it within those 200 ms shows an empty form at once, where the late reset used to wipe what the player had just typed. The stray timer had failed one full-suite gate of the coordinator's queue on 2026-11-22 with an unhandled error, although every test passed (#1876).
- Documentation: #1670 records the owner's answers of 2026-11-22. D-34: camera scanning leaves the non-goal list, conditionally, and I-40 moves to Next; its scanning slices still wait for the benchmark's go and D-10's written answers. D-109: a public deck list may hold other players' public decks, on the recommended rule. It also marks #1656 to #1665 done or partly done in the specs and answers I-32's price-zone question with the rule #1748 then applied. #1667 recorded the merges from #1652 to #1666 in this file and the progress tracker.
- **Owner actions.** No migration merged in the range: `git log 04bc2eb5..origin/dev -- prisma/migrations` is empty, and so is `0efe316f..origin/dev`. No PR body names a new environment variable, and the range adds no `process.env` read. D-34 leaves two owner actions open: confirm the accuracy thresholds of I-40 requirement 6.3, and photograph the benchmark set from the owner's own cards. #1868 asks the owner to confirm that a Commander deck's sideboard counts toward its copy limit, and #1748 leaves to the owner whether the price total should count the companion (CR 702.139a).
- #1867: the recovery's Red is the palette's absence from `dev` (`git ls-files` printed nothing for its files, and `git merge-base --is-ancestor 84968bd3 origin/dev` exited 1), with #1620's own Red quoted (`Failed to resolve import "@/lib/search/quick-add-query"`); the playtest and shortcut-list guards passed when written and were seen failing by mutation (`expected document not to contain element` and `Unable to find an element with the text: Open quick add.`); the page smoke has no separate Red, and the 22 recovered tests passed unchanged; at `21e1fdfa`, 8,978 unit tests across 765 files passed; no real browser run, Safari's ⌘K was not checked, and no E2E spec covers the palette. #1877: Red observed (the reader returned `4 Lightning Bolt` from a comment), and the five later tests each failed against `dev`'s reader (6 failed); its own full run had 7 failures in two slow builder-page files that never reach the reader, which passed alone (49); at `ec4504c6`, 9,025 across 772 files; no real `.dek` file in a browser. #1876: Reds observed (`expected 1 to be +0` for the timer left after unmount, `Expected: "" Received: "1 Arcane Signet"` on a quick reopen, and `Expected: "1 Sol Ring" Received: ""` for the wiped text); the closing test passed before the fix, as a guard; at `a013aabe`, 9,019 across 771 files, with no unhandled error; the closing animation was not watched in a browser. For all three, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI. #1670 and #1667: docs only. #1670 committed its three commits with `--no-verify`, because the `docs/product` files it touched are not Prettier-formatted on `dev`, and checked the path and anchor of every link it added; on its tip rebased onto `04bc2eb5`, typecheck, lint and 8,945 unit tests across 760 files passed. #1667, on the tip rebased onto `0efe316f`, passed typecheck, lint and 8,945 unit tests across 760 files. Both passed the pre-push Docker E2E gate on push. No migration and no new environment variable.

### 2026-11-21: The deck editor gains a summary bar, takes a card dropped or pasted from Scryfall or EDHREC, adds a row's card to the collection or another deck, hides the collection badges, deletes the open deck, and shows a deck's dates

- Under the builder's three panels, a "Deck summary" bar shows the deck's count with its size state ("100/100"), its format with the bracket the bracket panel shows (a manual bracket reads "set by you", and a format with no bracket scoring shows only its name), the deck's price with the number of cards that have none, and its cards counted by type. Each card counts once, under the first type of its front face in the order land, creature, planeswalker, battle, artifact, enchantment, instant, sorcery (CR 205.2a, CR 712.8a), so the type counts add up to the card count; the sideboard and Considering are not counted. Below the `lg` width the type counts sit behind a "Types" button. The price reads "USD 412.50", the Deck Price panel's format. A deck not yet loaded, or missing, shows no bar. English and French are written out; the eight dormant locales use the English wording (I-37, #1656).
- Dropping a card's link on the builder, or pasting it outside a text field, adds that card to the zone the editor shows, through the builder's own add with its copy limit and its undo. It reads a Scryfall card page as that printing, a Scryfall image or API address, an EDHREC card page, or one line of text of up to 200 characters as an exact card name, and looks the card up through the existing Scryfall client, never at the dropped address. A message names the card found, so a wrong match shows and can be undone; a link from another site, a failed lookup and a dropped file each get their own message, and the browser never opens a dropped link. While a drag from outside is over the window, the page says where the card will go. Dropping and pasting are off while a dialog is open. **Limits, from its body:** only `https:` addresses on Scryfall's and EDHREC's hosts are read, and a payload over 10 KB is dropped unread; Moxfield links and images, Archidekt addresses that carry no Scryfall id, a drop on a chosen zone tab and several cards in one drop are not covered, and there is no touch-screen path yet. #1666 then gave the roadmap line its own slice, I-37 slice 25 (I-37, #1657).
- Each List-view deck row has a "More actions" menu for a signed-in player. "Add to my collection" records one copy of the row's printing, and the row's Owned or Buy badge follows at once. "Add to another deck…" opens a picker of the player's other decks, most recently updated first, with a name filter and a Main, Sideboard or Considering choice (Main by default). It writes one copy to that deck against the version it read, tries once more after a conflicting save, and writes nothing when that zone's row already holds the most copies allowed (CR 903.5b, CR 100.2a), saying so. The open deck is never written, and opening the other deck afterwards shows the card. A guest sees no menu. The picker lists at most the 50 most recently updated decks and says when there are more. No migration and no new route (I-37, #1661).
- A "Collection" switch at the right end of the deck list's toolbar hides or shows the Owned and Buy badges on deck rows, in every zone. **Setting:** the choice is kept in this browser (`localStorage`, key `magic-ai-builder-deck-rows`) and starts on, which is the behaviour before this change; a stored value that cannot be read counts as on. The switch shows only while the collection holds cards. No server preference and no migration (I-37, #1665).
- The builder's title bar has a "Delete deck" button. It asks "Delete <name>? This cannot be undone.", with the focus on Cancel; Delete goes through the existing owner-only delete, then opens `/decks` with a message that the deck was deleted. Delete waits while a save is on its way and cannot be sent twice, and a refused delete keeps the dialog open with a message and the deck intact. The guest deck has no button (I-01, #1662).
- The builder's Deck details and a public deck's page show when the deck was created and last updated, for example "Created Mar 3, 2026 · Updated 2 days ago". The update reads as relative up to 30 days old, then as a date. Each date is the stored one, in a `<time>` element titled with its full date and time, and a missing date is left out, never guessed. A public deck's data now carries the two dates and no other new field, and a fork keeps its own dates (I-92, #1663).
- #1656: Reds observed (`Failed to resolve import "./DeckSummaryBar"` and `"./deck-type-counts"`, then 7 failing on the bar, among them `Unable to find an element with the text: 100/100.`, and the page's `Unable to find an accessible element with the role "region" and name "Deck summary"`); the add-a-card test and the French test passed on their first run and stay as guards, and two page tests that count the "x/100" counters now expect 3; on the tip rebased onto `dev` at `dcf10466`, 8,712 unit tests across 739 files passed; not seen in a browser at 360 pixels or at desktop width. #1657: Reds observed (10 failed | 3 passed on the mounted target, among them `expected [] to have a length of 1 but got +0`, and 23 failed | 4 passed on the payload reader); the three that passed are "nothing happens" guards; at `7f2343ba`, 8,752 across 741 files; not tried in a real browser, and jsdom has no `DataTransfer`, so the tests pass stand-in transfer objects. #1661: Reds observed (`Failed to resolve import "@/lib/deck/add-to-other-deck"` and `"@/hooks/useAddToOtherDeck"`, the retry's `expected "spy" to be called 2 times, but got 1 times`, the reopen's `expected [ 'Sol Ring' ] to deeply equal [ 'Sol Ring', 'Smothering Tithe' ]`, and `Unable to find an accessible element with the role "button" and name "More actions for Smothering Tithe"`); 34 tests added; at `685dec21`, 8,876 across 753 files; the menu and the dialog were not seen in a browser. #1665: Red observed (`Unable to find an accessible element with the role "button" and name "Collection"`); tests 2 to 8 passed on their first run, and three deliberate breaks of the code were each caught; at `a698b7ca`, 8,945 across 760 files; not seen in a browser. #1662: Reds observed, one at a time (`Failed to resolve import "./DeleteDeckButton"`, then Cancel, `Unable to find role="alert"`, the guest deck, the two waiting labels and the prefetch); the Escape and French tests passed on their first run; at `7d8375cf`, 8,885 across 754 files; the browser journey was not run, and the E2E gate has no journey for this button. #1663: Reds observed (`Unable to find an element with the text: 2 days ago.`, the panel's `/^Created/` and `/^Updated/`, `expected 2026-03-03T09:00:00.000Z to be '2026-03-03T09:00:00.000Z'`, and the route test against the old public field list); the dates line had no Red of its own, and two deliberate breaks failed 3 of its 11 tests; its first full run had 5 failures in one test fixture without the two dates, fixed before the rebase; at `454b14d5`, 8,903 across 755 files; not seen in a browser. For all six, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI.

### 2026-11-21: The curve splits permanents from spells, Draw odds counts the lands of an opening hand, deck-list groups show their price, the import reads decklist files, and the roadmap gains I-116

- In the statistics column, each bar of the mana curve stacks its permanents, solid, under its spells, striped, and is named in words ("Mana value 3: 7 permanents, 5 spells"); a card counts by its front face (CR 110.4, CR 712.8a), and a legend names both parts. The header adds the median, without and with lands counted at 0 ("Median 3, or 2 with lands", CR 202.3a), and the total mana value (CR 202.3). Activating a bar lists its cards with their count, the split and the colours; Escape or a second activation closes the list, and an empty bar cannot be opened. English and French are written out; the eight dormant locales use the English wording (I-37, #1658).
- The Draw odds panel gains "Lands in the opening hand": the average lands in an opening seven ("2.5 lands on average in an opening seven"), the chance of exactly 0 to 7 lands, and the chance of N lands by turn N for turns 1 to 7 under the panel's draw rule (CR 103.8a, CR 103.8c), in tables with header cells. The figures are exact counts, not a random sample, and follow every deck edit. They count the main deck's lands with no mulligan, ramp or colour, and say so; an empty library, a deck without lands or a library under seven cards gets a sentence instead of a table of zeros (I-97, #1664).
- Each group heading of the deck list shows its price subtotal ("· USD 142.10") under every grouping: none, type, mana value and colour. A partly priced group shows its known subtotal and how many cards have no price, and a group with no price says so instead of showing $0. The Deck Price panel adds "Without basic lands USD 403.50" under the total when the deck holds a basic land (CR 205.4c: Snow-Covered Forest is basic, Dryad Arbor is not). Sideboard and Considering have no group headings, so no subtotal. **Note:** the deck total, and the new total without basic lands, count every row of the deck, Sideboard and Considering included, while the price hook's own comment says the main deck and the command zone; #1666 recorded the zones as an I-32 open question, and no code changed (I-32 slice 3, category part, #1659).
- The import dialog's text tab has an "Import from files…" button that reads `.txt`, MTGO `.dek` and `.csv` decklist files into the text box, where Preview works as it does for pasted text. A `.dek` file's sideboard cards go under a Sideboard heading and no card is guessed to be the commander; a `.csv` file needs a header with a quantity and a name column, and may have a board column. The status line names each file, how it was read and its line count, says when the files replaced what the box held, and lists each unreadable line with its file and line number. **Limits, from its body:** at most 10 files and 1 MB a file, refused before reading, and at most 500 lines once joined, the import's existing limit, now stated instead of cutting the list silently; any other file type is refused by name. The files are read in the browser and never uploaded or stored (I-62 slice 1, #1660).
- Documentation: #1666, the twentieth roadmap pass, recorded what Moxfield's new deck editor offers that the product lacks, after the owner sent a public Moxfield deck and asked for its features. It adds I-116, public deck lists that one player curates, behind owner decision D-109, puts 17 dated scope lines and 3 boundary lines in 11 existing specs, and corrects the I-37 citation of the card-drop line to slice 25. #1652 recorded the merges from #1641 to #1651 in this file and the progress tracker.
- **Owner actions.** No migration merged in the range: `git log dcf10466..origin/dev -- prisma/migrations` is empty. No PR body names a new environment variable, and the range adds no `process.env` read. D-109, added by #1666, waits on the owner: may a public deck list hold other players' public decks, and on which rule. #1666 also leaves to the owner which zones the deck price total counts (the I-32 open question above).
- #1658: Reds observed (`Unable to find an accessible element with the role "button" and name "Mana value 3: 2 permanents, 1 spell"`, `Failed to resolve import "./curve-breakdown"`, `TypeError: (0 , curveMedians) is not a function`, and the header's `Unable to find an element with the text: Median 3, or 2 with lands`); six tests passed on their first run, and three of its own new expectations were corrected before Green; at `59208d5c`, 8,780 unit tests across 743 files passed; the stacked bars were not seen in a browser. #1664: Reds observed (`Failed to resolve import "./opening-hand-lands"`, the spread's and the land drops' `TypeError: Cannot read properties of undefined (reading 'map')`, the gaps' `expected { kind: 'known', …(3) } to deeply equal { kind: 'unknown', reason: 'no-lands' }`, and `Unable to find an accessible element with the role "region" and name "Lands in the opening hand"`); the short-library test and ten panel tests passed on their first run; the reference figures were computed once with exact fractions; at `a618337e`, 8,925 across 757 files; not seen in a browser. #1659: Reds observed (the heading's `Expected element to have text content: USD 142.10 Received: Creatures30`, and 3 failing on the panel's `Unable to find an element with the text: Without basic lands.`); the pure price tests had no separate Red, and the other heading, component and hook tests passed on their first run; at `fcb8ebdd`, 8,807 across 746 files; not seen in a browser. #1660: one focused Red (`Unable to find a label with the text of: Decklist files`); the later tests passed on their first run and none was seen failing; at `fc343fc9`, 8,842 across 748 files; no real file chooser and no real MTGO or Moxfield export, the fixtures being hand-written. For all four, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI. #1666 and #1652: docs only. #1666 resolved its 60 added link targets with none missing and committed three of its four commits with `--no-verify` to keep each diff to the pass's own lines; on the tip rebased onto `b0a7fe20`, typecheck, lint and 8,945 unit tests across 760 files passed. #1652, on the tip rebased onto `33125e1b`, passed typecheck, lint and 8,684 unit tests across 737 files. Both passed the pre-push Docker E2E gate on push. No migration and no new environment variable.

### 2026-11-21: The playtest deals chosen cards into the opening hand, the Game Changers page adds a card to the open deck, a deck lists its game pieces, and a registration sheet prints

- On the playtest's start screen, "Start with these cards" lets the player choose up to seven copies from the main deck, with a search box and one checkbox per copy ("Lightning Bolt (copy 2 of 4)"). The opening hand holds the chosen cards and the shuffle fills the rest of the seven, and the first line of the action log names them. A commander, a sideboard card or a card under consideration cannot be chosen. A mulligan still shuffles the whole hand back and draws seven (CR 103.5), so only the first hand is chosen, and Restart deals the same chosen cards again. A game dealt with chosen cards is not saved as a playtest session, because its opening hand is not a random deal, and the record bar says why. With no chosen card, every seeded deal is the same as before. English and French are written out; the eight dormant locales use the English wording (I-07, #1651).
- The zoom on the Game Changers and banlist pages offers "Add to <deck>" for the deck open in this session, a signed-in player's deck or the guest deck. It adds one copy to the main deck through the builder's own add, under its copy limit and with its save, rollback and failure toast. The button reads "Added to <deck>" only when the deck's count rose, and the deck's count of the card shows beside it ("In <deck>", or "2 in <deck>"). With no open deck, the zoom says "Open a deck in the builder to add cards from here." instead (I-37, #1650).
- The builder's token library lists the game pieces a deck needs beside its tokens: the monarch, the initiative and Undercity, dungeons, the Ring, day and night, the city's blessing, and energy, experience and poison counters, each read from Oracle text with reminder text removed and listed with its cards. The panel now shows for a deck that needs a piece but no token, and Copy and Download add the pieces under their own heading. An emblem is named after the card that gives it ("Elspeth, Sun's Champion Emblem") instead of a bare "Emblem", in the panel and in the playtest's token picker (I-19, #1647).
- The export dialog prints a one-page, black-and-white decklist registration sheet, or downloads it as an `.html` file: blank lines for the player, the event, the date and a signature; the deck name and format; the commander and partner apart from the list, and a companion section when the deck has one; the main deck in alphabetical order as "count name" with its total; and a sideboard only in a format that allows one. It prints no image and no price. A card under consideration, or a sideboard card in a format with no sideboard, is left out with a notice. **Note:** a companion that the player also stores as a sideboard row, in a format with a sideboard, prints twice, once under "Companion" and once in the sideboard; its body says this "matches a paper list, where the companion is one of the 15, but an organiser may want it once" (I-50, #1648).
- #1651: Reds observed (the deal's `"chosenInLibrary": 2` where 0 was expected, the seven-copy cap's `"eighthInLibrary": false` with the cap removed, `Failed to resolve import "./TrialCardsPicker"`, and the playtest's `Unable to find an accessible element with the role "group" and name "Start with these cards"`); the mulligan and reset tests passed on their first run and pin that behaviour; on the tip rebased onto `dev` at `68753f91`, 8,684 unit tests across 737 files passed; not seen in a browser. #1650: Red observed (`Unable to find an accessible element with the role "button" and name "Add to Atraxa Superfriends"`), and the eight later cases failed against `origin/dev`'s components (9 failed); a mutation of the "Added" rule was caught by two tests; at `977e7a65`, 8,663 across 736 files; not seen in a browser at desktop or mobile widths. #1647: Reds observed (`Failed to resolve import "./game-pieces"`, 13 failing with only the monarch pattern in place, `expected [ { name: 'Emblem', …(4) } ]`, and `Unable to find an element with the text: Game pieces.`); one expectation now reads "Garruk Emblem", the requested change; at `01285c0b`, 8,633 across 734 files; no browser check, and the fixtures' card texts are written from Oracle text, not fetched. #1648: Red observed (`TypeError: (0 , registrationSheetExport) is not a function`), three tests that passed on their first run failed under three deliberate breaks of the exporter, and the dialog's Red had 4 failing (`Unable to find an accessible element with the role "button" and name "Print registration sheet"`); at `e32b824b`, 8,642 across 736 files; no real print dialog, and the one-page fit on A4 and Letter is computed from the CSS, not printed. For all four, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI.

### 2026-11-21: The library finds the decks that run or leave out a card, a public deck lists the forks it inspired, Settings → Account downloads a player's data, and the acquisition plan reads proxy and buy-later choices

- On `/decks`, two fields beside the search, "Has the card" and "Leaves out", find the player's decks that run a card, or leave it out, across the whole library and not only the first page loaded, through a new owner-only `GET /api/decks/search`. A deck runs a card when its main deck or command zone holds it; a card under consideration, in the sideboard or as a companion does not count. A name matches whole, in any case, or as the front face of a double-faced card. Two names mean both. The folder filter, the name search and the sort still apply on top. At most the 50 most recently edited decks come back, and the page says when there are more; a failed search keeps the library on screen with a retry. English and French are written out; the eight dormant locales use the English wording (I-01, #1644).
- A public deck's page reads "Inspiration for N decks" beside its "Forked from" credit, or in its place on an original deck, and lists up to ten of its public forks, newest first, each linked to its page with its author, then "and N more". Private forks and forks of a fork are left out, a deck nobody forked publicly shows no line, and the page still renders when the read fails. **Note:** its body names an index on `Deck.forkedFromDeckId` as a follow-up, if the fork query shows up in the slow-query logs; no migration shipped (I-08, #1645).
- Settings → Account (`/settings/account`), linked from the user menu as "Account", has a "Download my data" button that saves the account archive #1595 built, free and with no request to a person. While the archive is prepared, the button is busy and the page says so. The archive is limited to one export an hour, and a second press within the hour says when the player can download again; any other failure shows a message and a retry. The page is not indexed, and a signed-out visitor goes to sign-in. This is the export half of the slice: the deletion half waits on re-authentication (I-61 slice 3), and the page only says that account deletion will arrive there (I-38 slice 5, #1646).
- The collection page's acquisition plan reads each deck's "proxy now" and "buy later" choices from its shopping list, as the shopping list already did. Those copies leave the copies to buy, the price total and the CSV, and a "Deferred · N copies" group lists them as "Proxy for now — <deck>" or "Buy later — <deck>". Owned copies cover the decks with no choice first, and no copy is counted twice (I-06, #1649).
- **Owner actions.** No migration merged in the range: `git log 5a22b2a0..origin/dev -- prisma/migrations` is empty. No PR body names a new environment variable; the one `process.env` read the range adds is the optional database URL of #1645's Prisma contract test, which an older contract test already reads. #1645's index on `Deck.forkedFromDeckId` is a follow-up, not an owner action. Two checks are left to a person: #1648's body asks for the `v1` registration sheet to be printed on A4 and Letter paper, and #1647's body leaves to the owner whether the "Token library" title should change now that the panel also lists game pieces.
- #1644: Red observed (`Cannot find module './route'`), then 7 failing on the page (`Unable to find an accessible element with the role "group" and name "home.cardFilter.includeLabel"`); removing the zone rule by hand failed two route tests; its first full run had 2 failures, a missing route-policy row, added before the second run; on the tip rebased onto `dev` at `c1d54bd9`, 8,577 unit tests across 729 files passed; the database matching was checked once against a local PostgreSQL 16 with a read-only probe, the route tests run on an in-memory fake, and the layout at mobile width was not checked. #1645: Reds observed (the missing in-memory fork store, `Unable to find an accessible element with the role "list" and name "Inspiration for 3 decks"`, and the page's `expected undefined to deeply equal { …(2) }`); its Prisma contract passed 5 of 5 on a throwaway PostgreSQL 16 database; at `ac3119ae`, 8,591 across 731 files; no browser run, and the focus outline is asserted by class only. #1646: Reds observed (`Failed to resolve import "./AccountDataSection"`, and the menu's `Unable to find an accessible element with the role "link" and name "Account"`); the rate-limit and failure tests passed on their first run and failed when the two branches were broken by hand (4 failed | 5 passed); at `0c151c40`, 8,604 across 733 files; the page, the saved file and the sign-in redirect were not checked in a browser. #1649: Reds observed (`"acquireQuantity": 0` expected where 1 was received, the owned-copy order, the route's `TypeError: Cannot read properties of undefined (reading '0')`, and `Unable to find role="region" and name "Deferred · 3 copies"`); at `8860f49b`, 8,654 across 736 files; no browser replay. For all four, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI.

### 2026-11-20: The playtest answers keys and lists them in a cheat sheet, and a deck lists what stands between it and its target bracket

- The playtest answers keys: D draws, N goes to the next turn, S shuffles the library and U untaps every permanent; with a hand card or a permanent focused, G, E, B and H move it to the graveyard, exile, the battlefield or the hand; Ctrl/⌘+Z undoes the game's last step. Each key sends the command its button sends, so it writes one log line and is one undo step. Shuffling the library is new, with its own "Library shuffled" line (CR 701.24a). `?` or a new "Keys" button in the playtest's header opens a cheat sheet built from the same table. No key fires while the player types in a field, and the single-key switch turns the letters off while Ctrl/⌘+Z stays on. **Fix:** a key pressed inside the playtest reached the builder behind it, so Ctrl+Z undid the deck while the player was in a game, Ctrl+S saved it, `/` focused the builder's search and `?` opened the builder's shortcut list. The playtest's key presses now stop at the playtest. The header's first focus moves from Close to Keys (I-07, #1642).
- Under the target bracket picker, a "To reach Bracket N" list names what stands between a deck and a target below its estimate: first the official floors in the way, with their cards and, for Game Changers, the most the target allows; then each heuristic term above the target, with the count at which it would read lower, or that no single count does. At or above the estimate it reads "No official rule stops this deck at Bracket N."; a Bracket 5 target says that a list cannot show cEDH intent; when combo data is unavailable, two-card combos read "not checked"; and a list under 60 cards gets the floors only (I-77 slice 4, #1643).
- Documentation: #1641 recorded the merges from #1623 to #1640 in this file and the progress tracker.
- #1642: Reds observed (the engine's `TypeError: Cannot read properties of undefined (reading 'map')`, 4 failing; through the real playtest over the builder's real shortcuts, 11 failed | 5 passed, among them `expected "spy" to not be called at all, but actually been called 1 times` for the deck's undo and save; the cheat sheet's, taken by removing its mount line, 5 failing); on the tip rebased onto `dev` at `5a22b2a0`, 8,493 unit tests across 723 files passed; jsdom only, so the listener order in the real app, IME composition, macOS ⌘ on hardware and a screen reader on the cheat sheet were not checked, and no Playwright journey covers the keys yet. #1643: Reds observed, one at a time (`Failed to resolve import "@/lib/deck/path-to-bracket"`, the term bounds, `noRuleStops`, the floors, and `Unable to find an accessible element with the role "region" and name "To reach Bracket 2"`); three tests passed on their first run and stay as pins; at `c1352de6`, 8,542 across 725 files; not seen in a browser or at 360 pixels. For both, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI. #1641: docs only; on the tip rebased onto `a764fca0`, typecheck, lint and 8,458 unit tests across 719 files passed, and the pre-push Docker E2E gate passed on push. No migration and no new environment variable.

### 2026-11-20: Two slow first tests load what they need before they are timed, and the roadmap gains I-108 to I-115

- Two unit tests that timed out under a loaded full run now load what they need before any test is timed, with no behaviour change. The header tests load the lazy deck-actions chunk once in `beforeAll`, so the first wait for the New Deck and Import buttons fell from 467–631 ms to 92–121 ms of `findByRole`'s one-second window (#1626). The test-hygiene lint tests load the ESLint configuration once in `beforeAll`, so their first test fell from about 1.2 s to 12–17 ms of its 5-second timeout (#1640).
- Documentation: the nineteenth roadmap pass adds I-108 to I-115, each with its spec: decks built for someone else, build requests anyone can answer, a Commander cube the product can check, a deck from a drafted or opened pool, singles or packs, a project across a player's own decks, a deck's place in the roster, and cards to get signed (#1639); #1625 recorded the merges from #1605 to #1622 in this file and the progress tracker.
- #1626 and #1640: test only; no deterministic Red, as each body says, because the failure depends on load. The evidence is the recorded failure (`Unable to find role="button" and name /import/i` at `3e94c321` for #1626; two 5-second timeouts in the full runs of the I-60 slice 2 and I-67 slice 1 workers for #1640) and the timing tables. Each file passed 3 runs in a row alone (13 and 15 tests). On the tips rebased onto `dev`, typecheck, lint and the unit suite passed: 8,178 tests across 696 files at `5a1b9802` (#1626) and 8,458 across 719 files at `84ecebe4` (#1640); the pre-push Docker E2E gate passed on push for both, and neither body mentions Sonar. Not verified: a loaded full run reproducing either timeout on demand. #1639: docs only; Prettier clean on the eight new spec files; 324 links on added lines resolved, one pre-existing anchor excepted; three commits used `--no-verify` so that unformatted `docs/product` files changed only by the pass's additions; on the tip rebased onto `fc4178e8`, typecheck, lint and 8,458 unit tests across 719 files passed, and the pre-push Docker E2E gate passed on push; Sonar is not mentioned. #1625: docs only; on the tip rebased onto `f9d779b2`, typecheck, lint and 8,178 unit tests across 696 files passed, and the pre-push Docker E2E gate passed on push. No migration and no new environment variable.

### 2026-11-20: An Archidekt deck fills at most two command slots, the wizard keeps a deck it could not save, a snapshot counts copies, sign-in and toasts are accessible, the deck card's buttons leave its link, borders meet 3:1, draw odds name what they cannot answer, and monitoring URLs drop private segments

- An Archidekt deck with three or more cards in its Commander category imports the first as the commander, the second as the partner and the rest as main-deck cards, as a Moxfield, AetherHub or MTGTop8 import already did. Before, every card after the first imported as a partner (#1623).
- When the deck wizard has built a deck but the server cannot save it, the player stays on the building screen with "Your deck was built, but it could not be saved", and "Try saving again" saves the same deck without a new AI build. Before, the player was dropped back on the plan with no message and the built deck was lost, so the only way on was a new build. A failure after the deck exists is still not retried, so no second deck is created. English and French are written out; the eight dormant locales use the English wording (#1624).
- A snapshot counts card copies, as the deck list does: a 100-card Commander deck with 30 Forests in one row reads "100 cards" in its history, not "71 cards". Snapshots saved before the fix read their copies from their stored card list, with no migration and no backfill. The diff badge compares copies with copies and is absent on an unchanged deck, and both labels are plural messages in English and French. The account export carries the same copies. **Owner note:** `schemaVersion` stays 1, because the field's type does not change; #1628's body flags this so the owner can overrule it, since the export contract says the version moves when a field "changes meaning" (#1628).
- Sign-in and sign-up fields declare their autocomplete purpose, a sign-in or sign-up failure is announced as an alert, and toasts stay readable: an error toast stays until the player dismisses it and is announced assertively, and any other toast stays 8 seconds and does not close while hovered or focused. **Owner note:** 8 seconds is a proposed default, its body says, set in one place, `TOAST_READING_TIME_MS`. Error toasts now sit nearest the bottom-right corner, below the other toasts, instead of in arrival order (I-04 slice 14, #1632).
- On `/decks`, the deck card's Duplicate and Delete buttons sit beside its link instead of inside it, at 28 by 28 pixels. The link is named after the deck, and a click elsewhere on the card still opens the builder. On a screen that cannot hover, the two buttons are always shown (I-04 slice 15, #1633).
- Borders across the app meet 3:1 against every surface in both themes, a visible change: the dark `--border` moves from `#443a5e` to `#8272a8` and the light one from `#e4dcf2` to `#8b80a6`, so every bordered input, button, card and panel stands out more, and the dark scrollbar thumb, drawn with the same token, is more visible too. Eleven elements that used the accent fill as their text colour now use `--accent-text` (I-13 slice 1, #1634).
- The draw odds panel says "At least 100 is more than the 7 cards drawn." for a minimum above the cards drawn, and "No land is counted in the main deck." for the lands question in a deck without lands, instead of a "0.0%" that read as a measured chance. The failure, empty and guest scenarios are pinned by tests (I-97 slice 2, #1637).
- The URLs sent to error and performance monitoring no longer carry share tokens, usernames or query strings, on the client, the server and the edge. Monitoring now groups share and profile pages under their route templates. The body names no owner check of the dashboards (I-39 slice 4, #1638).
- **Owner actions.** No migration merged in the range: `git log e69dabb8..origin/dev -- prisma/migrations` is empty. No PR body names a new environment variable. Two defaults await the owner's word: #1628 keeps the account export at `schemaVersion: 1`, and #1632 keeps a toast 8 seconds. #1634's stronger borders were not looked at in a browser; its body leaves that visual check to the owner or QA on `staging`.
- #1623: Red observed (`"isPartner": true` where `false` was expected, 2 failed | 3 passed), and the parity test failed with the fix reverted (3 failed | 3 passed); on the tip rebased onto `dev` at `e69dabb8`, 8,173 unit tests across 696 files passed; no live Archidekt request and no import through the UI. #1624: Red observed, 5 failing (`Unable to find role="button" and name "Try saving again"`); at `01822680`, 8,178 across 696 files; no real browser or database, and the message was not checked visually; its body records that the retry carries no idempotency key, so a lost response after a successful save would create a second deck. #1628: Reds observed (`expected 71 to be 100`, the export's `expected 32, received 4`, `Unable to find an element with the text: 100 cards`); four existing expectations that pinned the row count were flipped, none deleted; the first push failed the Docker gate on `e2e/deck-snapshots.spec.ts`, which expected `-1 cards`, and the spec now expects the singular; at `1935bca3`, 8,227 across 698 files; the history now reads every snapshot's card list on the server, about 59 KiB per Commander snapshot; no real browser and no real PostgreSQL. #1632: Reds observed (`autocomplete` `Received: null`, `Unable to find role="alert"`, `expected [] to deeply equal [ 'Save failed' ]`); at `c764ce57`, 8,282 across 704 files; no real screen reader, password manager or browser. #1633: Reds observed (the accessible name `Test Deck commander No commander yet 0 / 100 cards 1/2/2026 B3` where `Test Deck` was expected, no `size-7` class, and the two navigation tests failing against the old component); at `79bd3837`, 8,352 across 709 files; the hit area, the visibility and the size were not checked in a real browser, and the stretched link now covers the bracket badge's tooltip. #1634: Reds observed, 8 failing (`--border (#443a5e) on --surface (#261f38) is 1.51:1`), and the scan listing eleven files; at `fa95cf6c`, 8,370 across 710 files; no screenshots, as no dev server was allowed. #1637: Red observed, 5 failing (`Expected element to have text content: At least 100 is more than the 7 cards drawn. Received: 0.0%`), with 22 characterization tests passing; at `6edaadbc`, 8,426 across 715 files; not replayed in a browser. #1638: Reds observed, from a missing module to `expected '/fr/share/abc123' to be '/fr/share/[token]'`; at `69493c80`, 8,458 across 719 files; no real event was sent to either service, and its body lists as follow-ups the URL text the change does not reach. For all eight, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI.

### 2026-11-20: The playtest tracks designations and player counters, `/stats` shows a player's own statistics, a Theme panel counts cards on the owner's handles, primer card mentions link to the deck's cards, and a reader streams Scryfall's bulk files

- The playtest lets the player set the monarch, the initiative, the Ring's temptations, day and night, the city's blessing, and poison, energy and experience counters, in a panel below the commander-damage tally in every format. Each change is one undo step and one action-log line and leaves the life total alone; ten poison counters show the loss (CR 104.3d, 704.5c). The player sets them and the engine infers nothing from Oracle text; they are not saved with a recorded session yet (I-07, #1627).
- A signed-in player sees their own statistics on `/stats`, served by `GET /api/user/stats?year=`: colours, colour identities, commanders and partner pairs, the most used cards, cards shared across decks, brackets estimated beside their target, decks added and changed, and active decks per format. Each is a captioned table that reads "N of M decks" and links the decks behind each row, and a year picker goes back to the account's first year. The page is private and not indexed, with no ranking against other players and no money figure; the bracket estimate does not check two-card combos and says so. The user menu links to it (I-60 slice 2, #1629).
- The builder's deck details have a Theme panel. The player names one to three handles, such as the creature type Dragon or a first letter, and reads how many cards are on theme, each under the handle it matched, with the others under their category and "no handle matches". Basic lands stay out until the player counts them, and the commander and partner come first. The theme lives in the panel for the session and is not saved with the deck yet; the panel sends nothing, so a guest deck works the same way (I-102 slice 3, #1630).
- A `[[Card]]` mention in a primer links to that card of the deck on Scryfall, with a preview on hover and on keyboard focus that Escape closes, on the public page and in the editor's preview. A name the deck does not hold stays plain text, and the editor's preview lists it under "Not in this deck" (I-36 slice 6, #1631).
- `src/lib/card-data/` reads Scryfall's bulk-data index and streams the Oracle Cards, Default Cards and Rulings files line by line, with line guards, a SHA-256 of the bytes received and a report per file. A file that is not newer, or has the same hash, is skipped, and a 429 ends the run. It writes nothing, and nothing imports it yet: the loader is slice 2 (I-67 slice 1, #1636).
- #1627: Reds observed (`TypeError: Cannot read properties of undefined (reading 'poison')`, then the panel's `Unable to find an accessible element with the role "region" and name "Player counters and designations"`); on the tip rebased onto `dev` at `95671af1`, 8,212 unit tests across 698 files passed; no screenshot at desktop or mobile widths. #1629: Reds observed (`Cannot find module './route'`, `Failed to resolve import "./PlayerStatsView"`, and robots for `/stats` in three locales); its first full run had 1 failure, the test-hygiene lint timeout under load that #1640 fixes, which passed 15 of 15 alone; at `93991ccd`, 8,250 across 702 files; not opened in a browser, and the Prisma queries were not run against PostgreSQL. #1630: Reds observed (`Failed to resolve import "./ThemePanel"`, then the mount's `Unable to find an accessible element with the role "button" and name "Theme"`); the basic-lands and wording tests were shown to fail with a temporary change, then reverted; at `c764ce57`, 8,278 across 704 files; the 360-pixel stacking was not checked in a browser. #1631: Reds observed, 10 failing in the parser (`expected 'Keep [[Sol Ring|C21]] up' to be 'Keep Sol Ring up'`), then a missing module and both renderers; its first full run, on a base without #1626, had 1 failure, the `Header.test.tsx` Import test under load, which passed 13 of 13 three times alone; at `c764ce57`, 8,287 across 705 files; the preview's position was not checked in a browser. #1636: Reds observed (the missing `./bulk-stream`, `./read-bulk-file` and `./read-bulk-run` modules); its first full run had 1 failure, the test-hygiene lint timeout, which passed 15 of 15 alone; at `7f86d9d1`, 8,410 across 715 files; the real Default Cards file was not downloaded through the adapter. For all five, typecheck and lint passed on the rebased tip and the pre-push Docker E2E gate passed on push, with no `SKIP_E2E`; Sonar was not run locally and was left to CI. No migration and no new environment variable.

### 2026-11-20: Two flaky tests wait for their outcome, SonarCloud's findings on the promoted code are cleared, `dev` is promoted to `staging` and `main`, and the roadmap glance is refreshed

- Two unit tests that failed under a loaded full run now wait for the outcome they check. The public deck's save test waits for the "Saved deck" button instead of reading it right after the request, and the header's Import test waits for the created deck to be activated. Each now answers 30 ms late on purpose, which made the old assertions fail every time (#1622).
- Five SonarCloud findings on the code promoted from `dev` are cleared, with no behaviour change. Two guards keep refusing `NaN`, which the rule's suggested `x <= 0` would have let through; Deck Lab's oracle reader strips reminder text with a linear scan instead of a regular expression; the in-memory snapshot store no longer returns the result of a function that returns nothing. Characterization tests came first (#1606).
- Promoted to `staging` (#1605) and `main` (#1607): the 61 commits after #1540 through #1606, each promotion branch built from its source rebased onto its target, with a tree equal to `dev`'s at `0ce607f2`. The staging QA cycle was skipped at the owner's request.
- Documentation: the roadmap glance table is refreshed from the slices merged on `dev`, with delivery-slice tables added to the specs of I-01, I-03, I-04, I-05, I-86, I-95, I-96 and I-97, and I-95 marked Shipped (#1621); #1604 recorded the merges from #1472 to #1603 in this file and the progress tracker.
- #1622: test only; Red observed with the race made certain and the old assertions kept (`Unable to find an accessible element with the role "button" and name "Saved deck"`, then `expected "spy" to be called with arguments: [ 'deck-123' ]`), the same lines the loaded runs had shown; the two files passed 3 runs in a row alone; on the tip rebased onto `dev` at `3e94c321`, typecheck, lint and 8,167 unit tests across 695 files passed, and the pre-push Docker E2E gate passed on push. Not verified: a loaded full run reproducing the original flake on demand. #1606: characterization tests written first and green on `dev`; with the plain `x <= 0` the rule suggests, both `NaN` tests failed (`AssertionError: expected function to throw an error, but it didn't`, `2 failed | 18 passed`); on the tip rebased onto `dev` at `0bb36644`, typecheck, lint and 7,976 unit tests across 679 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI for #1606, and #1622's body does not mention it. #1605 and #1607: `HEAD^{tree}` equal to `dev`'s at `0ce607f2`, and the pre-push Docker E2E gate passed with 105 tests (3.1 min) on each; SonarCloud's gate is OK on the analysis of `main` at `b59e7e48` (#1606) on 2026-11-20; the staging deployment was not checked by hand. #1621: docs only; its one check was Prettier on the 37 Markdown files it changed, and typecheck, lint, the unit suite, the E2E gate and Sonar were not run. No migration and no new environment variable.

### 2026-11-20: Search results keep the card art clear, the wizard names its budget per card, a deck can carry a private Rule 0 sheet, `/precons` lists dated precon lists, and the legality verdict dates a preview card

- The builder's search results keep the card art clear. A native zone picker, then a full-width add pill, covered every tile. The tile is now the card alone; on hover or keyboard focus, two small buttons appear on a soft gradient: **+** adds the card to the main deck, and **…** opens the zone menu, which names each zone with the cards already in it. A screen that cannot hover keeps the two buttons in the card's corner. An add shows a check and is announced, scrolling the results closes the menu, and list rows use the same two buttons (#1619).
- The deck wizard's budget choices say they are a cap per card. "< $50", "$50 – $200" and "$200 – $500" read as deck totals while the build route sends a maximum per card, and "No limit" now says there is no per-card cap. English and French are written out; the eight dormant locales use the English wording. The values sent are unchanged (I-02, #1614).
- A deck owner can keep one private Rule 0 sheet per deck, opened from Deck details: speed, win conditions, combos, extra turns, resource denial, proxy count and house rules, as the player declares them. Nothing is filled from the deck, another player or a guest gets no sheet, and there is no share control and no computed bracket yet. The sheet is stored in a new `RuleZeroSheet` table, served by `/api/decks/[id]/rule-zero`, and included in the account archive (I-15 slice 1, #1612).
- `/precons` is a public page that lists each stored precon version with its set, release day, source and card count, with no edit control and no price. A precon list is appended as a dated, printing-level version: a correction is the next version, and rewriting a version or skipping a number is refused. The page stays empty until I-67 slice 13 imports the first set (I-17 slice 1, #1618).
- `GET /api/decks/[id]/legality` names a card that is not legal only because its set is not out yet as a preview with its release day, instead of "not legal" alone. Scryfall's verdict stands, so the card and the deck stay not legal, and a reprint, a released card and an undated card stay `not_legal`. The editor's own warning is a later step (I-73 slice 2, #1610).
- **Owner actions.** One migration merged: `20261120120000_add_rule_zero_sheet` (#1612) creates the `RuleZeroSheet` table, one row per deck, with foreign keys to `User` and `Deck` that cascade on delete. It is additive and is the only migration in the range. #1612's body does not mention it and names no ordering constraint; the rule 0 route and the account export (`GET /api/user/export`) both read the table, so it must exist before that code serves requests. No new environment variable.
- #1619: Red observed against the native picker (`Unable to find an accessible element with the role "button" and name "Add Sol Ring to the main deck"`, 9 of 9 failing); 11 focused tests passed; the full suite (8,165 tests passed) ran on the earlier pill design and was not run again after the icon redesign; desktop screenshots only, none at 390 pixels. It merged by rebase as two commits whose subjects carry no PR number. #1614: Red observed (`Unable to find an accessible element with the role "button" and name "Budget < $50 per card"`); 8,033 unit tests passed; `pnpm arch` was not run again; the wizard was not opened in a signed-in browser. #1612: Red observed (`Failed to resolve import "./sheet"`); 8,069 unit tests passed; no browser was used. #1618: no Red was captured, its body says, because the module was already in the tree when its tests first ran; 8,047 unit tests passed; no browser was used. #1610: Red observed, 2 of 12 failing (`"reason": "not_legal"` where `"preview"` with `"releasesOn": "2027-04-09"` was expected); 8,039 unit tests across 680 files passed, and the pre-push Docker E2E gate passed with 105 tests; no live Scryfall call was made. None of the five names the `dev` tip of its full run. #1610 came from the roadmap automation; the four others came from cursor agents, were pushed with `SKIP_E2E=1` because their environment had no Docker, and #1612, #1614 and #1618 record that a red GitHub Actions check came from an exhausted quota. Sonar was left to CI (#1610, opened with `SONAR_GATE_OVERRIDE=1`) or not run, for all five.

### 2026-11-20: Roadmap slices with no screen yet: Spellbook's route facts, a seeded shuffle, a league's round allowance, typed suggestion claims, a rate limit declared for every route, the commitment index and pod forming

- A combo now carries the facts I-65's route map reads, from the same Commander Spellbook call: the zones each card starts in, the results Spellbook marks Standalone (none means an engine), the mana value it needs and Spellbook's own bracket tag. `comboResultKind` maps a Standalone result to an alternative win, combat, drain, mill, lock, extra turns or another result, and never throws; it was checked by hand against the 323 Standalone result names Spellbook listed on 2026-11-20 (I-65 slice 2, #1608).
- `shuffleWithSeed` deals a library from a recorded seed: the same seed gives the same order, and `Math.random` is never called. The test helper re-exports the same generator, so a replay and the probability bench cannot drift apart. A live game still shuffles with Web Crypto (I-21 slice 1, #1609).
- `checkRoundAllowance` checks a precon league's next list against the round's allowance: the swaps (six against a cap of five fail, with the six pairs named), the money spent on added cards in one market and one source, with carry-over, and the card pool. An unpriced card leaves the money part unknown, and the report does not pass (I-104 slice 1, #1611).
- Every suggestion and alternative from the copilot carries typed claims. The model's reason is one reasoned claim with no source, even when it cites a rule number. Mana value, price, Commander legality, colour identity (CR 903.5c, with a rulebreaker's exceptions, CR 903.5e), the Game Changers flag and a copy the deck already holds (CR 903.5b) are checked claims, each with its source and the time the card data was read; an unknown value gives no checked claim. The panel does not show the distinction yet (I-02 slice 1, #1613).
- Every API route declares a rate limit, and a test fails when a new route ships without one (I-05, #1615).
- `commitmentIndex` counts, for each printing, the copies a player owns, foil and non-foil together, and the copies their decks commit in the main deck and the command zone; Considering, the sideboard and a companion commit nothing. One owned copy used by three decks is free in none of them. No screen shows it yet (I-16 slice 4, #1616).
- `formPods` seats a casual Commander night's checked-in players in pods of the allowed sizes, or keeps a player waiting with a reason: a bracket outside every table's spread, a dedicated bracket, or a play-together group too large for any table. The same input gives the same pods, and a second round seats as few repeated pairs as it can (I-41 slice 1, #1617).
- #1608: Reds observed (`Failed to resolve import "@/modules/combos/domain/combo-result-kind"`, the mapper with 20 of 40 failing, then the entry points); 8,032 unit tests across 680 files passed on a branch cut from `dev` at `0ce607f2`, and the pre-push Docker E2E gate passed on push; opened with `SONAR_GATE_OVERRIDE=1`, Sonar left to CI. #1609: Red observed (`Failed to resolve import "./seeded-rng"`); 8,041 unit tests across 681 files passed. #1611: Red observed (`Failed to resolve import "./league-allowance"`); 8,047 across 681 files. #1613: Reds observed (`Failed to resolve import "./suggestion-claims"`, then the route, `expected undefined to deeply equal { kind: 'reasoned', … }`); 8,044 passed. #1615: Red observed (`Failed to resolve import "./route-limits"`); 8,040 passed. #1616: Red observed (`Failed to resolve import "./commitment-index"`); 8,038 passed. #1617: Red observed (`Failed to resolve import "./form-pods"`); 8,043 across 681 files; a mixed pool of more than twelve players gets a deterministic fill that is not claimed to be the optimum. #1609, #1611, #1613, #1615, #1616 and #1617 came from cursor agents: none names the `dev` tip of its full run, each was pushed with `SKIP_E2E=1` because its environment had no Docker, each records that a red GitHub Actions check came from an exhausted quota, and none ran Sonar. #1609 to #1618 merged within ten minutes of each other; the first runs on their combined code that this record knows of are #1622's, rebased onto `dev` at `3e94c321`, where 8,167 unit tests and the Docker E2E gate passed, and the full run in the progress tracker on the same tip.

### 2026-11-20: An account exports as one JSON archive, every deck export names the cards it leaves out, a second build resolves against the main one, and a price book prices a player's month

- A signed-in player downloads everything tied to their account as one JSON file from `GET /api/user/export`, under a strict, versioned schema (`schemaVersion: 1`): the profile, each deck with its cards, snapshots and plain-text list, folders, collection, card packages, ratings, votes, comments, playtests, follows, saved decks, notification preferences, API key names and AI usage. It is free on every plan and limited to one export an hour. No credential is exported, and a follow carries only the other player's public username. A guard test fails when a new model tied to a user is neither exported nor excluded with its reason. Spec and contract: [Account export](../engineering/account-export.md) (I-38 slice 4, #1595).
- Every deck export goes through one contract that returns the content, the file name, the MIME type and typed notices. The export dialog says, before copy or download, which cards a target leaves out or moves, for example "TappedOut leaves out 3 cards". TappedOut no longer puts Considering and Sideboard cards in the main deck: it leaves them out with a notice. Every other target's output is unchanged, and each target has a `v1` fixture pinned byte for byte (I-50 slice 0, #1594).
- `diffBuild` and `resolveBuild` turn a second build of a deck into a change set against the main build, command zone first, and mark each change applied, absorbed or held when the main build has moved since. They are pure functions with fixtures; nothing is stored or shown yet (I-55 slice 1, #1566).
- `src/lib/costs/` holds the price book (each provider's rates and allotments, with their source and read date), one active player's assumed month of usage, the cost per active player and the headroom before each free allotment runs out, and reproduces the I-66 spec's tables 3.3 and 4.1. Pure functions; the fixed floor and the break-even are left for a follow-up (I-66 slice 1, #1584).
- #1594: three Reds observed, TappedOut (`2 failed`, Counterspell and Negate in the main list), the contract (`EXPORT_TARGETS` and `exportDeck` did not exist) and the dialog (`Unable to find an element with the text: TappedOut leaves out 3 cards.`, 3 of 4 failing); on the tip rebased onto `dev` at `1cdd6689`, typecheck, lint and 7,910 unit tests across 670 files passed, and the pre-push Docker E2E gate passed on push. Not verified: a real import of any fixture into its client (each fixture is marked unverified) and the dialog in a browser. #1595: Reds observed, the route (`Cannot find module './route'`), the relation guard (`expected [ Array(3) ] to deeply equal []`) and the route policy (`expected [] to deeply equal [ 'GET' ]`); the credential test passed first and was shown to fail by exporting a password column on purpose, then reverted; 7,938 unit tests across 674 files at `119a5597`, gate passed on push. Not verified: the queries against a real PostgreSQL (the tests use an in-memory database) and a browser download, which slice 5's button adds. #1566: Red observed against a stub, 11 of 15 failing (`expected [] to deeply equal [ 'commandSlot', 'commandSlot', …(4) ]`); 7,953 unit tests across 675 files at `0e04e89e`, gate passed on push; nothing persisted to verify until slice 2. #1584: Reds observed (`Failed to resolve import "./player-usage"`, `pricesInForce is not a function`, `Failed to resolve import "./cost-model"`); 7,970 unit tests across 678 files at `ec22250b`, gate passed on push. #1566 and #1584 came from the roadmap automation, with green CI on an older `dev`; the coordinator's queue rebased them and ran the gate again. Sonar was left to CI for all four. No migration and no new environment variable.

### 2026-11-20: Every write respects the copy limit, deck lists count card copies, and a constructed deck is complete from 60 cards

- The first add of a card respects the copy limit: one add of 3 Sol Ring to a Commander deck keeps 1 (CR 903.5b), 6 Lightning Bolt in a Modern deck keeps 4 (CR 100.2a), Seven Dwarves keeps the 7 its text allows, and basic lands stay exempt. The clamp is silent, as the quantity edit's already was. Before, `addCard` and `addDeckCard` stored the quantity they were given (#1579).
- The server applies the same rule. `POST /api/decks/[id]/cards` and the bulk edit store at most the copy limit for each added or resized row and answer with the stored row (#1587). The single-card `PATCH`, deck creation and the command-zone route do too, through one shared owner check that reads the format and the commanders (#1603).
- A constructed deck is complete from 60 cards, with no maximum: a 63-card Modern deck is no longer "over", and its counter reads `63/60+`. Commander, Brawl and Oathbreaker keep their exact size, and each format's bound cites its source (#1580).
- The card counters use the format's deck size: a full 60-card Standard deck read `60/100` in the editor, the deck list and the builder title bar, and never turned green (#1548, merged 2026-11-16). The deck list and the title bar now say "complete", "3 cards short" or "2 cards over" in words, with colour second, through one `DeckCardCount`, and a Whtz, the Bibliophile deck has no maximum (#1563).
- The deck list counts card copies, not rows: a deck with one row of 30 Forests and 70 other cards reads 100. The copies are summed in one database query per page; the commander and the partner count once each, and the sideboard, Considering and the companion stay out (#1588). The deck grid card, the commander's deck page and the share page count the same way, and a Modern deck's grid card reads "63 / 60+ cards" instead of "63 / 100 cards" (#1599).
- Before the copy-limit fixes, the store's behaviour was pinned with no production change: the companion refusals, the quantity clamps and the first-add gap that #1579 then closed (#1562).
- **Owner actions.** #1587 asks the owner to confirm the silent clamp (a write over the limit succeeds and stores the limit) or to ask for a refusal with 400 or 422 instead; #1603 applied the same silent clamp to the other routes. No migration and no new environment variable shipped from #1472 to #1603.
- #1548: Reds observed, one per counter (`Unable to find an element with the text: 60/60` while the toolbar showed `60/100`, then the deck list cell and the title bar); on the tip rebased onto `dev` at `5b0e4930`, typecheck, lint and 7,246 unit tests across 633 files passed, and the pre-push Docker E2E gate passed on push. #1562: characterization, no Red; two expectations flipped for one run failed as they should (`expected 'Lurrus of the Dream-Den' to be 'Sol Ring'`, `expected 3 to be 1`); 7,468 unit tests across 643 files at `e9ddf0fa`, gate passed on push; a full run before its rebase failed one test, `Header.test.tsx` › "creates a deck and activates it when clicking Import on home", under full-suite load, not investigated. #1563: Red observed (`Unable to find an accessible element with the role "cell" and name "100 / 100, complete"`); 7,478 across 643 at `30873e9f`, gate passed on push; the hidden text and the colour were checked in jsdom only. #1579: Red observed twice (`expected 3 to be 1`), once per add path; 7,615 across 654 at `045f4992`, gate passed on push; no import was replayed in a browser. #1580: two Reds observed (`expected 'over' to be 'legal'` for a 63-card Modern deck, then the counter text); 7,631 across 655 at `b166caf7`, gate passed on push. #1587: Reds observed on `POST` (`[3]` stored where `[1]` was expected) and on the bulk resize (the route stored the 4 it was sent); 7,656 across 657 at `a791c8ad`, gate passed on push; the nested PostgreSQL query ran against the fake only. #1588: Reds observed (`expected undefined to be 100` for a partner deck, and the 30-Forests deck); 7,676 across 658 at `0f3cd4d4`, gate passed on push; a real PostgreSQL `groupBy` was not run. #1599: Reds observed (`63 / 100 cards` where `63 / 60+ cards` was expected, then the commander page's 30-Forests deck); 7,812 across 665 at `ade0489c`, gate passed on push. #1603: one Red per route on the stored quantity; 7,861 across 667 at `360aedce`, gate passed on push; the nested owner query was not run on a live PostgreSQL. Sonar was left to CI for all nine.

### 2026-11-20: MTGTop8 decks import again, with their commander, and an AetherHub deck keeps both partner commanders

- Every MTGTop8 import failed: the adapter asked for an `export.txt` URL that answers 404 for every deck, so the player read "Deck not found or is private." for a deck that exists. It now reads the deck's MTGO export at `/mtgo?d=<id>`, main deck then sideboard. The HTML fallback, which could only produce wrong cards, is removed (#1582).
- An MTGTop8 Commander deck imports its commander as the commander. The MTGO export lists it after the `Sideboard` heading, so a sideboard of one or two single cards, in a deck whose URL names a Commander format, goes to the command zone: the first card as commander, the second as partner (#1602).
- An AetherHub deck led by a partner pair keeps both commanders; the second one used to fall out of the command zone. AetherHub and Moxfield share one `commandZoneRole` rule, and an invalid pair is left to the command zone's existing refusal (#1592).
- The URL importer's least-tested sources are pinned before their move: an EDHREC average deck and an MTGTop8 deck page replay pages recorded on 2026-11-19, and AetherHub builder URLs are built in the test because the site answers scripted requests with a challenge. These pins found the AetherHub partner loss that #1592 fixed (#1569).
- #1569: characterization, no Red; two mutations (the EDHREC cap and the fallback's copy limit) each failed a pin; on the tip rebased onto `dev` at `31b0f168`, typecheck, lint and 7,501 unit tests across 644 files passed, and the pre-push Docker E2E gate passed on push; the live-site facts were checked once, by hand, on 2026-11-19. #1582: two Reds observed, the first `Deck not found or is private.` with no handler serving the old `export.txt` URL; 7,621 across 655 at `1d83795f`, gate passed on push; MTGTop8's answer for a missing deck id was not requested. #1592: Red observed, 2 of 15 (`"isPartner": true` expected for Tymna the Weaver, `false` received); 7,782 across 664 at `6a881903`, gate passed on push; the in-browser import and the store's message on an invalid pair were not replayed. #1602: Red observed (`expected [] to deeply equal [ { …(5) } ]` for Surrak, Elusive Hunter in deck 913975); 7,849 across 666 at `6bd69f77`, gate passed on push; the live site was not called, and MTGTop8's code for multiplayer Commander is unknown. Sonar was left to CI for all four.

### 2026-11-20: Deck Lab classifies a deck's cards, the bracket estimate explains itself, a deck's format is chosen at creation, the primer previews while it is edited, and generated decks respect their bracket's Game Changers

- Deck Lab's classifier: `classifyDeck` turns a deck into one `LabCard` per copy, each with its kind and the id of the rule that classified it. It puts the commander and the partner in the command zone (CR 903.6), leaves Sideboard and Considering out, applies the player's overrides field by field and counts the cards that fell back to "spell". It is pure and deterministic, and no screen reads it yet (I-31 slice 2, #1601).
- `explainBracket` gives the bracket estimate as floors and terms: one row each for Game Changers and two-card combos with their cards, floor and rule; mass land denial and extra turns marked as not checked yet; unreadable combo data marked as a blind spot. `scoreBracket` becomes its projection, and no bracket number moves (I-77 slice 1, #1591).
- A deck's format is chosen at creation and in the deck details panel, with Commander, Brawl and Oathbreaker in one group and the six constructed formats in another. Choosing another format saves nothing until the player confirms a preview of what breaks: the deck size, the copies over the limit, the cards outside the colour identity and the new format's ban list. No card is removed (I-42 slice 1, #1593).
- The primer is edited in a dialog with the rendered preview beside the Markdown, stacked on narrow screens. The preview uses the public page's parser and blocks, so the two cannot disagree (I-37 slice 21, #1597).
- The playtest tallies commander damage dealt to up to three imagined opponents, kept per commander: an opponent has lost once one commander has dealt 21 (CR 903.10a, 704.6c). Each hit is one undo step and one log line, and the player's own life total does not change (I-07, #1589).
- Builder name search stays inside the commander's colour identity once a commander is set (`id<=WB`), widened by a rulebreaker commander, with one visible chip to search every colour (I-01, #1590).
- A deck folder named `{W}{U} Control` shows the white and blue mana symbols with their letters and is announced as "W U Control"; any other brace sequence stays as typed (I-01, #1586).
- A generated deck no longer holds more Game Changers than its bracket allows: the commander and the partner take their slots first, the list's Game Changers are kept in the model's order up to the limit, and the others are removed with a correction and replaced with basic lands (I-02 slice 8, #1583).
- #1583: Red observed (`"corrections": []` where the removal of Rhystic Study from a Bracket 2 deck was expected); on the tip rebased onto `dev` at `537ffb1f`, typecheck, lint and 7,634 unit tests across 655 files passed, and the pre-push Docker E2E gate passed on push; no real model build was run. #1586: Reds observed (`Unable to find role="button" and name "W U Control"`, then the tokenizer); 7,647 across 656 at `02130079`, gate passed on push; the pips' look was not checked in a browser. #1589: Red observed on the engine (`expected undefined to deeply equal { opponent: 1, hasLost: true, … }`); 7,707 across 660 at `25291552`, gate passed on push; no real-browser layout check. #1590: Red observed (`expected 'name:/Sol/ legal:commander' to be 'name:/Sol/ legal:commander id<=WB'`), and two mutations failed before being reverted; 7,728 across 662 at `3d8b50af`, gate passed on push. #1591: Red observed (module not found), and a characterization test pinned today's numbers before `scoreBracket` was rewritten; 7,781 across 664 at `8d3982af`, gate passed on push. #1593: Reds observed (`Unable to find an accessible element with the role "combobox" and name "Format"`, then `"New deck format"`); 7,795 across 665 at `934c2640`, gate passed on push; no live Scryfall ban list was requested. #1597: Red observed (`Unable to find an accessible element with the role "region" and name "Preview"`), with two mutation checks; 7,808 across 665 at `3cfd15d1`, gate passed on push; the layout at 360, 1024 and 1440 pixels was not checked in a browser. #1601: three Reds observed (module not found; `expected 1 to be +0` on the overrides; Treasure Map read as a filter rock because its reminder text quotes a mana ability); 7,841 across 666 at `8ab47628`, gate passed on push; database rows without a layout were not checked. Sonar was left to CI for all eight.

### 2026-11-20: Two flaky tests made deterministic, the collection page and the comment panel pinned, and three dependency changes

- The meta panel's tournament retry test takes a marker on the request log and waits for the requests it counts, so it no longer fails when EDHREC answers first; it had failed the merge gate on 2026-11-19 (#1600).
- The E2E "can create a new deck" test clicks the header's New Deck button by role. Its loose `text=New Deck` selector also matched the "New deck format" field #1593 added, and it failed the pre-push gate on 2026-11-19 (#1598).
- The collection page is characterized before its split: the filter, the figures, the clipboard and file exports and the printing swap, through the real store (#1572).
- The comment panel's post and reply tests run on MSW and check what the player sees after the reload. Before, the write stub answered `{}`, which the typed client refuses, so the reload never ran and the tests did not notice (#1581).
- Dependencies: `effect` 4.1.2 to 4.1.4 and `next-intl` 4.14.9 to 4.15.1, a Dependabot group (#1546); the dev-dependency group (`@playwright/test` 1.65.1, `prettier` 3.10.1, `msw` 3.0.6, `vite` 6.4.6 and four more) together with the Playwright Docker image `v1.65.1-jammy`, which the Dependabot PR alone could not move (#1568); `effect` 3 overridden to 3.22.1 or later for GHSA-7589-6fvf-x4pw, which had failed CI's production audit on every pull request since 2026-11-19 (#1596).
- #1546: a Dependabot group bump; its body records no verification of its own. #1568: Red observed with the Dependabot lockfile installed (`expected '1.65.0' to be '1.65.1'` in the toolchain guard), green once the image moved; on the tip rebased onto `dev` at `ea919fc9`, typecheck, lint and 7,485 unit tests across 643 files passed, and the pre-push Docker E2E gate passed on push; Lighthouse CI with `@lhci/cli` 0.16.1 was left to CI. #1572: characterization, no Red; three mutations each failed their test (`expected '5.5' to be '7'` among them); 7,538 across 646 at `39524030`, gate passed on push; the real clipboard and download were not used. #1581: Red observed against the old `{}` answer (`Unable to find an element with the text: Nice curve!.`); 7,631 across 655 at `48a323c4`, gate passed on push. #1596: dependency fix, no Red; `pnpm audit --prod --audit-level=high` reported one high on `dev` before and "No known vulnerabilities found" after; 7,795 across 665 at `281f5900`, gate passed on push; Prisma's CLI configuration loading in production was not checked. #1598: test only; 7,808 across 665 at `3120f84a`, gate passed on push. #1600: the race made deterministic with EDHREC answering 30 ms late; 7,812 across 665 at `aab175e3`, gate passed on push; the merge gate's exact load was not reproduced. Sonar was left to CI for all seven.

### 2026-11-19: Rulebreaker commanders build their decks as their text allows, and the editor names the commander that admits a card

- The eight "rulebreaker" commanders of Mystery Booster Commander Edition change deck construction only when they lead the deck (CR 903.5e) and never change a card's legality (CR 113.6n). A versioned table keyed by Oracle id, checked against the Oracle text recorded on 2026-11-16, lists each one's exceptions: any land, a creature type or card type outside the colour identity, a chosen colour, no maximum deck size. The colour identity, companion and deck size checks honour them (#1547, merged 2026-11-16).
- The same exceptions reach the search, the copy limits and the AI suggestions: a Seluma, Light of Aysen deck searches `(id<=WB OR t:angel OR t:basic)` instead of hiding every off-colour Angel (#1549, merged 2026-11-16).
- The list view names the rulebreaker that admits an off-identity card ("Allowed by Seluma, Light of Aysen") with the rule in plain words (#1557). The grid view, the editor's default, does too, and a card outside the identity that no rulebreaker admits is labelled "Outside commander color identity" (#1575).
- One rule says which stored row fills the commander, partner and companion slots (`commandSlotOf`, `isCommanderRow`), read by the store, the server and the fakes, with the CR numbers it follows. No behaviour change (#1576).
- #1547: Reds observed per reader (`expected [ { cardId: 'angel', …(1) } ] to deeply equal []` for a mono-black Angel under Seluma, then the companion and the deck size); on the tip rebased onto `dev` at `f2ec7282`, typecheck, lint and 7,243 unit tests across 633 files passed, and the pre-push Docker E2E gate passed on push. #1549: Reds observed per reader (`Received: "t:angel c:g id<=WB legal:commander"` for the described search); 7,276 across 635 at `39236702`, gate passed on push; Scryfall's answer was checked through two recorded requests only. #1557: Reds observed (`rulebreakerAdmission is not a function`, 13 failed, then the deck rule and the entry-point list); 7,452 across 642 at `1fc27f1b`, gate passed on push. #1575: Red observed (`Unable to find an element with the text: Allowed by Seluma, Light of Aysen.`); 7,555 across 648 at `961863d9`, gate passed on push; the layout and the light-theme contrast were not checked in a browser. #1576: structural; the new tests failed first (`commandSlotOf is not a function`, 8 failed); 7,563 across 649 at `34e165e1`, gate passed on push. Sonar was left to CI for all five, and none was tried in a running builder.

### 2026-11-19: The playtest's life rules hold after a heal and refuse negative damage, the AI streams skip malformed events, and the playtest and AI code is restructured

- A player who reached 0 life and healed back is no longer flagged as having lost: the loss is derived from the life total (CR 704.5a) instead of a stored flag that only damage set (#1560).
- Damage refuses a negative amount. Damage of -3 used to raise the life total by 3 and log "Lost -3 life"; the life tracker never sends one, so nothing visible changes (#1577).
- The suggestion and build streams read through one `readNdjsonEvents`, which skips a blank line, a line that is not JSON and an event its guard refuses, instead of each reader handling them its own way (#1571).
- Structural, no behaviour change: every playtest move is one `PlaytestCommand` (19 variants) handled by one reducer with a guard table, and the store dispatches it (#1556); the playtest section of the suggest prompt moves into the AI code, which removes a two-way dependency (#1559); the suggestion evidence is built by two pure functions the route calls (#1565).
- #1556: the two `dispatch` tests failed against the old store (`dispatch is not a function`), and the reducer table ran green against the old methods first; on the tip rebased onto `dev` at `6e0a9a73`, typecheck, lint and 7,364 unit tests across 636 files passed, and the pre-push Docker E2E gate passed on push. #1559: structural, no Red; the same 80 tests pass before and after the move; 7,454 across 642 at `19e5686d`, gate passed on push. #1560: Red observed (`hasLostOnLife is not a function`, `expected [ 'damage', 'heal' ] to deeply equal [ 'damage' ]`); 7,459 across 642 at `ec4877d3`, gate passed on push. #1565: structural; the new tests failed first (`attachSuggestionEvidence is not a function`, 7 of 11); 7,485 across 643 at `83199724`, gate passed on push. #1571: Red observed, 9 of 28 against the old readers (`readNdjsonEvents … is not a function`); 7,527 across 646 at `2171dffb`, gate passed on push; the wizard was not driven in a browser. #1577: Red observed (`expected 43 to be 40` after damage of -3); 7,568 across 649 at `3aa3145f`, gate passed on push. Sonar was left to CI for all six.

### 2026-11-19: Structural slices with no behaviour change: snapshot, saved-library and commander-discovery use cases, one double-faced card mapper, and the search types in the catalog

- The snapshot routes call four use cases (list, save, delete, restore) over two ports, and one `sanitizeDisplayName` cleans deck and snapshot names; every answer is the same as before (#1578).
- The saved-deck library routes call four use cases over two ports, with a Prisma adapter and a hand-written in-memory fake (#1573).
- The commander's deck page reads through a `listCommanderDecks` use case, a pure ranking and summary, and a reader port (#1570).
- The comment panel loads through the shared `useRemoteResource` hook and writes through the typed community client, as the ratings panel does (#1564). The moderation queue reads the report reasons from the one shared constant (#1558).
- One double-faced card mapper, `buildCardFaces`, serves the search grid and the deck store instead of two copies (CR 712) (#1561).
- The search filter types move into the card catalog, and the format-scoped query builders take Scryfall's legality key, so the catalog no longer imports deck building for them (#1567).
- #1558: characterization, no Red; two tests pinned the queue's rendering first; on the tip rebased onto `dev` at `757ada80`, typecheck, lint and 7,454 unit tests across 642 files passed, and the pre-push Docker E2E gate passed on push. #1561: structural, no Red, the existing pins unchanged; 7,459 across 642 at `609c5451`, gate passed on push. #1564: structural, the same 19 tests pass before and after; 7,478 across 643 at `e6a00b7e`, gate passed on push. #1567: structural, no test added or changed; 7,485 across 643 at `92b0d42d`, gate passed on push. #1570: the new tests failed first on the missing modules; 7,517 across 646 at `3878f674`, gate passed on push; the SQL was not run against PostgreSQL. #1573: the new tests failed first on the missing module; 7,546 across 647 at `4802d019`, gate passed on push; the Prisma adapter was not run against PostgreSQL. #1578: structural, the route answers unchanged; 7,606 across 654 at `f5ec72a3`, gate passed on push; no PostgreSQL run. Sonar was left to CI for all seven.

### 2026-11-19: A deck search query with one URL, a player's statistics across their decks, the CDN keeps proxied card images, two labelled Scryfall prices, and the sign-ups a target needs

- Public deck search starts with one typed `DeckSearchQuery`: a pure parser reads every filter, the sort and the cursor from the URL and drops what is unknown or malformed, and a serializer writes it back in a fixed key order, so one search has one URL and one cache key. No page reads it yet (I-75 slice 0, #1550).
- `countPlayerStats` counts a player's decks over a window (active, added and changed decks, formats and more), each figure carrying the ids of the decks behind it. "Changed" is a floor, because only the last save is stored. No screen reads it yet (I-60 slice 1, #1551).
- A proxied card image answers with `Vercel-CDN-Cache-Control: max-age=31536000`, so Vercel's CDN keeps it for a year while the browser keeps it for a day; an error answer carries no caching header, and the request's log line records the image's bytes (I-66 slice 4, #1552).
- The printing selector shows Scryfall's dollar and euro prices side by side, each labelled, with "No EUR from Scryfall" when Scryfall sent none, and never a converted figure (I-96, #1553).
- `whatItTakes` gives the sign-ups a month that hold a number of payers steady, from conversion, activation and churn, and refuses a conversion or an activation of zero. No screen reads it yet (I-72 slice 5, #1554).
- #1550: one Red per rule, the first a missing module and the second `serializeDeckSearchQuery is not a function`; `pnpm test` gave 7,301 tests across 636 files, and the pre-push Docker E2E gate passed with 105 Playwright tests in 3.0 min on `868e620c`. #1551: one Red per rule, the first a missing module; 7,290 across 636, gate 105 in 3.0 min. #1552: Reds observed (`expected null to be 'max-age=31536000'`, and the missing `bytes` in the log line); 7,281 across 635, gate 105 in 3.1 min; a real CDN hit needs a deployment. #1553: Red observed (`priceEurOf is not a function`); 7,283 across 635, gate 105 in 3.0 min; no browser check. #1554: Reds observed (module not found, then `expected function to throw an error, but it didn't` for an activation of zero); 7,285 across 636, gate 105 in 3.1 min; opened with `SONAR_GATE_OVERRIDE=1`, as it adds new files only. None of the five names a `dev` tip for its full run. Sonar was left to CI for all five.

### 2026-11-19: Roadmap research passes fourteen to eighteen, I-102 to I-107, and the previous changelog record

- Documentation only. The fourteenth pass attaches new public sources to the specs that already own their jobs, with no new initiative (#1506, 2026-11-14). The fifteenth adds I-102, a theme you can measure, and I-103, planar, scheme and Attraction decks (#1516, 2026-11-15). The sixteenth adds 28 sources and a dated scope line to five specs (#1544, 2026-11-16). The seventeenth adds a competitor feature matrix and turns two research notes into recorded results (#1574). The eighteenth adds I-104 to I-107: league decks, creator content, the precon choice and a route clock (#1585).
- The changelog and the progress tracker recorded the merges from #1343 to #1471 (#1475, 2026-11-12).
- #1506: docs only, no check run. #1516: typecheck, lint and 6,749 unit tests across 597 files passed, and the gate passed with 105 Playwright tests in 4.1 min; it names no `dev` tip, and its index commit used `--no-verify` because lint-staged would reformat the unformatted `docs/product` files. #1544: docs only, no Red; on the tip rebased onto `dev` at `105cccc8`, typecheck, lint and 7,162 unit tests across 630 files passed, and the pre-push Docker E2E gate passed on push. #1574: docs only; 7,546 across 647 at `a7577454`, gate passed on push; the sources it could not read are named as such. #1585: docs only; 7,634 across 655 at `cc0c6cb4`, gate passed on push; the glance generator was not re-run. #1475: docs only; 6,147 across 542 at `3d18d934`, gate passed on push. Sonar was not run for any of the six.

### 2026-11-16: Karsten's mana-base tables, added basics split by source targets, preview cards told apart from illegal ones, a measurable theme, and side-deck construction rules

- Karsten's mana-base tables become data with golden tests: the land-count formula, the 99-card source column with its 19 entries, the partial and modal double-faced land weights and the rule of thumb. A cost outside the table gets no number rather than an extrapolated one, and no screen reads them yet (I-58 slice 1, #1526, merged 2026-11-15).
- The AI wizard's size repair gives each added basic land to the colour furthest below its source target, read from its most demanding spell, instead of splitting them evenly in WUBRG order (I-58 slice 4, #1533, merged 2026-11-15).
- A card is `preview`, `upcoming` or `released` from its release date and Scryfall's legality, and a search can include previews (I-73 slice 1, #1538, merged 2026-11-15). A generated deck removes a preview card with the reason "preview" and the day its set becomes legal, instead of "not legal", and a preview commander is refused with that day (I-73 slice 2, #1543).
- A player's theme becomes measurable: `matchTheme` says whether a card meets a theme (a creature type, changelings included; a word in the name or the text; a first letter; a card type) with the evidence, and `themeCoverage` counts the deck's share. No screen yet (I-102 slice 1, #1539).
- A new `format-rules` context checks a planar, scheme or Attraction deck against its construction rules and reports pass, fail or unknown for each, with the CR number and the counts compared (I-103 slice 2, #1540).
- #1526: Reds observed per table (module not found, then the nearest-lower entry); `pnpm test` gave 6,964 tests across 611 files before a rebase onto `6ebdb648` (#1524), which touches none of its files, and the pre-push Docker E2E gate passed on push without a count; opened with `SONAR_GATE_OVERRIDE=1` for 18 issues already open on the default branch. #1533: Reds observed against a stub (`expected Map{} to deeply equal Map{ 'G' => { sources: 18, …(3) } }`) and against the even split; 7,082 across 619, gate 105 in 3.0 min; opened with `SONAR_GATE_OVERRIDE=1`. #1538: Reds observed against a compiling stub (`"kind": "released"` where `preview` was expected); 7,119 across 626, gate 105 in 3.0 min; the tests also pass in UTC+14 and New York time; no live Scryfall call. #1539: Reds observed (module not found, then a changeling read as `{ onTheme: false, evidence: [] }`); 7,141 across 628, gate 105 in 3.0 min. #1540: two Red cycles, the first a missing module; 7,140 across 628, gate 105 in 3.1 min. #1543: Red observed (`"reason": "not_legal"` where `preview` was expected, and the commander's message); 7,167 across 630, gate 105 in 3.1 min; a live build during a preview season cannot be forced. None of the six names a `dev` tip for its full run. Sonar was left to CI for all six.

### 2026-11-15: SonarCloud reaches zero code smells

- The 15 mechanical TypeScript smells of the 23 open on `a6eff2d5` are fixed in the code, with no `NOSONAR` and no exclusion: re-exports through `export … from`, optional chains, `.includes` guards and one helper for an error message's detail. Tests pinned the touched behaviour first (#1534).
- The three test-file smells, the only BLOCKER among them: the combo contract becomes a table of named cases that each file runs in its own `it`, and the AI route stand-in reads its stream without an `await` in a loop (#1535).
- The five UI smells: the search panel's resize handle becomes a native button named "Search panel width", with the same drag, arrow-key steps, bounds and saved width; the card zoom reads its arrow keys on the dialog; primer list items get stable keys (#1536).
- The three new smells the rescan of `d03e4024` found, all from #1535's reshaped contract: each contract test asserts in its own body, and one nested template goes (#1537).
- #1534: characterization, no Red; the new pins passed on the base and after; on the tip rebased onto `dev` at `a6eff2d5`, typecheck, lint and 7,081 unit tests across 621 files passed, and the pre-push Docker E2E gate passed on push. #1535: tests only; a pin of the stand-in's arrival times was committed before the loop changed, and a mutation of the fake failed the reshaped contract; 7,084 across 622 at `09fd5e70`, gate passed on push. #1536: Reds observed per area (`keyPrimerSiblings is not a function`, then the handle and the zoom); 7,103 across 623 at `49a322d6`, gate passed on push; no screen-reader or real-browser check. #1537: a mutation of the fake (`combos: []`) still failed the visible test; 7,103 across 623 at `d03e4024`, gate passed on push. None ran `pnpm sonar`; the rescans were the coordinator's. The SonarCloud analysis of `main` at `151db158` on 2026-11-16, read for this entry, reports 0 code smells.

### 2026-11-15: A failed sign-up recovers, a malformed Scryfall price is never stored as NaN, and structural slices for the catalog, the logger, the site and the deck library

- A sign-up whose answer is not JSON, fails on the network or stalls now shows "We could not create your account. Try again in a moment.", re-enables the button and keeps what was typed; before, the error escaped and the button stayed disabled. The request times out after 15 seconds. A failed read or save of the notification preferences answers 500 with the standard error body and is logged (#1528).
- One `toUsdPrice` reads every Scryfall price: a malformed price string is "no price", stored as `null` and shown as nothing, where some of the eight sites that parsed it on their own stored `NaN` (#1529).
- The structured data renders on the server and uses the site's own URL, like the canonical and the sitemap; with `NEXT_PUBLIC_BASE_URL` unset the output is the same as before (#1525).
- Structural, no behaviour change: Pino stays out of the browser bundle, behind a sink only the server loads (#1527); the Scryfall request queue takes an injectable clock instead of detecting the test runner (#1517); the deck library's screen is derived in one pure function (#1524).
- Tests: the API keys page, the preferences failure and the sign-up errors are pinned before the identity moves (#1515); the builder tests that wait 10 seconds for search rows get a 30-second limit, after the 5-second default failed #1522's and #1529's CI runs (#1531).
- #1515: characterization, no Red; three mutations each failed one test; on the tip rebased onto `dev` at `d3f27c0d`, typecheck, lint and 6,785 unit tests across 600 files passed, and the pre-push Docker E2E gate passed on push. #1517: the new suite could not run against the old API (`TypeError: Cannot read properties of undefined (reading 'keys')`, and `tsc` errors); 6,790 across 600 at `0a07648d`, gate passed on push; real Scryfall traffic was not paced live. #1524: structural; the new tests failed on the missing module; 6,946 across 611 at `201ac859`, gate passed on push. #1525: Red observed (`expected 'https://magicaibuilder.com' to be 'https://preview.example.test'`); 6,951 across 612 at `6ebdb648`, gate passed on push. #1527: structural; the sink's characterization failed on the missing module; 6,955 across 613 at `cf92d599`, gate passed on push; no live `next start`. #1528: Reds observed on `dd31c611`'s code (`connection refused` escaping the preferences route, 2 of 5; `TypeError: fetch failed` and the missing message on the form); 6,957 across 613 at `b7253ac5`, gate passed on push. #1529: Reds observed (module not found, then `expected NaN to be null`); 6,986 across 615 at `012ab787`, gate passed on push; a malformed price through the printing swap or the wizard import has no test. #1531: Red reproduced by delaying the search mock by 6 seconds (`Test timed out in 5000ms`), after CI runs 43684999921 and 43693127796 failed; 7,036 across 617 at `3ab1bddf`, gate passed on push. Sonar was left to CI for all eight.

### 2026-11-15: The community routes call use cases over ports, the community components go through the typed client, and the ratings panel ignores a stale answer

- The ratings panel keeps only the latest read: a slow answer for the previous deck no longer overwrites the current deck's ratings. A new `useRemoteResource` hook drops any answer a newer read superseded (#1522).
- A folder write in the saved-deck library that fails on the network shows the failure banner a refused write already showed, instead of nothing. The library, the save button and the report button go through the typed client, and the report reason is checked by a guard instead of a cast (#1521).
- Structural, no behaviour change: votes and ratings (#1518), reports, saves and follows (#1520) and comments (#1530) are use cases over ports with one interaction policy, so each route checks the session, parses, calls one use case and maps its result; the vote and follow buttons use the typed client (#1519); the primer's Markdown parser leaves the component as a pure module whose links carry their verdict (#1523); the commander slug moves to the community context, and `src/lib/meta/` is gone (#1532).
- #1518: structural, no Red; two pinned tests name today's behaviour; on the tip rebased onto `dev` at `a19afd92`, typecheck, lint and 6,836 unit tests across 603 files passed, and the pre-push Docker E2E gate passed on push. #1519: structural, the same 17 tests before and after; 6,836 across 603 at `9c01caa2`, gate passed on push. #1520: structural, no assertion changed; 6,877 across 608 at `67e05cda`, gate passed on push; the Prisma adapters have no database contract test yet. #1521: Red observed on the guard (`isReportReason is not a function`, 2 of 20); 6,879 across 608 at `b12f15c0`, gate passed on push. #1522: two Reds observed, the hook's missing module and the race on the old panel (`found <span>12 ratings</span>`); 6,888 across 609 at `df6d50f7`, gate passed on push; the 15-second timeout was not replayed live. #1523: structural, 42 new parser tests; 6,921 across 609 at `df6d50f7`, gate passed on push. #1530: structural; the use-case tests failed on the missing module; 7,007 across 615 at `012ab787`, gate passed on push. #1532: structural; the slug tests pass at the new path; 7,036 across 617 at `188ebe34`, gate passed on push. Sonar was left to CI for all eight.

### 2026-11-14: The draw odds panel, the onboarding dialog stays shut on public pages, the printing selector keeps the pick and its price, a deleted account signs its browser out, and four roadmap slices

- The builder has a Draw Odds panel: the chance of drawing at least N lands, or copies of a chosen card, in the opening hand or by turn 1 to 10, as a percentage, with its four inputs and the note that it counts equally likely hands. The library is the main deck only, never the sideboard or Considering (I-97, #1494, merged 2026-11-13, and #1502).
- The onboarding dialog no longer opens by itself on a public page; it still opens for a first visit to the guest builder and on request (I-39 slice 1, #1499, merged 2026-11-13).
- The printing selector keeps the printing the player picked, even when they own another printing of the card (I-57, #1504), and a printing swap takes the new printing's dollar price, or none, on screen and in the saved deck (I-57, #1505).
- A successful account deletion signs the browser out (I-05, #1511).
- Sentry no longer records random sessions; error replays keep text and input masking and media blocking, now set explicitly (I-39, #1503).
- A guard refuses destructive schema commands against production (`pnpm db:production-schema`), and the infrastructure guide documents the guard and an on-demand backup instead of a reset (I-71 slice 1, #1508).
- `/api-changelog` lists dated changes to the public read API, and a check fails when the OpenAPI document's hash has no dated line (I-95, #1509).
- Every deck shows a data-as-of line with the Comprehensive Rules date it uses (2026-08-07), and placeholders for the price and card-data dates until a source passes them (I-86, #1510).
- Tests: promoting a legendary creature to commander and the partner search are characterized on the builder page, with the AI route gate's 429 and 503 answers and the suggestion stream (#1507).
- #1494: Reds observed (module not found, then a Sideboard land counted in the library); `pnpm test` gave 6,535 tests across 566 files on `ccdaa522`, before a rebase onto the test-only #1493, and the pre-push Docker E2E gate passed with 103 Playwright tests in 3.2 min on the push of `521aa58d`. #1499: Red observed (the dialog found on the landing page for a first-time visitor); 6,664 across 584, gate 104 in 3.0 min with the new `e2e/onboarding.spec.ts`. #1502: Reds observed (module not found, then no "At least" field); 6,661 across 584 on a branch cut from `ef39a12f`, gate 104 on the push of `36a75258` with the new `e2e/draw-odds.spec.ts`, and 104 again on a re-push. #1503: Red observed (the Sentry call did not carry `replaysSessionSampleRate: 0`); 6,669 across 585, gate 104 in 3.0 min; the setting was not observed in the Sentry project. #1504: Red observed on the store (the saved `scryfallId` was not `picked-printing`); 6,687 across 587 on `ab5e2655`, gate 105 in 3.1 min on `63e81f74`. #1505: Red observed (the old `"price": 2.5` kept where the new printing's 4.99 was expected); 6,693 across 588 on its second full run; the first failed one test #1504 had added, `page.test.tsx` › "saves the printing the player picked although they own another printing of the card", which also failed 6 of 6 alone against `dev`'s unchanged source; gate 105 in 3.4 min. #1507: tests only, green on the first run; 6,700 across 589; `route-gate.ts` coverage rose from 76.31% to 100%; the push used `SKIP_E2E=1` (no Docker) and left the gate to the coordinator. #1508: Reds observed (module not found, then `migrate reset`); 6,699 across 589; `SKIP_E2E=1`, no Docker. #1509: Reds observed (module not found, then `Cannot read properties of undefined (reading 'find')`); 6,703 across 590; `SKIP_E2E=1`. #1510: Reds observed (both modules not found); the first full run failed on the rules-reference entry-point pin, which was updated, then 6,697 across 589; `SKIP_E2E=1`. #1511: Red observed per cookie (`expected undefined to deeply equal { value: '', …(1) }`); 6,749 across 597 after a rebase onto `d0125406` (#1510), gate 105 in 3.1 min; no deletion screen exists to try it in a browser. #1494, #1499, #1502, #1503, #1505 and #1507 to #1510 name no `dev` tip for their full run. #1499, #1502, #1503, #1504 and #1511 were opened with `SONAR_GATE_OVERRIDE=1`, each recording that the 8 to 18 issues open on the default branch were outside its files; #1502 records a local scan of `main` at `2b1c7c4a`, after a promotion to `main`: gate OK, 0 bugs, 0 vulnerabilities, 18 code smells. Sonar was otherwise left to CI.

### 2026-11-13: Export file names keep accented letters, and the community context gets one visibility policy, a typed client, one moderator check and a cache-leak net

- An export file name keeps an accented letter as its base letter: "Lim-Dûl the Necromancer" saves as `Lim-Dul-the-Necromancer-playtest.txt` instead of `Lim-D-l-…`, "Éowyn" as `Eowyn-…` instead of `owyn-…`, and Æ and Œ are spelled out. One shared accent strip serves the slug, the MTGTop8 matcher and the file names (#1492).
- Structural, no behaviour change: who may view a deck is one pure policy, `canViewDeck`, read through one repository (#1490); a typed community client checks every route's answer, ready for the components (#1491); the player badge rules leave the profile read, with named thresholds (#1495); one `isModerator` serves the moderation page and the routes (#1496).
- Tests: viewer-relative data (`isFollowing`, the viewer's vote, `isOwner`) is pinned never to be shared through a cache, with a data-cache stand-in that keys entries as Next does (#1493); the card grid's double-faced cards, the server fetch and the shared Scryfall cache are characterized before the catalog moves (#1498).
- #1490: structural, the routes' rules written as tests in domain language; on the tip rebased onto `dev` at `dd31c611`, typecheck, lint and 6,350 unit tests across 562 files passed, and the pre-push Docker E2E gate passed on push. #1491: the two new suites failed on the missing modules; 6,512 across 564 at `56bf4324`, gate passed on push; no component used the client yet. #1492: Reds observed (`expected 'rza-s-Saga' to be 'Urza-s-Saga'`, and `lim_d_l_the_necromancer.dek` where `lim_dul_the_necromancer.dek` was expected), and the playtest pin from #1485 flipped; 6,526 across 565 at `24018300`, gate passed on push. #1493: tests only; with the reads changed to cache every viewer's answer, 22 of the 31 new tests failed; 6,557 across 572 at `ccdaa522`, gate passed on push; Next's real cache is modelled, not run. #1495: the new test failed on the missing module; 6,570 across 572 at `2bb49580`, gate passed on push. #1496: the new test failed on the missing module; 6,579 across 574 at `27c5a510`, gate passed on push. #1498: characterization, no Red; three mutations each failed a test; 6,645 across 582 at `ea36de42`, gate passed on push. Sonar was left to CI for all seven.

### 2026-11-13: The meta panel reloads when the commander changes, and the meta insights context moves into its module and closes

- With the meta panel open, changing the deck's commander kept the previous commander's EDHREC cards and tournament decks on screen until the panel was reopened. The panel now reads the new commander's two sources at once and shows nothing of the old one meanwhile, and a late answer for the old commander is stored under that commander (#1483).
- No behaviour change: the context moves into `src/modules/meta-insights` (#1479); the analysis hook splits into the request and a pure state machine over the two sources (#1480); the route calls one read-through cache use case over four ports, and a Zod parse of the stored answer replaces two casts (#1481); the 625-line panel splits into a hook and its sections, pinned first by 21 characterization tests (#1482); EDHREC and MTGTop8 get one adapter each, and the boundaries run at error with a README and a functional doc (#1488).
- The characterization test that raced the meta-shift line, and failed #1487's CI, now waits for it (#1489).
- #1479: structural, no assertion changed; on the tip rebased onto `dev` at `da5c55df`, typecheck, lint and 6,188 unit tests across 547 files passed, and the pre-push Docker E2E gate passed on push. #1480: the two new suites failed on the missing modules; 6,206 across 549 at `530d4292`, gate passed on push. #1481: the new suites failed on the missing use case; 6,239 across 552 at `e12150f7`, gate passed on push; no live EDHREC or MTGTop8 call. #1482: characterization, the 21 tests passed on the unsplit panel first; the coordinator's first full run after the rebase failed 1 of 6,290 on a race in the new suite, fixed with `waitFor` and then passing three times in a row; 6,269 across 555 at `99f7acb1`, gate passed on push. #1483: Red observed, 5 failed and 41 passed on the three files (`expected [ Array(1) ] to deeply equal [ …(2) ]`); 6,274 across 555 at `d88444ac`, gate passed on push; not checked in a browser. #1488: Red observed, the 12 config cases of the closed context; 6,322 across 561 at `6662d37f`, gate passed on push. #1489: test only; 6,322 across 561 at `08519074`, gate passed on push. Sonar was left to CI for all seven. `e2e/mtgtop8-meta.spec.ts` reads the live site and is tagged `@external`, so the gate does not run it.

### 2026-11-13: The playtest engine is split by concern, with no behaviour change

- The session recording leaves the result bar for a `useRecordPlaytestSession` hook (#1484); the action log splits into a filter hook, the rows and the composer, pinned first by 17 characterization tests (#1485); the deal leaves the store as pure `buildSetup` and `dealFrom`, each citing the rules it applies (#1486); the 1,101-line engine splits into one module per concern behind the same 39 exported names (#1487); and the three steps it wrote more than once each have one helper: untap every permanent (CR 502.3), draw the top card (CR 121.1, 504.1) and the life entry (CR 119.3) (#1497).
- #1484: the hook's test failed on the missing module; on the tip rebased onto `dev` at `c28459ac`, typecheck, lint and 6,280 unit tests across 556 files passed, and the pre-push Docker E2E gate passed on push. #1485: characterization, the 17 tests passed on the unsplit log first, and the filter hook's test failed on the missing module; 6,309 across 559 at `f8f24b6d`, gate passed on push. #1486: structural; the moved tests were green before (42) and after (26 and 16); 6,309 across 560 at `3cd6a543`, gate passed on push. #1487: structural, the three engine suites unmodified; 6,309 across 560 at `6662d37f`, gate passed on push. #1497: the nine helper tests failed against the base modules (`untapAll is not a function`); 6,610 across 579 at `343a9145`, gate passed on push. Sonar was left to CI for all five.

### 2026-11-13: The rules reference moves into its module, the card zoom keeps focus, and the E2E stand-in's SonarCloud findings are cleared

- The card zoom on the Game Changers and banlist page is built on the shared modal: focus moves into it on open, stays trapped, and returns to the tile that opened it on close. Before, closing it dropped focus to the page (#1477).
- No behaviour change: the rules reference moves into `src/modules/rules-reference` and its rules loader splits (#1473, merged 2026-11-12); the reference-list page splits into a tile and a paged-list hook (#1476, merged 2026-11-12); the series closes with its boundaries at error, a README and a functional doc (#1478).
- The Scryfall stand-in of the E2E stack clears the seven SonarCloud findings that had failed #1469's quality gate: a linear trailing-slash trim, a one-pass query reader and a locale-aware sort (#1472, merged 2026-11-12).
- #1472: Red observed (`expected 3093.41… to be less than 250` on a linear-time test of the base URL); on the tip rebased onto `dev` at `81bb4ba6`, typecheck, lint and 6,143 unit tests across 540 files passed, and the pre-push Docker E2E gate passed on push; the SonarCloud result was left to the PR's check. #1473: structural; a wrong path segment failed the rules-file test, and `pnpm build` passed; 6,147 across 542 at `a37410c2`, gate passed on push. #1476: structural, the page's 33 characterization tests unchanged; 6,163 across 544 at `22eee7e3`, gate passed on push. #1477: Red observed (`toHaveFocus()` expected the tile that opened the zoom); 6,173 across 545 at `9a4b5704`, gate passed on push; no Playwright spec drives the rules page. #1478: Red observed, 12 of 26 config cases; 6,186 across 545 at `9716f654`, gate passed on push; the Mermaid diagrams were not previewed. Sonar was left to CI for all five.

### 2026-11-12: Every deck write carries the deck version, the command zone and the bulk edit change in one transaction, and a stale write is refused

- Setting or clearing the commander, the partner or the companion, and promoting a deck card to the command zone, is now one request to a new route, `PATCH /api/decks/[id]/command-zone`, and one server transaction that steps `Deck.version`. Before, the store sent up to three independent writes (deck fields, a new row, a deleted row), and a failure between them left a deck whose fields and rows disagreed. The repository contract runs against the in-memory fake and, opt-in, against Prisma on PostgreSQL (#1444).
- `PATCH /api/decks/[id]` refuses the five command-zone fields with a 400 that names them and points to the command-zone route, so a stale client learns why instead of seeing its keys silently dropped. The pair check has one copy, and the deck client's `updateDeck` types metadata only (#1458).
- The bulk edit goes through the deck repository: an edit sent with an outdated `expectedVersion` answers 409 and writes nothing, a saved edit steps the version by one in the same transaction as its rows and command-zone fields, and a removed or resized row the deck no longer holds also answers 409 (#1465).
- The browser takes part in the versioning: every card, command-zone and bulk-edit write sends the version the store holds, one queue per deck sends them in order and adopts the answered version, so two quick writes carry consecutive versions. A 409 rolls the change back, reloads the deck once and shows a localized conflict message instead of the failure toast. The eight dormant locales carry the English text. A new Playwright spec covers the conflict (#1471).
- #1444: three Reds observed, the repository contract (`writeCommandZone is not a function`, 4 of 18 failing), the route tests (module not found) and the store tests against the old store; on the tip rebased onto `dev` at `134feb05`, typecheck, lint and 5,789 unit tests across 518 files passed, and the pre-push Docker E2E gate passed on push. Not verified: a real PostgreSQL rollback (the Prisma contract runner is opt-in and was skipped) and the builder screen in a running app. #1458: Red observed, 7 failing route tests (`expected 200 to be 400`); 5,992 unit tests across 529 files at `25034b6a`, gate passed on push. #1465: two Reds observed, the contract (`applyBulkEdit is not a function`, 4 of 22) and the route (`expected 200 to be 409`); 6,052 unit tests across 531 files at `f2f18f1d`, gate passed on push. Not verified: the Prisma contract runner (no `CONTRACT_TEST_DATABASE_URL`) and a real two-tab race in a browser. #1471: Red observed on the store tests (`expected undefined to be 7`, `[undefined, undefined]` where `[7, 8]` was expected) before any production change; 6,136 unit tests across 540 files at `1949d021`, gate passed on push, the new spec among them. Not verified: the bulk-edit dialog's 409 text in a browser and the wording of the eight untranslated locales. Sonar was left to CI for all four. The non-versioned writes (create, rename, delete, duplicate, fork) still run without a timeout, and `updateCardQuantity` and `swapCardPrinting` still send their own `fetch`.

### 2026-11-12: The combos pilot closes: one module behind three entry points, its own Combo type, a use case with ports, a contract suite, docs, nightly mutation testing and boundaries enforced at error

- The behaviour was pinned first (merged 2026-11-11): three test files pin the two-card combo floor of the bracket score from the recorded Commander Spellbook response, replay the lookup through the adapter with MSW, and replay it end to end from the hook through the route to Spellbook. No production code changed (#1384).
- The context moved into `src/modules/combos/` (merged 2026-11-11), sixteen files through the move codemod, into `domain/`, `infrastructure/`, `client/` and `ui/`, behind `index.ts`, `server.ts` and `client.ts`. A new ESLint ban keeps `application/` away from adapters. The panel, the bracket score and `POST /api/combos` behave as before (#1401).
- The context publishes its own `Combo` value type and `isTwoCardInfiniteCombo` from `domain/`; Spellbook's wire shape stays in `infrastructure/spellbook-variant.ts`, the anti-corruption boundary. The route's JSON is unchanged field for field (#1445).
- The route calls one use case, `lookupDeckCombos`, built on three ports: the cache, the Spellbook budget and the combo source. It answers `ok`, `budget-exhausted` or `upstream-failed`, and the route keeps its 503, 504 and 502. No behaviour change (#1457).
- The `ComboSource` port has a hand-written in-memory fake and one contract suite that runs against the fake and against the HTTP adapter through MSW, as ADR 0005 asks (#1463).
- A nightly, advisory StrykerJS run mutates every `src/modules/*/domain/` folder (`mutation.yml`), with the Vitest runner, the TypeScript checker and a step summary; its exit code never depends on the score (#1466).
- The context has a technical README on the per-context template, a functional doc at `docs/functional/combos.md`, a module header on every file and TSDoc on every export (#1468).
- `pnpm arch` enforces the combos boundaries at error: six rules say what `domain/`, `application/`, `infrastructure/`, `testing/` and code outside the module may import; the same rules run at warn for any context still moving, and a later series closes its context by adding one name to `CLOSED_CONTEXTS` (#1470).
- #1384: characterization, no Red; five mutations each failed the tests meant to catch them; on the tip rebased onto `dev` at `67877d88`, typecheck, lint and 5,261 unit tests across 465 files passed, and the pre-push Docker E2E gate passed on push. #1401: structural, no Red; the new ESLint ban was written test first (10 of 16 failing); 5,482 unit tests across 488 files at `c378b628`, gate passed on push; a browser check of the panel and `next build` were not run. #1445: the new solitary tests failed before the modules existed, 26 pass after; 5,815 unit tests across 520 files at `acbd493c`, gate passed on push. #1457: the use-case tests failed to resolve the module, 7 pass after; 5,985 unit tests across 529 files at `b991dc7e`, gate passed on push. #1463: contract, no Red; two mutations of the adapter were caught (a dropped status failed 3 of 9, a dropped infinity flag failed the mapping); 6,029 unit tests across 531 files at `e4fa7fc8`, gate passed on push; the real Spellbook network was not called. #1466: Red observed, the summary script's test could not load its module, 6 pass after; 6,058 unit tests across 532 files at `46c83dc4`, gate passed on push. #1468: docs, no Red; 6,067 unit tests across 534 files at `05aa16ff`, gate passed on push. #1470: Red observed, 12 of 13 config tests failed against the old `.dependency-cruiser.cjs`, and six temporary violating files each tripped their rule; 6,104 unit tests across 537 files at `a4c2511c`, gate passed on push; the warn tier was proven on a probe folder only, no second context exists yet. Sonar was left to CI for all eight. The Zod request schema still sits in `domain/deck-query.ts`, and the panel's ten-card gate counts every zone while the hook counts the command zone and main deck only (B2-43).

### 2026-11-12: The builder stays open after a card is removed, the share popover is back and a revoked link stops at once, and card copies follow the deck's format

- Removing a card from a row no longer swaps the editor for "Loading deck…" for good. `Deck.cardCount` follows one rule, the rows held once the deck is loaded, and every card-list and command-zone edit keeps it so. Found by the P1-12 to P1-14 E2E journeys (#1413).
- The share popover is mounted again in the builder's action row; nothing had rendered it since the 2026-03-21 deck-notes commit, so a share link could only be made through the API. It recovers the live link on open, and revoking a link purges the share page cached under its token, so `/share/{token}` answers not-found on the next request (#1428).
- On a phone, "Import" in the header menu no longer closes the dialog it just opened: only the desktop instance renders the dialog, and the menu asks for it (#1438).
- Card copies are capped by the deck's format: a Modern deck takes four Lightning Bolt and refuses a fifth (CR 100.2a), Commander, Brawl and Oathbreaker keep one (CR 903.5b), basic lands and "any number" cards stay exempt. Before, every format was capped at one copy because the store never passed the format. An unknown stored format, inherited object keys included, falls back to Commander (#1439).
- A suggestion reply whose `suggestions` or `removals` is not a list, or that offers no usable entry and no analysis, is refused as `rejectedByValidator`: the monthly allowance unit is given back and the cost recorded. Before, the route crashed after the call was counted. Nameless entries are dropped (#1440).
- The commander banner's "Remove {name}" button takes the click; a layer above it intercepted pointer events. A new authenticated Playwright journey picks, replaces and clears a commander and a partner through the UI, with a reload after each step (#1443).
- The share page reads its deck in-process through one lookup shared with `GET /api/share/[token]`, cached under the token's tag, instead of calling the app's own HTTP API with a base URL guessed from the environment. A malformed token touches neither the database nor the cache (#1448).
- The last event of a suggestion or build stream is read even when the server ends it without a line break, and a multi-byte character split across the last two reads is decoded. One `readNdjsonLines` reader serves both streams (#1450).
- The profile page and the commander decks page read in-process too, through two lookups shared with their routes. Signed-out reads are cached for 60 seconds, signed-in reads stay fresh so `isFollowing` and the viewer's vote are never shared (#1452).
- When the card lookup does not answer during a bulk edit (timeout, network failure, Scryfall error), the dialog says so in the reader's language and keeps the list, instead of showing the browser's "signal timed out". The same line serves the import dialog and the URL import. The eight dormant locales carry the English text (#1467).
- #1413: Red observed, 4 failing tests (`{ cardCount: 2, loaded: 1, stub: true }` where the deck should stay loaded) on `abc0cb50`; on the tip rebased onto `dev` at `e2cde2c0`, typecheck, lint and 5,841 unit tests across 510 files passed, and the pre-push Docker E2E gate passed on push; the snapshot-restore journey still cuts its card through the API. #1428: Red observed on the route, the page and the popover tests (the cache tag never purged, no "Share" button); 5,995 unit tests across 521 files at `e05e97a0`, gate passed on push; the real Next data-cache purge end to end and screenshots were not checked. #1438: Red observed, 1 of 4 (`Unable to find role="dialog" and name "Import Decklist"`); 5,713 unit tests across 512 files at `6ef2419e`, gate passed on push. #1439: Red observed, 3 of 10 store tests (`expected 1 to be 4`) and 3 of 17 format tests; 5,727 unit tests across 513 files at `e94694e0`, gate passed on push; no E2E journey exists for a 60-card format. #1440: Red observed, the new stream tests crashed (`Cannot read properties of undefined (reading 'toLowerCase')`) with the usage row recorded as `ok`; 5,751 unit tests across 514 files at `f691ce82`, gate passed on push; no real provider was called. #1443: the Red is the new spec's first gate run on `b0e917b3`, 2 failed and 102 passed, `locator.click` timing out on the intercepted button; 5,760 unit tests across 515 files at `52b684c2`, gate passed on push; the partner journey depends on the server reaching Scryfall. #1448: Red observed, 8 of 10 page tests (`NOT_FOUND` with no HTTP server); 5,860 unit tests across 522 files at `940580c0`, gate passed on push. #1450: Red observed, 3 failing and the helper's file not loading; 5,868 unit tests across 523 files at `b9e56a6d`, gate passed on push; a real relay dropping the final newline was not reproduced. #1452: Red observed, 13 of 15 profile page tests (`PROFILE_UNAVAILABLE`) and the commander page tests; 5,905 unit tests across 525 files at `54871446`, gate passed on push. #1467: Red observed, the three failure cases showed "Failed to save changes.", "fetch failed" and the raw Scryfall 503 text; 6,067 unit tests across 534 files at `e5a71651`, gate passed on push; the stalled request was not replayed in a browser. Sonar was left to CI for all ten.

### 2026-11-12: Primer links are classified by origin, the playtest follows the CR for the first draw, accented commanders reach EDHREC and MTGTop8, and the search filters are announced

- A primer link is classified by its resolved origin, never its raw text: a protocol-relative `//evil.example/phish` and an upper-case `HTTPS://` link are external and open in a new tab with `rel="noopener noreferrer nofollow ugc"`; `mailto:` and other schemes render as plain text (#1417).
- The playtest follows three rules it broke: a multiplayer game draws on turn 1 (CR 103.8c) while a two-player game skips it (CR 103.8a), Brawl starts at 25 life in a two-player game and 30 in multiplayer, and mulligans go down to a hand of zero cards (CR 103.5) instead of stopping at one. The engine knows the table size, Brawl players are asked about it too, and the draw evidence follows it (#1418).
- Commander slugs transliterate accents the way EDHREC does: "Lim-Dûl the Necromancer" becomes `lim-dul-the-necromancer`, which EDHREC serves, instead of `lim-dl-…`, which it refused with a 403. The SQL twin of the slug uses the same rule under any database ctype, through a new partial expression index (#1419).
- A multi-word subtype or keyword in the advanced search is quoted (`t:"Time Lord"`, `keyword:"first strike"`), so Scryfall reads it as one term. A single word is sent unchanged, so cache keys do not move (#1437).
- The tournament tab finds a commander whose name carries a diacritic: the MTGTop8 archetype matcher folds names with the same rule as the slug, ligatures spelled out (#1442).
- The colour, Colorless and Land filters are toggle buttons with `aria-pressed`; every number, text, list and slider field of the filters panel has an accessible name from the catalogue; the "(USD)" label goes through the catalogue; the History panel's chevron is a named disclosure (#1451).
- `/rules/game-changers?page=3` opens page 3. The reset to page 1 ran on mount and rewrote the URL; it now runs only when the tab or the search changes, and a page beyond the last one still lands on page 1 (#1459).
- A public deck whose commander row is missing is still listed on the commander's deck page, named after its `commanderName` with the card back as image, instead of breaking the page. Such decks could be left behind by the pre-#1444 three-request save (#1460).
- The tournament tab shows no deck for a commander MTGTop8 does not know, instead of the five most recent decks of the whole site: the adapter reads the card filter the site echoes and treats an ignored filter as no result (#1462).
- A buy / proxy / later choice made before the saved intents arrive stays on screen when they load; switching decks never shows another deck's choices, an unreadable answer resets to empty, a stale save of the old deck cannot write into the new one, and a failed save shows an error toast. The eight dormant locales carry the English text (#1464).
- **Owner actions.** Apply `prisma/migrations/20261111210000_commander_slug_transliterates_accents/migration.sql` with `prisma migrate deploy` before deploying: it creates the expression index the commander deck page's slug query uses, and the old index from `20260819210000_denormalise_deck_commander` can be dropped once it is applied (#1419).
- #1417: Reds observed per commit (`expected <a> to be null` for `mailto:`, `href="//evil.example/phish"` where the canonical URL was expected); on the tip rebased onto `dev` at `b6ef3173`, typecheck, lint and 5,866 unit tests across 508 files passed, and the pre-push Docker E2E gate passed on push. #1418: Reds observed per rule, one `fix:` commit each; 5,882 unit tests across 508 files at `de6c1aa2`, gate passed on push; not checked in a browser. #1419: Red observed (`expected 'lim-dl-the-necromancer' to be 'lim-dul-the-necromancer'`, and the SQL twin test); 5,893 unit tests across 508 files at `3a0cec8d`, gate passed on push; the expression was verified on the repository's Alpine PostgreSQL image, not on Supabase's build. #1437: Red observed, 7 of 93 (`expected 't:Time Lord legal:commander' to contain 't:"Time Lord"'`); 5,709 unit tests across 511 files at `580bf080`, gate passed on push; no live Scryfall request. #1442: Red observed, 4 of 22 parser tests and the route test; 5,760 unit tests across 515 files at `19df47e9`, gate passed on push. #1451: Red observed (`expected null to be 'false'` on `aria-pressed`, 13 unnamed fields); 5,873 unit tests across 524 files at `bb77e6c6`, gate passed on push; no screen-reader pass. #1459: Red observed, 3 of 34 (page 1 shown for a `?page=2` link); 5,995 unit tests across 529 files at `1bcf393b`, gate passed on push; no rules-page Playwright spec exists. #1460: Red observed (`expected undefined to deeply equal { artCropUri: "", imageUri: "", name: … }`); 5,997 unit tests across 529 files at `bb825020`, gate passed on push; the production count of such decks is the owner's to run. #1462: Red observed, 1 of 44 replay tests and the new parser tests; 6,008 unit tests across 529 files at `fadd27b4`, gate passed on push; whether MTGTop8 matches slug words without punctuation was not recorded. #1464: one Red per commit on the pinned COL-02 tests; 6,036 unit tests across 531 files at `764f22a5`, gate passed on push; the toast was asserted on the store, not rendered. Sonar was left to CI for all ten.

### 2026-11-12: SonarCloud's findings are cleared and two of its rules move into ESLint, and the pre-commit hook leaves the git stash alone

- Four status messages render in a native `<output>` and three button groups in a `<fieldset>`, keeping their accessible names and live-region behaviour; the fork credit link moves to module level. These were Sonar's eight open `S6819` and `S6478` findings under `src/components` (#1421).
- The fifteen `src/lib` issues Sonar reported are fixed, several of them real defects: two regexes that read rules text in quadratic time (ReDoS, S8786) now read it once, the AI price table no longer throws on an empty rate list, and replaced command-zone rows are deleted concurrently. One documented `NOSONAR` exception stays on the guest-claim hash (#1422).
- Two more passes clear the findings in the shared test kit: the fakes settle their failures through one `prismaQuery` helper so a refusal still rejects and never throws at the call, `asStoredJson` uses `structuredClone`, the `useMsw` alias is gone in favour of `setupMsw`. Every suite that uses the doubles passes unchanged (#1420, #1435).
- ESLint now catches two of the three kinds of finding Sonar kept reporting after each push: `jsx-a11y/prefer-tag-over-role` and `react/no-unstable-nested-components` run at error on every file. The share popover becomes a native non-modal `<dialog>`, the commander banner a `<fieldset>`, the save indicator an `<output>`, and the builder's resize handle a focusable `<hr>` window splitter. The third kind, the deprecated `VALID_CATEGORIES` alias #1424 had left, is removed with its four importers moved to `CARD_CATEGORIES` (#1436).
- The builder's search-query characterization no longer times out on CI: it reads button names directly and proves "no search was sent" by request order instead of a timed wait. No pin was weakened (#1415).
- `.husky/pre-commit` runs lint-staged with `--no-stash`: its default backed the tree up into the git stash on every commit, and that stack is shared by every worktree and every agent committing at the same time. Partially staged files stay protected by lint-staged's patch file (#1425).
- #1415: the Red is CI run 43139765594 timing out at 5000 ms, reproduced locally three times out of three under load; on the tip rebased onto `dev` at `4d486091`, typecheck, lint and 5,841 unit tests across 510 files passed, and the pre-push Docker E2E gate passed on push; CI timing itself is verified only by the next CI run. #1420: Red observed on the new `prismaQuery` helper (a naive body threw at the call); 5,909 unit tests across 510 files at `1abbd49c`, gate passed on push. #1421: Red observed (`expected <div role="group"> to be an instance of HTMLFieldSetElement`, and the status announcements); 5,916 unit tests across 510 files at `bdc4d215`, gate passed on push; visual rendering and real screen readers were not checked. #1422: Reds observed, two regex timing tests (`expected 1060.6 to be less than 100`) and `Reduce of empty array`; 5,954 unit tests across 513 files at `1e1233f4`, gate passed on push; the Prisma contract case needs a database. #1425: Red observed (`expected 'pnpm exec lint-staged' to match /\s--no-stash(\s|$)/`); 5,959 unit tests across 516 files at `e07637dd`, gate passed on push. #1435: Red observed (`expected [ 'setupMsw', 'useMsw' ] to deeply equal [ 'setupMsw' ]`); 5,694 unit tests across 509 files at `3277a887`, gate passed on push; two `S9382` findings in the AI route kit stay open on purpose until accepted in SonarCloud. #1436: Red observed, 3 of 5 parity lint tests per rule before each was enabled; 5,702 unit tests across 511 files at `a1a07fc5`, gate passed on push. Each of these PRs cites the SonarCloud analysis it answers (`c3df4bf8` on 2026-11-11, `9b86da43` and `a1a07fc5` on 2026-11-12); none re-ran Sonar locally, and the re-analysis was left to CI.

### 2026-11-12: Dead code leaves: unused exports, hooks, scaffolds, the orphaned UI, and the favourites and templates tables

- Exports nothing imports are deleted or un-exported, with the 40 tests that covered only them; `eslint-suppressions.json` shrinks where the deleted code held the only breach. An advisory `dead-exports-report.ts` found the candidates (#1410).
- Eight modules with no importer outside their own test are deleted: `useCardFlip`, `useCardLookup`, `useDeck`, `useScrollReveal`, `useTypewriter`, the never-mounted `EnrichmentProvider` and `CollectionProvider`, and the placeholder Sidebar with its only string. The docs that named them now match the code (#1416).
- The deck store loses `markGameChanger` and `markBanned`, the deck client `updateCardMaybeboard` and `removeAllCards`, and the validation module its duplicate create schema. The store inventory test from #1376 is the Red (#1431).
- The unused library scaffolds go, under owner decision OD-02: eight modules nothing imports (archetypes, challenges, the recommendation engine, shortcuts, versioning, the stats export, benchmarks and deck analytics) and the `validateDeck` engine that no production code called. 3,918 lines removed, 231 added; `sortedUniqueNames`, the one export with a caller, moves to its own module (#1432).
- The six orphaned components (maybeboard panel, format selector, pricing shopping list, budget optimisation, onboarding tooltip, templates modal), the favourites and templates API stubs, `FavoriteButton` and their catalogue blocks are deleted, and a migration drops the four tables nothing wrote to: `CardFavorite`, `FavoriteList`, `CardInFavoriteList` and `DeckTemplate`. The route-policy table matches the 65 route files left (#1433).
- **Owner actions.** Apply `prisma/migrations/20261112073000_drop_favorites_and_deck_template/migration.sql` with `prisma migrate deploy`; check the row counts of the four tables first, because `DROP TABLE` loses whatever they hold (#1433).
- #1410: structural, no Red; on the tip rebased onto `dev` at `abc0cb50`, typecheck, lint and 5,770 unit tests across 507 files passed, and the pre-push Docker E2E gate passed on push; the report script has no tests. #1416: structural, no Red; 5,816 unit tests across 505 files at `045d0eda`, gate passed on push. #1431: Red observed on the store inventory (`+ "markBanned", + "markGameChanger"`); 5,992 unit tests across 525 files at `f9d3d972`, gate passed on push. #1432: structural, no Red; 5,811 unit tests across 517 files at `b8d1c130`, gate passed on push. #1433: the two Reds are the repository's own guards, the catalogue key-parity test and the route-policy table, each failing until the deletion was complete; `prisma validate` and `prisma generate` pass; 5,685 unit tests across 509 files at `c7b539b4`, gate passed on push. None of the five ran `next build` locally. Sonar was left to CI. `docs/engineering/technical.md` still lists `og/` under `src/app/api/`, and `docs/engineering/dx-ci-overview.md` still lists `promoteToCommander` under "missing tests".

### 2026-11-12: Structural slices with no behaviour change: one home each for Prisma helpers, Scryfall constants, enums and guards, and the header's deck actions load lazily

- The Prisma P2002 check has one home, `isUniqueViolation`, instead of three copies, and `toJsonPayload` moves next to it (#1407).
- Scryfall's API origin, image host and symbol URL live in one `constants.ts`, and one `isScryfallId` validator replaces the hand-written UUID patterns; every URL is byte-identical (#1408).
- A `CatalogCard` type and `toCatalogCard` mapper translate Scryfall JSON into the product's own card, as ADR 0004 asks; no consumer uses them yet (#1409).
- The card catalog owns its shared-cache lookups: `lookupCardCache` and `lookupSearchCache` leave the deck-building HTTP client, so the catalog no longer imports deck building (#1423).
- Card categories and pairing types are declared once as readonly tuples that the Zod schemas and the OpenAPI document read, and `CardFace` is declared once (#1424).
- Card conditions, the five colours and `C`, the formats and the zones each have one home that the schemas, the OpenAPI document and the add dialog read; `isRecord` and `isRecordOrArray` replace nine private copies; one `downloadTextFile` serves every export (#1427).
- The header's "New Deck" and "Import" actions load as a lazy slot, so the thirteen public pages no longer ship the deck store in their first bundle. First, a behaviour fix: a failed deck creation from the header now shows why and re-enables the button, in all ten locales (#1429).
- `InitProvider` hands the bootstrap payload to a callback the composition root wires, so identity no longer imports the collection store; the three TanStack stale times live in one module; `ButtonLink` renders the button variants as a localized link for the landing's three pills (#1430).
- The four meta types leave the fetch module into `src/lib/meta/types.ts`, which removes a type-only cycle from the dependency-cruiser baseline (13 to 12 known violations) (#1453).
- The playtest session's result and difficulty sets are declared once with typed guards, and eight casts go; a stored row outside the sets is skipped and logged instead of read untyped (#1456).
- #1407: the extracted function's test failed before the module existed; on the tip rebased onto `dev` at `66ed15c1`, typecheck, lint and 5,772 unit tests across 505 files passed, and the pre-push Docker E2E gate passed on push. #1408: the two new test files failed to resolve their modules; 5,789 unit tests across 507 files at `020a7fd0`, gate passed on push. #1409: three Reds in order (module missing, a reversible card refused, an unknown legality status refused); 5,810 unit tests across 508 files at `db34e908`, gate passed on push. #1423: the moved tests failed to resolve the new module; 5,954 unit tests across 514 files at `9b86da43`, gate passed on push. #1424: Red observed (`CARD_CATEGORIES is not iterable`, and `tsc` errors on the missing exports); 5,957 unit tests across 515 files at `98baddb3`, gate passed on push. #1427: the new tests failed before each module or export existed; 5,985 unit tests across 520 files at `5a688721`, gate passed on push; no real browser run of a download. #1429: Red observed on the header (`expected [] to deeply equal [ ObjectContaining{…} ]`, with two unhandled HTTP 500 and 503 rejections); 5,997 unit tests across 521 files at `f4d505d1`, gate passed on push. #1430: Red observed on the provider test (`expected "spy" to be called 1 times, but got 0 times`); 6,009 unit tests across 525 files at `6ea6e4be`, gate passed on push; no pixel comparison of the landing. #1453: structural, no Red; `pnpm arch` reported one stale baseline entry until the shrink; 5,905 unit tests across 525 files at `06970e53`, gate passed on push. #1456: structural, no Red; 5,978 unit tests across 528 files at `b98ad1c6`, gate passed on push. Sonar was left to CI for all ten.

### 2026-11-12: The shared test kit renders every component test, the AI prompts and streams are approved byte for byte, and the E2E stack answers Scryfall from recorded fixtures

- The full prompts of `POST /api/ai/suggest` and `POST /api/ai/build` are approved as text files (9 and 8 representative requests), and the exact NDJSON streams as golden files, so a prompt or stream change shows as a text diff. Edge paths are pinned: 401, the rate limit, invalid JSON, the monthly allowance, a provider 500, a non-JSON reply, the 45-second timeout (#1406).
- The search filters panel is characterized: every control's name, role and description, the exact Scryfall query of 26 filter combinations recorded at the wire by MSW, and the builder's query handling (#1412).
- One render helper, `renderWithProviders`, mounts next-intl with the real catalogues of both locales (`auth` included), a fresh no-retry query client and an optional session; shared `aDeck`, `aDeckCard` and `aScryfallCard` builders replace the hand-rolled ones. Thirteen files moved first (#1414), then the deck, community and layout tests (#1446), the remaining components and hooks (#1449), and the last three files, with an ESLint rule that refuses a new hand-rolled provider (#1461). Every moved test keeps its name, assertions and count.
- The three deck editor specs find every control by role and accessible name, and six new journeys cover snapshots, the bulk edit, a printing swap, export, the share link and the collection. Two small product fixes came with them: the view-mode buttons sit in a toolbar named "Deck view" with `aria-pressed`, and the commander banner is a group named after its card (#1426).
- The Game Changers and banlist page is characterized with 30 sociable tests through MSW, pinning three oddities for later fixes (#1447).
- The acquisition-intent hook is characterized (21 tests), pinning three behaviours that lose a player's choice, which #1464 then fixed (#1454).
- The EDHREC and MTGTop8 adapters replay pages recorded on 2026-11-12 (44 tests), trimmed and documented, instead of hand-written payloads (#1455).
- The E2E stack no longer reaches live Scryfall: a stand-in service built from the recorded fixtures answers the server through `SCRYFALL_API_BASE_URL`, and the browser specs stub `api.scryfall.com`. The two specs that test Scryfall's data are tagged `@external`. With the variable unset the app calls `https://api.scryfall.com` exactly as before (#1469).
- #1406: characterization, no Red; four one-line route changes failed 22 of 81 approvals; on the tip rebased onto `dev` at `91c91d41`, typecheck, lint and 5,764 unit tests across 504 files passed, and the pre-push Docker E2E gate passed on push; no real provider was called. #1412: characterization, no Red; three mutations each failed their pins; 5,830 unit tests across 509 files at `77e8b5f7`, gate passed on push. #1414: the helpers were written test first (`Failed to resolve import "@/test/render"`); 5,845 unit tests across 511 files at `e2cde2c0`, gate passed on push. #1426: Red observed on the two accessible names (`Unable to find … role "toolbar" and name "Deck view"`); 5,961 unit tests across 516 files at `144b878f`, gate passed on push with the new journeys. #1446: structural, no Red, same tests and same counts before and after; 5,815 unit tests across 520 files at `6e3acb4e`, gate passed on push. #1447: characterization, no Red; three mutations were caught; 5,845 unit tests across 521 files at `1d354697`, gate passed on push. #1449: Red observed on the kit (`renderWithIntl` lost its provider on rerender); 5,861 unit tests across 522 files at `3b657610`, gate passed on push. #1454: characterization, no Red; mutation proofs recorded; 5,926 unit tests across 526 files at `4fa32986`, gate passed on push. #1455: contract, no Red; two mutations (inclusion inverted, day and month swapped) were caught; 5,970 unit tests across 527 files at `7a52e1ca`, gate passed on push; the live sites after the recording date are not covered. #1461: Red observed on the new ESLint rule (3 of 15); 6,002 unit tests across 529 files at `278fe8ac`, gate passed on push. #1469: two Reds observed, the base-URL module and the stand-in failing to resolve; 6,091 unit tests across 536 files at `ed56b1c9`, gate passed on push; the `@external` specs were not run outside Docker. Sonar was left to CI for all eleven.

### 2026-11-11: Phase 1 of the clean-code programme: characterization nets over the store, the routes, the builder, the wizard and the community pages, and four structural slices

- The playtest engine takes its randomness and clock as ports, pinned by 46 characterization tests and a golden game replayed byte for byte; six pins name the B2 rows that will flip them (#1357).
- The E2E suite gains a `seededDeck` fixture whose teardown survives a connection reset and deletes every booked deck (#1364), and every mid-test idempotent read retries once on `ECONNRESET` while writes never do (#1370). Both answer gate failures seen on 2026-11-10 and 2026-11-11.
- The deck store's surface is pinned: exactly 14 state fields and 48 actions, the persisted sort preference and the guest deck (#1376); the exact save payload of seven actions and the whole request sequence of a command-zone change (#1377); a 75-test truth table of `isSyncing` across concurrent writes, which shows 17 writes the flag does not count (#1383); the three raw-`fetch` actions at the HTTP boundary, and one shared in-memory fake of the deck API for every store test (#1403).
- Every API route declares its auth policy in one table of 67 route folders, run against the real guards with only the session and the database replaced (#1379); the five 400 shapes, the 403 and the 404 bodies are pinned (#1380); deck folders, duplicate (#1381), snapshots and the OpenAPI route (#1382) get their first direct tests.
- Today's rule divergences are pinned side by side on one fixture deck: Game Changer counts, colour identity scope, land count, price scope and the shared page's numbers (#1396); a 13-input corpus pins where the paste and URL decklist parsers disagree, with the OD-04 note for each (#1399).
- The builder page shell and `DeckEditor` (#1402), the AI deck wizard flow with a recorded Scryfall fixture (#1404), and the decks page, the header, the primer and the commander slug's SQL twin (#1405) are characterized before their splits.
- Structural, no behaviour change: the game constants leave the playtest engine (#1394); a small route kit serves the 429 answer, failure logging and route params in nine routes (#1395); the analysis result types leave the core deck types, removing eight type-only cycles from the baseline (#1397).
- #1357: characterization and structural, no Red; the golden transcript was approved by hand; on the tip rebased onto `dev` at `6f5c62f5`, typecheck, lint and 4,571 unit tests across 439 files passed, and the pre-push Docker E2E gate passed on push. #1364: the Red is the gate failure of 2026-11-10 (`apiRequestContext.delete: read ECONNRESET`), reproduced with a throwaway reset server; 4,681 unit tests across 449 files at `3b46bb0a`, gate passed on push. #1370: the Red is the gate failure of 2026-11-11 09:12, reproduced the same way; 4,711 unit tests across 450 files at `b73fdf18`, gate passed on push. #1376, #1377, #1383: characterization, no Red; three, four and five mutations each failed their rows; 4,756 unit tests across 452 files at `97b988d3`, 4,766 across 453 at `90c27705` and 5,211 across 462 at `719bf74a`, gate passed on push. #1379, #1380, #1381, #1382: characterization, no Red; three mutations each; 5,047 across 455 at `360408ef`, 5,081 across 456 at `237d09a5`, 5,104 across 458 at `2caa93e2` and 5,136 across 461 at `a7b071ad`, gate passed on push. #1394: structural, no Red; 5,361 across 478 at `15fa54b8`. #1395: the route kit's tests failed before the module existed; 5,380 across 480 at `8379ccd1`; `next build`'s route-type check was not run. #1396, #1399: characterization, no Red, expected values derived from the code before the first run, five and three mutations caught; 5,395 across 481 at `8d4035e0` and 5,423 across 482 at `f9439209`. #1397: structural, no Red; 5,395 across 481 at `8663fad8`. #1402, #1403, #1404, #1405: characterization, no Red, mutations caught; 5,522 across 490 at `23fc965e`, 5,569 across 494 at `c3df4bf8`, 5,594 across 495 at `ad7446ba` and 5,660 across 497 at `db3d45fb`. Every PR in this batch reports typecheck and lint clean and the gate passing on push; Sonar was left to CI. Not verified: the wizard's Playwright journey (not written), the SQL side on production's ctype (recorded on the repository's PostgreSQL image only), and real CSS visibility of the mobile panels (jsdom).

### 2026-11-11: Phase 0 of the clean-code programme: ESLint 9 and a lint ratchet, server-only markers, a dependency-cruiser gate, a move codemod, MSW, typed mocks, the E2E suite in CI and a coverage ADR

- A repository test fails when a `vi.mock` path no longer resolves, so a moved module can no longer be silently un-mocked (#1350). Every `vi.mock` factory is type-checked: 315 of 374 string mocks moved to `vi.mock(import("…"))`, 169 partial factories fixed through a typed `stubPrisma` and an i18n navigation stand-in, and four test-hygiene lint rules run with a baseline (#1386).
- `pnpm lint` runs ESLint 9 with a flat config and `--max-warnings 0`; `next lint` and `.eslintrc.json` are gone, the rule set is unchanged file by file (#1351). The ratchet then enforces 300 lines per module and 200 per component, 80 per function, complexity 15, depth 3, three parameters, no `as` and no `!`, and the phase-1 import boundaries, with today's breaches recorded in `eslint-suppressions.json` (#1367).
- Fifteen server modules import `server-only`, so a client component that reaches Prisma, the Auth.js config or a Node built-in fails the build; Vitest aliases the package to an empty stub (#1356). `pnpm arch` runs dependency-cruiser over two graphs with a known-violations baseline of 11 layer edges and 3 type-only cycles, and the `client-not-server` rule names the import chain of a leak (#1365).
- `pnpm refactor:apply-moves` moves files from an ordered map with `git mv`, rewrites every specifier under `src/`, `e2e/` and `scripts/`, `vi.mock` strings included, and is idempotent (#1368); it then also rewrites root configs, reports old paths in docs and coverage patterns a move leaves, and guards temporary re-export shims (#1389).
- MSW 3 arrives with one `useMsw` helper that fails a test on any request no handler serves, and the Spellbook route test is the first to use it (#1378).
- The E2E suite runs in CI on PRs into `staging` and `main` and nightly on `dev`, against a server built once with `next build` instead of `next dev`; the pre-push gate uses the same stack, in one Playwright invocation (#1372).
- The stale agent rules that described another product are rewritten for this app, and the skills, the gate and the PR template are aligned (#1354). ADR 0010 records the coverage scope by layer: Sonar excludes `src/modules/*/ui/**` like `src/components/**`, and Vitest floors of 90% for `domain/` and 80% for `application/` are armed before any module moves (#1392).
- #1350: Red observed, 5 of 12 against a stub scanner; on the tip rebased onto `dev` at `f57cdace`, typecheck, lint and 4,456 unit tests across 433 files passed, and the pre-push Docker E2E gate passed on push. #1351: tooling; a probe warning exited 0 before and 1 after; rule sets compared file by file; 4,456 across 433 at `526169d9`. #1354: docs and comments, no Red; 4,506 across 434 at `1cb7d843`. #1356: Red observed, two suites failed with "This module cannot be imported from a Client Component module" before the alias; 4,508 across 436 at `0cdb1175`. #1365: tooling; scratch violations made the gate exit 4; 4,672 across 448 at `2782f018`. #1367: tooling; scratch probes failed each rule; 4,672 across 448 at `5dda7aa7`. #1368: Red observed (`Cannot find module './move-map'`), then a second Red on the baseline rewrite; 4,711 across 450 at `6c5632aa`. #1372: tooling; the toolchain documentation guard went red on the two new variables; 4,713 across 450 at `a3250bfa`. #1378: Red observed (`Failed to resolve import "@/test/msw"`), three deliberate breakages caught; 4,781 across 454 at `34eaafd5`. #1386: Reds observed on the two stand-ins and the hygiene rules; 5,306 across 471 at `cba29df8`. #1389: Red observed (`Cannot find module './migration-guard-rule.mjs'`, and the config rewrite tests); 5,339 across 474 at `08a3d6ce`. #1392: docs and two configuration lines; a throwaway module proved the floors (`Coverage for lines (44.44%) does not meet … threshold (90%)`); 5,349 across 475 at `4ecfc624`. Every PR in this batch reports typecheck and lint clean and the gate passing on push; Sonar was left to CI. #1392 records that a local `pnpm sonar` publishes its scan as `main` because `scripts/sonar.mjs` sets no branch name, and that three such scans on 2026-11-11 came from a feature worktree. Not verified: `.husky/pre-push` does not run `pnpm arch` (CI and the pre-PR gate do), and 59 string mocks stay in the baseline because their real type cannot be met without a cast.

### 2026-11-11: ADRs, the context map and the glossary; the roadmap grows from I-38 to I-98; the architecture audit and target structure

- Documentation only. `docs/adr/` holds ADRs 0001 to 0009 (modular monolith, entry points, a pure domain, anti-corruption layers, fakes and contracts, the comment standard, staged enforcement, English only, legality as a report), `docs/engineering/architecture.md` the C4 view, the context map and the layer rules, `CONTEXT.md` the glossary of each bounded context, and `code-documentation.md` the comment standard (#1353).
- The roadmap gains I-38 to I-79, the owner and legal registers, the three audits and the merges up to #1342 (#1366), then I-80 to I-98. Every initiative's detail moves into its own spec under `docs/product/specs/`, 30 specs created and 68 extended, so the roadmap is the index (#1373).
- `docs/architecture/audit-2026-11.md` measures `dev` at `95b5197f`: file sizes, complexity, cycles, the Prisma transaction and version gaps and v8 coverage; `target-structure.md` gives the `src/modules/<context>/` tree and a 12-step sequence (#1385).
- #1353: no Red; on the tip rebased onto `dev` at `90e6e0d6`, typecheck, lint and 4,506 unit tests across 434 files passed, and the pre-push Docker E2E gate passed on push. #1366: no Red; Prettier clean and 0 broken links across the changed files; 4,681 unit tests across 449 files at `1302e5f8`, gate passed on push. #1373: the only code change is a Scryfall stub in one AI build route test that timed out on CI (run 43028423672); 24 of 24 pass; no full `pnpm test`; the gate was skipped with `SKIP_E2E=1` because Docker was not available, and Prettier was not run on the spec files. #1385: docs only; `vitest run --coverage` on the parent commit gave 5,261 tests across 465 files and 83.09% statements, cited in the audit; the gate was skipped with `SKIP_E2E=1` because Docker was not installed. Sonar was left to CI or not run for all four.

### 2026-11-11: The image proxy refuses redirects and is rate-limited, CSV exports neutralise formulas, the CDN keeps shared Scryfall answers, the fonts are self-hosted, and Scryfall calls get a timeout, quote-safe lookups and the published pacing

- `GET /api/proxy-card-image` no longer follows a redirect from `cards.scryfall.io` to another host (a 3xx answers 502 and the target is never requested), and each client gets 300 requests a minute (#1371).
- Every CSV the app lets a player download neutralises a cell that starts like a formula (`=`, `+`, `-`, `@`, tab, line breaks) with a leading quote, through one `csvText` helper: the acquisition plan, the collection, the pricing shopping list and the deck statistics (#1374).
- The two shared Scryfall cache routes answer with `Cache-Control: public, s-maxage=<TTL>, stale-while-revalidate=60` on a 200, so Vercel's CDN serves repeat lookups; 400, 404, 429 and 502 carry no caching header (#1375).
- Inter and Geist load from WOFF2 files committed under `src/styles/fonts/`, so `next build` never contacts Google Fonts, whose unparsable CSS had failed two CI jobs; Geist Mono, which nothing rendered, is dropped (#1387).
- Every Scryfall request aborts after 10 seconds, counted from when it leaves the queue, and the server sends one documented User-Agent; a hung request no longer stalls every call after it (#1388). An exact-name term for a name holding a double quote uses single quotes, so the printing selector works for `Henzie "Toolbox" Torre` (#1390). Requests to `/cards/search`, `/cards/named`, `/cards/random` and `/cards/collection` start 500 ms apart, the manifest 6 seconds, everything else 100 ms, following Scryfall's published limits read on 2026-11-10 (#1391).
- #1371: Reds observed (a redirect answered 200 where 502 was expected, and `expected 200 to be 429`); on the tip rebased onto `dev` at `e35c3f40`, typecheck, lint and 4,713 unit tests across 450 files passed, and the pre-push Docker E2E gate passed on push. #1374: one Red per exporter; 4,735 across 451 at `b36121ab`, gate passed on push. #1375: two Reds observed (`expected null to be 'public, s-maxage=3600, …'`); `pnpm arch` clean; 4,723 unit tests across 450 files, and the gate passed on push with 83 Playwright tests in 3.6 min; it names no `dev` tip. It records 34 open SonarCloud issues on the default branch, none in its files, and was opened with `SONAR_GATE_OVERRIDE=1`. #1387: Red observed, three font tests (`+ [ "Geist", "Geist_Mono", "Inter" ]`); 5,309 across 471 at `3b685b10`, gate passed on push. #1388: Reds observed on the browser and server header tests and the timeout; 5,315 across 472 at `7f323846`, gate passed on push. #1390: Reds observed (`expected '!"Henzie "Toolbox" Torre" game:paper' to be '!\'Henzie …'`); 5,342 across 474 at `b91a02f9`, gate passed on push. #1391: Reds observed (`expected [ +0, 100 ] to deeply equal [ +0, 500 ]`, then `6000`); 5,349 across 475 at `548f41de`, gate passed on push. Sonar was left to CI for all seven. Nothing backs off after a Scryfall 429 yet, and each Vercel instance paces itself.

### 2026-11-11: Card writes are atomic, decks are versioned, and exact draw odds arrive

- The four single-card handlers write the card row and the deck's `updatedAt` in one transaction through `writeDeckCards`, and the printing-swap merge runs its update and delete in one transaction, so a failure leaves nothing half-stored. Production `$transaction` call sites go from 7 to 9 (#1393).
- `Deck.version` arrives, with a `DeckRepository` port and a Prisma adapter that claims the next version, writes the card row and answers `saved`, `stale` or `not-found` in one transaction. A card write that names an outdated `expectedVersion` is refused with 409 and stores nothing; a write without it proceeds. The client did not send the version yet; #1471 added that (#1400).
- Draw odds: `chanceOfAtLeast` gives the exact hypergeometric chance that the cards drawn hold at least N matching cards, with no randomness; the committed I-97 example (three or more of 36 lands in seven cards from 99) is 26,736,733 / 53,358,536, about 0.5011. A question with no answer returns `unknown` with a reason instead of a zero, and the chance is capped at 1. No UI yet (#1398).
- **Owner actions.** Apply `prisma/migrations/20261111190000_add_deck_version/migration.sql` (`ALTER TABLE "Deck" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0`) before deploying; a deployment without it breaks every card write (#1400).
- #1393: Reds observed on the new atomicity tests (the merged row kept while the source row was still stored; the card kept when the deck update fails); on the tip rebased onto `dev` at `5223b40d`, typecheck, lint and 5,359 unit tests across 477 files passed, and the pre-push Docker E2E gate passed on push; a real PostgreSQL rollback is modelled by the fakes, not run. #1400: Reds observed (`expected 201 to be 409`, `expected { status: 500 } to deeply equal { status: 409 }`); `prisma migrate deploy` applied every migration and the new one re-ran as a no-op; 5,463 unit tests across 486 files at `1ee6fc3f`, gate passed on push; the migration on production data and the PostgreSQL contract in CI (no Postgres service yet) were not verified. #1398: five Reds observed in order (module missing, then `NaN` and `+0` where `unknown` was expected); `pnpm arch` clean; 5,409 unit tests across 483 files on the branch rebased onto `8663fad8`, and the gate passed on `e9bb9c09` with 84 Playwright tests in 3.9 min. Sonar was left to CI for all three.

### 2026-11-11: The orphaned deck-editing controls return (badges, row controls, deck details, Collection only), the deck image is built from stored data, public deck reads are rate-limited, and a plain-language search shows its Scryfall query

- `GET /og/deck/{id}` renders the 1200×630 deck image from stored data only (name, commander and partner, colour identity, card count, author), and the deck page points Open Graph and Twitter at it; the old `/api/og` route, which drew any text a caller passed under the product's name, is removed. A private or missing deck gets the generic image, with the same bytes in each case (#1358).
- The list view shows **Owned** or **Buy** on each row again, counted per printing and silent for basic lands and empty collections; the badge had been dropped by commit 95c93075 (#1359). The "Collection only" search toggle filters results to cards the player owns, by Oracle card across printings, and tells a guest to sign in; it had done nothing since f77eeb30 (#1360).
- Inline card notes and the row's quantity stepper, "set as commander" crown and "change printing" button are back on each list row, with the stepper's limit following `maxQuantity` (#1361). A "Deck details" panel at the top of the analysis sidebar mounts the tags, description, target bracket (1 Exhibition to 5 cEDH) and budget-per-card editors, whose store actions had no screen (#1362).
- `GET /api/deck/[id]` allows 60 reads a minute per client, and the public deck page reads the deck in-process instead of over HTTP, so a deck turned private disappears from its page at once (#1363).
- A signed-in player can describe a card in English or French; `POST /api/search/translate` answers one Scryfall query, shown in an editable field before anything runs, with the deck's format and colour identity added and a warning when an edit drops them. A new monthly `translate` allowance of 60 applies. Without a provider key the control stays hidden (#1369).
- #1358: Red observed, 3 failing tests across 3 files (the art-crop URL where `/og/deck/deck-1` was expected); on the tip rebased onto `dev` at `a8acaafa`, typecheck, lint and 4,605 unit tests across 442 files passed, and the pre-push Docker E2E gate passed on push. #1359: Red observed (`Unable to find an element with the text: Owned.`), then four deliberate mutants checked; 4,617 across 443 at `083248df`, gate passed on push. #1360: Reds observed at the hook and component boundaries; 4,649 across 447 at `9f10f4f1`, gate passed on push. #1361: one Red per `fix/` commit on the 19-test row-actions file; 4,668 across 448 at `dca5fccd`, gate passed on push. #1362: one Red per test, run alone before its change; 4,681 across 449 at `48cc3aa2`, gate passed on push. #1363: Red observed (`expected 200 to be 429`); 4,640 unit tests across 446 files, and the gate passed on push with 76 then 8 Playwright tests, no flaky test; it names no `dev` tip. #1369: Red observed on the sanitizer and the colour-identity check; 4,733 unit tests passed on its first commit, `pnpm build` passed, and SonarCloud passed the quality gate on `b1045412` with 0 new issues and 89.7% coverage on new code; Docker E2E on that commit gave chromium 76/76 and authenticated 8/9, the failing heading test was fixed in `995482f3`, and the body records no rerun of its own. Sonar was left to CI for the other six. The AI wizard's chosen bracket is still not saved on the deck, and the per-deck shopping list still ignores the companion.

### 2026-11-11: Decks are scored against the official Brackets 1 to 5, AI use is metered with a monthly allowance, card notes save again, and six rules fixes

- The bracket definitions carry the five official Commander Brackets (Exhibition, Core, Upgraded, Optimized, cEDH) with their Game Changer, mass land denial, extra turn, two-card combo and turn rules; a two-card infinite sets a floor of Bracket 3, not 4, and the "(RC rule)" wording is gone. The tutor dimension is removed. The wizard and the indicator offer Bracket 5 (#1343).
- Every AI call goes through one metered module that records an `AiUsage` row (tokens, cost, outcome) and counts against a monthly allowance per user: 10 builds and 30 suggestion calls per UTC month by default, a global spend ceiling of 20 USD, each overridable by environment variable. The allowance is claimed before the model is asked and given back when the call fails on our side. `GET /api/ai/allowance` reports it (#1344).
- Card notes save again. `patchCardSchema` had no `notes` key since commit 35958094, so the route dropped the note and answered 200; it now accepts up to 1,000 characters or `null` (#1347). Edited collection quantities stay on screen: the client read the route's envelope as a card and rolled back (#1348). The acquisition plan keeps both commanders of a partner pair or a Background (#1346).
- Snow-covered basics count as basic lands everywhere, through one `isBasicLand` reading the supertypes (CR 205.4c); thirteen copies of `includes("basic land")` missed them, so the copy limit, the AI build, packages and the shopping list all mis-handled them (#1349). Commanders pair only as their partner abilities allow (CR 702.124h to m): "Partner with" cards must name each other, Doctor's companion needs a Time Lord Doctor, a Background needs a commander that chooses one, and one rule serves the store, the bulk edit, the AI check and the API (#1352).
- Apostrophes and quotes stay in card names sent to the model, so "Urza's Saga" is no longer "Urzas Saga"; the sanitizer collapses whitespace and control characters instead of stripping punctuation, and the one quoted prompt value is JSON-encoded (#1355). Localized private pages leave robots: `/fr/share/`, `/fr/builder/` and `/fr/collection` were open to crawlers, and `/collection` now matches the page itself (#1345).
- **Owner actions.** Apply `prisma/migrations/20261109120000_add_ai_usage_metering/migration.sql`, which creates `AiUsage`, `UsageCounter` and `AiMonthlySpend`; it was validated and generated with a placeholder `DATABASE_URL` and applied to no database (#1344).
- #1343: Red observed, 17 failing tests across 7 files, three at import; on the tip rebased onto `dev` at `0d653c15`, typecheck, lint and 4,295 unit tests across 420 files passed, and the pre-push Docker E2E gate passed on push. #1344: Reds observed on the pure modules, then 17 failing route tests (`expected 200 to be 429`); 4,349 across 426 at `4fc24d8a`, gate passed on push; a PostgreSQL test of two concurrent claims at the last unit does not exist. #1345: Red observed, 8 of 29 (`/fr/share/some-token` crawlable); 4,374 across 426 at `f129c888`. #1346: Red observed, 2 of 7 (Tymna and Jaheira missing); 4,381 across 427 at `5e890201`. #1347: Red observed, 8 of 35 (`expected null to be 'Keep for creature-heavy pods'`); 4,390 across 428 at `c3fabb28`. #1348: Red observed, 3 of 16 (`expected 1 to be 3`); 4,419 across 431 at `7a68dded`. #1349: one Red per call site, 182 focused files and 1,913 tests after; 4,444 across 432 at `83023946`. #1352: Reds observed, 24 of 67 pairing tests and 7 of 9 store tests; 4,506 across 434 at `d02b0407`. #1355: Red observed, 21 failing across four files; 4,508 across 436 at `8a9082c2`. Every PR in this batch reports typecheck and lint clean and the gate passing on push; Sonar was left to CI. No UI could write a card note until #1361 mounted the editor, and `POST /api/decks` still stores the client's `pairingType` as sent.

### 2026-11-11: Dialogs get real semantics and focus, and the public deck views and page metadata are translated

- The shared `Modal` is rebuilt on Radix Dialog, the primitive seven dialogs already used, and its props are unchanged. A modal now has the dialog role, an accessible name, a focus trap and a scroll lock, and the page behind it leaves the accessibility tree. Focus moves to the first control on open and returns on close to the control that opened it, through a new `useDialogFocusReturn` hook. Escape or an outside press closes only the top dialog, so Escape in the proxy sheet dialog no longer closes the export dialog underneath, and the builder's shortcuts ignore an Escape a dialog has already handled. The playtest gets the same semantics in a full-screen frame. Escape closes it, except in a text field, where the action log keeps the key to cancel an edit. `AddToCollectionDialog` moves onto `Modal`, and the icon-only close buttons of the import dialog and the printing selector are named. `Modal` no longer animates on exit (#1340).
- The public deck page's save, fork, share and print actions, its AI badge, its bracket label and its "Anonymous" fallback read from the message catalogues. So do the AI badges on the profile and home tiles, the deck list's mana-symbol alt text, the user chip and the avatar alt text. The average rating follows the locale ("4,5" in French), and the French rating and profile follow keys are translated. Default deck names are translated when the deck is created, in the creator's locale ("Nouveau deck", "Deck IA — Contrôle"); existing decks keep their stored names. The eight dormant locales carry the English text (#1341).
- Page titles, descriptions and Open Graph text come from a new `metadata` message namespace, so a French page no longer carries an English `<title>`. This covers the layout, which titles the home page, the deck, commander, profile and share pages, and five fixed-text pages: the two rules pages, the collection page and the notification and API-key settings pages. Each page's canonical stays its own locale URL, and the share page still has no canonical or hreflang. The eight dormant locales carry the English text (#1342).
- #1340: Red observed, 21 failing tests across seven files, on the base code, and a second Red showed that the move to Radix alone left the builder's stacked Escape broken; on the tip rebased onto `dev` at `872f08f`, typecheck, lint and 4,140 unit tests across 410 files passed, and the pre-push Docker E2E gate passed on push. #1341: Red observed, 23 failing tests across 13 files, before any production or catalogue change; on the tip rebased onto `dev` at `2cf792e`, typecheck, lint and 4,167 unit tests across 417 files passed, and the gate passed on push. #1342: Red observed, 14 failing tests across 7 of 13 files, before any production change; on the tip rebased onto `dev` at `a6d4522`, typecheck, lint and 4,193 unit tests across 419 files passed, and the gate passed on push. Sonar was left to CI for all three. No E2E test was added for the dialogs. `ImportDialog` opened with Cmd+I, `ShoppingListModal` and `DeckWizard` still drop focus to `<body>` on close, the proxy dialog's close button has no name, and "Added!" and "Adding…" are still English. The share page's French "Créer une branche de ce deck" does not match the new fork wording yet. Page titles carry the brand twice ("… — MagicAIBuilder | MagicAIBuilder"), and the rules pages have no canonical or hreflang.

### 2026-11-10: The Playwright image matches the installed Playwright, and two dependency groups move up

- `Dockerfile.playwright` pins `v1.65.0-jammy` instead of `v1.64.1-jammy`. #1310 moved `@playwright/test` to 1.65.0 without the image, a mismatched image cannot launch its browsers, and the toolchain guard test added by #1285 failed from then on. The PR names `7746642` (#1289) as the last green CI run on `dev`, and states that #1332 failed CI only after it rebased onto that `dev` (#1339).
- `chore(deps-dev): bump the dev-dependencies group across 1 directory with 6 updates (#1310)` — dev dependency upgrades, merged on 2026-11-10: `@lhci/cli` 0.16.0, `@next/bundle-analyzer` 16.4.5, `@playwright/test` 1.65.0, `@tailwindcss/postcss` and `tailwindcss` 4.3.5, `eslint-config-next` 15.5.29.
- `chore(deps): bump the production-dependencies group across 1 directory with 5 updates (#1332)` — production dependency upgrades: `@tanstack/react-query` 5.107.1, `@vercel/speed-insights` 2.1.0, `effect` 4.1.2, `next` 15.5.29, `zustand` 5.1.0.
- #1339: no Red is recorded, because the guard test was already failing. Typecheck, lint and 4,114 unit tests across 407 files passed, the guard among them, and the full Playwright suite passed in Docker with the new image through the pre-push hook. It names no `dev` tip and records no Sonar result. #1310 and #1332 are Dependabot PRs and record no verification of their own.

### 2026-11-10: Profiles with no public deck leave the index, and sitemap entries declare `x-default`

- Every sitemap entry declares `x-default`, pointing at the English URL, beside `en` and `fr`: the set each page already declared through `buildAlternates`. Both now build from one helper, `hreflangPaths`, so the sitemap cannot drift from the pages' alternate links again (#1327).
- A profile whose owner has no public deck leaves the sitemap, and its page declares `noindex`. Private decks do not count, because the profile page lists public decks only. The page still renders for visitors, and `robots.txt` is unchanged so crawlers can read the `noindex`. One rule, `isIndexableProfile`, decides both. #1313 shipped the commander half of the same spec item (#1338).
- #1327: Red observed, 3 failing tests, all for the missing `x-default`; typecheck, lint and 3,912 unit tests across 385 files passed, and the pre-push Docker E2E gate passed on push (75 + 8). #1338: four Reds observed, one per behaviour; typecheck, lint and 4,114 unit tests across 407 files passed, and the gate passed on push (75 + 8). Neither PR names the `dev` tip of its full run. Sonar was left to CI for both. A general index policy with the spec's §4.2 thresholds waits for the data pages it would govern, and commander discovery keeps the rule #1313 shipped.

### 2026-11-10: The dead 3D stack is removed, and #1324's Sonar findings are cleared

- `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` and `gsap` are removed, with 47 transitive packages nothing else needs. Nothing had imported them since the 3D landing left in #308. The eight unused files in `public/textures/` are deleted. Fresh installs, CI jobs and Vercel builds no longer download 133.4 MB of packages; the client bundle is not expected to change and was not measured. A new test fails if any of the six packages comes back. The README and the technical docs drop the 3D claims, SonarCloud's `S6747` suppression on `src/components/landing/**` is removed, and the CSP comment names Sentry Replay as the reason `worker-src` allows `blob:` (#1331).
- SonarCloud no longer counts `**/fixtures/**` in duplication. All 306 duplicated lines that failed #1324's gate were in a recorded Commander Spellbook response that only tests read. In `CombosPanel.tsx`, the credit link's renderer moves to module level, and the "Spellbook unavailable" line becomes an `<output>`, which keeps the status role (#1337).
- #1331: Red observed on the new manifest test before the removal, and `pnpm install --frozen-lockfile` passed after it; on the tip rebased onto `dev` at `8892d49`, typecheck, lint and 3,986 unit tests across 390 files passed, and the pre-push Docker E2E gate passed on push. `next build` was not run, and Sonar was left to CI. #1337: a refactor with no Red; one test now finds the unavailable line by its status role. On the tip rebased onto `dev` at `ea2a6cb`, typecheck, lint and 4,105 unit tests across 405 files passed, and the gate passed on push. #1337 records no SonarCloud analysis after the change.

### 2026-11-10: Forks leave private fields behind, only moderators force a meta refresh, and closed reports stay closed

- `POST /api/decks/[id]/fork` reads a public deck through `FORK_SOURCE_SELECT`: the public fields plus the command-zone slots, the card text and each card's zone. The owner's budget, manual bracket, card notes, tags, folder and sharing settings are no longer copied into the fork or returned in its response, which had let any signed-in user read them. This closes security audit finding L1 (#1336).
- The meta route accepts `refresh` only as `true` or `false` and answers 400 otherwise, so `?refresh=false` no longer forces a refresh. Only a moderator can bypass a fresh cache. Anyone else gets the cache, and a live fetch still happens when no fresh row exists. Before, any visitor could keep the server scraping EDHREC or MTGTop8. This closes finding L3 (#1336).
- Reporting a deck again no longer reopens a reviewed or dismissed report: the repeat answers 200 `{ status: "closed" }` and changes nothing. A pending report's reason can still be replaced. This closes finding L4 (#1336).
- One Red per finding, observed against the unchanged code (1, 4 and 2 failing tests). On the tip rebased onto `dev` at `27eeae3`, typecheck, lint and 4,082 unit tests across 400 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. Card notes are still never saved: `patchCardSchema` has no `notes` field, so `updateCardNotes` reports success and stores nothing. The `@external` MTGTop8 E2E test's anonymous `?refresh=true` no longer bypasses a fresh cache row.

### 2026-11-10: Import, export and rules browsing are translated

- The Moxfield profile import and its results, the proxy export's paper size and blocked pop-up message, the export dialog's plain-text label, the set search hint, the rules pagination and the rules search's empty state read from the message catalogues. The range line and the set count use ICU plurals. The rules' effective date is parsed once and formatted for the reader's locale in UTC, so French reads "7 août 2026" instead of "August 7, 2026", and the sentence is left out when the file has no date. The eight dormant locales carry the English text (#1335).
- Red observed, 12 failing tests, before any production change. On the tip rebased onto `dev` at `27eeae3`, typecheck, lint and 4,092 unit tests across 404 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. The rules tests also pass under two other time zones. The Moxfield import still shows the raw error message for fetch, JSON and timeout errors, and the proxy export's "({n}/page)" and "Image loading failed" and a Game Changers zoom label are still English.

### 2026-11-10: No result can be recorded mid-mulligan, and the free mulligan follows a multiplayer choice

- While a London mulligan waits for the cards to bottom, Win, Loss and Draw are disabled and described by "Finish your mulligan first."; Skip and the notes stay usable. The draw evidence no longer counts the cards still to bottom as cards seen (#1334).
- The playtest start screen of a Commander or Oathbreaker deck has a "Multiplayer game (first mulligan free)" checkbox, checked by default. CR 103.5c gives the free first mulligan only in a multiplayer game and in any Brawl game, so unchecked, the first mulligan bottoms a card. Brawl always gets the free mulligan, and the constructed formats offer no choice. Restart keeps the choice, and closing the playtest resets it. The keep advice follows the same setting (#1334).
- Reds observed for both topics (2 and 4 failing tests) before the fixes. On the tip rebased onto `dev` at `ba8f49c`, typecheck, lint and 4,069 unit tests across 399 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. No E2E test covers the checkbox or the blocked result bar. A multiplayer Modern game would also get the free mulligan, but no checkbox offers it.

### 2026-11-10: A guest's deck survives sign-up, and sign-in follows only same-site callbacks

- A guest who signs up or signs in is offered to save the browser's guest deck to the account, in a non-modal panel with "Save to my account" and "Not now". The deck, its cards, commander, partner and companion go in one `POST /api/decks`, which now takes up to 500 cards and writes them with the deck in one create. An `Idempotency-Key` header, stored in the new `Deck.idempotencyKey` column with a unique index per user, makes a double click, a retry or a reload return the same deck instead of a copy. The browser copy is removed only after the server returns the saved deck. "Not now" stops the floating offer, and the deck list still shows it. The guest notice no longer promises that the deck is kept safe (#1333).
- Sign-up now returns to its `callbackUrl`, and both forms follow only a same-site path, so `?callbackUrl=https://evil.com` and `javascript:` values fall back to `/decks`. Before, sign-in followed any value. The middleware now sends a path instead of an absolute URL (#1333).
- Reds observed: 15 failing callback tests and 7 failing route tests. `prisma migrate diff` produces exactly the new migration, `20261109230000_add_deck_idempotency_key`. On the tip rebased onto `dev` at `97b7ec3`, typecheck, lint and 4,052 unit tests across 398 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. Card notes are not sent, edits made while the save is in flight are lost, and the guest AI panel still shows "AI request failed (401)". `Deck.origin` is left to I-39's instrumentation slice.

### 2026-11-10: Deck legality checked on the server, and cards that cannot work with a colourless commander

- `GET /api/decks/[id]/legality` (owner only) judges a deck from card data the server fetches from Scryfall, 75 printings per request, under the format's own legality key. It never reads the browser's `isBanned` flag. Banned and not-legal cards make the deck illegal, a restricted card is allowed at one copy, and a card Scryfall does not return keeps the deck from being called legal. The verdict names Scryfall and the fetch time, and an unreachable Scryfall gives 502. An unknown stored format gets an "unsupported format" verdict without a Scryfall request, and `validateDeck` reports it the same way instead of applying Commander's rules (#1330).
- The deck warnings gain a "Cards that can't work with this commander" section, labelled as a deterministic rules check and not a recommendation. It flags Arcane Signet, Command Tower and Path of Ancestry in a Commander or Brawl deck whose commander has no colour in its identity, citing CR 903.4 and 106.5: their mana ability produces no mana there. Cards that keep another working ability, commanders whose colour is chosen before the game, and Oathbreaker are left out. English and French are written, and the dormant locales carry the English text (#1328).
- #1328: Reds observed for the policy (9 failing tests), the wiring (3) and a stored-data guard (1); on the tip rebased onto `dev` at `fee835d`, typecheck, lint and 3,949 unit tests across 386 files passed, and the pre-push Docker E2E gate passed on push. Not checked in a browser. #1330: Red observed, 2 failing tests, with the three new test files failing for want of their modules; on the tip rebased onto `dev` at `8892d49`, typecheck, lint and 4,000 unit tests across 392 files passed, and the gate passed on push. Sonar was left to CI for both. The builder still shows the stored `isBanned` badge and does not call the new route, and `POST /api/decks/[id]/cards` still stores the browser's flag (I-42). The flagged cards are not highlighted in the deck list.

### 2026-11-10: Card images move to Scryfall's WebP before the JPEG cutoff

- Scryfall stops serving its `small`, `large`, `border_crop` and `art_crop` JPEGs, and PNG hotlinking, after 2027-01-01. New card images use the WebP versions (`grid` for the card, `display` for zoom, `art` for art crops), and the seed builds WebP URLs. URLs already stored in decks, collections, snapshots and templates are rewritten to their WebP analogue when they are read, at every place that hands them to the browser or a crawler, so no data migration is needed. Card data cached before the WebP keys existed still yields WebP (#1329).
- Reds observed for the image policy (27 failing tests), the stored card faces (3) and ten render and metadata sinks (10). On the tip rebased onto `dev` at `96aeea7`, typecheck, lint and 3,985 unit tests across 389 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. Link previews now point at the `art` WebP; switching `og:image` to the `jpeg` key remains open if a crawler cannot render WebP. Stored rows keep their JPEG URLs unless an optional backfill runs, and `docs/references/official-sources.md` still lists the old versions.

### 2026-11-10: A failed tag save puts the previous tags back

- When a tag save fails, the editor restores the tags shown before the attempt and shows "Could not save deck tags. Please retry." A newer tag edit that replaced the failed one is kept without an error, and a deck deleted meanwhile is not recreated. Adding and removing tags share one save path (#1326).
- Red observed, 2 failing tests, against the unchanged store at `72fbfc1`. Typecheck, lint and 3,913 unit tests across 385 files passed, and the pre-push Docker E2E gate passed on push (75 + 8); the PR does not name the `dev` tip of its full run. Sonar was left to CI. If the newest of several overlapping tag saves fails, it restores a list that can hold an older unsaved change, as rename, budget and the brackets do (I-01). The toast is English.

### 2026-11-10: Generated decks are checked against card data before the player sees them

- The AI build route now checks every card of a generated deck against Scryfall card data before it streams the list. Unknown names, banned or not-legal cards, cards outside the colour identity of the commander and partner, extra copies and a repeated commander are removed. A short list is filled with basic lands of the command zone's colours, and a long one loses basics from its largest stack. The wizard lists each correction with its rule before it opens the deck. A commander that is unknown, banned, not legal or not allowed to lead a deck, or a pair that cannot share the command zone, still fails the build. Legal lists that the old name-based singleton check refused, such as 20 Persistent Petitioners, now pass (#1318).
- Red observed before the route change. On the tip rebased onto `dev` at `65e6230`, typecheck, lint and 3,772 unit tests across 370 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. The Game Changer count for the chosen bracket is not checked, so generated decks are not labelled verified, and repairs add basic lands rather than cards from a legal candidate pool. A list of snow-covered basics would lose all but one copy. The demo deck now needs Scryfall too.

### 2026-11-10: A deleted account stays deleted, and Google no longer signs into an unverified password account

- A session whose account was deleted now gets 401 from every API instead of re-creating an empty account from the token's email. The per-request lookup no longer creates users; only the Playwright test bypass still does. A session minted before a database rebuild is no longer healed, so its user signs in again (#1319).
- "Continue with Google" no longer links to an existing password account with the same email, because sign-up never verifies that email. The sign-in returns to the sign-in page with a message to use the email and password instead. Google-first users, accounts already linked and new Google users are unchanged. This closes account pre-hijacking, security audit finding H2. Someone who registers another person's email first can still block that person's Google sign-in for the address (#1321).
- #1319: Red observed before the fix; on the tip rebased onto `dev` at `576f680`, typecheck, lint and 3,743 unit tests across 370 files passed, and the pre-push Docker E2E gate passed on push. #1321: three Reds observed before the fix; on the tip rebased onto `dev` at `76643f0`, typecheck, lint and 3,788 unit tests across 375 files passed, and the gate passed on push. Sonar was left to CI for both. The delete route still leaves the session cookie, so pages keep their signed-in chrome until sign-out, and deleting an account still deletes other players' replies under its comments and the reports it filed (I-38). Sign-up still answers 409 for a registered email, and there is no email verification, password reset or Google linking from settings.

### 2026-11-10: Only the server writes the shared Scryfall cache, and share links send only what the page shows

- `/api/cache/search` and `/api/cache/cards` now answer `GET` only, and a `POST` gets 405. On a miss or an expired row the server fetches Scryfall itself, checks the body's shape, stores its own copy and returns it. Before, any signed-in user could store any JSON there, so one forged page could change the banlist and the Game Changer list every player loads (security audit finding H3). Keys are bounded and carry the `srv1:` prefix, so rows that clients wrote are never read again and are deleted on the first fill. The tables are capped at 200 unexpired search rows and 2,000 card rows, of 500 KB and 50 KB each (the cache part of M3). Fills are limited per IP to 60 a minute for searches and 120 for cards, and the browser asks Scryfall directly when the server cannot answer (#1322).
- `GET /api/share/[token]` returns only the fields the share page renders, listed in `SHARED_DECK_SELECT`, instead of the whole deck row minus the token. The owner's id, folder, tags, settings and card notes no longer reach a link holder, and a column added later is not sent unless the allowlist names it. A private deck is still readable at its token, and unknown, revoked and disabled tokens still answer 404 (#1325).
- #1322: Red observed against the unchanged code; on the tip rebased onto `dev` at `76643f0`, typecheck, lint and 3,842 unit tests across 375 files passed, and the pre-push Docker E2E gate passed on push. #1325: Red observed before any production change; on the tip rebased onto `dev` at `13d9e0b`, typecheck, lint and 3,816 unit tests across 376 files passed, and the gate passed on push. No E2E spec opens a share link, and #1325 was not checked in a browser. Sonar was left to CI for both. The fill limit and the Scryfall queue hold per server instance (M2). "Fork this deck" on the share page of a private deck still fails, because the fork route requires a public deck.

### 2026-11-10: Single-key shortcuts can be turned off, and the editor's mobile controls are localized

- The keyboard shortcut list has a "Single-key shortcuts" switch. It is on by default and remembered in the browser, for guests too. With it off, `/`, `?`, Esc, the up and down arrows and Enter do nothing on the page, while Ctrl/Cmd shortcuts keep working. A "Shortcuts" button in the builder toolbar keeps the list reachable when `?` is off. Plain keys are left to a focused select, combobox, listbox, menu or other widget that reads keys, Enter activates a focused button or link instead of adding a search result, and no shortcut fires during an IME composition. WCAG 2.2 SC 2.1.4 accepts an off switch for single-character shortcuts (#1320).
- Below `lg`, the builder's tab bar, the colour search toggles and their hint, the filters toggle, the title bar's Duplicate, Bulk Edit, Playtest and Export labels and the AI badge read their text from the message catalogues. French is translated, English is unchanged, and the eight dormant locales carry the English text (#1323).
- #1320: Red observed, 20 failing tests, before any production change except the new preference store; on the tip rebased onto `dev` at `648f80d`, typecheck, lint and 3,814 unit tests across 375 files passed, and the pre-push Docker E2E gate passed on push. Its CI audit job first failed on a `next/font` Google Fonts fetch and passed on rerun. #1323: Red observed, 5 failing tests; on the tip rebased onto `dev` at `13d9e0b`, typecheck, lint and 3,821 unit tests across 378 files passed, and the gate passed on push. Sonar was left to CI for both. Neither was checked in a browser, and the switch was not checked with a screen reader. Remapping keys and the shortcut registry remain I-37's. The save button shown while renaming a deck still has no accessible name, and the "AI" badge outside the builder is still English.

### 2026-11-10: One Commander Spellbook lookup per deck, with each combo's prerequisites

- The combo panel looks up the whole deck in one request to `POST /api/combos`, which makes one Commander Spellbook `find-my-combos` call instead of about one per card. The route accepts at most 2 commanders and 250 names, allows 30 lookups a minute per address and 60 Spellbook calls a minute per server instance, and caches a card list for 6 hours whatever its order, case or spacing. Each combo shows the other pieces it needs, its conditions and the mana it needs, and links to its Spellbook page. When Spellbook cannot be reached, the panel says so instead of "No known combos detected" (#1324).
- Red observed before any change: the old client made four requests for a four-card list. On the tip rebased onto `dev` at `13d9e0b`, typecheck, lint and 3,833 unit tests across 379 files passed, and the pre-push Docker E2E gate passed on push. SonarCloud, which is advisory, failed the PR's gate on new duplicated lines: 15.2% against 3%, all 306 lines in the test fixture `src/lib/combos/fixtures/find-my-combos-v1.ts`. It also raised two MAJOR issues in `CombosPanel.tsx`. Both were recorded on the PR before merge, and the follow-up branch `chore/sonar-combos-followup` is queued, not yet a PR. The cache and limits hold per server instance, and only the first page of results, up to 1,000 variants, is read.

### 2026-11-10: Playtest runs filed under the deck version, and one row per command-zone slot

- A run recorded in the playtest is filed under the most recent snapshot that holds the deck as saved (the same cards, quantities, zones, commander and partner), or under a new snapshot named `Playtest · <UTC time>`, in one transaction. Repeated runs on an unchanged deck share one snapshot, so the snapshot comparison now receives the runs players record. An explicit `snapshotId` is still honoured, and the history panel no longer crashes on a session with a snapshot (#1315).
- Replacing or clearing a commander or partner now deletes the old row. The store kept the placed card under its printing id, so its row could not be deleted, and the old commander came back on reload. `Deck.commanderId` stays a printing id (#1317).
- #1315: two Reds observed before any production change; on the tip rebased onto `dev` at `61792c1`, typecheck, lint and 3,687 unit tests across 359 files passed, and the pre-push Docker E2E gate passed on push. Not checked in a browser or against a real Postgres. #1317: Red observed before the fix; on the tip rebased onto `dev` at `1b95285`, typecheck, lint and 3,743 unit tests across 369 files passed, and the gate passed on push. Sonar was left to CI for both. Decks saved before #1317 can still hold extra commander rows, and no cleanup ships with it.

### 2026-11-10: The i18n navigation E2E test no longer flakes

- "locale prefix is preserved after navigation" suppresses the onboarding dialog before it navigates, clicks the one "Ouvrir mes decks" link in the capability atlas and expects `/fr/decks`. A missing link now fails the test instead of skipping its only assertion (#1316).
- No production code changed. The Red is the recorded gate failure of 2026-11-08, not re-run. On the tip rebased onto `dev` at `61792c1`, typecheck, lint and 3,665 unit tests across 356 files passed, and the pre-push Docker E2E gate passed on push.

### 2026-11-09: Bulk edit saves only what changed

- Saving a bulk edit no longer rebuilds the deck. Lines whose quantity did not change keep their rows, printings, categories and notes; more copies go on a line's first row and fewer come off its last rows; new lines are looked up and added. The whole change set, command zone included, is applied in one transaction by the new `PATCH /api/decks/[id]/cards`, which answers 409 on a stale row and writes nothing. An unknown name blocks the save and is named, and invalid partner or companion lines are refused instead of dropped. The guest deck applies the same change set in the browser (#1314).
- The two required Reds were observed before any production change, and each later behaviour had its own cycle. On the tip rebased onto `dev` at `61792c1`, typecheck, lint and 3,691 unit tests across 361 files passed, and the pre-push Docker E2E gate passed on push; Sonar was left to CI. Not checked in a browser or against a real Postgres. A printing typed in the text is still not applied; that is I-37's.

### 2026-11-09: Public deck fields, public rules pages and commander pages out of the index

- `GET /api/deck/[id]` serves every viewer but the owner through an explicit field allowlist (`PUBLIC_DECK_SELECT`), so the owner's budget, folder, manual bracket, sharing settings, user id and card notes no longer reach the public. The owner's view is unchanged, and the response types derive from the allowlist (#1312).
- `/rules/game-changers` and `/rules/comprehensive` open for signed-out visitors, and the public page paths now live in one module that the middleware and the auth callback share. An empty commander listing is `noindex` with no canonical; a slug no commander name can produce answers the 404 page; a failed discovery request shows the retryable error page; the sitemap drops such slugs (#1313).
- Each behaviour was observed red first. On tips rebased onto `dev` at `61792c1`, typecheck, lint and the unit suite passed (3,673 tests across 357 files for #1312, 3,677 across 358 for #1313), and the pre-push Docker E2E gate passed on push; Sonar was left to CI. Neither was checked in a running app. The rate limit on `GET /api/deck/[id]`, the share-link route and the rules pages' metadata remain open.

### 2026-11-09: Native undo in text fields and a rolled-back commander save

- Ctrl/Cmd+Z in a card note, the search bar or another text field is left to the field's own undo instead of undoing the last deck change. Checkboxes and other controls keep deck undo, and the other shortcuts are unchanged (#1309).
- When saving a new commander or clearing it fails, the editor restores the previous commander, partner and pairing type and shows an error. A commander whose deck record was saved, a newer choice and a partner picked meanwhile are kept (#1297).
- #1309: six Reds, then typecheck, lint, 3,645 unit tests across 350 files and the pre-push Docker E2E gate (74 + 8) passed; not verified in a real browser. #1297: four Red/Green cycles, then typecheck, lint, 3,515 unit tests across 345 files and the pre-push Docker E2E gate (74 + 8) passed. Sonar was left to CI for both. The off switch for single-character shortcuts remains open.

### 2026-11-09: Stop impersonating moxfield.com and explain Moxfield refusals

- The Moxfield deck and profile imports go through one client that sends the app's own User-Agent and no `Origin` or `Referer` set to moxfield.com. A 403, a 429 or an HTML page becomes a typed refusal (HTTP 422), logged once as a warning and never retried, and the player is told to paste the list in the Plain Text tab; the profile panel hides Retry for a refusal. `docs/product/import-moxfield.md` no longer advises browser-like headers (#1304).
- A live probe on 2026-11-09 at 10:41 UTC, with honest headers, got HTTP 403 from both Moxfield endpoints, so Moxfield URL import now shows the paste instructions unless production gets another answer. Thirteen Reds were observed. Typecheck, lint, 3,530 unit tests across 350 files (on the previous base, with the 61 affected files rerun after the rebase), Prettier and the pre-push Docker E2E gate (74 + 8) passed; Sonar was left to CI. Whether to ask Moxfield for API access is the owner's decision.

### 2026-11-09: Changelog catch-up and the I-30 to I-37 roadmap

- The changelog records every PR merged from #1111 to #1302, and the progress file's metrics are recounted (#1306).
- The roadmap gains I-30 to I-37 and their specs from a dated pass on the owner's goals: the business model and paid tier, Deck Lab, seller hand-off, the marketplace ladder, data reports, a pod game log, a creator toolkit and editor depth. The competitive landscape gains section 10 (#1308).
- Documentation only. #1306: Prettier clean, every PR from #1111 to #1302 found in the new block by a script, and the pre-push Docker E2E gate passed on the retry (74 + 8) after the first push hit an out-of-memory kill. #1308: Prettier clean, 269 relative links and anchors checked with 0 problems, and the E2E gate script, run by hand because the worktree's husky hook was missing, passed (74 + 8).

### 2026-11-09: Deal every copy and start the commander in the command zone

- The playtest deals each main-deck row as many times as its quantity, stops dealing Sideboard and Considering rows, and starts the commander and partner in a new command zone in Commander, Brawl and Oathbreaker. A commander can be cast from the command zone and returned to it, and casting it no longer counts as a card seen. On a 36-land test list the dealt library grows from 79 to 99 cards, and opening hands with 0–1 land fall from 59.8% to 20.3% (#1307).
- The Red reproduced the bug on `c4562a7`, and each later behaviour had its own Red. Typecheck, lint, 3,630 unit tests across 350 files, catalog key parity and the pre-push Docker E2E gate (74 + 8) passed; Sonar was left to CI. No E2E covers the command zone yet; commander tax and the Oathbreaker signature spell remain open.

### 2026-11-09: Report AI replies cut off at the token cap

- A model reply that stops at its output cap (Anthropic `max_tokens`, OpenAI `length`) is reported as a typed truncation with the provider, model and cap, logged once, instead of failing as a JSON parse error. The client still gets the route's existing error event. The suggestion cap rises from 2,048 to 4,096 tokens, and the routes no longer read the API key with a non-null assertion (#1305).
- The first Red was observed before any production change. Typecheck, lint, 3,585 unit tests across 348 files (on `dev` at `b6056cb`) and the pre-push Docker E2E gate (74 + 8) on the rebased commit passed; Sonar was left to CI. Not run against the real providers. Per-call usage metering remains I-30's.

### 2026-11-09: Stage-aware keep advice for Commander opening hands

- The playtest's opening-hand panel gives keep advice from the opening-hands guide's tables: by mulligan stage, land count, cheap ramp and the deck's target bracket, with the margin and a judgment call within ±2%. Where the guide publishes no rule, the panel says so. Commander only; other formats keep the land-balance hint (#1303).
- Each behaviour went through its own Red/Green cycle, and a test checks all 75 published cells against the guide. Typecheck, lint, 3,586 unit tests across 346 files (before the rebase onto `dev` at `49983a9`) and the pre-push Docker E2E gate (74 + 8) passed; Sonar was left to CI. Not checked in a browser.

### 2026-11-09: Queue concurrent E2E gates and clear root-owned reports

- Two pre-push E2E gates started on the same machine no longer replace each other's containers: the second waits for a machine-wide lock and starts when the first exits. Report folders left behind as root by an interrupted run are cleared through a throwaway container instead of blocking every later push. `SKIP_E2E` and the CI bypass are unchanged (#1302).
- Both script tests were observed red against the unchanged script. Typecheck, lint, 3,540 unit tests across 348 files (on `dev` at `70c57f4`, before #1301), Prettier, a `bash -n` check and the pre-push Docker E2E gate (74 + 8) with the new script passed; Sonar was left to CI. The flaky `e2e/i18n-routing.spec.ts` onboarding race remains open.

### 2026-11-09: Follow the London mulligan and the free multiplayer mulligan

- Every playtest mulligan now draws a fresh seven, and the player chooses which cards go to the bottom, in order, as the London mulligan requires. In Commander, Brawl and Oathbreaker the first mulligan is free; in the 1v1 constructed formats the first mulligan already bottoms a card. Other board actions wait while that choice is pending, undo steps back through both stages, and the action log says what happened (#1301).
- Each behavior went through its own Red/Green cycle. Typecheck, lint, 3,555 unit tests across 345 files (on a branch based on `dev` before #1300) and the pre-push Docker E2E gate (74 + 8, including the updated playtest spec) passed. Sonar was left to CI; the bottom-choice layout is covered by component tests and was not checked in a browser. A per-session multiplayer toggle and stage-aware opening-hand advice remain open.

### 2026-11-09: Use the official bracket names and rules

- The target-bracket picker shows the official names and limits: Exhibition, Core, Upgraded and Optimized in English, and "Catégorie N — Nom (bracket N)" in French. Core allows no Game Changers. The copilot prompt no longer forbids tutors at bracket 1 or allows a Game Changer at bracket 2, and it states each bracket's official rules and turn floor. The eight dormant catalogs carry the corrected English copy (#1300).
- Each behavior went through its own Red/Green cycle, adding 23 tests. Typecheck, lint, 3,538 unit tests across 347 files, key parity and the pre-push Docker E2E gate (74 + 8) passed; Sonar was left to CI. The shared bracket constants, the bracket indicator's "Casual" label, the scorer's two-card-combo rule and a bracket 5 choice remain for the next slice.

### 2026-11-09: Reject duplicate commander cards on card add

- Adding a commander or partner card that reprints the Oracle card already in the other command slot is rejected with the existing "Commander and partner must be different cards" message before anything is written. Main, Sideboard and Considering additions are unaffected (#1295).
- Three route tests were observed red before the change. Typecheck, lint, 3,515 unit tests across 345 files and the pre-push Docker E2E gate (74 + 8) passed; Sonar was left to CI.

### 2026-11-09: Guides to brackets and opening hands, and a cross-site deck index proposal

- A sourced guide to building a Commander deck for each bracket, with every claim labelled Official, Data or Community against 126 dated sources, plus the I-28 spec. It found the wrong bracket labels and copilot rules corrected in #1300 (#1296).
- A companion guide to the free mulligan, keep decisions, mana curves and play style, backed by 74 dated sources and a seeded research simulator that no product code imports. It found the playtest mulligan error corrected in #1301 (#1298).
- The I-29 proposal and spec for a cross-site Commander deck index: source policy first, index only what may be held, link out to everything else, and treat partnerships as the only route to EDHREC's scale (#1299).
- Documentation and research scripts only. Each PR records typecheck, lint, the unit suite (3,510 tests for #1296; 3,515 for #1298 and #1299), Prettier, link checks and the pre-push Docker E2E gate passing; Sonar was not run on Markdown.

### 2026-11-08: Name each warned card once and gate leftover automation fixes

- Bracket warnings name a banned, off-identity or Game Changer card once even when the deck holds several printings, matching deck validation. The Game Changer count still counts copies (#1292).
- Three fixes that the retired hourly roadmap automation had committed but never pushed were replayed unchanged and gated for the first time: the companion even-mana-value warning counts copies rather than rows (#1287), missing meta cards with equal scores keep a stable order (#1288), and a failed Moxfield profile page offers Retry (#1286).
- #1292 was observed red; typecheck, lint, 3,510 unit tests across 344 files and the pre-push Docker E2E gate (74 + 8) passed on the third attempt, after an unrelated onboarding-dialog race in `e2e/i18n-routing.spec.ts` and a root-owned report folder. #1286-#1288 record a clean typecheck, lint and unit suite and a passing pre-push Docker Playwright run; Sonar was left to CI.

### 2026-11-08: Record the Docker E2E environment

- The quality gate documents all 11 variables the E2E Compose stack sets, and a toolchain test fails when one of them is missing from that table (#1285).
- The guard was observed red, then checked by deleting a row. Typecheck, lint, 3,506 unit tests across 343 files and the pre-push Docker E2E gate passed; Sonar was left to CI.

### 2026-11-08: Competitive analysis, initiative specs and the 2027 roadmap

- The roadmap gains I-14 to I-21 (none in Now) from an 8 November competitive pass, and the competitive landscape is rewritten in English with current sources (#1289). A refreshed benchmark corrects the premise that no platform ships LLM-powered Commander deckbuilding; positioning moves from "AI builds your deck" to "AI you can check" (#1284).
- Functional specs for ten initiatives, each with a dated market sweep and delivery slices with dependencies (#1293). Six sourced 2027 initiatives, I-22 to I-27, and four rejected directions with their reasons (#1294).
- Documentation only. #1293 and #1294 record typecheck, lint and the unit suite (3,509 and 3,510 tests); #1284 lists Prettier, typecheck, lint and tests; #1289 ran no code gates. #1290 and #1291 promoted #1283 and #1289 through `staging` to `main`, citing Docker E2E (74 + 8) and a SonarCloud Quality Gate OK with zero code smells for #1283.

### 2026-11-07: Roll back a failed partner save

- When saving a new partner fails, the editor restores the previous partner and pairing type and shows an error. A partner whose deck save already succeeded, or a newer choice, is kept (#1283).
- Three Red/Green cycles, plus a failed-clearing case covered by the same guard. Typecheck, lint, 3,505 unit tests across 343 files and build passed. The full Docker E2E gate passed (74 + 8) on the first commit; the follow-up commit that removed the Sonar complexity smell reported there was pushed with `SKIP_E2E=1`.

### 2026-11-07: Restore playtest readability and the editor E2E gate

- Playtest text and surfaces follow the theme again, feedback controls fit narrow screens, and a bundled card back stands in for missing images (#1275). Tournament evidence dates use an explicit comparator, resolving Sonar S2871 (#1276).
- The remaining maintainability findings were resolved without suppressing rules, six duplicate API tests introduced during promotions were removed, and the editor E2E setup was repaired for the grid default (#1279).
- #1275: 125 focused tests, typecheck, lint, build and all seven playtest E2E scenarios passed, but the editor E2E gate was red (71/74); the owner explicitly asked to merge, and the push used `SKIP_E2E=1`. #1279: 3,501 unit tests across 343 files, lint, typecheck, build and the full Docker E2E suite passed without bypasses or retries; Sonar processed the branch scan, whose results the organization cannot read (HTTP 403).
- #1277 and #1278 promoted #1275 and #1276 under an owner-approved waiver for the known E2E failures and remaining smells. #1281 reconciled `staging` history (74 + 8 Playwright passed), then #1280 and #1282 promoted #1279 with 3,501 unit tests and 74 + 8 Playwright passing. #1282 used a regular merge, authorized because GitHub could not rebase the historical promotion commits; its Vercel preview failed.

### 2026-11-06: Lumen light and dark redesign

- A new visual language, Lumen, in light and dark: soft surfaces, generous corners, a violet accent and Inter, with a sun, moon and system control in the header. System is opt-in, so an existing explicit theme choice is kept (#1259).
- The landing page (#1265), collection (#1266), public decks and commander discovery (#1267), forms and modals (#1268) and the deck library (#1269) moved onto Lumen. Public decks gain category chips, commander discovery a name filter and the deck library a search over loaded decks; the landing page no longer loads Cinzel.
- Typecheck, lint and unit tests passed in each PR (3,440 tests across 329 files for #1259; 3,473 for #1269). Sonar was not run, and Docker E2E was skipped with `SKIP_E2E=1` because Docker was unavailable in that environment. #1259 records a manual check of the guest builder in both themes and at 390x844.

### 2026-11-06: One card list for deck zones, cross-zone drag and stable loading

- Main, Sideboard and Considering come from one card list in which each card's saved zone is the truth. Zone moves can be undone, and the save indicator stays on until every overlapping write finishes (#1263).
- Zone tabs and categories are stable drop targets, grid cards have a keyboard-focusable drag handle, and search results have a zone menu that adds a card to Main, Sideboard or Considering without dragging (#1264).
- A session request that never finishes shows a retry after eight seconds while loaded decks stay on screen, and a failed profile refresh keeps the last profile. Hover previews sit in a fixed box, and the large zoom can no longer widen the page (#1271).
- The editor opens in grid view by default (#1256). Signed-in players can save a public deck (#1257).
- #1263, #1264 and #1271 passed typecheck, lint and 3,478, 3,477 and 3,473 unit tests; Sonar was not run and Docker E2E was skipped with `SKIP_E2E=1`. #1256's commit records a focused red, store tests, typecheck and lint on the VPS; #1257 records no verification.

### 2026-11-06: Fix audit regressions and simplify dense helpers

- Audit fixes, each with a regression test: a second clipboard copy resets the confirmation timer; a non-numeric stored panel width falls back to the default; only the latest meta or comment request updates the screen; a playtest-history server error is reported; collection loading drops malformed rows and concurrent additions increment one row; a failed shopping toggle no longer undoes others; the wizard budget starts unselected; AI suggestions go to the active zone; a Commander Spellbook failure returns 502 instead of an empty list (#1260).
- Behavior-preserving refactors split the dense playtest, acquisition, Moxfield import and store helpers (#1261) and move NDJSON streaming and payload building out of the AI suggestions hook (#1262).
- Typecheck, lint and unit tests passed (3,439 for #1260; 3,471 for #1261 and #1262). Sonar was left to CI, and Docker E2E was skipped with `SKIP_E2E=1`.

### 2026-11-06: Cover editor zone flows in E2E

- New Playwright specs cover Main to Sideboard persistence after reload (#1258) and after a rejected move (#1274), plus Considering persistence, Main to Considering, a rejected move, banner geometry and a fixed hover preview (#1270).
- #1258 passed 6 Docker Playwright tests. #1270's specs were not executed in that PR's environment (3,471 unit tests passed); the full gate passed with 74 browser tests from #1279 onward. #1274 records no run.
- #1254 and #1255 promoted the accumulated `dev` changes to `staging` and `main` that morning; #1272 and #1273 promoted this day's batch in the evening.

### 2026-11-05: Fix guest building, snapshot restores and stale reloads

- A guest's New Deck stays in the browser instead of calling the signed-in API, so it no longer fails with 401, and the builder no longer re-renders in a loop (#1231).
- Restoring a snapshot keeps each card's zone, notes, power and toughness, and the editor reloads the open deck after a restore or a package apply (#1250, #1252). An older collection reload no longer overwrites a newer one (#1247), and a resized panel keeps its width on the next visit (#1246).
- Clearing a vote on a deck the caller cannot see now returns 404 without revealing the tally (#1251).
- #1231 was observed red; 3,391 unit tests, typecheck, lint, build and Docker E2E (67 + 8, including a new guest route test) passed; Sonar was unavailable. #1246, #1247 and #1250-#1252 were observed red and passed typecheck, lint and 3,404-3,407 unit tests; Sonar was not run and Docker E2E was skipped with `SKIP_E2E=1`.

### 2026-11-05: Keep share tokens out of logs and clear the production audit

- Share-route errors no longer log the share token (#1234). A scoped override clears the production dependency advisories, and `pnpm audit --prod` reports zero (#1235).
- Both were observed red. Typecheck, lint, 3,395 and 3,394 unit tests, build and Docker E2E (67 + 8) passed; Sonar was unavailable without a token.

### 2026-11-05: Import fidelity and meta-source disclosure

- Moxfield URL imports keep companions (#1238). Pasted text drops standalone lowercase set codes (#1244), and pasted Archidekt lists drop category tags such as `[Ramp]` before the name lookup (#1249).
- Meta API responses name their source, EDHREC or tournament, for live and cached data (#1236), and dated tournament recommendations show the event window they cover (#1242).
- #1236: 3,395 unit tests, build and Docker E2E (67 + 8) passed. #1238: 46 focused tests, lint and build passed; local Sonar failed and Docker E2E was not run. #1242 and #1244 passed typecheck, lint, the unit suite and build. #1242's Docker attempt failed in the runner without failed cases; #1244 relied on the preceding feature's run (67 browser tests passed, with an unrelated authenticated rename-focus failure). #1249 records the focused test, with full validation still in progress at merge.

### 2026-11-05: Localization, keyboard access and an honest landing page

- French players get a localized collection panel with correct plurals (#1232), deck tag controls (#1233), imported deck names and dates (#1237), home-deck mana labels for screen readers (#1243) and a locale-formatted average winning turn (#1245). The locale menu reports its open and selected state to assistive technology (#1253).
- Collection list actions (#1239), Considering row actions (#1240) and the main-deck reorder handle (#1241) appear on keyboard focus.
- The landing page replaces unsupported AI and pricing claims with an atlas of shipped Commander capabilities, and its structured data drops the price offer (#1248).
- Focused red tests are recorded for all but #1243. Typecheck and lint passed throughout. Full unit suites passed for #1232 (3,393), #1233 (3,394), #1237 (3,396), #1240 (3,399), #1248 (3,405), #1239, #1243 and #1245; Docker E2E (67 + 8) passed for #1232, #1237, #1239, #1245 and #1248, while #1243's authenticated run hit the unrelated rename-focus failure. #1241 and #1253 record focused tests with the full suite still running. Sonar was unavailable without a token.

### 2026-11-04: Clearer deck library and workspace

- Primary navigation is a named, keyboard-visible group, and deck cards separate the deck's identity from its card count, update time, bracket and colors (#1217, #1218). The active zone keeps a pressed state with a fixed height that avoids layout movement (#1219).
- Commander banner actions (#1222) and the double-faced card's Turn Over control (#1228) appear on keyboard focus.
- All were observed red. #1217 passed typecheck, lint, the unit suite, build and Docker E2E (66 + 8). #1219 records the targeted test, typecheck and lint, with the full suite and build cut off before a verdict. #1222 passed the unit suite and build, and #1228 lists the same checks; Docker E2E was not rerun for these class-only changes.

### 2026-11-04: Persist quantity edits and protect shared links

- Quantity changes in the deck editor are saved instead of being dropped by the API (#1223). A failed description save restores the last saved text and offers retry (#1229).
- Share pages tell search engines not to index, follow or archive them (#1220). API v1 deck exports include the pairing type (#1221), and Archidekt text exports keep Sideboard and Considering (#1226).
- All were observed red. #1220, #1221, #1223 and #1226 passed typecheck, lint, the unit suite (3,385 tests for #1226), build and Docker E2E (66 + 8). #1229 lists the same checks with 66 Docker tests passing. Sonar was unavailable without a token.

### 2026-11-04: USD labels, meta-source health and Scryfall latency

- The printing selector (#1224) and card-search price bounds (#1230) label Scryfall prices as USD without converting them. Unavailable meta sources and their retry count appear beside the evidence disclosure (#1225). Uncached Scryfall card lookups record status and duration without card identifiers (#1227).
- All were observed red. #1224 and #1225 (3,385 unit tests) passed typecheck, lint, the unit suite, build and Docker E2E (66 + 8); #1227 lists the same checks with Docker E2E (66 + 8) passing. #1230 passed its focused test, typecheck and lint; the full suite, build and E2E were not rerun for it.

### 2026-11-03: Label prices as USD and choose notification events

- Card tooltips (#1194), card list prices (#1196) and acquisition-plan prices (#1209) label Scryfall values as USD in every locale.
- A new settings page lets players choose which replies, mentions, follows and watched-deck events notify them, in English and French (#1197).
- All were observed red. #1194 passed typecheck, lint and the unit suite, but its build did not finish within the runner's window; #1196 its targeted test, typecheck and lint; #1209 3,368 unit tests, build and Docker E2E (66 + 8). #1197 lists typecheck, lint, tests and build; Docker E2E could not start because the Playwright image lacked Corepack.

### 2026-11-03: Repair the E2E image and keep loading bounded

- The Docker Playwright image bootstraps the pinned Corepack, so the E2E gate builds again after being blocked since #1188 (#1208).
- Moxfield profile loads stop after 15 seconds and show the existing retry (#1199, #1200). The save indicator stays on through overlapping renames (#1203) and through a budget save that finishes during a rename (#1205). Acquisition-intent lookups return a controlled error, and notification-preference message keys are back at parity across catalogs (#1207).
- Route loading fallbacks cover the collection (#1210), builder (#1212), saved decks (#1213), notification settings (#1214), API keys (#1215) and moderation reports (#1216). The combo panel names Commander Spellbook and the observation date (#1206), and the localized home page carries JSON-LD with no ratings, reviews or offers beyond the existing free one (#1211).
- #1208: the image build passed through dependency installation and Prisma generation. #1203 and #1205 passed typecheck, lint, the unit suite and build, and #1206 lists the same checks, while E2E was still blocked. #1207: 3,367 unit tests and build. #1210 (3,370 unit tests) and #1211 passed Docker E2E (66 + 8); #1212's run was inconclusive. #1213 lists the unit suite and build; #1214-#1216 their focused tests, typecheck and lint. #1199 noted an unrelated `de/settings.json` parity failure, fixed in #1207. Sonar was unavailable without a token.

### 2026-11-03: Tooling, dependencies and backend ownership

- The Sonar launcher runs on Windows and Linux without putting the token on the command line (#1201, #1202). Production dependencies were bumped: `@sentry/nextjs` 10.78.0, `@tanstack/react-query` 5.105.0, `effect` 4.1.1 and `three` 0.187.0 (#1193). Backend ownership of business rules is documented (#1198).
- #1201 records a syntax check, the missing-token guard and a full local analysis; #1202 was validated with sonar-scanner 4.4.0.

### 2026-11-02: More import formats and companion fidelity

- AetherHub deck-builder URLs import the main deck, sideboard and command zone (#1161). MTGDecks URL imports keep their format instead of requesting the Commander export (#1162). ManaBox collector-number suffixes (#1163) and CardNexus text exports with printing and foil markers (#1183) are understood.
- Plain-text Companion sections keep the companion role (#1189), and MTGO exports put the companion in the sideboard (#1170). Contract fixtures protect Moxfield imports (#1158) and the plain-text round trip (#1176).
- #1161: 42 focused URL-import tests. #1162: 45 focused tests, typecheck and lint, with the full suite, build and Sonar pending; a Deckstats export endpoint returned 403, so no Deckstats import was added. #1163's body lists no readable results. #1183: a red-to-green parser test, typecheck, lint and build. #1189: 3,356 unit tests and build. #1170: 34 focused tests, lint and build; its full run showed 3,322 passing and 2 failing pre-existing provenance tests. #1176: 74 contract tests, typecheck, lint and build. #1158 records no verification.

### 2026-11-02: Show where recommendations come from

- Recommendations carry a provenance badge, popular, high synergy, tournament-observed or AI (#1165), and AI recommendations show the provider, the analysis time and the size of the deck analyzed (#1173).
- EDHREC and tournament sources retry independently (#1164) and report their health (#1184). A standalone EDHREC trend view discloses its top-20 limit (#1181) and its capture window (#1191), and a disclosure explains that EDHREC publishes no reliable sample window (#1186).
- Focused tests passed for each, with typecheck and lint for #1164, #1165, #1173, #1181 and #1184. #1186: 19 focused tests, lint and build. #1191: 3,358 unit tests and build. Full suites or builds were still running when #1165, #1173 and #1181 were written.

### 2026-11-02: Clearer deck feedback

- Legality failures appear as a distinct blocking alert, separate from optional advice (#1168). Card lists explain each card's role (#1175). The weakest card is picked from deck data alone, with explicit criteria and no AI call (#1177). Two analyses can be compared before and after a deck change (#1174), and a contract proves warnings are the same whether or not a deck came from AI (#1182).
- #1168: 3,316 unit tests across 297 files and build. #1175 and #1182 (22 tests): focused tests, typecheck and lint. #1177: 3 focused tests, the full suite and build. #1174: focused test and build, with 2 pre-existing failures in the full suite.

### 2026-11-02: Collection, locale, editor and playtest improvements

- Acquisition rows show the total copies needed across decks (#1166). Players can mark a printing Proxy now or Buy later, saved privately across devices (#1171). Adding a card prefers a printing the player owns (#1179), and acquisition CSVs keep each deck's allocation (#1185).
- English and French number and USD formatting share one utility (#1167) that shows the USD code explicitly (#1190), with contracts for dates, numbers, plurals and mana notation (#1178).
- Deck-zone tabs accept dropped cards without changing size (#1187). My Decks keeps a deck-list skeleton while navigating (#1172). Public-deck comments (#1188) and ratings (#1192) stop waiting after 15 seconds and offer retry. Per-event notification preferences are stored behind an authenticated API (#1180). The playtest log records life and counter changes, included in the version 3 JSON export (#1169).
- #1166 (8 tests), #1171 (11), #1178 (11), #1179 (92) and #1180 (3) record focused tests, with full suites pending or showing the 2 pre-existing provenance failures. #1167: 5 focused tests and build; one timing-sensitive assertion failed in the full suite and passed when rechecked alone. #1185: 11 focused tests and build. #1172: build, with 3,322 passing alongside the same 2 pre-existing failures. #1169: 3,316 unit tests, build and Sonar. #1188, #1190 and #1192: 3,355-3,359 unit tests and build. #1187 lists its focused test, typecheck, lint, unit suite and build. Docker E2E could not start from #1188 onward because the Playwright image lacked Corepack, and those pushes skipped the hook after the other gates passed.
- #1157 recorded the request-observability progress. #1159 and #1160 promoted the then-current `dev` to `staging` and `main` that morning; the `main` PR body is an unticked checklist.

### 2026-10-31: Show loading skeletons for shared decks and commander deck lists

- Share links (#1149) and commander deck lists (#1150) show an accessible, localized skeleton while loading instead of a blank page.
- Both passed typecheck, lint, 3,301 unit tests across 295 files, a SonarCloud Quality Gate OK and Docker E2E (66 + 8). A plain-text v1 import fixture (#1151; focused tests, typecheck and lint) and an English/French locale-formatting contract (#1156; no verification recorded) were added. #1152-#1155 promoted QA-validated `dev` through `staging` to `main`; #1153 and #1155 resolved conflicts in favor of the validated versions.

### 2026-10-30: Make deck warnings deterministic and reject blank commander IDs

- Banned-card, color-identity and Game Changer messages name each card once in a stable order (#1133). The companion mana-value warning samples distinct names in order (#1134), and off-identity colors are listed in WUBRG order (#1142). The deck API rejects blank commander and partner IDs on create and update (#1135).
- 3,247-3,272 unit tests, typecheck, lint and a SonarCloud Quality Gate OK with zero project code smells passed for each. Docker E2E (66 + 8) passed for #1134 and #1142, ran in the pre-push hook for #1135, and was not run for #1133.

### 2026-10-30: Bound the remaining loading requests

- Deck snapshot lists (#1136), combo lookups (#1137) and card rulings (#1138) stop after 15 seconds, meta analysis after 30 seconds (#1140) and meta history after 15 (#1141). Rulings fall back to the offline cache, and a stalled combo lookup counts as no combos so the rest of the analysis completes.
- 3,247-3,268 unit tests, typecheck, lint and a SonarCloud Quality Gate OK passed for each. Docker E2E (66 + 8) passed for #1137, #1138, #1140 and #1141 and ran in the pre-push hook for #1136.

### 2026-10-30: Record request latency on profile, cache, image and import routes

- The public profile (#1143), card cache lookup (#1144), card image proxy (#1145), Moxfield profile import (#1146), user init (#1147) and username update (#1148) routes write one status-and-duration line per request, without usernames, URLs or other personal data.
- 3,274-3,287 unit tests, typecheck, lint, a SonarCloud Quality Gate OK and Docker E2E (66 + 8) passed for each. #1139 reconciled the roadmap with shipped validation and gate evidence (documentation only).

### 2026-10-29: Reject same-Oracle commander pairs and time profile changes

- A commander and partner that are different printings of the same Oracle card are rejected on deck creation and update (#1131). Profile updates and deletions record status and duration without account details (#1132).
- Both were observed red. #1131: 37 focused route tests, typecheck, lint, the full unit suite and build passed, and SonarCloud reported a Quality Gate OK with zero code smells. #1132: 3,245 unit tests across 292 files and build passed. E2E was not rerun for these server-side changes.

### 2026-10-28: Clear stale comparisons, show exact-printing needs and close Sonar smells

- A deck comparison clears when the selection changes, and late responses cannot bring stale results back (#1117). The collection's exact-printing usage dialog shows how many copies remain to acquire (#1118).
- Behavior-preserving refactors resolved the 20 open Sonar code smells (#1119) and the remaining import-dialog complexity (#1123, #1127).
- #1117: focused tests, typecheck and lint, with the full suite (3,239 tests) run before a follow-up. #1118: 3,239 unit tests across 292 files. #1119: 3,238 unit tests and build. #1123 and #1127: 3,241 unit tests and build. #1117 and #1118 did not run Sonar locally, and E2E was not rerun for the refactors. #1130 recorded the shipped deterministic AI golden evaluations (6 tests) in the roadmap.
- #1111, #1120 and #1124 recorded the batch; #1113 reconciled `staging` ancestry; #1114 and #1116, #1121 and #1122, #1125 and #1126, and #1128 and #1129 promoted QA-approved content to `staging` and `main`.

### 2026-10-28: Refine five deckbuilding boundaries

- Companion deck-building failures now appear as legality warnings, and AI per-card budget choices format their USD amounts for the active locale without implying conversion (#1110).
- Acquisition plans retain a known printing price when an earlier deck lacks one. Public-profile requests encode reserved username characters, and HTML card imports deduplicate names case-insensitively (#1110).
- Duplicate-card warning names use locale-aware sorting, resolving a Sonar reliability finding. Five behavior tests were observed red before their fixes; 3,238 VPS unit tests, typecheck, lint, build, Sonar, 66 browser E2E, 8 authenticated/setup E2E and PR checks passed (#1110).

### 2026-10-27: Harden collection and deck feedback boundaries

- Collection API parsing rejects negative and fractional owned quantities instead of letting them distort acquisition calculations (#1108).
- Game Changer warnings list names in a stable order, count actual copies and apply the Bracket 4 warning to that count. Text imports preserve `Fire // Ice` before a trailing comment; public profiles replace failed avatar images with an accessible neutral icon (#1108).
- Focused Red/Green cycles, VPS typecheck, lint, 3,232 unit tests, production build, Sonar analysis, 66 browser E2E and 8 authenticated/setup E2E passed. CI, SonarCloud, Vercel and the performance/accessibility audit passed before merge into `dev`.

### 2026-10-27: Refine imports, acquisition exports and deck feedback

- Text decklists retain simple split-card names such as `Fire // Ice` without treating a multiword card's `// Foil` annotation as part of its name (#1106).
- Collection acquisition CSV line totals round to cents; Moxfield profile pagination stays with the loaded profile when the editable username changes; duplicate deck warnings have stable name order (#1106).
- Focused Red/Green tests, VPS typecheck, lint, 3,227 unit tests, production build, Sonar analysis and the full Docker E2E gate passed. CI, SonarCloud, Vercel and the performance/accessibility audit passed before merge into `dev`.

### 2026-10-27: Harden deck validation and roadmap workflows

- Adding a fifth non-basic copy in a four-copy format is rejected before the deck is changed. Failed maybeboard additions roll back without removing an existing main-deck card of the same printing (#1104).
- The cross-deck acquisition plan includes commander-slot cards even when their stored zone is not main. Meta trends skip empty historical baselines while still withholding trends when the latest snapshot is empty (#1104).
- Focused Red/Green tests, VPS typecheck, lint, 3,222 unit tests, production build, Sonar analysis, 66 browser E2E and 8 authenticated/setup E2E passed. CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`.

### 2026-10-26: Stabilize deck and meta boundaries

- Older failed deck renames no longer roll back a newer rename with the same title; superseded Moxfield profile responses no longer replace a newer request's state (#1100).
- Deck price summaries choose the same card ID for equal highest or lowest prices regardless of card order. MTGTop8 forms without EDH archetypes now fail explicitly instead of silently using a different search (#1100).
- Focused Red/Green tests, VPS typecheck, lint, 3,217 unit tests, production build, Sonar scan, 66 browser E2E and 8 authenticated E2E passed. PR CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`.

### 2026-10-20: Label card destinations in pasted-list previews

- Each card row in a pasted-list preview now displays its destination zone before import (#1069). English and French labels are active, with key parity maintained in dormant catalogs. Parsing, quantities and persisted zones are unchanged.
- Observed a focused Red/Green UI test plus French and locale-parity coverage. VPS typecheck, lint, 3,178 unit tests and production build passed; CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-20: Show duplicates before pasted-list import

- Pasted-list previews now flag repeated card lines and commanders repeated in the main deck before confirmation (#1067). Both import paths share canonical Scryfall-name matching; the preview does not change quantities or remove cards automatically.
- Observed two focused Red/Green UI cycles. VPS typecheck, lint, 3,176 unit tests and production build passed; CI, SonarCloud, Vercel and the retried performance/accessibility audit passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-20: Validate pasted card names before import

- Pasted-list previews now check card names with Scryfall and show unresolved names before confirmation (#1065). Confirming reuses the validated cards without another lookup; closing or editing invalidates stale results. Duplicate decisions and exact-printing choices remain open.
- Observed focused Red/Green tests for missing names, late responses and stale warnings. VPS typecheck, lint, 3,174 unit tests and production build passed; CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-20: Preview pasted decklists before import

- Show parsed commander, zone copy counts and card rows before requesting Scryfall data or changing the deck (#1063). Confirmation starts the existing import; editing the pasted text invalidates a stale preview. Scryfall-unresolved names remain a post-confirmation warning.
- Observed a focused Red/Green UI test. VPS typecheck, lint, 3,171 unit tests and production build passed; CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-20: Make meta recommendation actions usable without hover

- Keep the EDHREC card-add button visible without hovering, enlarge its touch target to 40 px and show a keyboard focus outline (#1058). Recommendation data and add behavior are unchanged.
- Observed a focused Red/Green UI test. VPS typecheck, lint, 3,169 unit tests, production build and 72 Docker E2E scenarios passed; CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`.

### 2026-10-20: Show owned copies in acquisition planning

- Show the number of copies already owned beside each missing printing, so the remaining purchase quantity has context (#1056). Ownership, prices and the read-only plan calculation are unchanged.
- Observed a focused Red/Green component test. VPS typecheck, lint, 3,168 unit tests, production build and 72 Docker E2E scenarios passed; CI, SonarCloud, Vercel and performance/accessibility checks passed before merge into `dev`.

### 2026-10-20: Show per-deck acquisition demand

- Display the number of copies required by each contributing deck in acquisition-plan rows while preserving the aggregate missing quantity and deck links (#1054).
- Align the Docker Playwright image with the already-updated 1.64.1 package. Observed a focused Red/Green UI test and the failing/passing toolchain guard; VPS typecheck, lint, 3,168 unit tests, build and 72 Docker E2E scenarios passed. CI, SonarCloud, Vercel and the performance/accessibility audit passed before merge into `dev`.

### 2026-10-20: Label AI suggestion provenance

- Show the AI provenance of each generated card rationale in English and French, distinct from Scryfall card verification (#1052). The broader meta-source separation remains open.
- Observed bilingual Red/Green component tests. VPS typecheck, lint, 3,167 unit tests, production build and 72 Docker E2E scenarios passed; CI, SonarCloud, Vercel and the performance/accessibility audit passed before merge into `dev`.

### 2026-10-20: Filter playtest actions by phase

- Filter the visible playtest action log by phase, optionally within one turn. Changing turns clears the phase choice; copying and downloading still include the full session (#1050).
- Observed a focused Red before implementation. VPS typecheck, lint, 3,165 unit tests, production build and 72 Docker E2E scenarios passed. CI, SonarCloud, Vercel and the retried performance/accessibility audit passed before merge into `dev`.

### 2026-10-19: Focus the playtest log on one turn

- Filter visible action entries and turn evidence by a selected turn, with an accessible way to return to the full log (#1045). Copy and downloads continue to include the complete session.
- Two focused Red/Green cycles and a full-export regression test passed. VPS typecheck, lint, 3,163 unit tests, production build on retry and 72 Docker E2E checks passed. The first build attempt failed in Next.js Google Fonts loading; the retry completed successfully.

### 2026-10-19: Cancel playtest action edits

- Press Escape to leave an action-log edit without saving its draft (#1043). Enter and blur continue to save.
- The focused test failed before the change and passed afterward. VPS typecheck, lint, 3,160 unit tests and production build passed.

### 2026-10-18: Localize playtest action logs

- Use the active English or French locale for action-log turn and phase labels and copied or downloaded text, while leaving player-authored descriptions and JSON exports unchanged (#1042).
- VPS typecheck, lint, 3,159 unit tests, production build and Docker E2E passed. CI, SonarCloud and Lighthouse passed; Vercel failed independently, and the merge into `dev` was explicitly approved despite that check.

### 2026-10-18: Copy the playtest action log

- Copy the existing text log without downloading it; confirm success and explain clipboard failures with the text export as a fallback (#1040).
- Keep English and French messages available while preserving key parity in dormant catalogs.
- Validated on the VPS with typecheck, lint, 3,157 unit tests, production build and 72 Docker E2E checks. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-18: Record Scryfall search and cache timing

- Record external Scryfall search status and duration without including query text or card data (#1036).
- Record server-side cache hit, miss and database failure duration while preserving existing responses.
- Validated on the VPS with typecheck, lint, 3,154 unit tests, production build and 72 Docker E2E checks. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-18: Record deck-list request outcomes

- Log the status and duration of `GET /api/decks`, including authentication and server failures, without recording user identifiers (#1034).
- Split Docker Playwright into anonymous and authenticated runs so Next.js starts fresh before signed-in flows; keep all 72 scenarios in the pre-push gate.
- Validated on the VPS with typecheck, lint, 3,145 unit tests, production build and the full Docker E2E gate. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-18: Cover searched-card addition and reload in E2E

#### Tests

- Add a Docker-backed browser scenario that searches for a card, selects a printing, verifies its saved Main-zone row and confirms it remains in the editor after reload (#1031).

#### Validation

- VPS typecheck, lint, 3,144 unit tests, production build and focused Docker E2E (4 passed) succeeded. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. No production behavior changed.

### 2026-10-18: Cover failed deck-zone save and reload in E2E

#### Tests

- Add a Docker-backed browser scenario that rejects a Sideboard-to-Considering save, verifies the retry message and retained card, checks the saved zone through the API, and confirms the card remains after reload (#1029).

#### Validation

- VPS typecheck, lint, 3,144 unit tests, production build, and focused Docker E2E (3 passed) succeeded. CI, SonarCloud, Lighthouse, and Vercel passed before merge into `dev`. No production behavior changed.

### 2026-10-18: Ignore stale zone-save errors after card removal

#### Fixed

- Do not show a failed card-move message when that card has already been removed from its deck (#1027). Recovery for cards still in the deck is unchanged.

#### Validation

- Focused Red/Green test, VPS typecheck, lint, 3,144 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-17: Ignore stale zone-save errors after deck removal

#### Fixed

- Do not show a failed card-move message when its deck has already been removed (#1025). Zone-save recovery for existing decks is unchanged.

#### Validation

- Focused Red/Green test, VPS typecheck, lint, 3,143 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-17: Visible omissions in pasted deck imports

#### Changed

- Show unresolved card names after a plain-text decklist import rather than presenting a partial import as complete (#1023). Successfully resolved cards are still added.

#### Validation

- Focused Red/Green test, VPS typecheck, lint, 3,142 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-17: Localized deck wizard strategy and bracket choices

#### Improved

- Show the existing English or French strategy names/descriptions and bracket names/descriptions in deck creation, without changing the selected strategy value or bracket level (#1021).

#### Validation

- Separate French UI tests for strategy and bracket descriptions failed before their respective implementation steps. VPS typecheck, lint, 3,141 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Localized deck wizard color names

#### Improved

- Announce deck creation color choices in the active English or French language, including accessible button names and tooltips, while preserving mana symbols and selection behavior (#1019).

#### Validation

- A French accessible-name test failed before implementation. VPS typecheck, lint, 3,139 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Localized deck wizard budget choices

#### Improved

- Display the four deck creation budget choices from the active locale catalog instead of hardcoded English labels, without converting their USD limits (#1017).

#### Validation

- A French UI regression test failed on the previous English label before implementation. VPS typecheck, lint, 3,138 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Locale-aware AI impact metrics

#### Improved

- Format average mana value and known USD card value in the AI suggestion impact preview for the active locale, without implying a currency conversion (#1015).

#### Validation

- Separate focused tests observed French currency and decimal-separator failures before implementation. VPS typecheck, zero-warning lint, 3,137 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Recoverable collection loading

#### Fixed

- Stop stalled collection reads after 15 seconds and offer a localized retry instead of an endless spinner or a false empty collection (#1013). Failed refreshes keep saved cards visible with a warning.

#### Validation

- Focused Red/Green cycles covered failure reporting, visible retry and timeout. VPS typecheck, zero-warning lint, 3,135 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Guest deck-list loading state

#### Fixed

- Show the empty deck state rather than an indefinite loading skeleton to signed-out visitors after session resolution (#1011). Keep the skeleton during session resolution and authenticated deck loading.

#### Validation

- The focused regression test failed before implementation because the guest empty state was absent. VPS typecheck, lint, 3,131 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Builder loading skeleton

#### Improved

- Replace the initial deck-loading text with an accessible, responsive silhouette of the editor's search, deck and statistics panels (#1009). Missing-deck and retryable error states are unchanged.

#### Validation

- The focused test failed before implementation because the loading status was not marked busy and no editor structure existed. VPS typecheck, lint, 3,130 unit tests and production build passed. CI, SonarCloud, Lighthouse and the final Vercel preview passed before merge into `dev`; an earlier Vercel preview failed without accessible logs. Docker E2E and QA promotion remain pending.

### 2026-10-17: Category editing in every Main list grouping

#### Fixed

- Keep the existing accessible category menu available when cards are grouped by mana value or color, not only by card category (#1007).

#### Validation

- The focused test failed before implementation because the grouped card lacked the category control. VPS typecheck, lint, 3,128 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Main-grid category editing

#### Added

- Change a Main card's category directly in grid view using an accessible native selector, without switching views or dragging (#1005).

#### Validation

- The focused test failed before implementation because the grid had no named category control. VPS typecheck, lint, 3,127 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E and QA promotion remain pending.

### 2026-10-17: Touch-friendly Main grid actions

#### Added

- Keep a Main-grid card's moves to Sideboard and Considering and its removal action visible on touch devices, with larger touch targets and keyboard focus visibility (#1003).

#### Validation

- Two focused Red/Green cycles, VPS typecheck, lint, 3,126 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-17: Touch-friendly secondary zone moves

#### Added

- Offer both legal destinations for Sideboard and Considering cards in grid view, and keep the existing move controls visible on touch devices in grid and list views (#1001).

#### Validation

- Three focused Red/Green cycles, VPS typecheck, lint, 3,124 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`. Docker E2E was not run for this slice.

### 2026-10-16: Touch-friendly deck categories

#### Added

- Let players change a card's category from a touch-friendly menu in the grouped deck list, using the existing persisted category update (#999).

#### Validation

- VPS typecheck, lint, 3,121 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Keyboard deck card sorting

#### Added

- Keep category reorder handles in the keyboard tab order and enable vertical keyboard sorting in the deck editor (#997).

#### Validation

- VPS typecheck, lint, 3,120 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Acquisition plan loading timeout

#### Fixed

- Show the existing retry state if the acquisition-plan request stalls for 15 seconds, while preserving cancellation when the panel closes or its filter changes (#995).

#### Validation

- VPS typecheck, lint, 3,119 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Recoverable public deck failures

#### Fixed

- Preserve not-found behavior for a missing deck, but show the existing retryable route error when the public-deck API, network or response fails (#993).
- Abort public-deck API loading after 15 seconds and avoid labeling temporary failures as missing in metadata (#993).

#### Validation

- VPS typecheck, lint, 3,118 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Public deck loading feedback

#### Added

- Show an accessible English/French loading skeleton while a public deck route resolves (#991).

#### Changed

- Share the public deck and profile loading presentation and use semantic output for the loading status (#991).

#### Validation

- VPS typecheck, lint, 3,113 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`; Sonar new-code duplication was 0%.

### 2026-10-16: Recoverable public profile failures

#### Fixed

- Preserve not-found behavior for a missing user, but show the existing localized retryable route error when the public-profile API or network fails (#989).
- Abort a public-profile API fetch after 15 seconds and avoid presenting unavailable metadata as a missing profile (#989).

#### Validation

- Two observed Red/Green cycles; VPS typecheck, lint, 3,111 unit tests and production build passed. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Public profile loading feedback

#### Added

- Show a localized, accessible loading skeleton while a public profile route resolves (#987).

#### Fixed

- Restore focus to the deck-report trigger after closing its dialog without a React hook lint warning (#987).

#### Validation

- Typecheck, zero-warning lint, 3,108 unit tests and production build passed on the VPS. CI, SonarCloud, Lighthouse and Vercel passed before merge into `dev`.

### 2026-10-16: Deck-list retry reliability

#### Fixed

- Ignore an older deck-list response after a newer request completes, preventing a stale failure from undoing a successful retry (#984).
- Show a compact, localized warning and retry action when a failed refresh leaves cached decks visible (#985).

#### Validation

- Both changes were tested and built on the VPS, with observed test-first failures and 3,105 passing unit tests for the latest branch. CI, SonarCloud, Lighthouse and Vercel passed before each merge into `dev`. QA promotion remains separate.

### 2026-10-15: Public deck card-count localization

#### Changed

- Localized the public deck card count in English and French, including singular and plural forms, using the shared deck-count message (#982).
- Added component tests for one and multiple copies and verified catalog parity.

### 2026-10-15: Locale-aware suggestion prices

#### Changed

- Formatted Scryfall USD prices in AI suggestion evidence according to the active locale while retaining the USD currency (#980).
- Added French component coverage for grouping, decimals and currency placement.

### 2026-10-15: Owned printing filter

#### Added

- The printing selector can show only editions already in the player's collection, counting regular and foil copies. Its default remains the full list, and selecting an edition remains explicit (#978).
- An empty owned-only view explains the result and can be switched back to all editions without leaving the selector.

#### Validation

- Three observed Red/Green cycles. VPS only: TypeScript, lint, 3,101 unit tests, production build and 69 Docker Playwright scenarios passed. Automatic edition matching on import remains separate scope; staging and main require QA promotion.

### 2026-10-15: Individual deck loading retry

#### Fixed

- Direct builder navigation now shows a localized retry state when fetching the individual deck fails, rather than displaying the incomplete deck-list stub as an empty editor (#976). A successful retry hydrates the full deck and clears the error.

#### Validation

- Observed Red/Green for failure reporting, error clearing and the retry UI. VPS only: TypeScript, lint, 3,099 unit tests, production build and 69 Docker Playwright scenarios passed. SonarCloud public issue search returned zero open issues. Broader loading ownership remains open; staging and main require QA promotion.

### 2026-10-15: Recoverable builder loading

#### Fixed

- Direct builder navigation now shows a localized retry action when the deck-list request fails instead of incorrectly saying the deck is missing (#974). A successfully loaded list without that deck still shows the missing-deck state.

#### Validation

- Observed Red/Green for the failed-load and missing-deck states. VPS only: TypeScript, lint, 3,097 unit tests, production build and 68 Docker Playwright scenarios passed. SonarCloud reported zero open issues, and all PR checks passed. Integrated into `dev`; QA promotion remains pending.

### 2026-10-13: Accessible main-deck zone moves

#### Added

- Added explicit Sideboard actions to main-deck cards in grid and list views without removing the existing drag-and-drop workflow.
- Gave repeated zone controls card-specific accessible names and aligned every locale catalog.
- Added three Red/Green behavior cycles and validated 3,095 unit tests, 68 Docker-backed E2E tests, the production build and a zero-issue Sonar report.

### 2026-10-10: Sonar reliability and maintainability recovery

#### Fixed

- Google authentication failures now show recoverable feedback on sign-in and sign-up pages. Description editing waits for save completion; the AI card import promise chain has one rejection handler. Background UI calls are explicit where existing stores/hooks already handle errors (#955).
- Simplified exact public-route membership, unnecessary async wrappers, optional-chain guards, array sorting and text export formatting. Test setup precedes test cases (#956).

#### Validation

- Three separately observed Red/Green cycles protect description-save completion and both Google failure paths. The refactoring lot passed 1,005 targeted tests before and after changes.
- VPS only: 3,077 unit tests across 275 files, typecheck, lint, production build and 66 Docker E2E scenarios passed. CI, Sonar, performance and Vercel passed for both PRs.
- The approved secret refresh restored GitHub analysis. Fresh Sonar API evidence: Quality Gate OK, new-code reliability/security/maintainability A, 91.3% new-code coverage under existing exclusions, 0.5% new-code duplication, zero bugs and 65 remaining code smells. No threshold reduction or additional exclusion was introduced. See [Sonar status](../engineering/sonar-status.md).
- Integrated into `dev`; staging/main promotion awaits QA. The remaining code smells are not claimed fixed.

### 2026-10-10: Reliable import and deck activation completion

#### Fixed

- Await deck activation before import, public fork and AI wizard follow-up actions, await each URL import addition, and await existing-card quantity persistence before completing the addition (#953).

#### Validation

- Observed Red: an addition resolved before its pending quantity save. Minimal Green awaits the mutation. VPS: 3,074 unit tests across 274 files, typecheck, lint, build and 66 full Docker E2E scenarios passed. CI, performance and Vercel passed.
- Sonar CI fails before analysis with HTTP 403. Integrated into `dev` only; staging/main promotion awaits QA. Broader Sonar and save-recovery work remains open.

### 2026-10-09: Shared bulk and manual bracket activity

#### Fixed

- Completing a bulk removal no longer hides pending manual bracket save activity, and manual bracket completion no longer hides a pending bulk removal (#947). Other action combinations and mutation ownership remain follow-up work.

#### Validation

- Two separately observed Red/Green cycles reproduce both completion orders. Minimal Green checks the two existing counters in both completion paths. VPS: 3,073 unit tests across 274 files, TypeScript, lint and build passed; full blocking Docker E2E passed 66 scenarios without bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Concurrent bulk removal activity

#### Fixed

- Keep the save indicator active until every overlapping bulk removal batch finishes (#945). This covers bulk removal batches only; cross-action tracking and overlapping recovery ownership remain follow-up work.

#### Validation

- Observed focused Red hid activity while an earlier batch remained pending. Minimal Green counts pending batches; existing recovery regressions pass. VPS: 3,071 unit tests across 274 files, TypeScript, lint and build passed; full blocking Docker E2E passed 66 scenarios without bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Stale bulk removal selections

#### Fixed

- Request bulk removal only for cards present in the active deck. An entirely stale selection leaves the deck and save activity unchanged and sends no request (#943). Cross-batch ownership remains follow-up work.

#### Validation

- Observed focused Red sent requests for an absent card and a present card instead of only the present card. Minimal Green intersects selection with current identifiers; passing characterization covers an entirely stale selection. VPS: 3,070 unit tests across 274 files, TypeScript, lint and build passed. Initial E2E: 64 passed and two authenticated deck-list failures; a fresh full run passed all 66 without assertion changes, retries or bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Intermittent loading/session failure is not claimed fixed. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Unique bulk removal requests

#### Fixed

- Process repeated card identifiers once per bulk removal, avoiding duplicate server writes and conflicting recovery for the same card (#941). Cross-batch ownership remains follow-up work.

#### Validation

- Observed focused Red produced two removal requests instead of one. Minimal Green reuses the existing identifier set for requests; existing recovery regressions pass. VPS: 3,068 unit tests across 274 files, TypeScript, lint and build passed; full blocking Docker E2E passed 66 scenarios without bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Grouped bulk removal feedback

#### Fixed

- Show one retry notification after a bulk removal batch finishes, even when several cards are rejected. Individual recovery remains unchanged; no notification is shown for a deleted deck (#939). Overlapping removal ownership remains follow-up work.

#### Validation

- Observed focused Red produced two notifications instead of one. Minimal Green aggregates rejected removals within the batch. Existing partial-success, deletion and ordering regressions pass. VPS: 3,067 unit tests across 274 files, TypeScript, lint and production build passed; full blocking Docker E2E passed 66 scenarios without bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Bulk removal recovery ordering

#### Fixed

- Restore rejected bulk removals before the next surviving original card, or append when no successor remains. Relative order is preserved when rejections finish out of order; successful removals remain applied (#937). Overlapping removal recovery and aggregate feedback remain follow-up work.

#### Validation

- Observed focused Red placed the restored middle card after the last card. Minimal Green uses original successor identifiers; passing characterization covers reverse-order failures with a successful removal. VPS: 3,066 unit tests across 274 files, TypeScript, lint and build passed; full blocking Docker Playwright passed 66 scenarios without bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Bulk removal failure recovery

#### Fixed

- Rejected bulk removals restore only failed cards with their original zone and quantity and show retry feedback. Successful removals remain removed; late failures do not recreate or warn about deleted decks (#935). Restored cards append to the list. Original ordering, overlapping recovery and aggregate feedback remain follow-up work; bulk undo behavior is unchanged.

#### Validation

- Observed focused Red reproduced a missing card after a rejected removal. Minimal Green recovers each rejection independently. Passing characterization covers deletion during a pending request. VPS: 3,064 unit tests across 274 files, TypeScript, lint and production build passed; full blocking Docker Playwright passed all 66 scenarios with unchanged exclusions and no bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. Integrated into dev only; staging/main promotion awaits QA validation.

### 2026-10-09: Manual bracket save activity

#### Fixed

- The compact save indicator stays active until every overlapping manual bracket request finishes, including rejected requests (#933). This increment covers manual bracket requests only, not shared activity across other actions or server write ordering.

#### Validation

- Observed focused Red: isSyncing became false while the first request remained pending. Minimal Green tracks pending manual bracket requests; passing characterization covers rejection during another pending save. VPS: 3,062 unit tests across 274 files, TypeScript, lint and production build passed. Initial full E2E run: 63 passed, one authentication socket hang up, two not run. A fresh full run passed all 66 scenarios with unchanged exclusions, no added retries and no bypass. CI, performance and Vercel passed.
- Sonar local configuration is absent; CI failed before analysis with HTTP 403. The intermittent authentication outage is not claimed fixed. Integrated into dev only; staging/main promotion awaits the QA cycle.

### 2026-10-08: Manual bracket save recovery

#### Fixed

- Rejected manual bracket overrides or returns to automatic calculation restore the previous displayed setting when the attempted value remains current and show retry feedback. Different newer settings are preserved; late failures do not recreate or warn about deleted decks (#931).

#### Validation

- Observed focused Red: rejected override left bracket 4 instead of null. Minimal Green restores the prior setting. Three additional passing characterization tests cover clearing an existing override, a different newer successful setting and deletion during the request. VPS: 3,060 unit tests across 274 files, TypeScript, lint and production build passed. Full blocking Docker Playwright passed 66 scenarios with unchanged exclusions and no bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI failed before analysis with HTTP 403. General write serialization, repeated identical values, confirmed-baseline recovery and global activity accounting remain open. Integrated into dev; staging/main promotion remains pending. The existing intermittent E2E outage is not claimed fixed.

### 2026-10-08: Deck budget save recovery

#### Fixed

- Rejected budget saves or clears restore the previous displayed budget when the attempted value is still current and show retry feedback. A different newer budget is preserved; late failures neither recreate nor warn about deleted decks (#929).

#### Validation

- Observed focused Red/Green: attempted budget 200 remained instead of previous null. Supplementary passing characterization covers clearing an existing limit, a different newer successful budget and deletion during the request. VPS: 3,056 unit tests across 274 files, TypeScript, lint and production build passed. Full blocking Docker Playwright: 66 passed in isolated Compose with diagnostic logging, unchanged exclusions and no retries or bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI is blocked before analysis by HTTP 403. General budget-write serialization, repeated identical values, confirmed-baseline recovery and global activity accounting remain open. Integrated into dev; staging/main promotion remains pending. The existing intermittent E2E outage is not claimed fixed.

### 2026-10-08: Target bracket save recovery

#### Fixed

- Rejected target bracket saves restore the previous displayed target when the attempted value is still current and show retry feedback. A different newer target is preserved; late failures neither recreate nor warn about deleted decks (#927).

#### Validation

- Observed focused Red/Green: attempted target 4 remained instead of previous target 2. Supplementary passing characterization covers feedback, a different newer successful target and deletion during the request. VPS: 3,053 unit tests across 274 files, TypeScript, lint and production build passed. Full blocking Docker Playwright: 66 passed in isolated Compose with diagnostic server logging, unchanged exclusions and no retries or bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent; CI is blocked before analysis by HTTP 403. General target-write serialization, repeated identical values, confirmed-baseline recovery and global activity accounting remain open. Integrated into dev; staging/main promotion remains pending. The existing intermittent E2E outage is not claimed fixed.

### 2026-10-08: Failed deck rename recovery

#### Fixed

- Failed deck renames restore the previous displayed name when the attempted name is still current and show a retry notification. A different newer name remains intact; a late failure neither recreates a deleted deck nor warns about it (#925).

#### Validation

- Observed one focused Red/Green cycle by replacing the existing test of unwanted optimistic-name retention. Supplementary passing characterization covers retry feedback, a newer different successful name and deletion during the request. VPS: 3,050 unit tests across 274 files, TypeScript, lint and production build passed. Full blocking Docker Playwright: 66 scenarios passed in an isolated Compose project with diagnostic logging, unchanged exclusions and no retries or bypass. CI, performance and Vercel passed.
- Local Sonar configuration is absent and CI remains blocked before analysis by HTTP 403. General rename serialization, repeated identical names and confirmed-baseline recovery remain open. The previously documented intermittent E2E server outage is not claimed fixed. Integrated into dev; staging/main promotion remains pending.

### 2026-10-08: Deck refresh failure feedback

#### Fixed

- Failed manual deck refresh asks the player to retry without changing the existing deck. Late failures after successful deletion do not display an obsolete warning (#923).

#### Validation

- Two sequential observed Red/Green cycles: missing error feedback, then obsolete feedback after deletion. VPS validation passed 3,048 unit tests across 274 files, TypeScript, lint and production build. CI, performance and Vercel passed; Sonar remains blocked before analysis by HTTP 403 and local configuration is absent.
- The full blocking Docker Playwright gate passed all 66 scenarios with unchanged exclusions and no test retries or hook bypass. Two earlier full runs failed at authentication setup with a socket hang up (63 passed, two not run). Isolated authentication and a subsequent full run with server diagnostic logging passed. The intermittent test-server outage is not claimed resolved; failure evidence is retained on the VPS.
- Integrated into dev. Dedicated visual retry states, broader loading ownership and staging/main promotion remain open.

### 2026-10-08: Deleted deck refresh protection

#### Fixed

- A save refresh completing after successful deck deletion no longer restores the deleted deck or announces a successful save (#921). If deletion is rejected, refresh still updates the existing deck.

#### Validation

- One observed focused Red/Green cycle reproduced the deleted deck being recreated. Additional passing characterization covers rejected deletion and obsolete save feedback. VPS: 3,046 unit tests across 274 files, TypeScript, lint and production build passed. Full blocking Docker Playwright: 66 scenarios passed with existing external/performance exclusions in an isolated Compose project. CI, performance and Vercel passed.
- Local Sonar execution lacks configuration; CI Sonar is blocked before analysis by HTTP 403. Broader unloading, stale-response ownership and concurrent edits remain open. Integrated into dev; staging/main promotion remains pending.

### 2026-10-08: Obsolete undo success feedback

#### Fixed

- Undo completion no longer announces a successful edit when its original deck has disappeared after deletion (#919). Late restoration responses do not recreate the deleted deck; ordinary undo feedback for present decks is unchanged.

#### Validation

- Observed one focused Red/Green cycle for late addition undo, followed by passing restoration characterization coverage. VPS: 3,044 unit tests across 274 files, TypeScript, lint and build passed. Full blocking Docker Playwright: 66 scenarios passed with existing external/performance exclusions in an isolated Compose project. CI, performance and Vercel passed. Local Sonar lacks configuration; CI Sonar remains blocked before analysis with HTTP 403.
- Broader unloading, late-response ownership and concurrent mutations remain open. Integrated into dev; staging/main promotion remains pending.

### 2026-10-08: Pending undo after deck deletion

#### Fixed

- Failed in-flight undo additions/removals no longer restore obsolete retry entries when their original deck is absent after successful deletion (#917). Existing failure recovery for still-present decks is unchanged.

#### Validation

- Two sequential observed Red/Green cycles, one for each undo kind. VPS: 3,042 unit tests across 274 files, TypeScript, lint and build passed. Full Docker Playwright: 66 scenarios passed with existing external/performance exclusions, using an isolated Compose project without published database ports. CI, performance and Vercel passed. Local Sonar configuration is absent; CI Sonar remains blocked before analysis with HTTP 403.
- Successful late responses, unloading races and broader mutation ownership remain open. Integrated into dev; staging/main promotion remains pending.

### 2026-10-07: Deleted deck undo cleanup

#### Fixed

- Successful deck deletion removes only its undo entries, keeping other decks' undo usable; rejected deletion retains the deck and history (#915).
- Zone-persistence E2E assertions distinguish rendered card names from menu options and zone tabs from move actions, retaining save and reload checks.

#### Validation

- Observed one focused Red before the minimal store change, then Green. VPS validation passed 3,040 unit tests across 274 files, TypeScript, lint and build. The complete blocking Docker Playwright suite passed 66 scenarios (existing external/performance exclusions unchanged) in an isolated Compose project without published database ports. CI, performance and Vercel passed. Local Sonar lacks configuration; CI Sonar remains blocked before analysis with HTTP 403.
- Broader concurrent delete/undo ownership and staging/main promotion remain open; this delivery is integrated into dev.

### 2026-10-07: Deck opening failure feedback

#### Fixed

- Display a retry error notification when individual deck opening fails instead of logging silently (#911).

#### Validation

- Regression failed before implementation. VPS validation passed 3,038 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-07: Individual deck loading deadline

#### Fixed

- Abort stalled individual server deck requests after 15 seconds, including response-body reading, without changing local guest loading (#909).

#### Validation

- Regression failed before implementation. VPS validation passed 3,037 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-07: Ambiguous legacy undo protection

#### Fixed

- Preserve cards and undo actions when recorded ID is absent and multiple same-name candidates exist, reporting ambiguity without deletion (#907).

#### Validation

- Regression failed before implementation. VPS validation passed 3,036 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-07: Exact printing undo targeting

#### Fixed

- Prioritize the recorded card identifier before the existing same-name fallback when undoing additions, preserving other printings (#905).

#### Validation

- Regression failed before implementation. VPS validation passed 3,035 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### Unloaded deck undo recovery

#### Fixed

- Preserve undo actions for unloaded original decks and ask the player to open them before retrying, without server mutations (#901).

#### Validation

- Both regressions failed before implementation. VPS validation passed 3,034 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-07: Obsolete undo duplicate prevention

#### Fixed

- Discard obsolete removal undo when its saved card is already present, without another API addition or changes to current zone/quantity (#899).

#### Validation

- Regression failed before implementation. VPS validation passed 3,032 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Restored card identifiers

#### Fixed

- Use the original printing identifier and returned saved row identifier when undo restores a removed card, preserving zone and quantity and enabling subsequent edits/removals (#897).

#### Validation

- Both regressions failed before implementation. VPS validation passed 3,031 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Failed undo removal recovery

#### Fixed

- Roll back unsaved restored cards after failed undo removals, retain retry actions and replace false success notifications with errors (#895).

#### Validation

- Regression failed before implementation. VPS validation passed 3,029 tests across 274 files, TypeScript, lint and build. CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Failed undo addition recovery

#### Fixed

- Restore cards and retry actions after failed undo additions, retaining zone and quantity and replacing the false success notification with an error (#893).

#### Validation

- Regression failed before implementation. VPS validation passed 3,028 tests across 274 files, TypeScript, lint and build. CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Undo deck targeting

#### Fixed

- Apply undo additions/removals to the action's recorded deck after switching decks, without changing the current selection or unrelated deck (#891).

#### Validation

- Both regressions failed before implementation. VPS validation passed 3,027 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Card order during removal recovery

#### Fixed

- Restore failed removals before surviving original successors rather than appending the card, while preserving concurrent successful removals and their undo entries (#889).

#### Validation

- Regression failed before implementation. VPS validation passed 3,025 tests across 274 files, TypeScript, lint and build. CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Rejected card removal recovery

#### Fixed

- Restore cards after failed removal saves, retaining their zone and quantity and removing the corresponding undo entry; display a retry error (#887).

#### Validation

- Regression failed before implementation. VPS validation passed 3,024 tests across 274 files, TypeScript, lint and build. CI, performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403. Docker E2E and wider remove/undo concurrency remain open.

### 2026-10-06: Ordered category edits

#### Fixed

- Serialize category saves per card and restore the last confirmed category instead of an unsaved intermediate value when rapid edits fail (#882).

#### Validation

- Two regressions failed before implementation. VPS validation passed 3,023 tests across 274 files, TypeScript, lint and build. CI passed after rerunning a transient Next.js font-loader failure; performance and Vercel passed. Sonar remains blocked before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-06: Failed category edit recovery

#### Fixed

- Restore the previous card category when its save fails and the attempted category is still displayed; notify the player to retry (#880).

#### Validation

- Observed a failing regression before implementation. VPS validation passed 3,021 tests across 274 files, TypeScript, lint and build; CI, performance and Vercel passed. Sonar remains blocked before analysis by HTTP 403. Rapid category-edit serialization and Docker E2E remain open.

### 2026-10-06: Overlapping quantity save activity

#### Fixed

- Keep the saving indicator visible when quantity, note and zone updates overlap, whichever tracked write finishes first (#877, #878).
- Refresh vulnerable source-map-js transitive resolutions to the patched version; production dependency audit passed (#877).

#### Validation

- Observed failing store regressions before implementation. Final VPS validation passed all 3,020 tests across 274 files, TypeScript, lint and build. GitHub CI, performance and Vercel passed. Sonar remains blocked before analysis by HTTP 403; Docker E2E and activity tracking for other mutation types remain open.

### 2026-10-06: Confirmed notes and consistent editor save activity

#### Fixed

- Restore the last confirmed card note after failed saves and serialize rapid edits (#872).
- Keep save activity visible across concurrent zone writes and pending card-note saves (#870, #874), preserving successful zone moves when a note fails.

#### Validation

- Regressions failed before implementation on the VPS. Final #874 validation passed 73 focused tests and all 3,017 tests across 274 files, TypeScript, lint and build. GitHub CI, performance and Vercel passed for each merged fix. Sonar failed before analysis with HTTP 403; Docker E2E remains deferred. Other mutation types and the wider editor recovery/undo scope remain open.

### 2026-10-05: Bulk zone recovery and edition-code imports

#### Fixed

- Recover failed cards independently during partial bulk zone saves, preserving successfully saved moves (#871).
- Accept lowercase and mixed-case trailing edition codes in downloaded text lists without treating them as card-name text (#869).

#### Validation

- Both regressions were observed before implementation on the VPS. Full unit suites, TypeScript, lint and builds passed there (3,013 tests for #871; 3,012 for #869). GitHub CI and Vercel passed; #871 also passed the performance audit. Sonar remains unavailable before analysis and Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Individually reviewed package application

#### Fixed

- Package application uses each row's own preview result (#861), preventing a blocked duplicate row from being written merely because another row with the same Scryfall identifier is ready. Canonical verification and existing legality checks remain unchanged.

#### Validation

- The API regression failed before implementation. All 12 package API tests and all 3,004 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-05: Uppercase quantity markers in downloaded lists

#### Fixed

- Downloaded text imports accept uppercase X quantity markers alongside lowercase x (#867), preserving commander and secondary zones. Existing quantity limits and malformed-line handling remain unchanged.

#### Validation

- The regression failed before implementation. All 24 parser tests and all 3,008 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-05: Resolved-name import duplicate warnings

#### Fixed

- Import previews warn when front-face and full names resolve to the same canonical Scryfall name (#865), without merging rows or changing quantities, zones or the first displayed spelling.

#### Validation

- The regression failed before implementation. All seven focused tests and all 3,007 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-05: Available copy capacity after rejected package rows

#### Fixed

- Package preview and application reserve copies only for ready rows (#863), allowing later valid additions after a rejected oversized or banned row. Existing deck quantities and accepted rows remain cumulative; no copy limits are relaxed.

#### Validation

- Two regressions failed before implementation. All 21 focused tests and all 3,006 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-04: Restricted copy limits in card packages

#### Fixed

- Package preview and application limit cards with canonical restricted legality to one copy, including existing deck copies (#859). A single restricted card remains allowed; non-singleton copy-limit errors are distinct from singleton errors. Author-supplied metadata does not determine restricted status.

#### Validation

- Two regressions failed before implementation. All 14 focused tests and all 3,003 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. Rule reference: [Wizards banned and restricted list](https://magic.wizards.com/en/banned-restricted-list).

### 2026-10-04: Verified Oracle copy exceptions in card packages

#### Fixed

- Package preview and application reuse the existing multiple-copy policy with canonical Oracle text from Scryfall (#854). Stored author metadata cannot grant an exception; absent Oracle text falls back to existing format limits. The existing 99-copy policy ceiling is unchanged.

#### Validation

- The canonical-exception regression failed before implementation; the forged-metadata regression passed. All 11 focused tests and all 2,998 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-04: Format copy limits in card packages

#### Fixed

- Package preview and application enforce existing non-singleton format copy limits, counting existing deck copies and package printings together (#852). Basic lands and named capped-copy exceptions retain their existing behavior; Oracle-text unlimited-copy exceptions remain separate scope.

#### Validation

- Both new regressions failed before implementation. All seven package tests and all 2,996 tests across 274 files, TypeScript, lint and build passed on the VPS only. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred.

### 2026-10-04: Capped multiples in card packages

#### Fixed

- Reusable card packages honor existing named capped-copy exceptions in singleton formats, combining existing deck quantities and package quantities across printings (#850). Ordinary singleton, basic-land, banned-card and color-identity checks remain in place. Oracle-text unlimited-copy exceptions and non-singleton copy limits are outside this increment.

#### Validation

- Both regressions failed before implementation. All five package tests and all 2,994 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Grouped missing-card import warnings

#### Fixed

- URL import previews show each normalized missing name once, grouping variations in case, whitespace and apostrophes while preserving the first spelling (#848). Imported rows, quantities and zones are unchanged.

#### Validation

- The focused regression failed before implementation. All six preview tests and all 2,992 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Carriage returns in CSV fields

#### Fixed

- Deck CSV exports quote carriage returns in card names and metadata, preserving their contents without breaking records (#846). The schema is unchanged; spreadsheet-client import remains unverified.

#### Validation

- Three regressions failed before implementation. All 24 export tests and all 2,991 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Colon-terminated import sections

#### Fixed

- Downloaded plain-text imports preserve commander, partner and secondary zones when section headings end with a colon, including headings with counts or comment prefixes (#844).

#### Validation

- Both regressions failed before implementation. All 23 parser tests and all 2,988 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Printing and category metadata in CSV

#### Added

- Simple and full deck CSV exports append Scryfall ID and Category columns (#842), preserving selected editions and application categories. Unknown printing IDs remain blank. CSV reimport and external-tool category mapping are not added.

#### Validation

- Both focused regressions failed before implementation. All 21 export tests and all 2,986 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Card zones in CSV exports

#### Added

- Simple and full deck CSV exports include a trailing Zone column with main, sideboard and maybeboard values (#840). Existing column positions and export scope are unchanged. CSV reimport and command-zone rows remain separate scope.

#### Validation

- Both focused regressions failed before implementation. All 19 export tests and all 2,984 tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Quantity-aware exported statistics

#### Fixed

- Exported card totals and type percentages count physical copies instead of distinct rows (#838). Existing export scope and total-price behavior are preserved.

#### Validation

- Both focused regressions failed before implementation. All 17 export tests and all 2,982 unit tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Portable decklist line endings

#### Fixed

- Downloaded plain-text imports recognize CR, CRLF and LF line endings while preserving commander, quantities, sideboard and Considering zones (#836).

#### Validation

- The CR-separated regression failed before implementation. All 21 parser tests and all 2,980 unit tests across 274 files, TypeScript, lint and build passed on the VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud failed before analysis with HTTP 403; Docker E2E remains deferred. No local tests or builds were run.

### 2026-10-04: Stable meta history responses

#### Fixed

- Late meta-history successes and failures no longer repopulate a reset panel. An older request finishing last cannot overwrite the newest request's result. Request cancellation and timeout are not added in this increment.

#### Validation

- All three stale-response regressions failed before implementation. All 2,977 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Docker E2E remains deferred.

### 2026-10-04: Consistent meta trend cutoffs

#### Fixed

- Meta trend bounds now use the same first-entry-per-card values as measured shifts. Discarded duplicates no longer distort the cutoff used for cards entering or leaving a snapshot.

#### Validation

- The regression failed before implementation. All 2,974 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Docker E2E remains deferred.

### 2026-10-04: Safe multiline export notes

#### Fixed

- Plain-text exports prefix every note line with `// Note:`, normalizing CRLF, LF and CR separators. Note content can no longer be mistaken for cards or recognized section headings during text reimport. Saved notes remain unchanged; note rehydration is not included.

#### Validation

- The export/parser regression failed before implementation. All 2,973 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Legacy prefix expectations were updated for the explicit comment format. Docker E2E remains deferred.

### 2026-10-04: Empty meta snapshot evidence

#### Fixed

- Withhold meta shift reports when either comparison endpoint has no cards. Empty source data no longer produces fabricated inclusion bounds from or to zero. Non-empty snapshot comparisons remain unchanged.

#### Validation

- Both empty-endpoint regression cases failed before implementation. All 2,972 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Docker E2E remains deferred.

### 2026-10-04: Moxfield text export sections

#### Changed

- Preserve companion, Sideboard and Considering sections in the existing Moxfield text export instead of flattening secondary zones into Deck. Commander, partner, quantities and saved deck data remain unchanged.

#### Validation

- The export/import regression failed before implementation. All 2,971 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Our text parser round trip is covered; live Moxfield comment-header compatibility remains unverified. Docker E2E remains deferred.

### 2026-10-04: Arena companion export

#### Added

- Arena text exports include the selected companion in its dedicated section and exported sideboard, adding one sideboard copy only when absent. Saved deck data and existing quantities remain unchanged; Considering cards remain excluded.

#### Validation

- Both companion contract tests failed before implementation. All 2,970 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Text reimport is covered; live Arena client import remains unverified and Docker E2E remains deferred.

### 2026-10-04: Bounded user initialization body loading

#### Fixed

- The eight-second user initialization deadline now includes response-body consumption and JSON validation. Receiving headers no longer disables the timeout while onboarding and collection data are still loading. Request deduplication remains user-scoped; database latency is not changed.

#### Validation

- The streaming-body regression test failed before implementation. All 2,968 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Docker E2E remains deferred.

### 2026-10-04: Archidekt mainboard scope

#### Fixed

- Archidekt exports exclude Sideboard and Considering cards from Mainboard and its count. Commander, partner and category tags are preserved. Dedicated secondary-zone export is not included in this increment.

#### Validation

- The regression test failed on the VPS before implementation. All 2,967 unit tests across 274 files, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403. Docker E2E remains deferred.

### 2026-10-04: Recommendation filter feedback

#### Fixed

- Filtering EDHREC recommendations to cards absent from the deck now announces when all popular cards are already present. Disabling the filter restores the list. Loading, failure and empty-source states do not show the completion message.

#### Validation

- The component regression test failed before implementation. All 2,966 unit tests, TypeScript, lint and production build passed on the VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud failed before analysis with HTTP 403 and Docker E2E remains deferred.

### 2026-10-04: EDHREC popularity ranking

#### Changed

- The commander meta panel's twenty popular cards are now selected by observed inclusion across EDHREC categories, not by category order.

#### Validation

- The cross-category ranking test failed before implementation. All 2,965 unit tests, TypeScript, lint and production build passed on the personal VPS. GitHub CI, Lighthouse and Vercel passed; SonarCloud returned HTTP 403 before analysis and Docker E2E was not run.

### 2026-10-03: Browser-persistent shopping choices

#### Added

- The shopping list now remembers buy-later printings per signed-in player and deck in the same browser. Buy-now totals and exports still exclude deferred cards without changing deck or collection ownership.

#### Validation

- The reopening regression test failed before implementation. All 2,964 unit tests, TypeScript, lint and production build passed on the personal VPS. GitHub CI, Lighthouse and Vercel passed. SonarCloud returned HTTP 403 before analysis; Docker E2E was not run. Cross-device acquisition state and proxy tracking remain open.

### 2026-10-03: Deck import fidelity batch

#### Added

- Manual decklist paste preserves Unicode card names and recognizes commented sections, colon-terminated sections, and uppercase set-code suffixes without collector numbers.
- Scryfall lookup and matching normalize copied smart apostrophes without changing the displayed imported name.
- Supported deck URLs work without an explicit scheme, and downloaded lists preserve zones from count-labelled section headings.
- EDHREC average-deck import keeps the first occurrence of each card across recommendation categories, excludes a repeated commander, and limits the main list to 99 distinct cards.
- Import preview warns about duplicate names despite case or spacing differences and about commanders or partners repeated elsewhere in the list.

#### Validation

- Each of the ten focused regression tests failed before implementation. The integrated `dev` passed 2,962 unit tests, TypeScript, lint and production build on the personal VPS. The isolated VPS build exited successfully but logged a sitemap database diagnostic because `DATABASE_URL` is not configured there. All ten feature PRs passed CI, Lighthouse and Vercel before merging to `dev`. Docker E2E was not run; SonarCloud returned HTTP 403 before code analysis. Exact printing/category round trips and localized-name resolution remain open.

### 2026-10-03: Deck-list request recovery

#### Fixed

- Stalled deck-list requests now abort after 15 seconds, allowing the existing failure and retry UI to replace an indefinite loading state. Profile loading and other UX-stability work remain open.

#### Validation

- The regression test failed before implementation. All 2,950 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-03: Acquisition plan deck links

#### Added

- Each missing printing in the acquisition plan now links to the player's contributing decks. The read-only plan keeps its existing quantities, prices and deck filter.

#### Validation

- The focused component test failed before implementation. All 2,949 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-03: URL import preview for unresolved cards

#### Fixed

- The URL import preview now warns about cards Scryfall could not resolve before confirmation. Repeated unresolved names are listed once, and valid front-face names for double-faced cards are not falsely flagged.

#### Validation

- The focused preview test failed before implementation. All 2,949 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-03: Acquisition plan line costs

#### Added

- The acquisition plan now shows a known-price subtotal for each missing printing and identifies rows without a price. Its overall known-price subtotal and ownership remain unchanged.

#### Validation

- The focused component test failed before implementation. All 2,948 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-03: Owned-printing preference

#### Added

- The printing selector puts exact owned editions first and shows their combined regular and foil quantity. It leaves the selected edition unchanged until the player chooses one.

#### Validation

- The focused test failed before implementation. All 2,947 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-03: Acquisition plan deck filter

#### Added

- Players can switch the collection acquisition plan between all owned decks and a single deck. Totals and CSV export follow the selected view; unknown or foreign deck IDs are rejected without exposing private data.

#### Validation

- Route and component tests failed before implementation. All 2,945 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Exact-printing deck usage

#### Added

- Collection cards now reveal which of the player's private decks use that exact printing, with zone, quantity and a link to each deck. The read-only lookup loads on demand in both collection views.

#### Validation

- Route and component tests failed before implementation. All 2,942 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Cross-deck acquisition-plan CSV

#### Added

- The collection acquisition plan exports a generic CSV of missing copies with Scryfall printing IDs and known prices. It excludes owned quantities and does not change the collection. Regional seller links and condition/finish choices remain future work.

#### Validation

- The focused export test failed before implementation. All 2,937 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Collection acquisition-plan view

#### Added

- A collapsible collection panel shows the read-only cross-deck purchase plan, with missing-copy quantities, deck names, known-price subtotal, unpriced-copy disclosure, and refresh/retry actions. It loads only when opened and does not change ownership.

#### Validation

- The focused component test failed before implementation. All 2,936 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Private cross-deck acquisition plan API

#### Added

- A read-only endpoint aggregates required copies across a signed-in player's decks, deducts owned printings and returns the remaining acquisition quantities without mutating ownership. The collection UI and persistent acquisition state are follow-up work.

#### Validation

- The route test failed before implementation. All 2,933 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Session-only buy-later planning

#### Added

- The shopping list can defer individual missing printings for later without changing deck or collection ownership. Its buy-now subtotal, copied list and CSV include only cards planned for now; the choice lasts only for the current session.

#### Validation

- The buy-later component tests failed before implementation. All 2,931 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: EDHREC feed response validation

#### Fixed

- Malformed EDHREC card-list responses no longer masquerade as an empty recommendation set and overwrite a reliable cache. Legitimately empty lists and missing commander pages still return no recommendations.

#### Validation

- Focused feed-contract tests failed before the fix. All 2,928 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Unpriced collection cards

#### Fixed

- Deck collection and shopping-list totals no longer imply that missing cards without a known price cost nothing. Mixed lists show a known-price subtotal and the unpriced quantity; wholly unpriced lists show that the price is unavailable.

#### Validation

- Three focused tests failed before the fix. All 2,926 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: Shared collection safety

#### Fixed

- Removed the deck sidebar's ambiguous Reset action, which could subtract cards from the global collection even when other decks relied on them. Owners can now open collection management to change inventory deliberately.

#### Validation

- The new component regression test failed before the fix. All 2,923 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-10-02: EDHREC recommendation sample sizes

#### Added

- Popular-card recommendations show the number of eligible decks containing each card when EDHREC supplies valid counts. The percentage is calculated from those same counts; missing or inconsistent counts are not presented as evidence.

#### Validation

- The focused data and interface tests failed before implementation. All 2,924 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-09-28: Card printing save recovery

#### Fixed

- Failed card printing saves now restore the previous printing instead of leaving an unsaved image visible; the card's zone and quantity remain unchanged and an error toast requests a retry.

#### Validation

- Network and HTTP failure tests were red before the fix. All 2,887 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse on rerun and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-09-28: MTGO XML card names

#### Fixed

- MTGO exports now escape XML-reserved characters in card names without altering the name read back from the file.

#### Validation

- The XML parsing test failed before the fix. All 2,886 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-09-27: MTGO sideboard export fidelity

#### Fixed

- MTGO XML now marks sideboard cards as sideboard, preserves their quantities, and excludes Considering cards from the playable export.

#### Validation

- The focused test failed before implementation. All 2,885 unit tests, TypeScript, lint and production build passed on the personal VPS. CI, Lighthouse and Vercel passed; Docker E2E was not run and SonarCloud returned HTTP 403 before analysis.

### 2026-09-26: Plain-text deck round-trip

#### Fixed

- Dedicated partner and companion sections now survive plain-text export, import and bulk editing instead of becoming ordinary deck cards.
- Sideboard and Considering cards retain their zones and quantities through a text round-trip.
- Bulk edit validates all card names before clearing the saved deck, resets stale client state before rebuilding, and reloads the full deck afterward.

#### Validation

- 2,884 unit tests, TypeScript, ESLint, production build and dependency audit passed on the personal VPS. Docker E2E remains unrun because port 5433 is occupied by another VPS service. SonarCloud still returns HTTP 403 before analysis.

### 2026-09-26: Card packages, playtest evidence and package verification

#### Added

- Reusable card packages in the deck editor, including a private owned-package library and legality preview.
- Per-turn playtest summaries for draws, mana production and cards seen, with readable and versioned JSON exports.

#### Security

- Reverified package card identity, color identity, format legality and basic-land status against Scryfall before preview or apply; unknown cards fail closed and duplicate singleton quantities are blocked.
- Production dependency audit found no known vulnerabilities. SonarCloud remains unavailable because its configured token returns HTTP 403.

### 2026-09-25: AI legality separation

#### Changed

- Separated verified color-identity and Commander-legality failures from optional strategic recommendations.
- Removed add actions from blocked primary suggestions and disabled blocked alternatives while retaining their explanation.
- Added policy and presentation coverage, bringing the suite to 2,862 tests across 262 files.

### 2026-09-24: AI change impact preview

#### Added

- Added a deterministic before/after comparison to reviewed AI deck changes for card count, average mana value and known card value.
- Added visible evidence-limit warnings for unverified, off-color and Commander-illegal additions.
- Added projection and presentation coverage, bringing the suite to 2,857 tests across 261 files.

### 2026-09-24: Owned deck folders

#### Added

- Added private folder creation, filtering, renaming and safe deletion to My Decks.
- Added owner-scoped bulk movement for up to 100 selected decks, including a return to Unfiled.
- Added API and UI behavioral coverage, bringing the suite to 2,854 tests across 259 files.

### 2026-09-20: Safe public deck primers

#### Added

- Rendered complete public deck primers with responsive headings, paragraphs, ordered and unordered lists, and links.
- Kept raw HTML inert, rejected unsafe link protocols and isolated external navigation without adding a runtime dependency.
- Added three behavioral security and presentation tests, bringing the suite to 2,738 tests across 226 files.

### 2026-09-20: Guided deck primer template

#### Added

- Added a localized, non-destructive primer template covering game plan, mulligans, win conditions, key interactions and budget alternatives.
- Added editor behavior coverage and corrected invalid nested-button markup that could cause React hydration instability.
- Expanded the suite to 2,735 tests across 225 files.

### 2026-09-20: Exportable token checklist

#### Added

- Added copy and text-download actions to the deck's deduplicated token and emblem library.
- Added accessible localized controls and deterministic checklist formatting.
- Added formatter and component coverage, bringing the suite to 2,731 tests across 224 files.

### 2026-09-19: Reversible AI change review

#### Changed

- Made AI card additions, removals and alternatives reversible before applying a proposed deck change.
- Added an exact, deduplicated deck diff with explicit apply and clear actions across every locale catalog.
- Added immutable selection and diff coverage, bringing the suite to 2,725 tests across 223 files.

### 2026-09-18: Targeted AI suggestion alternatives

#### Added

- Added budget, power-level and playstyle alternatives to AI card recommendations instead of returning one opaque answer.
- Verified alternatives in the same deduplicated Scryfall batch as primary suggestions and exposed them through a compact, directly actionable disclosure.
- Added route and component coverage, bringing the suite to 2,711 tests across 220 files.

### 2026-09-18: Verified AI suggestion evidence

#### Added

- Enriched all AI additions through one batched Scryfall lookup with mana value, curve impact, color compatibility, Commander legality and USD price evidence.
- Added a compact evidence panel that distinguishes verified facts from unavailable data without blocking suggestions during a Scryfall outage.
- Added policy, route and component coverage, bringing the suite to 2,710 tests across 219 files.

### 2026-09-18: Reviewed AI deck plan

#### Added

- Added a pre-generation review step that presents the selected gameplan, win conditions, deck-role targets and explicit constraints before any cards are chosen.
- Rebuilt the same deterministic plan server-side and embedded it in the provider prompt so the reviewed structure governs generation without trusting client-authored instructions.
- Added strategy, fallback and constraint coverage, bringing the suite to 2,703 tests across 217 files.

### 2026-09-18: Conversational AI deck brief

#### Added

- Added optional theme, desired-play-pattern and dislikes fields to the AI suggestions panel, complementing the existing commander, budget and target bracket inputs.
- Added bounded runtime normalization and a distinct prompt section for player intent; changing the brief now invalidates cached suggestions and requests a fresh analysis.
- Added policy, component, hook, route and locale-catalog coverage, bringing the suite to 2,700 tests across 216 files.

### 2026-09-18: User-owned playtest context for AI suggestions

#### Added

- Grounded AI deck suggestions in up to five recent meaningful playtest records, loaded server-side with both deck and authenticated-user ownership constraints.
- Marked playtest observations as private anecdotal context rather than tournament evidence or model instructions, with bounded sanitization for player-authored notes and proposed changes.
- Preserved suggestion availability when playtest history cannot be loaded and added route, formatter and hook coverage, bringing the suite to 2,694 tests across 214 files.

### 2026-09-18: Proposed playtest changes

#### Added

- Added an optional proposed-change field to recorded playtest sessions so players can separate what they observed from what they intend to try next.
- Displayed the proposed change as a distinct item in playtest history and persisted it through the validated API contract and an additive database migration.
- Added parser, API and component coverage, bringing the suite to 2,688 tests across 212 files.

### 2026-09-18: Opening-hand color evidence

#### Added

- Added deterministic opening-hand castability analysis that combines visible land production, affordable spell costs and hybrid mana options.
- Added explicit missing-color and dead-hand guidance before the mulligan decision, with English and French copy plus key parity for dormant locales.
- Added focused policy and component coverage, bringing the suite to 2,684 tests across 212 files.

### 2026-09-17: Snapshot playtest comparison

#### Added

- Added an in-product comparison for playtest cohorts linked to two distinct deck snapshots. Players can now inspect directional changes in self-reported win rate, winning-turn speed and mulligan frequency directly from the playtest history panel.
- Kept the evidence boundary explicit in the interface: solitaire playtests are user-owned directional evidence, not tournament win rates.
- Added focused component coverage and preserved message-catalog parity across the two active and eight dormant locales.
- Added cohort-size disclosure and an early-signal warning below three runs per version. Directional labels now describe slower wins and increased mulligans directly instead of rendering misleading negative improvements.
- Persisted deterministic cards-seen and additional-draw evidence with each newly recorded playtest session through an additive database migration and validated API contract.

### 2026-08-23: Release batch #552–#562 — thirty advisories nobody could reach, two limiters that enforced nothing, and dates in the wrong language

#### Fixed

- `fix(limits): stop short-window callers from wiping the brute-force counter (#553)` — **two limiters whose own comments describe behaviour they did not have.** Both were found by reading the code the dependency audit walked past, not by anything failing.
  - **`rate-limit.ts` kept one store for callers that do not agree on a window.** Signup budgets 5 attempts per IP over **15 minutes** and login 10 per email over the same; import, meta, ai-suggest, the cache routes and the API-key limiter all work in **60 seconds**. `prune` deleted every entry older than twice _the calling_ window, so a single 60-second request evicted entries belonging to the 15-minute limiters. Three minutes of ordinary traffic — from any user, on any unrelated endpoint — handed an attacker a fresh login budget. **The 15-minute brute-force limit was in practice a two-minute one**, and nothing about it looked wrong: each limiter is correct in isolation, and the defect exists only in the shared `Map`. Each entry now records the window it was opened with and expires on its own terms.
  - **`scryfall/client.ts` calls its queue an async mutex and the file header promises 10 req/s. It serialised nothing.** The code chained off `queue` but **never assigned the chain back**, so every concurrent caller found the same already-resolved promise and went straight through: they read one `lastRequestTime`, waited the same delay, then hit Scryfall together. The tail is now handed back to `queue`, and deliberately cannot reject — a failed request must not poison the chain for the requests behind it, which is what the old reset-on-error handlers were reaching for.
  - Each fix has a test that fails without it. The rate-limit one advances three minutes of unrelated 60-second traffic and asserts the 15-minute budget survives; the scryfall one holds a request open and asserts the second never reaches `fetch` — `expected "spy" to be called 1 times, but got 2 times` against the old code.
- `fix(i18n): render dates in the reader's locale, not the platform's (#558)` — **the app serves two locales and eight components formatted dates with the platform API.** `toLocaleDateString()` reads the _ambient_ locale, which is not the one the request carries. The public profile was the plainest case: it passed `"en-US"` outright, so "Membre depuis" read **"August 2026"** on an otherwise French page.
  - The other seven passed no locale at all, **which is worse than it looks**. They are `"use client"` components, and Next still server-renders them for the initial HTML — so the date was formatted once in the server's locale and timezone and again in the browser's, and the two need not agree.
  - `useFormatter()` was already the project's answer, in use in five other components. These eight had drifted from it. `SnapshotsPanel`'s helper lived outside the component and so could not call a hook; the formatting moved to the call site.
  - **`renderWithIntl` grew a `locale` option, because `en` is the one locale under which a hardcoded `"en-US"` looks correct.** Asserting anything about localization needs a second locale to compare with; the test renders the profile under `fr` and asserts `août 2026`. A repo-wide guard test keeps a ninth site from drifting back, and it was checked to actually bite by reintroducing one call and watching it fail.
  - **Two things deliberately left alone.** `Header` builds an imported deck's _name_ from the current time — persisted data, not rendered UI. And the request config still sets no `timeZone`: pinning one changes which calendar day a late-evening edit displays as, which is a product call rather than a bug fix. **Currency shows the same split** — three components use `format.number(…, { style: "currency" })`, about twelve hardcode `# Changelog

All notable changes to MagicAIBuilder are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

with `toFixed(2)` — but prices really are USD, so nothing is _wrong_ and the decision is left open rather than taken quietly.

- `fix(random): reject the biased byte tail the ID generator was folding (#559)` — `crypto-random.ts` holds two generators to one standard and **only one met it**. `randomIntBelow` rejection-samples and documents why; beside it `randomAlphanumericId` mapped a raw byte with `% 36`, and 256 is not a multiple of 36, so bytes 252–255 folded onto `a`–`d` and dealt those four an eighth chance the other thirty-two never got.
  - **Stated plainly: this is hygiene, not a vulnerability.** The callers build local collision-avoidance ids already prefixed with `Date.now()`, and the share tokens that actually have to resist guessing come from `randomBytes` server-side. The reason to fix it is that a file explaining modulo bias in one function and committing it in the next is a trap for whoever reaches for it later.
  - **The first version of the test passed against the old code too.** It used byte 252, and `252 % 36` is 0, so both implementations answer `'a'` and it proved nothing. **255 is the discriminating byte**: folded it yields `'d'`, rejected it yields whatever comes next. The test drives `getRandomValues` directly rather than sampling a distribution, so it reads the mapping off instead of inferring it from a histogram.

#### Security

- `chore(deps): pin the 30 vulnerable transitive packages the audit flagged (#552)` — **`pnpm audit` reported 31 advisories and not one was reachable by a direct upgrade.** `postcss` arrives pinned to exactly `8.4.31` by `next@15`; `sharp` is next's optional `^0.34.3`; `defu` and `deepmerge-ts` come from `prisma@6` via `@prisma/config`; `brace-expansion` is present in **three major lines at once** under different parents and needed three range-scoped entries. Fifteen `pnpm.overrides` later: **31 → 1**, and the production tree is clean at _every_ level, `--audit-level=low` included.
  - **The five highs this file recorded as "unfixable without majors" needed neither major.** That entry stood since 2026-08-20 and named Next 16 / Prisma 7 as the precondition. Overrides reach all five.
  - **One advisory is left standing and cannot be closed**: `extract-zip`, via `@lhci/cli > lighthouse > puppeteer-core > @puppeteer/browsers`, has **no patched version published**. Dev-only tooling; it stays until upstream ships one.
  - Verified with a production build as well as the suite, since overriding `postcss` and `sharp` reaches the build itself and not only the dependency graph.

#### Changed

- `chore(ci): block on high advisories, and let Dependabot watch the actions (#554)` — the audit gate blocked only on `critical`, with a comment naming its own next step: _"Tighten to `--audit-level=high` once those land."_ #552 made that true without either major, so **`high` now blocks and `moderate` is reported**. Low stays quiet deliberately: a low advisory in a transitive package is not worth a red `main`, but a moderate one should not pass unseen.
  - **Dependabot only ever watched npm.** The workflows pin five actions by major tag with nothing looking at them, which is why the SonarCloud job had been _warning_ about a deprecated Node 20 runtime rather than being offered an upgrade. Majors are deliberately **not** ignored for actions, unlike npm: the breaking change is almost always a runner bump, the diff is one line, and CI settles it on the spot.
- `chore(ci): send Dependabot to staging, and stop it failing the Sonar job (#562)` — **enabling the ecosystem produced its first PR within the hour, and that PR exposed two things the config had not accounted for.**
  - **It opened against `main`.** Dependabot targets the default branch unless told otherwise, which made the bot the one contributor exempt from `staging` → `dev` → `main` and would have pushed `main` ahead of the two branches meant to gate it. Both ecosystems now set `target-branch: staging`.
  - **It failed the SonarCloud job for a different reason than every other branch is failing it today.** The log reads `SONAR_TOKEN:` followed by nothing: **GitHub withholds repository secrets from Dependabot pull requests**, so the token arrives empty and the `Require SONAR_TOKEN` guard fires — a guard written to catch a genuinely missing secret, doing exactly its job on a case that is not a misconfiguration. `sonar.yml` already handled the identical situation for fork PRs; the two conditions collapse into one `SECRETS_WITHHELD` flag, so a Dependabot PR is announced rather than failed. Without it, every weekly Dependabot PR would carry a red check nobody can act on.
  - The five action bumps from #557 come along, **proven by the CI that ran them rather than assumed**: the job reporting green is the one running `checkout@v7`, `setup-node@v7` and `pnpm/action-setup@v6`, and the green Lighthouse job is the one running `upload-artifact@v7`. `sonarqube-scan-action@v8` is the exception and stays **unproven** — nothing can exercise it until the token is regenerated. #557 was closed as superseded.

#### Process

- **A conflicting promotion PR runs no workflow at all, and says nothing about it.** #552–#554 were merged into `staging` with `--merge`, putting merge commits on it; the promotion rebase then rewrote SHAs, and `staging` and `dev` ended up with identical content on unrelated ancestries. Promotion PR #563 came back `mergeable: CONFLICTING`, and the symptom was **silence** — GitHub cannot build the merge ref for a conflicting PR, so it dispatched no CI, no Lighthouse and no Sonar. `gh pr checks` listed only Vercel. There is no failure to read, which is what makes it expensive: the first instinct is to hunt for a broken trigger.
  - **A clean rebase is not evidence the merge will work.** Rebasing `staging` onto `dev` printed `skipped previously applied commit …` three times and succeeded, which read as reassurance and was wrong — a PR is tested by a _merge_, and the same edits arriving down two ancestries conflict. Check `gh pr view <n> --json mergeable,mergeStateStatus` before diagnosing anything else.
  - Unblocked **without a force-push** by opening the promotion from `staging` rebased onto `dev`, which is a true descendant and merges cleanly. Then `staging` and `dev` were reset onto `main` — the practice this file already records for batch #480–#489, and the reason `CLAUDE.md`'s claim that rebasing "keeps all three branches on the same commit" is only true after that reset. **Feature PRs into `staging` should use `--rebase`; this batch used `--merge`, and that is what created the divergence.**

### 2026-08-22: Release batch #534–#536 — a quality gate that was measuring the wrong thing, and the credential hook nobody tested

#### Fixed

- `fix(e2e): stop keying the gate on a CI variable nothing sets (#535)` — **`playwright.config.ts` read `forbidOnly`, `retries` and `workers` off `process.env.CI`, and `CI` is set nowhere.** Not in the e2e container, and no GitHub workflow runs Playwright at all — the suite has exactly one home, the Dockerised pre-push gate. Every branch keyed on that variable was dead code that never once took its intended value. The `retries` side happened to land on the value `quality-gate.md` explicitly wants, which is why it went unnoticed for as long as it did; the other two did not.
  - **`forbidOnly` was never enforced.** A single stray `test.only` would have narrowed the blocking gate to one test and still reported green — the same silent-green shape as the hardcoded `PLAYWRIGHT_SPEC` that once ran 1 of 8 spec files while reporting a full pass. It is now `true` outright rather than inferred.
  - **`trace: "on-first-retry"` could never fire**, because retries are 0. That is why the only forensic artifact any gate failure has ever produced is an aria snapshot: no network log, no DOM timeline — exactly what made the 2026-08-22 ratings failure undiagnosable from its own report. Now `retain-on-failure`: a trace for a failing test, without adding retries.
  - **The suite runs on one worker, and that is a fix for the flake rather than padding for it.** Measured across the same 58 tests: **8–13 s per test under parallel load against ~2.5 s each serially**, a fourfold inflation the suite was inflicting on itself. `quality-gate.md` had already recorded that a _visibly loaded host_ stretched a run from ~1.4 to 2.1 minutes and told readers to avoid other Docker builds during the gate — advice that addressed **external** load and never the load the run generated internally.
  - **Retries stay at 0.** Setting `CI=true` in the compose file would have been the smaller change and would have silently flipped retries to 2, reversing a documented decision with a stated rationale: _fix the flake, do not pad the gate._
  - **The timing estimate was wrong twice, by the same method.** The first estimate put a serial run at 8–10 minutes, taking per-test durations from a _parallel_ run at face value. The correction put it at 2m24 by summing serial per-test durations. The first gate to actually run under `workers: 1` reported **58 passed, 1 skipped, 3.4m**, against 1.7m for the same suite in parallel — so the real cost is roughly double, not the 50% projected. A second commit on the branch corrects the doc to budget ~3.5 minutes. Measure the whole run; do not extrapolate from its parts.
- `fix: clear the five SonarCloud issues left by batch #528–#531 (#536)` — the pre-PR gate makes "open issues = 0" mandatory, and the API-key and meta-shift branches left five behind. None changed behaviour; two were latent correctness risks rather than style.
  - **S6582 on `authenticate.ts` was right and its remedy was wrong.** `!key || key.revokedAt !== null` does collapse to `key?.revokedAt !== null` — the two are equivalent. But the optional-chain form **narrows nothing**, so every `key.` access below the guard would then need its own null check. Split into an explicit `if (!key) return` instead: rule satisfied, narrowing kept, and it reads as the early return it already was.
  - **S1874 on `snapshots.ts`**: Zod 4 deprecates `z.number().finite()` because `z.number()` already rejects `NaN` and both infinities. Verified at runtime before removing the call rather than trusting the deprecation note. A test now covers all three values — an inclusion of `NaN` reaching storage would turn every downstream delta into `NaN`, so the guarantee is now load-bearing where it had been incidental.
  - The remaining three are mechanical: `React.FormEvent` is deprecated by React's own types ("FormEvent doesn't actually exist"); `ordered[ordered.length - 1]` became `ordered.at(-1)` with a guard rather than a non-null assertion; a `[ ]` character class became a plain space.

#### Added

- `test(hooks): cover useApiKeys and useMetaShifts (#534)` — closes the coverage gap this changelog recorded in #532. Both hooks shipped in the previous batch **without tests**: `useApiKeys` at **0% of 88 statements** — the largest uncovered unit in the repository, and the one that mints and revokes credentials — and `useMetaShifts` at 25.6%. **Coverage 93.69% → 94.89%**, above the 94.5% that preceded the batch.
  - The tests guard properties rather than line count. **A freshly minted token must survive a failed refetch**: it exists exactly once, in the response that created it, and cannot be recovered from anywhere, since the row stores only a hash. `createKey` sets it _before_ reloading the list precisely so a network blip on the reload cannot take it with it — a test now fails if that order is ever reversed. **A 201 carrying no token is a failure, not a silent success.** The revoke id is asserted encoded against `../../admin`, so a hostile id reshaping the request path fails the suite rather than the review.
  - **No history is not an error.** `useMetaShifts` receives `report: null` for any commander recorded fewer than two days — the ordinary state of a commander nobody has opened twice — so the tests keep it distinct from the error path, and keep `snapshotCount`, which is what separates recorded-once from never-recorded. A stale report is dropped when a later fetch fails, since showing last week's movements beside an error message misdates the data.
  - This PR is also where the `process.env.CI` defect was found, while diagnosing the flake that blocked the promotion. It was deliberately **not** fixed there: enabling `CI` also makes the run serial, and that trade-off was worth measuring rather than assuming. #535 is that measurement.

### 2026-08-22: Release batch #528–#531 — retained meta history, a public API, and a scope that gated nothing

#### Added

- `feat(meta): track meta shifts over time (#528)` — **`MetaCache` holds one row per (commander, source) and upserts it on every refresh, so yesterday's distribution was destroyed the moment today's arrived.** Nothing in the database could answer _what moved_; only one point in time ever survived. `MetaSnapshot` retains one row per commander per day, written from the EDHRec fetch the meta route already performs — no cron, no crawl, no extra upstream request. The history accrues from ordinary traffic, so a commander nobody has opened twice has none, and every read path treats that as the normal state rather than a failure.
  - **The list is truncated at 20 cards, and that governs the whole design.** A card missing from a snapshot is _not_ a card at 0% inclusion — it is a card below that snapshot's cut-off, at a value nobody recorded. Reporting a drop-out as a fall from 78% to zero would invent a collapse out of a ranking change. Appearing and disappearing are therefore their own variants of `MetaShift`, carrying a **bound** rather than a delta: a card that entered rose by _at least_ `current - cutoff(baseline)`. The panel renders those with `≥` / `≤` and says why on hover.
  - **An empty result is never recorded.** `fetchEdhrecData` returns `{ cards: [] }` both for a commander EDHRec has never heard of _and_ for an upstream 404, and the two are indistinguishable at the call site. Storing it would make every card in the previous snapshot read as having left the list — an outage rendered as a meta collapse.
  - EDHRec only: the tournament feed is the five most recent events, a rolling window and not a distribution, so differencing it reports only that events happened. `capturedOn` is a `DATE` truncated in **UTC** and is the row's identity, so five refreshes in a day record one point and the day boundary cannot move when the runtime's zone does. Verified against the real Postgres column, where a `DATE` round trip usually goes wrong: 23:45 UTC stays on its own day.
- `feat(api): public REST API — key auth, versioned endpoints, OpenAPI, management UI (#529)` — closes the roadmap's four named requirements: auth, rate limiting, OpenAPI documentation and a versioning strategy. `GET /api/v1/decks`, `/decks/:id`, `/collection`, `/openapi`, plus key management behind the browser session and a `/settings/api-keys` screen.
  - A key is `mab_` followed by 32 random bytes in base64url; only its SHA-256 reaches the database, and that hash is the unique index, so verification is one indexed read rather than a scan. **SHA-256 and not bcrypt, deliberately** — a slow hash exists to make guessing a _low-entropy_ secret expensive, and bcrypt would only add a deliberate delay to every request. The reasoning inverts the moment a key is something a human chooses, so keys stay machine-generated.
  - **Scopes exist from the first key**, though every endpoint is read-only. Without them, the day a write endpoint ships every key already in the wild silently gains write access — a privilege escalation delivered by a deploy, with nothing in the request to show it happened.
  - **A key cannot mint another key.** Management stays behind the session, or one leaked credential becomes permanent access revocation can never catch: the thief simply issues replacements. Revocation stamps `revokedAt` rather than deleting — the key that had to be revoked is exactly the one whose history matters afterwards — and the `updateMany` carries `userId` in the same WHERE as the id.
  - **Unknown, revoked and expired keys share one 401 and one message.** Telling them apart confirms to the holder of a cancelled credential that it was once real, and to anyone guessing, which guesses landed on a row. A missing deck and someone else's deck likewise share one 404. A missing _scope_ is 403 and not 401: the credential is valid, so inviting the client to re-authenticate sends it round a loop it cannot win.
  - **`collection:read` shipped with the first key and gated nothing for two commits** — a permission a user could tick that bought no access. An advertised permission with no meaning is worse than a missing one: it invites a caller to request the narrowest scope that fits and then fail at runtime for reasons the documentation denies. `GET /api/v1/collection` is the endpoint it was named for, and a test now asserts **no scope is decorative** — every granted scope must gate at least one operation.
  - The OpenAPI document is hand-authored, because nothing in this stack can derive a spec from an App Router handler: the request shape lives in a zod schema inside the function body and the response shape only in the object it returns, so a "generator" would be a second hand-written source pretending to be derived. **The drift guard is the point** — `openapi.test.ts` asserts every `/api/v1` route file is documented and every documented path has a route file, and it **earned its keep**: `/collection` was written first and the test failed with `documents /collection` before a line of the spec was touched. It also asserts the directory walk found anything at all, since a broken walk would satisfy every "this route is documented" check vacuously — the same silent-green shape already catalogued three times in this repository.

#### Fixed

- `chore: clear the four open SonarCloud issues (#530)` — `CLAUDE.md` makes "SonarCloud open issues = 0" a mandatory pre-PR gate, and four were standing on `staging` **outside any feature branch**, so every PR inherited a gate it could not satisfy. **Two of the four suggestions were wrong for this codebase.**
  - **S7784 ×2**: Sonar suggests `structuredClone` for `JSON.parse(JSON.stringify(…))`. Taking that literally would be a _regression_ — `structuredClone` preserves a `Date` as a `Date` and throws on a function, while the point is to **flatten** a value to plain JSON, the only thing `Prisma.InputJsonValue` accepts. The helper existed **three times over** and now lives once in `lib/api/json-payload.ts`, which removed the flagged shape. All three copies shared an edge none handled: `JSON.stringify` returns `undefined` for `undefined`, a function or a symbol, and feeding that back throws `SyntaxError: "undefined" is not valid JSON` — naming the parser rather than the caller's mistake.
  - **S7765**: Sonar wants `.includes()`, which **does not typecheck** — `SUPPORTED_LOCALES` is `readonly ["en", "fr"]` and the argument is a `string`. That is precisely why `.some()` was written. A `ReadonlySet<string>` satisfies both without an `as`.
  - **S8786 (MAJOR)** was real: the trailing-slash regex in `siteUrl` retries the slash run from each position, quadratic in trailing slashes. Not a live denial-of-service — the input is an environment variable — but the replacement loop is linear and costs nothing.

#### Documentation

- `docs: evaluate Better-Auth against the current NextAuth v5 setup (#531)` — **recommendation: do not migrate; revisit after Next.js 16.** Not because NextAuth is fine, but because Better-Auth's own documentation says of middleware on Next 13 – 15.1.x: _"THIS IS NOT SECURE! This is the recommended approach to optimistically redirect users."_ Its recommended helper checks only that a **cookie exists**; database validation in middleware arrives with Next 16. This app is on 15.5.23, `src/middleware.ts` is the only thing in front of every protected _page_, and the current check is real — the JWT strategy means NextAuth verifies the token's signature on the Edge before `authorized` runs. Migrating today trades cryptographic verification for a presence check, across 41 call sites. The second cost is a hand-written data migration preserving every `User.id`, since **eleven tables of application data point at them**. Only **two-factor and passkeys** are things Better-Auth offers that this project lacks; three conditions for reopening are written down so the decision carries an expiry.

### 2026-08-21: #524 — a correction to this changelog's own premise

#### Fixed

- `docs(seo): record why the two base-URL helpers must not be merged (#524)` — **`progress.md` claimed `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` "name the same thing" and should be reconciled. They do not, and acting on it would have introduced a bug.**
  - `resolveAppBaseUrl()` resolves _the instance that is running_: a server component calling this app's own API needs the current deployment, so it falls back to `VERCEL_URL` — the preview host on a preview.
  - `siteUrl()` is the site's _public identity_, used for canonicals, hreflang and the sitemap. Resolving it to a preview host would publish canonical URLs pointing at deployments that disappear — the exact damage #517 and #521 repaired.
  - **On a preview deployment the two are supposed to disagree.** The names look interchangeable, which is the entire hazard; the claim survived several restatements in `progress.md` for that reason alone. Each function now points at the other and says why they stay apart.
  - Found by going to merge them, not by reviewing them. A wrong claim in a document is only as visible as the next person who acts on it.

### 2026-08-21: Release batch #521–#522 — a sitemap that published private links, and a 500 that was a closed tab

#### Fixed

- `fix(seo): stop publishing share tokens, and index the pages that are public (#521)` — **the sitemap was publishing capability URLs.** It listed every `shareEnabled` deck's `/share/<token>`. The sharing dialog promises "Anyone with this link can view your deck" — a promise about who _receives_ the link — and `/api/share/[token]` checks `shareEnabled` and **never `isPublic`**, so a deck the owner kept private is fully readable at its token, by design, for the person they sent it to. Feeding those tokens to search engines turned "anyone with this link" into "anyone at all", for decks never marked public, while `isPublic` sits in the same model precisely to mark the ones that were. `robots.ts` carried a matching `allow: "/share/"`. Both are gone. **Live since #153.**
  - The pages that _should_ have been listed were absent: public decks, public profiles and commander deck discovery are all public per the middleware and all received a canonical in #517. Each entry now carries an hreflang alternate per served locale, so the sitemap cannot give a crawler a different answer than the page.
  - The bare `catch {}` produced a one-URL sitemap indistinguishable from a site that genuinely has one page — the **fourth** instance of the shape, this one in output nobody looks at. Failures now reach `logger.error` and Sentry. Two `as` casts on `prisma.deck` removed; `robots.ts` folded onto the shared `siteUrl()`, which had three copies of its fallback.
  - `buildSitemap` is a pure function. Its first test asserts no share token appears whatever it is handed — the guard worth keeping, since nothing about the leak was visible from the sitemap itself.
- `fix(api): answer 400 for a malformed body instead of 500 (#522)` — a request stream truncated by page teardown produced `Unexpected end of JSON input`, a 500 and an error log **indistinguishable from a genuine server fault**. Nothing broke; the logs stopped being able to tell an incident from a closed tab. **Nineteen routes shared the shape** — not 22 as first counted: `ai/build`, `ai/suggest` and `import/url` already handled it, and were left alone.
  - **Three routes stopped compiling, which was the point.** `request.json()` returns `any`; the helper returns `unknown`. `cache/cards`, `cache/search` and `decks/[id]/snapshots` destructured the body directly. They _do_ check the fields immediately afterwards — a typing hole rather than a validation hole — but `any` is what kept it open. No `as` was needed anywhere; Prisma's JSON columns use the round-trip idiom already in `metaCachePayload`.

#### Changed

- `refactor(community): extract the shared deck-visibility rule (#522)` — `findVisibleDeck` was **byte-identical in four route files** (same md5) and `COMMENT_SELECT` in two. Both are shared modules now, moved verbatim.
  - **A test written as a hypothesis found a real defect.** `deck.userId !== viewerId` with both sides nullable reads `null !== null` as false, so an ownerless private deck registered as owned by an anonymous viewer. **Latent, never live** — `Deck.userId` is optional in the schema, but the only creation path sets it and no such row exists. Fixed because the schema permits the state and this is a visibility rule. Four copies, tested in none; now seven tests.
  - This extraction was not planned: SonarCloud failed the gate at 3.8% new-code duplication. The added lines were three per route, under the detector's block size, so the duplications API was asked _where_ rather than guessed at — it pointed at 21-to-34-line blocks of pre-existing boilerplate pulled into the new-code measure by the edit. Guessing would have meant refactoring the wrong code.

### 2026-08-21: Release #519 — the accent token split, and two defects no audit could see

#### Fixed

- `fix(a11y): split --accent into a background token and a text token (#519)` — **accessibility is now 100 on all three audited pages, with no failing audits** (was 96 / 96 / 96).
  - `--accent` had two jobs with opposite requirements: white-on-accent needs `L <= 0.183`, accent-on-surface needs `L >= 0.195`. **No overlap**, so at #6366f1 it was 4.46:1 and 4.42:1 — failing both by a hair, and unfixable by moving one value. 91 `text-[var(--accent)]` call sites swept across 46 files onto a new `--accent-text`.
  - Every token moved by the **minimum** that crosses 4.5:1, hue and saturation untouched — `--accent` shifted 0.2% in lightness. An accessibility fix should not redesign the brand.
- **`--accent-hover` was 2.98:1 under white text in the dark theme** — _worse than the resting state_, so hovering an accent button made its own label harder to read. **No audit can report this**: Lighthouse measures the page as rendered and never a hover, focus or active state. Found by computing the ratio from the tokens. The dark theme now darkens on hover, as the light theme already did.
- **Light `--text-secondary` was 4.28:1 on `--surface-hover`.** Found by the new test, not by inspection — and the first solve for it targeted `#ffffff`, passed at 5.04, and was wrong. Light-theme text is bound by the **darkest** surface. That is the third instance of the same mistake: `#7c5cfc` cleared `--black` and failed `--surface` in #516; this is its mirror image.

#### Changed

- **The Lighthouse harness was under-reporting, and the gate hid it.** SEO read 92 on `/` and `/fr` after #517 because `NEXT_PUBLIC_BASE_URL` was unset: `siteUrl()` fell back to the production domain while the page was served from localhost, so every canonical pointed off-origin and the audit reported "points to another hreflang location". It cleared the 0.9 threshold, so nothing complained — **and a standing failure like that would have hidden a real canonical defect behind it.** The variable is now set on the build _and_ the audit step, since `NEXT_PUBLIC_*` is inlined at build time. Confirmed at 100 across the board.
- **Accessibility, best practices and SEO raised from 0.9 to 0.95**, the follow-through the #516 config comment promised. Performance stays at 0.9 — the only category that moves with load.
- `src/styles/contrast.test.ts` guards both themes: white on `--accent` and `--accent-hover`, and `--accent-text` and `--text-secondary` against all three surfaces each. **Sixteen assertions, ten of which failed before this change.**

### 2026-08-21: Release batch #514–#517 — a gate that was never running, and three defects it found on its first pass

#### Added

- `chore(ci): Lighthouse CI (#514)` — performance, accessibility, best practices and SEO scored on every PR. `lhci autorun` builds the app, serves it with `next start` and audits `/`, `/fr` and `/auth/signin`, median of three runs, desktop preset, no database — every audited URL is public and the session strategy is JWT, so an anonymous visit issues no query. All four categories assert as **errors** at 0.9.
  - **The `warn` on performance was retired on measured data, not on nerve.** It shipped as a warning because a workstation's 97 says nothing about a shared runner. The first CI run answered it: 98/98/97 against 97/97/98, with one point of spread across three runs on the same URL. The preset's simulated throttling normalises the hardware, so it gates.
  - **The audited URLs were not deterministic.** next-intl negotiates the locale from `Accept-Language`, so on a French Chrome `/` redirected to `/fr` and `/auth/signin` to `/fr/auth/signin` — three requested URLs collapsed into two audited pages, and English was never measured at all. On an Ubuntu runner it would have been the mirror image. `extraHeaders` pins it.
  - **The first CI run was green with an empty artifact.** Nine reports written, none uploaded: `.lighthouseci` is a dot-directory and `actions/upload-artifact@v4` skips hidden files by default, while `if-no-files-found` defaults to `warn`. **The fourth instance of the shape already catalogued three times** — a failure whose output is indistinguishable from a legitimate empty result. Now `include-hidden-files: true` **and** `if-no-files-found: error`.
  - `.prettierignore`, which the repository did not have. lint-staged formats `*.yml`, so adding the first dependency in a while rewrote `pnpm-lock.yaml` wholesale — 14k lines of churn that pnpm undoes on the next install.
- `feat(seo): canonical and hreflang on the public pages (#517)` — self-referential canonical per locale, one `hreflang` per served locale plus `x-default`, on the landing page, public decks, public profiles and commander deck discovery. Verified against a production build, not only unit tests.
  - **Deliberately not set on the locale layout.** Layout metadata is inherited by every page that does not override it, so a canonical there would declare every deck, profile and commander page to be the homepage — worse than declaring nothing, and the obvious way to write this change. Only `metadataBase` is global, because it is a base URL and not an instruction.
  - `siteUrl()` reads `NEXT_PUBLIC_BASE_URL`, the variable `robots.ts` and `sitemap.ts` already use. A canonical disagreeing with the sitemap hands a crawler two answers for one page.
  - Dormant locales are excluded: advertising a language the middleware does not route sends a crawler to a redirect or a 404.

#### Fixed

- `fix(ci): run the gates on PRs into staging, not only main (#515)` — **`ci.yml` and `sonar.yml` were scoped to `branches: [main]` while every feature PR targets `staging`.** No PR carrying a change had ever been linted, typechecked, tested or analysed; the gates fired only on the promotion, after review, once the code was already in the integration branch. Found because Lighthouse was the only repository check present on #514 — the new workflow was the only one that listed `staging`. All three now trigger on `[main, dev, staging]`.
- `fix(a11y): readable contrast on the landing and sign-in pages (#516)` — three of the four defects Lighthouse reported on its first pass. `.section-label` was 2.23:1 on `--surface`; `--muted`, which carries body copy across seventeen rules, was 3.41:1; the sign-up link was distinguished from its sentence by colour alone.
  - `--gold-dark` itself is untouched — it also ends two gradients and a card border, where lightening it would alter the design rather than the accessibility.
  - **`contrast.test.ts` exists for a narrower trap than "check the contrast".** `#7c5cfc` clears 4.5:1 against `--black` at 4.60 and fails against `--surface` at 4.08, so a token verified against the darkest background alone reads as safe and is not. Two of the four candidates costed for this fix had exactly that shape. Every text token is now checked against every background it can land on.
  - Only small text is asserted at 4.5:1. Several headings use `--gold` at `clamp(1.8rem, 4vw, 3rem)`, which WCAG allows at 3:1 — asserting 4.5:1 across every `color:` declaration would fail on those and teach the next reader to weaken the rule.

#### Known

- **`--accent` is the remaining contrast failure and cannot be fixed by moving one value.** #6366f1 is 4.46:1 under white button text and 4.42:1 as text on the app background: the button wants it darker, the link wants it lighter. Needs a second derived token and 179 call sites across 46 files. The a11y ratchet stays at 0.9 until then.
- **A fourth silent-read instance, in `sitemap.ts`.** A bare `catch {}` around the Prisma read yields a one-URL sitemap indistinguishable from a site that has one page. The sitemap also omits the public decks, profiles and commander pages that #517 just made canonical.
- **The e2e flake got a controlled data point.** The gate failed on `back navigation returns to home` while a `next start` server left over from a Lighthouse verification held the host; killing it and re-running **the same commit** went green. Still not reproducible on demand, but the first recurrence where the load was known and removable rather than inferred afterwards.

### 2026-08-20: Release batch #505–#510 — silent failures hunted down, DeckEditor split in four

#### Fixed

- **Three instances of one failure shape, the third found by looking for it.** A read whose failure is indistinguishable from a legitimate empty state, with no way to recover: the UI renders something plausible, so nobody suspects the fetch.
  1. The MTGTop8 source returned nothing from #205 to #487 — **months**
  2. `DeckRatingPanel` (#505) — swallowed its read; found **by accident**, by an agent diagnosing an unrelated gate failure
  3. `DeckCommentPanel` (#506) — **found by grepping for the signature** rather than waiting for a report
     Both panels ignored a non-OK response and caught a thrown fetch bare, with a code comment describing it as intentional. Their bodies render only when `data` is set, so either outcome left the section showing its header alone, forever. Both now report the failure and offer a retry, with `loadFailed` kept distinct from the existing `failed` for writes. Each fix is **mutation-checked** — reverting it fails two of its three new tests. The grep that found the third (`if (res.ok)` followed by a state setter) now returns nothing in `src`.
- `fix(i18n): the gap my own sweep left (#507)` — the #498 sweep grepped for `attr="Text"` and `>Text<`. Neither shape catches a string in a **template literal** or a **const table**, and ten more were sitting in exactly those two places: interpolated `aria-label`s across five components, the price tooltip, and the whole `SortGroupToolbar`, whose `CMC / Name / Price / Color / Type` and `Ungrouped / By Type / By CMC / By Color` are visible button text living in `SORT_OPTIONS` / `GROUP_OPTIONS`. Both signatures now return zero. The two survivors — the decklist example placeholders — stay English deliberately and now say why in the code: `parsePlainTextDecklist` matches the English section headers, so a localised example would show input the parser rejects.
  - Worth stating plainly: `catalog.test.ts` guards key parity across locales, but **it cannot see a string that was never extracted.** That is a grep problem, and a grep is only as good as the shapes it knows about.

#### Changed

- **`DeckEditor` split in four: 1214 → 325 lines (−73%).** The project's largest component is now a shell around `MainZoneContent` (442), `SecondaryZoneContent` (321), `ColorIdentityBanner` (165) and a shared `grid-cols.ts` (25).
  - `ColorIdentityBanner` (#508) — self-contained, already exported. Its test file was named `DeckEditor.test.tsx` and tested **only the banner**, which made a 1214-line component look covered when it was not; renamed to what it always was. Six tests added for `getDisplayColorIdentity`, which normalises identities arriving from deck data _and from imports_: lowercase accepted, repeats drawn once, non-colour symbols ignored rather than rendered as broken pips, colourless fallback, and the identity's own order preserved rather than sorted.
  - `SecondaryZoneContent` (#509) — took everything through props already, so no prop threading was needed. `DroppableZone` travelled with it; `getDropZoneClass` stayed because `DroppableCategory` still needs it; `gridColsClass` got its own module because the main zone shares it, and duplicating it would have been the easy wrong answer.
  - `MainZoneContent` (#510) — took its whole drag-and-drop chain, since nothing else used it. The banner row, companion zone and pairing helpers stayed with the shell. **That boundary was wrong on the first pass and the compiler caught it in seconds** — the argument for splitting against a type checker rather than by eye.
  - In every case the code moved **verbatim**, so the pre-existing suite passing unchanged is the evidence, not a hope.

#### Known

- **The e2e flake fix reduced it; it did not eliminate it.** Four gate runs since #495 still failed and passed on retry — one of them on `back navigation returns to home`, the very spec the fix was written against. So `networkidle` is not a reliable hydration proxy, or the swallowed-click mechanism is not the whole story. Recorded in `progress.md`, which no longer reads as if the item were closed.

### 2026-08-20: Release batch #495–#501 — the e2e flake diagnosed, i18n stragglers, three store extractions

#### Fixed

- `fix(e2e): wait for the builder to be interactive (#495)` — **the intermittent failure is diagnosed.** `openBuilder` returned as soon as `waitForURL` saw the address change, well before the route was usable: the deck store was still syncing (the transient `!deck` branch) and React was still hydrating the pushed route. A click dispatched in that window is **swallowed** — the listener has attached and calls `preventDefault`, but the router cannot act yet, so the native navigation is cancelled and nothing replaces it. Load-sensitive by construction, which is what every observation said: `back navigation returns to home` failed three times on a host busy with another agent's greps and passed on an idle one. Now waits for the loaded branch and for `networkidle`. Verified with the spec run three times, twice under deliberate load. **Honest limit**: the flake was never reproducible on demand, so this is a mechanism that fits every observation and a fix that removes it — not a captured failure.
  - Making the helper deterministic immediately broke `builder shows 3-panel layout`: `getByRole` matches `name` as a **substring**, so with the search results actually rendered, `"Commander"` also matched _Commander's Sphere_ and its add button. **It had only ever passed by racing ahead of those cards.**
- `fix(i18n): localize the builder page (#497)` — the roadmap marked string extraction done at #455, but **the builder — the app's main screen — never called `useTranslations` at all**. A French viewer got `Loading deck…`, `Deck not found`, the Name / By Set / By Color tabs, and **every icon-only control announced an English name to a screen reader**.
- `fix(i18n): sweep the shared components (#498)` — the same defect elsewhere, notably `ui/Modal` and `ui/Toast`, whose English Close / Dismiss labels were shared by **every modal and every toast in the app**. Also the entire keyboard-shortcuts modal, pagination, the description editor, share controls and the landing hero. **Zero hardcoded `aria-label` / `title` / `placeholder` left in `src`** (was 15).
- **A decklist section-header branch was dead code** (#501). The branch clearing the commander section tested `/^(deck|main|sideboard)/` against the raw line, but that code is only reachable when the line is blank or starts with `//` or `#` — so an anchored pattern expecting the line to _begin_ with "deck" could never match. A list whose commander section is empty before a deck header therefore **mislabelled the first deck card as the commander**. Found by writing the tests, not by reading the code.

#### Changed

- **Three store/parser extractions, chosen by measurement rather than feel** — `store.ts` (cognitive complexity 190, double the next), `collection/store.ts` (99) and `url-import.ts` (88). In each case the seam was the same and the reason it was safe was the same: the extracted functions touch no store state and make no network call. All moved **verbatim**, so the pre-existing suites passing unchanged is the evidence nothing shifted semantically.
  - `refactor(deck): store-factories.ts (#499)` — −165 lines, +16 direct tests
  - `refactor(collection): parse.ts (#500)` — +27 tests. This one is a **trust boundary whose rejection is silent by design**: `parseCollectionCard` returns `null` and the caller drops the row, so a mistake here does not throw — it makes a card vanish from someone's collection with no error anywhere
  - `refactor(import): decklist-parse.ts (#501)` — −115 lines, +16 tests, and the dead branch above
- `src/i18n/catalog.test.ts` (#497) — a key present in `en` and missing elsewhere **fails nothing today**: no build error, no render error, no warning; next-intl prints the key path into the UI. Parity is now asserted on key paths across every locale × namespace. **Mutation-checked** — deleting `fr` `actions.playtest` fails the test naming that exact key. Values are deliberately not compared, since dormant locales legitimately hold English.
- `chore(scripts): compact-docker-disk.ps1 (#496)` — the gate leaves ~2–3 GB of build cache per run; ten pushes took the cache to 21 GB and C: to 95 %. `docker builder prune` frees it inside Docker but the backing `.vhdx` stays at its high-water mark. Measured on the dev machine: **28.5 GB → 4.1 GB, C: from 26 GB to 49.5 GB free.** `wsl --set-sparse` is deliberately not used — WSL disables it over a data-corruption risk and the dev Postgres volume lives on that disk.

### 2026-08-20: Release batch #480–#489 — localized card data finished, production hardening, tournament context

#### Added

- `feat(i18n): localized card names on deck rows (#480)` — the batch path the `DeckCard` surfaces had been waiting for since #415. Names are chunked into `lang:xx unique:cards (!"A" or !"B" …)` searches, 20 per request, cached 24 h, indexed by oracle name and handed to every row through a provider mounted once in `DeckEditor`. `/cards/collection` could not be used: it has no language parameter. English viewers make no request.
- `feat(i18n): translated printing in the deck tooltip (#481)` — a hover is an image, so the meaningful localization is the French card itself, not English art with a translated caption.
- `feat(i18n): playtest zones (#482)` — hand, battlefield and graveyard/exile, including `alt` and `aria-label`s. `useLocalizeDeckCard` returns a function so a zone that maps over its cards needs no per-card component.
- `feat(i18n): proxy sheets (#484)` — name, type line, rules and the printing image on every slot; mana cost and P/T are language-neutral and stay. **With this the roadmap line _Localized card data_ is complete**: search, storage, import and export keep English names, display follows the viewer.
- `feat(meta): tournament decks with event context (#487)` — player, event, ISO date, placement, format label and event level.
- `chore(ci): production dependency audit (#486)` — critical advisories block the job; high ones are reported. The five present today (`sharp`/`postcss` under `next@15`, `defu`/`deepmerge-ts` under `prisma@6`) need the Next 16 / Prisma 7 majors.

#### Fixed

- `fix(security): CSP, HSTS, session expiry, error leaks, image byte cap (#485)` — closes the header findings the 2026-07-20 audit left open and the actionable items of the 20-point production checklist, now recorded per item in `docs/security/production-checklist.md`. The CSP host allowlist is unit-tested in `src/lib/security-headers.ts`: a missing host breaks a feature silently in production and a test is the only cheap place to catch it. JWT sessions expire after 7 days instead of the unasserted 30-day default. Four routes (`ai/build`, `ai/suggest`, `import/url`, `meta/[slug]`) echoed `error.message` — provider quotas, upstream hostnames — straight to the client; they now log it and answer with a fixed line. `proxy-card-image` refuses upstream bodies over 5 MB.
- **The tournament source had matched nothing since #205.** Its regex expected quoted `/event?e=…&d=…` links on the MTGTop8 format listing, but that page lists _events_ — unquoted, no `&d=`. The panel showed "no tournament decks" and read as "this commander has none". `fetchTournamentData` now searches by commander archetype (the id map is parsed from the search form and cached 24 h per instance), falls back to a card-content search, and decodes the site's Latin-1. An `@external` contract spec guards the live markup so the next silent break is loud.

#### Changed

- `chore(hooks): deterministic SonarCloud PR gate (#483)` — the prompt hook ignored its own `Bash(gh pr create:*)` filter and blocked unrelated multi-line shell commands (heredocs, loops, pipelines) with a Sonar message, six times in one session. Replaced by `scripts/pre-pr-sonar-gate.sh`, which exits silently unless the command is a PR creation and otherwise queries the issues API itself.
- `docs(readme): catch up features, stack, architecture, security (#488)` — the README had fallen several batches behind.

> **Branch drift, again.** `gh pr merge --rebase` rewrites the promoted commits on the target, so after `staging → dev → main` the same nine commits existed three times under different SHAs — identical trees, divergent histories. `staging` and `dev` were reset onto `main`'s commits to bring all three level. Rebasing the promotion avoids a _merge commit_, but not the SHA rewrite; the reset is still needed.

### 2026-08-20: Release batch #471–#476 — five light features and a clean slate

#### Added

- `feat(export): download button for every format (#472)` — only MTGO and Plain Text offered a file download; the other six were copy-only.
- `feat(meta): link the commander out to EDHRec (#473)` — same `commanderToSlug` the panel's data is fetched with, so the link can never point somewhere the data did not come from.
- `feat(i18n): localized banlist tab (#474)` — the Game Changers tab was localized since #456 while the banlist tab beside it stayed English; same merge-over-English construction, `useBanlistSet` untouched.
- `feat(community): sort toggle on the comment stream (#475)` — newest-first reads as a feed, oldest-first as a conversation; replies stay chronological either way. Hidden below two comments.
- `feat(community): copy-link button on the public deck page (#476)` — plus the header's hardcoded "Edit", missed by the extraction, moved to a catalog key.

#### Fixed

- `fix: optional chains for the three S6582 issues (#471)` — the only findings from the first full `pnpm sonar` run after the #455–#468 promotion; open issues back to **0**.

### 2026-08-19 (late): Release batch #466–#467 — export formats, and the flake fights back

#### Added

- `feat(export): MTGGoldfish and EDHRec formats, categories in the Archidekt export (#467)` — Goldfish gets the MTGO sideboard-slot convention its text import reads as the command zone; EDHRec gets a plain deck-check list with the command zone first; the Archidekt export tags every card with its app category (`[Commander{top}]` pinning the command zone) so the categorisation survives the round trip. The Goldfish URL **import** stays blocked by their Cloudflare challenge — exporting a list a user pastes into Goldfish needs no network at all.

#### Fixed

- `fix(e2e): wait for the deck's cards before opening the playtest (#466)` — the spec opened the playtest immediately after `goto`, but the builder lazy-loads cards, so under load the engine snapshotted a short library and drew under seven.

#### Notes

- **Hypothesis 3 for the intermittent e2e failure is falsified**, by its own pre-registered criterion: a run failed 3 specs with the warmup active, on a loaded host (2.1m vs the usual 1.4). Compile timing is at most a trigger; load widens the real mechanism. Recorded in `quality-gate.md`, along with the operational rule — do not run other Docker builds while the gate runs. The next step is a **decision, not a patch**: test a production build instead of `next dev`, which first requires un-tying the e2e auth bypass from `NODE_ENV`.

### 2026-08-19 (night): Release batch #462–#465 — Archidekt fidelity, the flake gets a mechanism, commander in SQL

#### Added

- `test(e2e): Archidekt live-contract spec (#463)` — mirrors the Moxfield `@external` pattern against our own deck (25314868); structural assertions so content drift cannot redden it.
- `feat(community): denormalise the commander name onto Deck (#465)` — `Deck.commanderName`, written wherever `commanderId` is written, **backfilled from the `isCommander` card in the repository's first data migration**. The discovery route now matches the slug in SQL via an expression index (the exact twin of `commanderToSlug` — the slug itself is never stored, since that function is shared with the EDHRec URL builder and a stored copy could silently desync) instead of fetching every public deck with its votes and ratings and slugging in memory. A new e2e case proves the SQL expression against real Postgres with "Kroxa, Titan of Death's Hunger".

#### Fixed

- `fix(import): honour Archidekt zones and partner commanders (#462)` — verified against the live API. Archidekt models Maybeboard/Sideboard/Considering as categories flagged `includedInDeck: false`; the importer put **every card in the main zone**, silently changing the deck's contents. And with no partner flag on Archidekt, both halves of a pair sat in the Commander category — importing both as commander made the second overwrite the first. Not-included categories now route to maybeboard/sideboard and the second commander imports as the partner.
- `fix(e2e): warm every route before the suite runs (#464)` — **hypothesis 3 for the intermittent flake, the first with a mechanism**: the gate's web server is `next dev`, so route segments compile on demand mid-run, and a navigation landing mid-compile can render against a different instance of the next-intl context module than the provider captured — the "context from `NextIntlClientProvider` was not found" log line, a client retry, an aborted navigation. A `warmup` Playwright project the suite depends on now compiles every segment first. Falsification criterion recorded in `quality-gate.md`: a recurrence with warmup in place means the hypothesis is wrong.

#### Notes

- The Goldfish import stays blocked (Cloudflare JS challenge) — the Archidekt work in this batch is the practical answer to richer URL imports.
- `Deck.commanderName` ships with a data backfill; production deploys must run `prisma migrate deploy` with `DATABASE_URL_UNPOOLED` as usual.

### 2026-08-19 (evening): Release batch #458–#460 — structured logs and deck comments

#### Added

- `feat(observability): emit structured JSON logs on the production server (#458)` — Pino behind the existing `logger` API with **zero call-site changes**: `level`, ISO `time`, `msg`, `context`, `meta`, serialised `err` stack. Development and the browser keep the readable `[context] message` console form; Sentry forwarding is unchanged in both modes. `pid`/`hostname` dropped — on serverless every invocation differs, so they say nothing.
- `feat(community): threaded deck comments (#459 API, #460 UI)` — `DeckComment` model (`parentId` self-relation, database-level cascade), public GET / authed POST-PATCH-DELETE under `/api/community`, and a panel below the ratings block on the public deck page. The deck owner **may post** (unlike rating and voting) and may delete any comment as the minimal moderation surface; the API answers "is this mine?" / "is this the deck author?" as booleans so the raw `userId` never leaves it.
- Shared `UserChip` author chip — extracted from `ReviewList` when the comments panel would have been the pattern's third copy.

#### Fixed

- `fix(e2e): probe the database healthcheck over TCP (#459)` — on a cold volume (every gate run: cleanup is `down -v`) postgres's initdb phase runs a bootstrap server that listens **only on the Unix socket**, which `pg_isready` without `-h` happily answers. The check could pass seconds before the real server bound TCP, and `prisma migrate deploy` died with P1001 before a single test executed. `-h 127.0.0.1` makes the probe ask the question Prisma asks.
- The comments empty-state copy initially collided with the ratings e2e locator `/be the first/i` — a strict-mode two-element violation the moment both panels rendered. Caught by the gate, reworded (#460).

#### Notes

- **Goldfish import is blocked**, not just unbuilt: mtggoldfish.com's download endpoint sits behind a Cloudflare managed JS challenge, so the server-side fetch the other five parsers use receives the challenge page. Recorded on the roadmap; no parser shipped.
- Two latent e2e flakes surfaced by the gate, both pre-existing: a playtest spec can start before the full deck loads (the engine snapshots an empty library), and the community pages log a masked `useTranslations … NextIntlClientProvider was not found` SSR error from `Header` that client-side rendering recovers. Neither is diagnosed yet; both are now in the progress tracker.

### 2026-08-19: Release batch #455–#456 — string extraction complete, localized surfaces spread

#### Added

- `feat(i18n): extract TemplatesModal, BulkEditModal and ImportFromUrlTab (#455)` — the **final slice of the string extraction**: every one of the 125 components now reads its copy from the catalogs. The slice kept the effort's record of surfacing defects the hardcoded strings were hiding: a **ninth hand-built plural** (`lineCount === 1 ? "line" : "lines"`), and the URL-import footer claiming **2 supported sources while its own intro listed 6**.
- `feat(i18n): localized card text on the Game Changers page and the wizard commander preview (#456)` — extends #415's per-field printed-text fallback past the printing selector. The Game Changers list merges one localized paginated search (24h cached) **over** the English list: a `lang:` search only returns cards printed in that language, so using it as the list itself would silently drop every Game Changer without a translated printing. The page's search box matches printed names too — a viewer reading a French list types the French name they see. A reusable `useLocalizedCardText` hook piggybacks on the printing-selector query cache; English locales make no request at all.

#### Fixed

- `deck.import.description` had been in the catalogs — translated — since the import dialog's extraction, while the dialog rendered the same sentence **hardcoded** beside it. The key is now actually rendered, and the `codeCard` / `codeCommander` fragment keys were folded into it as `<code>` rich tags (#455).
- The bulk edit modal's close button had **no accessible name** (#455).
- `TemplatesModal` formatted dates with `toLocaleDateString()`, which ignores the app locale; it now goes through `useFormatter().dateTime` (#455).

#### Notes

- The roadmap's "Difficulty on recorded sessions" entry was **stale**: the recording bar has asked for opponent strength since #425. It survived one roadmap review after the feature shipped — caught this time by checking the component before building it again.

### 2026-08-16 (evening): Release batch #428–#447 — honest gates and the deck cluster

#### Fixed

- `fix(ci): make the SonarCloud scan fail rather than skip (#442)` — the scan step carried `if: env.SONAR_TOKEN != ''`. With no secret set it was **skipped while the job still reported success**, so every PR showed a green SonarCloud check with nothing analysed and the "open issues = 0" checklist line read a months-old snapshot. **Thirteen batches shipped in one day under that tick.** Fork PRs are handled separately — GitHub withholds secrets from forks by design, so those emit a `::warning::` rather than failing a contributor for something they cannot fix.
- `fix(e2e): let the report leave the container (#436)` — the `e2e` service mounted nothing, so the Playwright report was written inside it and destroyed by the cleanup. The host copy was **six days old** while the script said "Check playwright-report/ for details". Also switched the reporter to `[list, html]`: `html` alone writes nothing to stdout, so a failing run named no failing test anywhere a reader could see.
- The builder's back arrow was an icon-only link with **no accessible name**, and `a[href$="/decks"]` matched the header nav link first — so the e2e test named _back navigation returns to home_ never touched the back arrow (#436).
- Card prices come from Scryfall's `prices.usd`, but the budget modal, pricing shopping list and CSV export printed a **euro sign**. A "€50" budget was really $50, and exports named a currency the numbers were never in (#433).
- The shopping-list CSV **dropped cards with no known price** — `getCardsSortedByPrice` filters them by design, right for a sorted view, wrong for a list of what to buy (#433).
- Five SonarCloud issues, the first ever raised against this project's real code, all written the same day: a `t.rich` renderer read as a nested component, nested template literals, a missing optional chain, and two `waitFor` + `getByText` pairs (#439).

#### Added

- i18n extraction of the deck cluster: stats panels (#428), budget and shopping-list modals (#433), bracket indicator and buy list (#439), proxy export (#445).

#### Changed

- `SONAR_TOKEN` now exists as a repository secret. The local gitignored `.env.sonar` drives `pnpm sonar` only — **a local file does nothing for CI**, which is what made this easy to miss for so long.
- Three `setRequestLocale` / `requestLocale` deprecation warnings marked **accepted** in SonarCloud with the reason recorded: the replacement `next/root-params` exports `unstable_rootParams` and ships a stub `.d.ts` in Next 15.5.22. Reversible; revisit when it stabilises.
- Promotions now use `gh pr merge --rebase`. Merge commits are created _on the target_, so `staging` drifted to **26 commits behind `main` with zero files different**. `delete_branch_on_merge` enabled on the repository.

#### Notes

- The intermittent e2e navigation failure is **still open**, but no longer invisible: it took three push attempts to land #436, and the now-readable report named the failing specs. Two hypotheses ruled out and written into `quality-gate.md`.

### 2026-08-16: Release batch #409–#421 — deck analytics and localised cards

#### Added

- `feat(stats): add mana base alignment to deck statistics (#410)` — the colour distribution reported what the **spells** ask for and nothing about what the **lands** produce, so a deck could read as balanced while being unable to cast half its cards. Each colour now shows sources against a proportional recommendation. Puts `MANA_IMBALANCE_THRESHOLD` to work: declared in `constants.ts` since the early days and referenced **nowhere**.
- `feat(stats): add turn-one playability (#412)` — exact hypergeometric odds that the opening seven holds a land and a one-drop, plus a stricter per-colour read requiring a matching source. Not simulated, so the figures do not wobble between visits. The two are deliberately never summed: one hand can satisfy two colours at once.
- `feat(i18n): show card text in the viewer's language (#415)` — card name, type line and rules text read from a printing in the viewer's language, with **per-field** English fallback. Scryfall fills `printed_name` / `printed_type_line` / `printed_text` independently, so falling back as a unit would blank a card's rules whenever one field was missing.
- `feat(playtest): record playtest sessions (#418)` — `PlaytestSession` model and route. `analytics.ts` had held win rate, mulligan distribution, matchup splits and daily trend since US-AG Phase 1, **written, tested, and reachable from nothing**: no model existed, so no session could ever be recorded. The result is user-declared — the playtest is a solitaire goldfish, so nothing in the app can decide whether a run was a win.
- `feat(playtest): show the deck's recorded history (#421)` — games, win rate, turns to win, mulligan breakdown and a trend verdict. #418 had shipped recording with no way to read it back.
- `feat(i18n): extract the card and collection components (#409)` — third extraction slice, `card` namespace added.

#### Changed

- Playtest records are **private to the account**, not attached to the deck: two players practising the same public deck never see each other's runs. Hence the route sits under `/api/decks`, not `/api/community`.
- `PlaytestSession` carries **no unique constraint**, unlike `DeckVote` and `DeckRating` which upsert on `@@unique([userId, deckId])`. Every run is its own row — that is what makes a trend possible.
- The trend verdict is deliberately conservative: four days of play before claiming a direction, each day weighted by games played, and movements under 10 points reported as steady.
- `searchCardPrintings` sends `lang:xx` and `include_multilingual=true` **together** — Scryfall hides non-English cards from search without the flag, so the filter alone returns nothing, which reads as "no translation exists".

#### Fixed

- The printing selector's text panel read the card it was **opened with** rather than the printing selected, so choosing a printing changed nothing (#415).
- Recording a playtest did not invalidate the history query, so the run just recorded was **missing from the panel** the next time the modal opened (#421).
- A hardcoded `"No text"` missed by the card/collection extraction (#415).
- `CardListItem` hardcoded "Move to Maybeboard" while `builder.json` already held `zoneMoveTargets.toMaybeboard` = "Move to Considering", the actual tab name. The hardcoded string was the inconsistent one (#409).
- `PrintingSelectorModal` built an English plural by hand; replaced by an ICU plural (#409).

#### Notes

- The `PlaytestSession` migration was **hand-written** and applied with `db execute` + `migrate resolve`. `migrate dev` demanded a database reset over a pre-existing, unrelated drift — `DeckCard.isMaybeboard` exists in the dev database but not in the schema — and its generated diff would have dropped that column. **That drift is still unexplained and still there.**
- CI's SonarCloud step has reported _pass_ throughout this batch **without analysing anything**: `SONAR_TOKEN` is absent from repo secrets and the scan step is gated on it. `fix/sonar-gate-silently-skipped` is pushed and waiting on the secret.

### 2026-08-16: Release batch #392–#406

#### Added

- `feat(playtest): wire the enhanced playtest engine into the UI (#394)` — turn phases, life tracking with history and undo, battlefield / graveyard / exile zones. The engine, store and five zone components were already written and unit-tested but **had no importer outside their own tests**; the modal still ran a hand-only hook. Added `applyMulligan` (the engine had none, so wiring the store in as-is would have removed a shipped feature) and `FormatConfig.startingLife` (40 Commander, 30 Brawl, 20 elsewhere — Oathbreaker runs a commander but starts at 20).
- `feat(stats): add format-specific deck statistics (#395)` — curve, threat density and interaction ratio per format, ratios taken against non-land cards. Bands are heuristic, not tournament data.
- `feat(community): commander deck discovery with up/down votes (#396)` — public `/commanders/[slug]/decks` ranked by vote score, `DeckVote` model, Meta panel link. Nothing listed public decks before this.
- `feat(404): keep the app chrome and locale on a not-found inside the app (#405)` — `[locale]/not-found.tsx`, with its own provider so it also works when the locale layout itself bailed.
- `feat(i18n): extract the search panel and guard key parity (#397)`, `extract the playtest zone components (#406)` — plus `messages.test.ts` failing the suite when any locale diverges from `en`.

#### Changed

- `feat(i18n): serve English and French only, keep the other catalogs dormant (#398)` — the other eight were machine-seeded English copies. **A dormant prefix such as `/ja` is now an ordinary unknown path.**
- Locale routing is `as-needed`: English is served unprefixed. It was `always`, which contradicted both the documented design and `app/sitemap.ts` — **every indexed URL was a redirect to its `/en` equivalent**.
- Production database migrated from Supabase to **Neon**. The Supabase project had been deleted or auto-paused; all prior production data was lost with it.

#### Fixed

- `fix(deck): load a deck's cards when it is opened by URL (#399)` — a bookmark, refresh, shared link or freshly imported deck opened **with no cards**: the editor was blank, stats read zero, the playtest dealt an empty hand. Two holes: `setActiveDeck` skipped the fetch when the store was still empty, and `loadDecks` then overwrote any hydrated deck with the lightweight listing.
- `fix(observability): report server errors to Sentry and add error boundaries (#392)` — there was no `instrumentation.ts`, so `onRequestError` never ran, and the API routes catch into a JSON 500 that automatic instrumentation never sees. **No server-side error reached Sentry.** Also stopped `/api/health` leaking the raw driver message to anonymous callers.
- `fix(e2e): make the pre-push gate truthful and repair the suite (#393)` — the gate branched on `claude -p`, which exits 0 whenever the CLI ran, so it printed "E2E passed — push allowed" on a run with **27 failures**. 27 → 0: Playwright image drift (18 failures), unpinned pnpm, a `prisma.upsert` race across 8 workers (7 failures), plus `@external` / `@perf` tagging.
- `fix(dev): bind the dev server on IPv6 as well as IPv4 (#401)` — `dev:local` listened on IPv4 loopback only, so a browser resolving `localhost` to `::1` could never connect. It read as broken authentication.
- `fix(ci): stop declaring the pnpm version twice (#402)` — `pnpm/action-setup` received the version from both the workflow and `packageManager`, killing setup in 7 seconds. Never surfaced earlier because the workflows only trigger on PRs to `main`.
- HandZone rendered the French string "Deck vide" in the English UI, and its test asserted `/deck vide/i` — the test encoded the bug (#406).
- Phase labels were duplicated between `PhaseTracker` and `LifeTracker`; both now read the catalog (#406).

### Added — 2026-04-12: i18n Infrastructure

- `feat: add i18n infrastructure with next-intl (#320)` — full internationalization plumbing for 10 locales (en, fr, de, it, es, ja, zh, ko, ru, pt) using next-intl v4 with pathname-prefix routing (as-needed mode):
  - Install next-intl and wire into next.config.ts plugin chain
  - Create i18n config: `routing.ts`, `request.ts`, `navigation.ts` with type-safe `SupportedLocale`
  - Restructure all page routes under `src/app/[locale]/` with `NextIntlClientProvider` in layout
  - Compose middleware: next-intl locale detection + NextAuth session (edge-compatible)
  - Update `edge-config.ts` to strip locale prefix from auth path checks
  - Create message stub files (10 namespaces × 10 locales = 100 JSON files, empty — ready for translation)
  - 6 unit tests (routing config) + 7 E2E tests (locale routing, fallback, API passthrough)

### Added — 2026-04-07: 3D Landing Page & Marketing Overhaul

- `feat: redesign 3D landing with dark fantasy aesthetic (#305)` — Three.js scene with gritty MTG/D&D aesthetic: chiaroscuro lighting, creeping fog, warped parchment spellbook, stone altar, drifting ember particles, film grain, vignette, hexagonal rune glyphs, gothic typography
- `feat: replace 3D landing with full marketing landing page (#308)` — remove Three.js/R3F, build 9-section marketing page: hero (Scryfall mana SVGs), pain points, product demo (AI chat mockup), stats, how it works, testimonials, CTA, navbar, footer; Cinzel + Inter fonts, `useScrollReveal` + `useTypewriter` hooks, WotC legal disclaimer

### Fixed — 2026-04-06 → 2026-04-12: Performance, Polish, Sonar

- `fix: translate remaining French UI strings to English (#319)` — translate leftover French strings in GameChangersPageClient and Pagination
- `fix: slim down /api/decks listing response (#318)` — reduce API payload size for deck listings
- `fix: optimize /api/decks listing with lightweight query and pagination (#317)` — replace `include { cards: true }` with filtered query (commander/partner/companion only + `_count`); add page/limit pagination; lazy-load full deck data on `setActiveDeck`
- `fix: reduce onboarding and collection loading latency (#316)` — optimize loading performance
- `fix: reduce profile loading overhead from onboarding (#315)` — reduce redundant data fetching
- `fix: Header logo links to landing page instead of /decks (#313)` — correct logo navigation target
- `fix: companion color identity visual (#310)` — fix companion display in color identity banner
- `fix: git-prune script handles worktrees and protects main/master/develop/dev (#309)` — safer git cleanup
- `fix: allow unauthenticated access to / for 3D landing page (#303)` — public landing page access
- `fix: resolve all 54 SonarCloud issues from 3D landing page (#302)` — bulk Sonar cleanup
- `fix: use direct undefined comparison instead of typeof (S6635) (#304)` — Sonar rule compliance

### Refactored — 2026-04-08: Route Architecture

- `refactor: split landing page and deck listing into separate routes (#311, #312)` — `/` always shows marketing landing page; `/decks` is auth-protected deck listing; CTAs adapt to session state; post-auth redirects point to `/decks`

### Chore — 2026-04-07 → 2026-04-12: Dependencies & Config

- `chore: suppress sonar S7780 on middleware matcher (#321)` — suppress false-positive Sonar rule on Next.js middleware config
- `chore: move agent rules from skills/cursor-rules to rules/ (#314)` — reorganize AI agent configuration
- `chore(deps): bump the production-dependencies group with 3 updates (#307)` — production dependency upgrades
- `chore(deps-dev): bump the dev-dependencies group with 5 updates (#306)` — dev dependency upgrades

---

### Added — 2026-03-30/31: Phase 13 features — Challenges, Deck Branching, Archetypes, Playtest Analytics, Social, Keyboard Shortcuts, Ratings, Favorites

- `feat(usai): challenges — validation, scoring, ranking, status (#247)` — deck building challenges system with pure functions `validateChallenge`, `scoreChallenge`, `getRankings`; challenge completion tracking with badge rewards; 308 tests
- `feat(usaj): deck branching — create, diff, merge, conflict detection (#246)` — deck versioning: create branches from deck states, diff (added/removed/changed cards), merge with conflict detection; 222 tests
- `feat(usaf): archetypes library — 10 official archetypes` — Control, Aggro, Combo, Midrange, Ramp, Stax, Voltron, Tokens, Reanimator, Lands; archetype metadata, helpers `getArchetypesForCommander()`, `filterDeckByArchetype()`; 97 tests
- `feat(usag): Playtest Analytics — win rate, mulligan stats, matchup stats, trends` — advanced playtest statistics: win rate calculation, historical trends, mulligan metrics, matchup performance; 217 tests
- `feat(usah): social follow system — follow/unfollow + player badges` — follow other players, "Following" badge on profiles, notifications when followed players publish decks; 110 tests
- `feat(usab): deck ratings & reviews — pure logic + validation` — 5-star rating system + text reviews, review validation (length, profanity filtering), aggregate ratings; 131 tests
- `feat(usaa): card favorites & wishlist` — favorite cards across decks, wishlist for planned acquisitions; 183 tests
- `feat(usac+usad): stats export + smart recommendations engine (#241)` — export deck stats to CSV/JSON, recommendation engine with `getSmartRecommendations` and `rankRecommendationsByMetaplay`; 166 tests
- `feat(usae): keyboard shortcuts — definitions + utilities` — 15+ keyboard shortcuts, shortcut help modal (`?` key), `useKeyboardShortcuts` hook; 127 tests
- `feat: polish color identity banner symbols (#254)` — color identity mana symbols (W/U/B/R/G circles) in deck headers
- `feat: add mana symbols to home deck cards (#256)` — mana symbols on deck preview cards in home view

### Fixed — 2026-03-30/31: UI Polish, Sonar Hardening

- `fix: neutralize color identity banner background (#255)` — color banner contrast/legibility
- `fix: make builder warnings dismissible (#252)` — users can close non-critical alerts
- `fix: resolve remaining Sonar issues (#249)` — 8+ MEDIUM/LOW issues resolved
- `fix: resolve Sonar low bugs and harden ids (#248)` — crypto-random ID generation, no insecure random

### Chore — 2026-03-30: Infrastructure & Documentation

- `chore(docs): reorganize docs and update references (#251)` — docs split into `/engineering` (infrastructure.md, technical.md, dx-ci-overview.md), `/product` (roadmap.md, project-spec.md, user-guide.md), `/project` (changelog.md, progress.md), `/security`; cross-references updated
- `chore(deps): bump @sentry/nextjs in production-dependencies (#250)` — error tracking dependency upgrade

### Added — 2026-03-29: Phase 12 — Playtest mode, Deck Templates, Analytics Dashboard, Pricing UI

- `feat(usk): playtest mode — engine + store foundation (#222)` — full playtest game engine built with TDD:
  - Pure immutable state machine: `createPlaytestState`, `applyDrawCard`, `applyNextPhase`, `applyNextTurn`
  - Life tracking with history log and undo support (max 10 entries)
  - Zone management: hand, battlefield, graveyard, exile; `applyMoveToZone`, `applyTap`, `applyUntapAll`, `applyAddCounter`
  - Zustand store (`usePlaytestStore`) isolated from main deck store
  - 28 tests passing ✅ (1107 total)
- `feat(usk): playtest UI — LifeTracker, PhaseTracker, HandZone, BattlefieldZone, GraveyardZone (#236)` — full UI for playtest mode:
  - **LifeTracker**: life total display, ±1/±5 buttons, custom input, game over state, life history with undo
  - **PhaseTracker**: turn badge, 7-phase list with active highlight, Next Phase / Next Turn buttons
  - **HandZone**: hand + library counts, draw button, show/hide toggle, card context menu (→ Battlefield / → Graveyard)
  - **BattlefieldZone**: responsive grid, tap/untap with rotate animation, +1/-1 counters, remove button
  - **GraveyardZone**: graveyard + exile collapsible zones, restore to hand / battlefield
  - 36 tests passing ✅ (1297 total)
- `feat(usu): deck templates — library and application system (#223)` — template management system:
  - `DeckTemplate` interface with commander, archetype, deck list (99 cards), upvotes, source (official/community)
  - Pure functions: `createTemplate`, `applyTemplate`, `getTemplatesForCommander`, `searchTemplates`, `filterByArchetype`, `getPopularTemplates`
  - `TemplatesModal` UI component: browse, filter, apply templates
  - API routes: `GET /api/templates` (list by commander), `POST /api/templates` (create from deck)
  - `DeckTemplate` Prisma model added to schema
  - 26 tests passing ✅ (1131 total)
- `feat(usx): analytics dashboard — aggregated deck statistics (#225)` — deck analytics with TDD:
  - `aggregateDeckStats`: total decks, total value, avg cost, favorite archetype
  - `getFormatDistribution`, `getArchetypeDistribution`, `getBudgetDistribution` (Budget/Mid-range/Optimized/cEDH tiers)
  - `getRecentlyModified` with pagination support
  - 16 tests passing ✅ (1195 total)
- `feat(usw): pricing — deck price tracking and budget optimization (#224)` — Scryfall-powered pricing engine:
  - `calculateDeckPrice`, `getPriceBreakdown` (by card type with percentages)
  - `suggestBudgetReductions` (sorted by savings impact), `getCardsSortedByPrice`, `findCheaperAlternatives`
  - `generateShoppingListCSV` export helper
  - `useDeckPrice` hook: total USD value, missingPriceCount, hasCards
  - `DeckPriceDisplay` component in Stats Panel with live total + missing-price notice
  - Per-card green `$X.XX` badge in `CardListItem`
  - 20 tests passing ✅
- `feat(usw): pricing UI — BudgetOptimizationModal + PricingShoppingListModal (#237)` — pricing UI components:
  - **BudgetOptimizationModal**: current vs target budget, suggestions sorted by savings, per-suggestion Apply button, "Budget goal reached!" empty state
  - **PricingShoppingListModal**: card table sorted by total cost, subtotal display, missing-price count, CSV download (`deck-name-shopping.csv`), copy to clipboard
  - 19 tests passing ✅ (1316 total)
- `feat: US-I — Advanced card sorting & grouping (#221)` — powerful sorting and grouping in the deck editor:
  - `sortCards()`: CMC, name, price, color, type with asc/desc direction
  - `groupCards()`: by type, CMC, color, or none
  - `loadSortPreference` / `saveSortPreference` with localStorage persistence per deck
  - `SortGroupToolbar` wired into DeckEditor; `GenericGroup` component for dynamic groupings
  - 18 tests passing ✅

### Fixed — 2026-03-29: Security hardening, auth reconciliation, Sonar cleanup

- `fix: reconcile authenticated users with Prisma records (#233)` — race-safe auth reconciliation: upsert on first login prevents duplicate user records; test mocks updated for strict typing
- `fix: stabilize printings hover preview (#235)` — resolved flickering/instability in the printings modal hover card preview
- `fix: add hover zoom in printings modal (#234)` — card zoom on hover in the printings modal for better print selection UX
- `fix: replace ReDoS-prone regex in url-import and mana parse (#230)` — strip MDFC/pipe suffixes and set codes via linear `indexOf` loops (Sonar S5852); `parseManaCost` refactored to avoid catastrophic backtracking
- `fix: use Web Crypto instead of Math.random for ids and shuffle (#231)` — `crypto.getRandomValues`-backed `randomIntBelow` and `randomAlphanumericId` helpers; Fisher–Yates shuffle via unbiased CSPRNG (Sonar pseudorandom hotspot)
- `fix(sonar): resolve open LOW/MEDIUM issues (#227)` — A11y, Zod v4 migration (`z.uuid`, `z.url`, `z.flattenError`), nested ternary removal, `globalThis.window` guard, proxy print via `Blob` + `load`
- `fix(sonar): resolve 12 HIGH/MEDIUM impact issues (#226)` — reduce complexity in meta route, EDHRec fetch, AI stream parsing; fix `reduce` initial value; stable list keys in MetaPanel; A11y fixes (GameChangers modal backdrop, CardNoteInline role)

### Tests — 2026-03-29

- `test: raise coverage for meta, import, playtest, templates (#228)` — `usePlaytestStore` Zustand tests, `useMetaAnalysis` hook with fetch mocks, fetch edge cases, templates helpers, `importFromUrl` Moxfield/Archidekt paths
- `test: expand coverage for onboarding, url-import, sort, rate-limit (#229)` — `useOnboarding` Session mock fixes, url-import/sort preference/`getClientIp` edge cases

### Added — 2026-03-28: Phase 11 features — bulk edit, hybrid mana, AI archetypes, proxy PDF, URL import, meta panel

- `feat(editor): bulk select in sideboard & maybeboard (#199) [US-A]` — select multiple cards at once in the Sideboard and Maybeboard zones:
  - Checkbox multi-select per card in both zones
  - Bulk move to Main / Maybeboard / Sideboard
  - Bulk remove with single confirmation
- `feat(mana): hybrid mana support (#200) [US-B]` — full hybrid mana cost handling:
  - Parse `{W/U}`, `{2/W}`, `{B/G}` hybrid symbols in mana costs
  - Both colors attributed to card's color identity
  - Hybrid pips counted as 0.5 toward each color in mana proportion statistics
  - Hybrid symbols rendered using official Scryfall SVGs
- `feat(ai): enhanced AI deck builder — archetypes, budget & rationale (#201) [US-C]` — improved AI deck suggestions:
  - Archetype templates: stax, combo, voltron, control, aggro, midrange
  - Budget constraint parameter passed to AI prompt
  - Per-card rationale explaining why each suggestion fits the deck
  - Improved prompt with archetype context + budget filter
- `feat(export): proxy sheet export — print-ready PDF (#202) [US-D]` — print-ready proxy sheet generation:
  - Configurable layout: 3×3 (A4/Letter), 2×2, 1×1
  - PDF export via browser print API (landscape/portrait)
  - Image-only export with card art cropped to proxy size
  - Card-by-card HTML rendering fixed (follow-up from #203)
- `feat(import): URL import extended — 6 sources + rate limiting (#204) [US-E]` — deck URL import extended:
  - Added support for: MTGTop8, MTGDecks.net, TappedOut, Goldfish (alongside Moxfield & Archidekt)
  - Rate limiting on import requests (respect `robots.txt` and source fair-use policies)
  - "Tournament Deck" badge displayed on imported decks
  - Unified error handling for private/deleted/unsupported URLs
- `feat(meta): commander meta analysis panel — EDHRec + tournament (#205) [US-F]` — new Commander meta panel in deck editor:
  - Fetch and display top cards from EDHRec for the current commander
  - Aggregate top-played cards across recent MTGTop8/MTGDecks tournament results
  - Show card frequency % and meta rank alongside deck-builder suggestions
  - Panel accessible from the Stats sidebar in the builder

### Fixed — 2026-03-28: proxy rendering, SonarCloud batch, regex ReDoS

- `fix(profile): case-insensitive username lookup & normalize on save (#196)` — username now normalized to lowercase on both read and write paths; prevents duplicate profiles differing only in casing
- `fix(proxy): card-by-card HTML rendering (#203)` — corrected card rendering in proxy sheet HTML output; each card now generates an independent `<figure>` block with correct image URL and layout
- `fix(quality): SonarCloud smells — unsafe casts, duplication, coverage (#206)` — resolved code smell batch: replaced unsafe `as` type casts, eliminated duplicated utility logic, increased branch coverage for flagged paths
- `fix(sonar): resolve 38 SonarCloud issues across 19 files (#207)` — batch fix clearing 38 issues (MEDIUM + LOW) across 19 source files: dead code, async patterns, missing return types, optional chain, unnecessary spread
- `fix(security): regex backtracking in TappedOut parser (#208)` — replaced vulnerable regex with linear-time alternative; prevents ReDoS on crafted deck import input
- `fix(security): regex backtracking in decklist parser (#209)` — refactored plain-text decklist parser regex; catastrophic backtracking eliminated
- `fix(security): regex backtracking in card name strip pattern (#210)` — replaced strip-name regex with possessive quantifier pattern; safe under all inputs
- `fix(security): regex backtracking in deck import parser (#212)` — final ReDoS fix pass on the deck import orchestration layer; all import parsers now use linear-time patterns

### Docs — 2026-03-28

- `docs(infra): production schema sync guide + checklist (#211)` — new `docs/engineering/infrastructure.md` section covering:
  - Step-by-step Supabase ↔ Prisma schema sync procedure
  - Pre-deploy checklist for schema migrations in production
  - Rollback instructions and migration verification queries

### Added — 2026-03-27: Onboarding wizard, URL import & user profile [Phase 10 — US-02, US-03, US-04]

- `feat(onboarding): first-run wizard, tooltips & replay [US-04]` — guided onboarding experience for new users:
  - **First-run wizard**: step-by-step tour triggered on first login, covers key app sections
  - **Tooltips**: contextual help icons throughout the UI with descriptive popovers
  - **Replay**: "Show me again" option in user settings to re-run the onboarding flow
- `feat(import): URL import from Moxfield & Archidekt [US-03]` — import decks directly from external services:
  - **Moxfield** URL parsing and deck import
  - **Archidekt** URL parsing and deck import
  - Unified `importDeckFromUrl()` helper; error handling for unsupported or private decks
- `feat(profile): user accounts & deck sharing [US-02]` — extended user profile and public deck sharing:
  - **Profile page** with avatar, display name, and username (case-insensitive lookup)
  - **Deck sharing**: public/private toggle on decks; shareable `/share/[deckId]` link
  - **Username storage**: case-insensitive slug stored and resolved via profile API

### Added — 2026-03-27: Paginated Game Changers & Banlist page [US-01]

- `feat(rules): paginated Game Changers & Banlist page [US-01]` — dedicated rules reference page:
  - Paginated display of all Game Changer cards (bypasses Scryfall 175-card page limit)
  - Full Commander banlist with search and filter
  - Accessible at `/rules` route in main navigation

### Added — 2026-03-27: Mobile-responsive layout (#189)

- `feat: mobile-responsive layout — header hamburger menu, builder tab navigation, collection grid (#189)` — full mobile-first responsive redesign:
  - **Header**: hamburger menu for small screens, navigation links collapse into a mobile drawer
  - **Builder**: tab navigation for the 3-panel layout on mobile (Search / Editor / Stats)
  - **Collection**: responsive grid adapts columns to screen width

### Fixed — 2026-03-27: Profile username lookup and SonarCloud issues

- `fix(profile): case-insensitive username lookup and storage` — username lookups now normalised to lowercase at read and write time; prevents duplicate profiles differing only in casing
- `fix(auth): force Google account picker on every sign-in (#186)` — added `prompt: "select_account"` to Google OAuth provider so users can switch accounts without signing out first
- `fix(sonar): resolve deprecated Zod/React types and a11y warning (#184)` — updated Zod v3 API usage, fixed React type deprecations, resolved accessibility warning flagged by SonarCloud
- `fix(sonar): resolve 7 SonarCloud issues in auth and card components (#183)` — addressed 7 issues (dead code, type safety, async patterns) in auth helpers and card-related components

### Changed — 2026-03-27: Test coverage & docs

- `test: increase unit test coverage from 91% to 98% (#188)` — added tests for previously uncovered paths; 98% line coverage across all source files
- `docs: add database reset instructions to infrastructure.md (#187)` — step-by-step guide for resetting the Supabase database in dev and production environments
- `docs: split roadmap into Technical and Functional sections (#185)` — `docs/product/roadmap.md` restructured with separate Technical Roadmap and Functional Roadmap sections for clarity
- `chore(qa): update quality gate history — PR #192 merged (US-01) (#193)` — `docs/engineering/quality-gate.md` updated with metrics snapshot after US-01 merge
- `chore(qa): quality gate baseline and metrics tracking` — established baseline metrics snapshot in `docs/engineering/quality-gate.md` for ongoing Phase 10 tracking

### Added — 2026-03-26: NextAuth.js v5 Authentication (#181)

- `feat: NextAuth.js v5 authentication (Google OAuth + credentials)` — full multi-user auth system:
  - **Prisma models**: `User`, `Account`, `Session`, `VerificationToken` with Prisma adapter
  - **Providers**: Google OAuth + email/password (bcryptjs hashed, cost 12)
  - **JWT sessions** with `userId` propagated to all routes via callbacks
  - **Middleware** — page routes redirect to `/auth/signin`, API routes return 401
  - **Ownership enforcement** on all deck and collection API routes (`requireAuth()`, `requireDeckOwner()`)
  - **Sign-in / Sign-up pages** with Google button + email/password form, responsive design
  - **UserMenu** dropdown in Header (avatar, profile link, sign out)
  - **User profile API** — `GET/PATCH/DELETE /api/user/profile`
  - **Registration API** — `POST /api/auth/signup` with Zod validation, email normalization
  - **`userId` FK** on `Deck` and `CollectionCard` (nullable for backward compat)
  - **Public endpoints** preserved: `/api/share/*`, `/api/health`, `/api/auth/*`
  - **33 new unit tests** (helpers, signup, profile) — 880 total passing

### Fixed — 2026-03-26: cardFaces reconstruction on deck load (#179)

- `fix: reconstruct cardFaces from DB fields on deck load (#179)` — `loadDeck` now calls `rebuildCardFaces()` for every card after fetching from the API, ensuring MDFC/DFC flip data is correctly rebuilt from stored `name //` split + Scryfall image URLs when a deck is loaded or the page is refreshed

### Fixed — 2026-03-26: SonarCloud issues — batch (#168, #169, #170, #171)

- `fix: reduce cognitive complexity in CardFlip and useCardFlip (#168)` — extracted helpers to keep cyclomatic complexity below 15; avoids SonarCloud maintainability warnings
- `fix: resolve SonarCloud LOW issues across 16 files (#169)` — addressed 13 LOW-severity issues (unused variables, prefer-optional-chain, missing return types) flagged across the codebase
- `fix: resolve all 18 SonarCloud issues (1 HIGH, 4 MEDIUM, 13 LOW) (#170)` — batch fix clearing full SonarCloud backlog: removed dead code, fixed async patterns, corrected type annotations
- `fix: resolve remaining 3 SonarCloud issues (2 MEDIUM, 1 LOW) (#171)` — final pass on SonarCloud queue: addressed 2 MEDIUM (redundant null checks) and 1 LOW (missing accessibility attribute)

### Fixed — 2026-03-26: SonarCloud issues (#180)

- `fix: resolve 2 SonarCloud issues (1 MEDIUM, 1 LOW)` — S6582: use optional chain in `store.ts` instead of explicit undefined check; S6847: move event listeners from non-interactive `<dialog>` to interactive `<form>` in `CardNoteInline.tsx` for accessibility

### Changed — 2026-03-26: Bundle analyzer (#172)

- `chore: add @next/bundle-analyzer (#172)` — `@next/bundle-analyzer` added as dev dependency; `ANALYZE=true pnpm build` generates webpack bundle visualisations for `client.html`, `edge.html`, and `nodejs.html`

### Fixed — 2026-03-26: MDFC/DFC flip in search results & deck editor (#176, #178)

- `fix: MDFC/DFC cards not showing flip in search results (#176)` — the draggable code path in `CardGrid` computed `dfcFaces` but never passed `cardFaces` or `isFlexibleLand` to `CardImage`, so MDFC/DFC cards displayed as static single-face images in search results grid view
- `fix: MDFC/DFC flip missing in deck editor grid views (#178)` — `DeckEditor` had `cardFaces` data on each `DeckCard` but never passed it to `CardImage`; fixed in all 4 grid locations: commander, partner, main zone, sideboard/maybeboard; also added `rebuildCardFaces()` in store to reconstruct face data from DB-stored fields (name `//` split + Scryfall image URLs) so flip works after page reload

### Added — 2026-03-26: Search By Type tab (#174)

- `feat: add "By Type" search tab with card type checkboxes` — new search mode in builder alongside Name / By Set / By Color; 10 checkboxes in a 2-column grid (Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, DFC Transform); OR-joined Scryfall queries; optional name filter; `buildTypeSearchQuery()` + `CARD_TYPE_FILTERS` constant; 11 new tests

---

### Added — 2026-03-26: MDFC/DFC, SEO, Footer Fix

- `feat: MDFC/DFC support with 3D flip animation (#162)` — Modal Double-Faced Cards and transform cards with Moxfield-style 3D CSS flip animation, `CardFlip` component, `useCardFlip` hook, `isDfcLayout`/`isMdfcWithLandBack` utilities, flexible land detection, 20 new tests
- `feat: SEO optimization — robots.txt, sitemap, metadata, JSON-LD, OG image (#153)` — `robots.txt` blocking private routes, dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card, canonical), JSON-LD `SoftwareApplication` structured data, dynamic OG image via `/api/og` edge route
- `fix: align Shortcuts button inline with copyright in footer (#166)` — Shortcuts button is now inline with the copyright line in the footer instead of being on a separate row

---

### Added — 2026-03-26: Batch — Deck Snapshots, Playtest Mode, Maybeboard, Deck Annotations, Enhanced Stats, Advanced Filters

#### Deck Snapshots (#154)

- **`DeckSnapshot` Prisma model** — stores named versions of a deck (cardList JSON, commander, cardCount, createdAt)
- **API** — `GET/POST /api/decks/[id]/snapshots`, `DELETE /api/decks/[id]/snapshots/[snapshotId]`, `POST /api/decks/[id]/snapshots/[snapshotId]/restore` (transactional restore)
- **`snapshot-api.ts`** — typed client helper for snapshot operations
- **`SnapshotsPanel`** — collapsible save popover, versioned history list with diff badge (+/- cards vs current deck), restore and delete with confirmation

#### Playtest Mode (#152)

- **`usePlaytest` hook** — Fisher-Yates shuffle, `startPlaytest`, London mulligan, `drawCard`, `nextTurn` actions
- **`PlaytestModal`** — fullscreen overlay with fan hand display, card hover preview, library pile counter, and control buttons (Draw, Mulligan, Next Turn, End)
- **London mulligan** implemented — auto-keep all drawn cards for simplicity
- **Playtest button** (Dices icon) added to `DeckEditor` toolbar

#### Maybeboard (#155)

- **`isMaybeboard` field** on `DeckCard` Prisma model + migration
- **Store** — `addToMaybeboard`, `removeFromMaybeboard`, `moveToMaybeboard`, `moveToDeck` actions
- **API** — `POST /cards` and `PATCH /cards/:id` accept `isMaybeboard`
- **`MaybeboardPanel`** — list with Move to Deck / Remove actions per card
- **`CardListItem`** — Bookmark button to move card to Maybeboard (hover), In Maybeboard badge
- **`CardGrid`** — Maybeboard overlay badge + bookmark hover button
- **Stats** — maybeboard cards excluded from all totals (totalCards, price, mana curve)
- **Tests** — 20 new tests (8 stats exclusion + 12 store actions)

#### Deck Description, Card Notes & Tags (#156)

- **Deck description** — `description String?` on `Deck`; collapsible `DeckDescriptionEditor` textarea below deck name; first-line preview when collapsed; Ctrl+Enter to save, Esc to cancel; API sanitisation (max 2000 chars)
- **Card notes** — `notes String?` on `DeckCard`; `CardNoteInline` 📝 icon + inline popover per card; amber note preview below card name; exported as `// comment` in plain text format; API sanitisation (max 1000 chars)
- **Deck tags** — `tags String[]` on `Deck`; `DeckTagsEditor` pill UI with colour coding; suggestions: casual / cEDH / WIP / budget / tuned / theme; Tab autocompletes first suggestion; home page tag filter bar + clickable tag pills on deck cards; API sanitisation (trim + max 50 chars per tag)
- **51 new tests** — store-notes, export-notes, tags (111 total, all passing)

#### Enhanced Deck Statistics (#163)

- **Dual CMC rows** — `avgCmcWithLands` and `avgCmcWithoutLands` (non-land average); `avgCmc` kept as deprecated backward-compat alias
- **Turn 1 Playable** — count of cards with CMC ≤ 1 (castable turn 1)
- **Mana Alignment** — per-colour symbol ratio vs. land production ratio; flags colour imbalances (e.g. 48% blue symbols but only 30% blue mana produced); collapsible panel in DeckStats UI
- **`recommendedLandsByColor`** — per-colour land recommendations based on mana requirements
- **Hybrid pips** — counted as 0.5 toward each colour in symbol ratios
- **`MDFC_LAYOUTS` / `MANA_IMBALANCE_THRESHOLD`** constants extracted

#### Enhanced Search Filters (#161)

- **Color AND/OR/EXACT mode toggle** — _Any_ (OR, default), _All_ (AND), _Exact_ matching when 2+ colors selected
- **Colorless filter** (C symbol) — mutually exclusive with WUBRG, filters `c:c`
- **Lands toggle** — `t:land`, composable with color/colorless
- **CMC mode tabs** — Range / Exact / Min / Max with appropriate inputs
- **Price range** — `priceMin` + `priceMax` (`usd>=N` / `usd<=N`)
- **Subtype** — free-text → `t:<subtype>` (e.g. Elf, Dragon)
- **Keyword** — free-text → `keyword:<keyword>` (e.g. Flying, Trample)
- **Power/Toughness range** — shown only when Creature type selected
- **Interaction archetype** — Removal, Counterspell, Board Wipe, Tutor, Draw, Ramp presets
- **Filter presets** — save/load named filter configurations to `localStorage`
- **47 tests** in `search.test.ts` covering all new filter behaviors

### Documentation — 2026-03-26

- `chore: no changelog/progress/roadmap edits in feature branches (#164)` — policy documented in git workflow
- `chore: add documentation discipline rule to CLAUDE.md (#165)` — docs-only PRs mandated after each feature batch
- `docs: comprehensive MTG competitive landscape report (#159)` — competitive analysis added to docs
- `docs: add tournament decks import roadmap section (#158)` — MTGTop8, MTGDecks, Moxfield, EDHRec import plan
- `docs: add DX/CI-CD overview document (#150)` — CI pipeline and DX tooling documented

### Changed — 2026-03-26

- `chore(deps): bump production-dependencies group (#149)` — two production dependency bumps
- `chore(deps-dev): bump dev-dependencies group (#148)` — two dev dependency bumps
- `chore: restrict Dependabot to minor/patch updates only (#147)` — major version bumps now require manual review

### Added — 2026-03-26: MDFC / DFC Support with 3D Flip Animation

- **Modal Double-Faced Cards (MDFC)**: e.g. _Shatterskull Smashing // Shatterskull, the Hammer Pass_ — both faces display with a Moxfield-style 3D CSS flip animation (350ms `rotateY`)
- **Transform cards (DFC)**: e.g. _Delver of Secrets // Insectile Aberration_ — front face shown by default, flip button reveals back face
- **CardFlip component**: circular `↻` button overlay in bottom-right corner of card image (visible on hover), triggers 3D flip
- **CardListItem**: "Turn Over" outlined secondary button + `△▽` badge for DFC/MDFC cards
- **CardGrid**: passes `cardFaces`/`isFlexibleLand` props to `CardImage`
- **`CardFace` type** and `cardFaces?: [CardFace, CardFace]` field on `DeckCard`
- **`isFlexibleLand`** flag on MDFC cards with a Land back face (e.g. spell//land MDFCs)
- **`categorizeDfcCard()`**: categorizes by front face only — MDFCs with land backs are NOT classified as lands
- **`isDfcLayout()`, `isMdfcWithLandBack()`** utility functions in `categories.ts`
- **`buildCardFaces()`** in store — populates DFC fields when adding cards from Scryfall
- **`flexibleLands`** count in `DeckStats` — MDFCs with land back for mana-base flexibility display
- **`getCardImageUri()`** now accepts `face: "front" | "back"` parameter for per-face image fetching
- **`DFC_LAYOUTS`** constant (`modal_dfc`, `transform`, `reversible_card`, `double_faced_token`)
- **`useCardFlip` hook**: reusable flip state management for any component
- **CSS utilities**: `backface-hidden` and `preserve-3d` Tailwind `@utility` classes
- **Tests**: 20 new tests — `isDfcLayout`, `isMdfcWithLandBack`, `categorizeDfcCard`, CMC correctness, `useCardFlip` hook

### Added — feat/advanced-search-filters (2026-03-26)

- **Color AND/OR/EXACT mode toggle** — when 2+ colors selected, a "Match:" row appears:
  - _Any_ (OR, default): `id<=WUBRG` — cards within the selected color identity
  - _All_ (AND): `c>=WUBRG` — cards containing all selected colors
  - _Exact_: `c=WUBRG` — cards with precisely these colors, nothing more
- **Colorless filter** (C mana symbol) — filters truly colorless cards (`c:c`), mutually exclusive with WUBRG
- **Lands toggle** — filter to lands (`t:land`), composable with color/colorless filters
- **CMC mode tabs** — Range / Exact / Min / Max; each mode renders appropriate input(s)
- **Price range** — `priceMin` added alongside existing `priceMax` (`usd>=N`, `usd<=N`)
- **Subtype filter** — free-text → Scryfall `t:<subtype>` (e.g. Elf, Dragon)
- **Keyword filter** — free-text → Scryfall `keyword:<keyword>` (e.g. Flying, Trample)
- **Power/Toughness range** — min/max inputs for `pow>=` / `pow<=` / `tou>=` / `tou<=`, shown only when Creature type is selected
- **Interaction archetype dropdown** — Removal, Counterspell, Board Wipe, Tutor, Draw, Ramp → oracle-text Scryfall queries
- **Filter presets** — save/load named filter configurations to `localStorage` (`magicaibuilder:filter-presets`)
- New `SearchFilters` type fields: `colorMode`, `colorlessFilter`, `landFilter`, `cmcMode`, `cmcExact`, `priceMin`, `subtype`, `keyword`, `powerMin/Max`, `toughnessMin/Max`, `interactionType`
- New exported types: `ColorMode`, `CmcMode`, `InteractionType`
- New exported helpers: `buildInteractionQuery()`, `buildColorQuery()`
- `buildSearchQuery()` split into `buildCmcParts()`, `buildPriceParts()`, `buildPowerToughnessParts()` — cognitive complexity below 15
- All React sub-components (`TabButton`, `NumInput`, `SearchFilters`) have explicit `displayName`
- `PRESETS_STORAGE_KEY` named constant (no magic strings)
- docs/product/roadmap.md: "Enhanced deck-building filters" marked ✅ done
- 47 tests in `src/lib/scryfall/search.test.ts` covering all new filter behaviors

### Added — 2026-04-03: Text-only proxy mode and P/T fallback

- Proxy export modal now has a **Content: Card art / Text only** toggle
- Text-only mode skips Scryfall image preloading and prints readable oracle-text placeholders only
- DeckCard `power` / `toughness` fields added (Scryfall-backed) so P/T is always shown bottom-right on fallback proxies
- Prisma schema + migrations updated to persist power/toughness safely (idempotent deploy migrations)
- Deck API validation accepts `character_select` pairing type for TMNT “Partner — Character select” commanders
- SonarCloud issues (S7735, S6644, S6582) fixed in `ProxyExportModal` and `scryfall/name-index.ts`

### Fixed — 2026-04-02: DFC import + combo detection

- Name-index for Scryfall now maps front-face names (`A`) and full `A // B` strings to the same card
- Import from Moxfield and other deck sources correctly resolves MDFC/DFC names when hitting Scryfall’s collection API
- Commander Spellbook combo fetch stabilized (batching / retry) and now ignores Considering zone cards

### Fixed — 2026-04-02: Proxy export with Scryfall art

- Proxy export uses a Next.js API route to fetch Scryfall images server-side and embed them as data URLs (no more CORS failures)
- Progress indicator shows loaded/failed art count; failed images fall back to text-only card faces instead of blank slots
- Proxy placeholders upgraded: oracle text shown in a readable block, type line italicized, P/T badge rendered bottom-right when known

### Added — 2026-03-22: Grid density selector

- Deck grid view now has a density picker (2 / 3 / 4 / 6 / 8 columns) in the toolbar, visible in grid mode only
- Default changed from 4 → **6 columns**
- `deckGridCols` state + `setDeckGridCols` action added to deck store

### Added — 2026-03-22: Grid view for Sideboard and Maybeboard

- Sideboard and Considering tabs now support grid/list toggle with the same density selector as Main
- Hover overlay shows remove (×) and quick move (→M) buttons in grid mode

### Fixed — 2026-03-22: Add card respects active zone

- Clicking or drag-dropping a card while on Sideboard/Considering now adds it to the active zone instead of always Main
- `addCard()` accepts optional `zone` parameter (default: `"main"`)
- `activeZone` state lifted from `DeckEditor` to `BuilderPage`

### Fixed — 2026-03-22: Drag & drop cross-panel reliability

- `MeasuringStrategy.Always` on `DndContext` — drop targets remeasured continuously during drag
- `DroppableZone` wrapper on Sideboard and Maybeboard — visual highlight on hover + proper target detection
- `deck-panel-{zone}` droppable on the full deck panel as fallback

### Fixed — 2026-03-22: Commander/Partner clickable in grid view

- Commander and partner cards in grid view now open the printing selector on click (same as regular cards)
- Remove button has `stopPropagation` to avoid triggering the printing selector

### Added — 2026-03-22: Bracket 4 forced for infinite 2-card combos

- `scoreBracket()` now accepts `combos: SpellbookVariant[]` — if any combo is infinite and uses exactly 2 cards, bracket is forced to 4 (RC rule)
- New `twoCardInfiniteCombos` field on `BracketScore`
- Warning added: _"N infinite 2-card combo(s) detected — deck is Bracket 4 (RC rule)"_
- Red ∞ badge in `BracketIndicator`
- `useBracketScore(deck, combos)` — combos passed from `useCombos` in BuilderPage

### Added — 2026-03-21: SonarCloud CI

- `sonar-project.properties` — SonarCloud project config (sources, exclusions, coverage path)
- `.github/workflows/sonar.yml` — GitHub Actions: runs on push/PR to main, installs deps, runs coverage, uploads to SonarCloud

### Changed — 2026-03-21: pairing.ts refactor

- `src/lib/deck/pairing.ts` — `detectPairingType()` simplifié: helper `has()` extrait, double check em-dash supprimé

### Added — 2026-03-21: Remove Commander / Partner

- **✕ button on commander and partner** — hover in grid view (on the card image) or list view (next to the name) to remove
- **`clearCommander()`** action in DeckStore — removes both commander and partner, resets pairingType to "none"
- **`setPartner(null)`** removes only the partner without affecting the commander

### Fixed — 2026-03-21: Partner & Pairing Bugs

- **Partner search now filters by pairing type** — Character Select TMNT shows only other Character Select cards; generic Partner shows only Partner keyword cards (not Character Select)
- **Self-partner bug fixed** — if commander and partner have the same name (import artifact), the duplicate is hidden in grid and list view, and filtered out at hydration time
- **`clearCommander` clears partner too** — can't have a partner without a commander
- **`setCommander` clears self-partner** — if partner name equals commander name, partner is reset to null

### Added — 2026-03-21: TMNT Character Select Partner Type

- New `character_select` value in `CommanderPairingType` for TMNT "Partner—Character select" mechanic
- `detectPairingType()` detects `partner—character select` in oracle text
- `canPairWith()` only allows character_select + character_select (not with generic Partner)
- Partner button label shows "Character Select Partner" for these commanders

### Fixed — 2026-03-21: Partner Search Mode

- **Partner mode stays active** after selecting a partner (consistent with Commander mode behavior)
- **Partner button appears** next to Commander button when current commander supports a pairing type
- Partner mode and Commander mode are mutually exclusive

### Fixed — 2026-03-21: Color Identity with Partner

- `stats.ts` was only checking `commander.colorIdentity`, ignoring `partner.colorIdentity`
- Combined identity now used for violation checks — Tymna + Reyhan = 5-color

### Fixed — 2026-03-21: Import Formats

- Import parser now strips trailing `(SET) collector_number` suffix (Moxfield/Archidekt format)
- No Commander section required — works without it
- Handles promo suffixes: 123p, 123s, 123★

### Added — 2026-03-21: Set as Commander from Deck

- **Crown icon** on hover in list view → removes card from deck and sets it as commander
- **`promoteToCommander(cardId)`** action in DeckStore

### Fixed — 2026-03-21: Multiples Detection via Oracle Text

- `maxQuantity()` now reads oracle text for "a deck can have any number of cards named"
- Replaces hardcoded name list — works for any language and future cards automatically
- Nazgûl (×9) and Seven Dwarves (×7) remain as capped exceptions

### Fixed — 2026-03-21: Mana Symbols in Color Filter

- Color filter (Show Filters) now uses Scryfall SVG mana symbols instead of emoji

### Added — 2026-03-21: Card Quantity Editor

- **+/- quantity buttons** in list view (hover to reveal) — basic lands and Commander-legal multiples can be adjusted
- **`multiples.ts`** — encodes Commander multi-copy rules: Relentless Rats, Shadowborn Apostle, Persistent Petitioners, Nazgûl (max 9), Seven Dwarves (max 7), etc.
- **`addCard` now increments** quantity instead of silently blocking when a card allows multiples

### Added — 2026-03-21: Commander in Grid View + Build Fixes

- **Commander visible in grid view** — commander (and partner) now appear pinned first in the card grid with a gold ring and `CMD` badge
- **`updateDeckDescription`, `addTag`, `removeTag`** actions added to DeckStore
- **`PlaytestState`** type added to `types.ts`
- **`DeckSnapshot`** model added to Prisma schema
- **`description` / `tags`** fields added to Deck Prisma model + API
- **`shareToken` / `shareEnabled`** fields added to Prisma schema (were in migration but missing from schema)
- **Card PATCH route** now accepts `notes`, `scryfallId`, `imageUri`, `artCropUri`
- **Deck PATCH route** now accepts `description` and `tags`

### Fixed — 2026-03-21: Edition Picker + Import

- **Edition picker in list view** — hover a card in list view → Layers icon → opens printing selector; swaps `scryfallId` + image optimistically and persists to DB
- **Import dialog** now shows a clear error message when no deck is active instead of silently doing nothing
- **`analyzeAI` call signature** fixed (was passing a raw number instead of `BracketScore | null`)
- **`onRemoveCard` prop** added to `AISuggestionsPanel` usage
- **Duplicate init migration** (`20260321002006_init`) removed — was causing `P3018` errors on `prisma migrate reset`

### Added — feat/export-audit-fix: Export audit & companion support

- **Companion in all export formats** — companion card was silently dropped from every format; now included:
  - Plain Text / Moxfield: `Companion` / `// Companion` section before `Deck`
  - MTG Arena: `Companion` section (spec-compliant for Brawl/Standard companion import)
  - MTGO `.dek`: companion placed in `Sideboard="true"` element per MTGO convention
  - TappedOut: companion marked with `*SB*` tag
  - Archidekt: companion gets its own `Companion (1)` section
- **Manabox format** — added export support for Manabox (popular iOS/Android MTG collection app); Arena-compatible layout with Commander/Companion/Deck sections
- **ExportModal card count fix** — total card count in export modal preview now includes the companion

### Added — 2026-03-21: AI Builder Improvements

- **Streaming suggestions** — API now streams NDJSON events instead of blocking; cards appear one-by-one as they arrive
- **Full deck context** — prompt now sends ALL cards (removed 60-card cap), bracket dimension scores, detected themes, game changers list, and detected gaps
- **Cards to Remove** — AI now suggests 4 cards to CUT in addition to 8 cards to add (least synergistic / bracket-pushing cards)
- **Contextual prompt** — commander-specific synergy focus instead of generic staples, respects bracket targets
- **Remove from deck button** — "Cards to Cut" section in AISuggestionsPanel with a red remove button per card
- **Suggestion cache** — deck state hash prevents redundant API calls when deck hasn't changed
- **Streaming UX** — animated card entries, loading skeleton while waiting for first stream event, spinner in header

### Added — 2026-03-21: Collection Mode

- **CollectionCard Prisma model** — tracks owned cards with scryfallId, name, quantity, foil, condition, price, acquiredAt
- **Database migration** — 20260321140000_add_collection_card with unique index on (scryfallId, foil)
- **GET /api/collection** — list all collection cards
- **POST /api/collection** — add card (upserts by scryfallId+foil, increments quantity if exists)
- **PATCH /api/collection/[id]** — update quantity/condition/foil (quantity=0 auto-deletes)
- **DELETE /api/collection/[id]** — remove card from collection
- **collectionStore (Zustand)** — collectionCards + collectionCardsFoil maps; actions: addToCollection, removeFromCollection, updateQuantity, updateCondition, getTotalOwned
- **CollectionProvider** — loads collection from DB on app startup
- **/collection page** — grid/list view, search, stat cards (unique cards, total cards, total value), quantity controls
- **AddToCollectionDialog** — search for any card, set quantity/condition/foil, add to collection
- **CollectionBadge** — shows "In Collection (xN)" badge on search result cards (grid and list views)
- **DeckCardOwnershipBadge** — shows "Owned" or "Buy" badge on deck editor card list items
- **Collection filter** — "Show only collection cards" toggle in SearchFilters (only visible when collection is non-empty)
- **Header nav** — Collection link added next to My Decks

### Added — feat/deck-notes-description

#### Deck Description

- `prisma/schema.prisma` — `description String? @default("")` field on `Deck`
- `src/components/deck/DeckDescriptionEditor.tsx` — collapsible textarea below deck name; collapsed by default with first-line preview; supports Ctrl+Enter to save, Esc to cancel
- `src/lib/deck/store.ts` — `updateDeckDescription(deckId, description)` action with optimistic update
- `src/lib/db/deck-api.ts` — `description` field in `updateDeck()` patch type and `ApiDeck` type
- `src/app/api/decks/[id]/route.ts` — PATCH handler accepts and sanitizes `description` (max 2000 chars)

#### Card Notes

- `prisma/schema.prisma` — `notes String?` field on `DeckCard`
- `src/components/card/CardNoteInline.tsx` — 📝 icon on each card in list view; click opens inline textarea popover; note preview shown below card name when non-empty
- `src/components/card/CardListItem.tsx` — `showNotes` prop wires up `CardNoteInline`; note preview line in amber below card name
- `src/lib/deck/store.ts` — `updateCardNotes(cardId, notes)` action with optimistic update
- `src/lib/db/deck-api.ts` — `updateCardNotes()` function; `notes` field in `ApiDeckCard`
- `src/app/api/decks/[id]/cards/[cardId]/route.ts` — PATCH handler accepts `notes` (max 1000 chars)
- `src/lib/deck/export.ts` — `exportPlainText()` emits card notes as `// note` comment lines

#### Deck Tags

- `prisma/schema.prisma` — `tags String[] @default([])` field on `Deck`
- `src/components/deck/DeckTagsEditor.tsx` — pill tags with color coding; suggestions: casual / cEDH / WIP / budget / tuned / theme; Tab autocompletes first suggestion; X removes tag
- `src/lib/deck/store.ts` — `addTag(deckId, tag)` and `removeTag(deckId, tag)` with optimistic updates and deduplication guard
- `src/lib/db/deck-api.ts` — `tags` field in `updateDeck()` patch type and `ApiDeck` type
- `src/app/api/decks/[id]/route.ts` — PATCH handler accepts `tags` array with per-tag sanitization (trim + max 50 chars)
- `src/app/page.tsx` — tag filter bar on home page; tag pills on deck cards (clickable to filter); active tag highlighting

#### Migration & Tests

- `prisma/migrations/20260321140000_feat_deck_description_notes_tags/migration.sql` — ALTER TABLE adds description, tags, notes
- `__tests__/lib/deck/store-notes.test.ts` — 20 tests: updateDeckDescription, addTag, removeTag, updateCardNotes (with mocked deck-api)
- `__tests__/lib/deck/export-notes.test.ts` — 10 tests: note export as comments, edge cases (null/empty/whitespace notes)
- `__tests__/lib/deck/tags.test.ts` — 21 tests: normaliseTag, shouldAddTag, sanitiseTags, suggestions coverage
- **Total tests: 111 (all passing)**

### Fixed — 2026-03-21

- **Card tooltip position** — tooltip now follows the mouse cursor via `createPortal` instead of anchoring to the right edge of the full-width list item row (which landed it in the stats panel)

### Added — 2026-03-21: Oracle text in printing selector

- `src/components/card/PrintingSelectorModal.tsx` — two-column layout: oracle text panel (mana cost, type line, card text, price) on the left, printings grid on the right; handles double-faced cards via `card_faces[0]` fallback

### Changed — 2026-03-21: Mana symbols in color filter

- **By Color search** — remplacé les emojis (☀️💧💀🔥🌲) par les vrais SVGs officiels Scryfall (`svgs.scryfall.io/card-symbols/{W,U,B,R,G,C}.svg`); colorless intégré dans la liste principale

### Added — feat/set-search-all-sets

- **SetAutocomplete** — replaced static hardcoded list (~35 sets) with dynamic fetch from Scryfall `GET /sets`; filters to Commander-relevant set types (core, expansion, masters, commander…), sorted newest first, in-memory 1h cache
- **SetAutocomplete** — scroll container (max-h-64), year badge per set, loading spinner, "X sets available — type to search" footer hint

### Added — 2026-03-21: Legal & Documentation

- `src/components/layout/Footer.tsx` — legal footer component with WotC fan site policy + Scryfall disclaimer
- `LEGAL.md` — dedicated legal notices file at repo root (WotC trademarks, Scryfall data)
- `README.md` — Legal section added, links to LEGAL.md, banner image added at top
- `assets/banner.png` — updated banner image

### Added — 2026-03-21: Companion Support

- `src/lib/deck/types.ts` — `companion` field on `Deck` type (sideboard slot, outside the 99)
- Full Companion card support: stored separately, not counted in the 99, shown in builder

### Added — 2026-03-21: Inline Deck Rename

- `src/app/builder/[deckId]/page.tsx` — click deck name in title bar to edit inline (Enter to save, Escape to cancel)
- `src/lib/deck/store.ts` — `renameDeck(deckId, name)` action synced to DB via PATCH

### Added — 2026-03-21: Favicon, OG Image & Page Metadata

- `public/favicon.svg` — custom SVG favicon
- `public/og-image.svg` — Open Graph image (1200×630)
- `src/app/layout.tsx` — `icons`, `openGraph`, `keywords` metadata fields
- Page title template `%s | MagicAIBuilder`

### Added — 2026-03-21: Home Page Deck Card Art

- `src/app/page.tsx` — commander art crop shown as background on home deck cards

### Added — 2026-03-21: Search Mode Tabs

- `src/app/builder/[deckId]/page.tsx` — By Name / By Set / By Color mode tabs in search panel
- `src/components/search/SetAutocomplete.tsx` — set name autocomplete for set search
- `src/lib/scryfall/search.ts` — `buildSetSearchQuery()` and `buildColorSearchQuery()` builders

### Added — 2026-03-21: Card Printing Selector

- `src/components/card/PrintingSelectorModal.tsx` — modal to pick preferred art/printing before adding to deck
- Clicking a search result now opens the printing selector instead of adding the default print

### Added — 2026-03-21: Phase 4 — AI Suggestions

- `src/hooks/useAISuggestions.ts` — AI deck analysis hook (Anthropic/OpenAI with mock fallback)
- `src/components/deck/AISuggestionsPanel.tsx` — panel in stats column with analyze button + suggestions
- `src/app/api/ai/suggest/route.ts` — Next.js API route proxying AI provider calls
- Requires commander to be set before AI analysis is available

### Fixed — 2026-03-21: Security (#29)

- `next.config.ts` — upgrade Next.js to patch RCE CVE, restrict `images.remotePatterns` to Scryfall domains only, add `X-Content-Type-Options` / `X-Frame-Options` security headers
- `src/app/api/**` — input validation with Zod on all API routes, log sanitization to prevent log injection

### Added — 2026-03-21: Card Grid Hover Overlay (#28)

- `src/components/card/CardImage.tsx` — hover overlay shows card name, mana cost, and "+" add-to-deck indicator on search result grid cards
- `src/components/card/CardGrid.tsx` — overlay wired to grid items

### Added — 2026-03-21: Deck Grid View + Commander Hover Tooltip (#23)

- `src/components/deck/DeckEditor.tsx` — deck card grid view with card images (alongside existing list view)
- Commander card shows hover tooltip with full card details

### Added — 2026-03-21: Game Changer Toast Warning (#21)

- `src/lib/deck/store.ts` — `addCard` triggers toast notification when a Game Changer card is added
- `src/hooks/useToast.ts` — toast hook extended with GC-specific warning

### Added — Phase 3: Database & Prisma Integration

- `docker-compose.yml` — Postgres 16-alpine service
- `prisma/schema.prisma` — `Deck`, `DeckCard`, `CardCache` models
- `src/lib/db/prisma.ts` — PrismaClient singleton
- Full REST API: `GET/POST /api/decks`, `GET/PATCH/DELETE /api/decks/[id]`, card routes, cache routes
- `src/lib/db/deck-api.ts` — typed HTTP client
- `src/lib/deck/store.ts` — migrated from localStorage to DB sync with optimistic updates
- `docs/engineering/infrastructure.md` — full infra documentation

### Added — Phase 2: Intelligence Layer

- Commander pairing types (`pairingType` field: none / partner / friends-forever / etc.)
- `src/lib/deck/pairing.ts` — pairing type detection logic
- Combo detection via Commander Spellbook API (`useCombos`, `CombosPanel`)
- `src/hooks/useTheme.ts` — theme store (dark/light)
- `src/components/providers/ThemeSync.tsx` — syncs theme to `data-theme` on `<html>`
- Light theme CSS variables in `globals.css`
- Theme toggle in `Header`
- Delete deck action with confirmation

---

### Fixed — 2026-03-21

- **Hydration mismatch** — `suppressHydrationWarning` on `<html>` in `layout.tsx`; inline theme script sets `data-theme` before React hydration causing server/client attribute diff
- **removeCard HTTP 404** — `toDeckCard` in `loadDecks` was mapping `id: c.scryfallId` instead of `id: c.id` (DB CUID); DELETE sent wrong ID to API
- **Drag to empty deck** — `DroppableCategory` returned `null` when empty, unregistering dnd-kit droppable zones; fix: always render `<div ref={setNodeRef} />` to keep zone registered
- **Missing zod dependency** — `zod` was imported in API routes but not in `package.json`

---

### Changed — 2026-03-21

- Prisma upgraded from `^5.22.0` to `^6.19.2`; moved `prisma` CLI to devDependencies
- Next.js upgraded from `15.2.4` to `15.5.14`
- `.gitattributes` added for LF line ending normalization across Windows/Linux
- `src/app/layout.tsx` — `suppressHydrationWarning` on `<html>` element

---

### Added — Phase 1: Integration (feat/phase-1-integration)

#### Game Changers & Banlist Enrichment

- `useBanlist.ts` — new hook fetching `banned:commander` cards from Scryfall (24h cache)
- `useGameChangers.ts` — extended with `useGameChangersSet()` exposing `isGameChanger(name)` helper
- `EnrichmentProvider.tsx` — syncs GC and banlist Sets into Zustand store at startup
- `store.ts` — `addCard` and `setCommander` auto-mark `isGameChanger` and `isBanned`

#### dnd-kit Drag-and-Drop

- `DraggableCard.tsx` — search cards wrapped with `useDraggable` (8px activation distance)
- `DeckEditor.tsx` — category sections use `useDroppable` with visual highlight on drag-over
- `builder/[deckId]/page.tsx` — `DndContext` + `DragOverlay` wrapping entire page

#### Import UI

- `ImportDialog.tsx` — Radix Dialog, plain text format, Scryfall batch lookup

#### Color Distribution Chart

- `ColorDistribution.tsx` — CSS-only bar chart for W/U/B/R/G/C color pips

#### Commander Auto-Detection

- Commander mode toggle (Crown icon): filters search with `is:commander`, clicking sets commander

#### Grid/List View Toggle

- `SearchResults.tsx` + `DeckEditor.tsx` — grid/list toggle, persisted in Zustand store

---

### Added — Phase 1: Foundation Scaffold

#### Project Setup

- Next.js 15 App Router, TypeScript 5, Tailwind CSS 4, pnpm, ESLint 9 + Prettier 3
- Dark theme (CSS custom properties), MTG design tokens

#### Core Types, Scryfall Integration, Deck Logic, Hooks, Components

- Full details in `docs/project/progress.md`

---

## [0.1.0] — 2026-03-20

### Added

- Initial repository setup with README and project documentation
- Game Changers card list documentation (`docs/references/game-changers.md`)

[Unreleased]: https://github.com/KaelSensei/MagicAIBuilder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KaelSensei/MagicAIBuilder/releases/tag/v0.1.0
