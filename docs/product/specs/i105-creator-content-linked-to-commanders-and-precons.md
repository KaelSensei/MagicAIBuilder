# I-105: Creator Content Linked To Commanders And Precons

> **Initiative:** I-105, proposed for the [roadmap](../roadmap.md) · **Status:** Later — proposed 2026-11-19 · **Priority:** Later for every slice, behind [I-29](i29-cross-site-deck-index.md) slice 0's source register, [L-53](../legal-questions.md#l-53-listing-other-sites-content-from-public-feeds-and-youtube) and owner decision D-102 · **Paid:** never · **Written 2026-11-19**
> **Placement:** the content side of the cross-site indexer. [I-29](i29-cross-site-deck-index.md) indexes decks from other sites; I-105 indexes the deck techs, upgrade guides, primers and podcast episodes other people publish about a commander or a precon, and links out to each. [I-36](i36-creator-and-embed-toolkit.md) owns video attached to a deck on this site (primers with video, embeds, the creator page); [I-72](i72-growth-loops-referrals-creators-and-return.md) owns the creator programme and verified links; [I-54](i54-find-your-next-commander.md) owns commander signals and their next steps. I-105 adds a dated, attributed list of outside content and never hosts, summarises or ranks it.
> **Research:** one dated note of 2026-11-19 (angle R2), not committed, so every external fact links its entry in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) and to [L-53](../legal-questions.md#l-53-listing-other-sites-content-from-public-feeds-and-youtube).
> **Owns:** the content source register entries (as I-29 `SourcePolicy` records), the feed reader, the `ContentItem` and `ContentLink` records, the matcher from an item to a commander or a precon, the content list on a commander and a precon, creator submissions through verified links, and removal on opt-out. **Does not own:** the source register's shape (I-29 slice 0); video players and primer timestamps (I-36); verified links (I-72 5.1); commander names and aliases (I-67); precon identities (I-17); the commander page itself (I-08, I-34, I-54); notice and action (I-38, I-69); the index policy (I-34).

**Proposed changes to neighbours, for the integrator:**

| Initiative | Change                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-36       | A non-goal line: a cross-site list of outside content per commander or precon belongs to I-105. I-36 keeps video on this site's decks; I-105 reuses I-36 4.4's timestamp syntax for creator submissions. |
| I-29       | The source register gains content sources (EDHREC's articles feed, Draftsim's feed, The Command Zone's podcast feed) as `SourcePolicy` records with `tier` `linkOut`, read by I-105.                     |
| I-54       | Requirement 3.7's next steps may add "Videos and articles about this commander" once I-105 slice 4 exists.                                                                                               |
| I-17       | The precon page, once it exists, shows I-105's content list for that precon.                                                                                                                             |
| I-72       | A creator with a verified link (5.1) may attach their own content to a commander, a precon or a public deck through I-105 slice 5. No ranking, featuring or payment (5.4).                               |

## Overview

A player who has picked a commander or bought a precon wants to know how it plays and how to upgrade it. That content exists and is dated: The Command Zone's podcast feed published four Star Trek precon upgrade-guide episodes between 2026-10-29 and 2026-11-13 [3]; EDHREC's articles feed carried "Jurati, Cordial Queen | Artifact Tokens Aggro" and "Jace, Multiverse Architect | A $50 Upgrade for Multiverse Reforged" on 2026-11-19, each title starting with the commander's name [1]; Draftsim's feed publishes rules explainers and value reports [2]. A player finds it today by searching YouTube, podcast apps and several article sites.

No site read on 2026-11-19 lists that content by commander or precon across sources. EDHREC's commander JSON for Atraxa has an `articles` panel holding two EDHREC articles and nothing from another source [4]; Library of Leng reports "237,891 articles indexed", organised by date, site and author, with no commander organisation and no video or podcast [5]; metagame.info's Commander page filters by kind and format, not by commander [6]. The owner's ambition to be the largest cross-site Commander indexer covers decks today (I-29), not the content players learn from.

This initiative adds a dated list of links to other people's content on a commander and on a precon in I-17's catalogue: each item shows its kind, source, author and date, credits its maker and opens the source. Sources are reviewed records in I-29's register; a creator with a verified link can attach their own work; nothing is hosted, summarised or ranked.

**Why a new initiative.** No file owns outside content per commander. I-29 indexes decks; I-36 attaches video to a deck on this site; I-68 quotes podcasts inside its own guides; I-54's next steps link Scryfall, EDHREC's commander page and the precon. **Why Later.** Each source's terms and YouTube's API policies are questions for the lawyer (L-53), the register's shape is I-29 slice 0, and no player request for this list was found on r/EDH: the case rests on the supply, the gap and the owner's indexer ambition, so confidence is Low under the twelfth pass's words.

## What the market does

All rows were read on 2026-11-19.

| Product or source                           | What it does or says                                                                                                                                                                                                                                                                                           | Source |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **EDHREC articles feed**                    | RSS, 10 newest items dated 2026-11-18 and 2026-11-19; deck-tech titles start with the commander's name before " \| " (verified); categories such as "Deck Techs", "Precon" and "upgraded precon" (reported by the R2 reading). `robots.txt` disallows `/articles/embed/` and `/articles/preview`, not the feed | [1]    |
| **Draftsim feed**                           | RSS, 10 items, newest 2026-11-18, including "MTG Value Report: The Dune Secret Lair" and rules explainers                                                                                                                                                                                                      | [2]    |
| **The Command Zone podcast feed**           | 825 episodes; Star Trek precon upgrade guides #771 (2026-10-29), #773 (2026-11-05), #774 (2026-11-10), #775 (2026-11-13)                                                                                                                                                                                       | [3]    |
| **EDHREC commander page**                   | An `articles` panel with EDHREC's own articles only (two for Atraxa, dated 2026-10-28 and 2026-09-07)                                                                                                                                                                                                          | [4]    |
| **Library of Leng**                         | "237,891 articles indexed", by date, site and author; no commander, video or podcast                                                                                                                                                                                                                           | [5]    |
| **metagame.info**                           | Commander page filtered by "all, article, spoiler, tournament, deck, author"; no commander filter visible                                                                                                                                                                                                      | [6]    |
| **YouTube API Services Developer Policies** | Stored data deleted or refreshed after 30 days (III.E.4.c); no single attribution for results from several sources (III.F.2.a); no aggregation of API data except per channel (III.E.2.a); results not merged and presented as YouTube search (III.C.5)                                                        | [7]    |
| **Scryfall**                                | `preview.source` and `preview.source_uri` join a new card to the creator or outlet that previewed it, with a date                                                                                                                                                                                              | [8]    |
| **This product**                            | Public primers render Markdown headings, lists and links (`PublicDeckPrimer.tsx`); `/commanders/[slug]/decks` lists public decks only; no outbound content link and no feed reader                                                                                                                             | code   |

**The gap.** Content about a commander or a precon is published on dated, machine-readable feeds, and no site joins it to the commander or precon across sources. The one deckbuilding data site with an articles panel lists only its own articles.

## Current state in this codebase

Verified on `dev` at `045f4992` (#1578) on 2026-11-19:

- **Commander route.** `src/app/[locale]/commanders/[slug]/decks/` is the only commander route: a list of public decks ordered by community votes. There is no commander summary page ([I-54](i54-find-your-next-commander.md) current state).
- **Primers.** `src/components/profile/PublicDeckPrimer.tsx` renders a public primer's Markdown; I-36 plans video and timestamps inside primers.
- **No feed reader.** A search of `src` for RSS, Atom and podcast finds only a font README.
- **No precon catalogue.** I-17 slice 1 plans it; no model exists.

**Owning context** in the target layout (`docs/engineering/architecture.md`): `meta-insights` for the feed readers, beside its existing outside providers; `community` for the content list on the commander page and creator submissions; the source register stays I-29's.

## Functional requirements

### 1. Principles

1.1 A list links out. It shows the title and the description a feed publishes, within each source's policy, and never reproduces article text, transcripts or a model-written summary.
1.2 Every item credits its source and author by name and links to the original.
1.3 The order is the date, newest first, or a grouping by kind. Never views, popularity or who the creator is.

### 2. Sources

2.1 Each source is a reviewed `SourcePolicy` record in I-29's register: feed URL, terms URL and the date read, the fields that may be shown, the refresh interval, and `tier` `linkOut`.
2.2 The first sources, after L-53: EDHREC's articles feed, Draftsim's feed and The Command Zone's podcast feed. Reddit is not a source: it refuses automated reads, and its data terms were not reviewed.
2.3 A source removed from the register, or a creator's opt-out, removes its items from every list at the next daily run.

### 3. Items and matching

3.1 A daily run reads each feed into `ContentItem` (source, url, title, author, publishedAt, kind, fetchedAt). A broken feed leaves yesterday's items; the run is atomic per source.
3.2 Kinds: deck tech, upgrade guide, primer, podcast episode, rules explainer, and a card's official preview (from Scryfall's `preview.source_uri`).
3.3 The matcher attaches an item to a commander or a precon only on an exact match: the commander's name or an alias from [I-67](i67-one-card-data-pipeline.md), a precon name from I-17, the title prefix before " | ", or a feed category. Anything else attaches to nothing.
3.4 The matcher's precision is measured on an owner-labelled fixture, and a list is shown only while precision stays at or above the floor the owner sets (D-102).

### 4. The content list

4.1 A commander page and a precon page show the list, signed out, newest first: title, kind, source, author and date, opening the source in a new tab. No view count.
4.2 A link-only source shows no image, excerpt or text beyond the title.
4.3 The list is `noindex` until [I-34](i34-commander-data-reports.md)'s index policy says otherwise.

### 5. Creator submissions

5.1 A creator with a verified link ([I-72](i72-growth-loops-referrals-creators-and-return.md) 5.1) may attach a video or an article to a commander, a precon or one of their public decks, with timestamps in [I-36](i36-creator-and-embed-toolkit.md) 4.4's syntax. It appears labelled "Added by the creator".
5.2 An operator can remove a submission through [I-69](i69-operator-console-support-moderation-and-kill-switches.md); a takedown follows [I-38](i38-trust-safety-and-user-rights.md)'s notice and action.
5.3 A YouTube item is read through oEmbed from a creator's own submission, or through the Data API with the 30-day refresh, after L-53 (slice 6).

### 6. Free and paid

| Part                                   | Free | Paid candidate | Why                                                                                                                                                  |
| -------------------------------------- | ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content lists, submissions and removal | Yes  | —              | Content stays free under [I-30](i30-business-model-and-paid-tier.md)'s "content free, tools paid", and creators get traffic, which feeds I-72's loop |

## Data model / API

```
ContentSource   = I-29 SourcePolicy with tier linkOut, feedUrl, refreshHours, shownFields[]
ContentKind     deckTech | upgradeGuide | primer | podcastEpisode | rulesExplainer | officialPreview
ContentItem     id, sourceId, url, title, author?, publishedAt, kind, fetchedAt, submittedByUserId?
ContentLink     itemId, target: commander{oracleId} | precon{preconId} | deck{deckId}, matchedBy (alias | titlePrefix | category | creator)
```

- `ContentKind` and the link target are discriminated unions with exhaustive `never` guards. The matcher is a pure function with an owner-labelled fixture.
- A run replaces one source's items in one Prisma transaction; a failed read leaves the previous set.
- Routes: `GET /api/commanders/[slug]/content`, `GET /api/precons/[id]/content`, `POST /api/content/submissions` (verified creators only). The daily run uses [I-63](i63-one-notification-system.md)'s job route or I-67's runner.

## Non-goals

- Hosting, transcoding or auto-playing third-party video. [I-36](i36-creator-and-embed-toolkit.md)'s click-to-load video blocks stay the only player, and video attached to this site's decks stays I-36's.
- Reproducing article text or transcripts, or summaries written by a model.
- Ranking creators, featured slots, paid placement or affiliate splits (I-36 and I-72 non-goals).
- Scraping sites that forbid it (Moxfield, Archidekt; the roadmap's risks table).
- A news feed, spoiler news or a public release calendar ([I-73](i73-every-set-release-ready-on-day-one.md) non-goal).
- Comments on content items.
- Presenting YouTube results as YouTube search (III.C.5).
- Hosting articles or sending newsletters for creators (rejected in the eighteenth pass).

## Testing strategy

- **Matcher (solitary):** "Jurati, Cordial Queen | Artifact Tokens Aggro" attaches to Jurati; a title that names no commander or precon exactly attaches to nothing; an alias from I-67 matches; a category "Precon" with a precon name matches the precon; precision on the labelled fixture is reported.
- **Reader (sociable, with an in-memory feed fake and its contract suite):** a malformed feed leaves yesterday's items; a removed source empties its items at the next run; a link-only source stores no image or excerpt.
- **List:** newest first; no view count; a new tab with `rel="noopener"`; `noindex` header present.
- **Submissions:** an unverified account is refused; a verified creator's item shows "Added by the creator"; an operator removal hides it at once.
- **Accessibility and layout:** each item's link names its title and source; at 360 px the list stacks.
- **Red first:** each slice starts with one failing test the PR records, as [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md) requires. Slice 3's first Red: an item titled "Jurati, Cordial Queen | Artifact Tokens Aggro" yields one `ContentLink` to Jurati's Oracle ID.

## Delivery slices

| #   | Slice                                                                                                                                           | Depends on                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0   | Owner: launch sources, the matcher's precision floor, YouTube route (oEmbed or Data API), indexable or not, opt-out speed (D-102); lawyer: L-53 | — (owner, lawyer)                    |
| 1   | Content sources as reviewed `SourcePolicy` data: EDHREC, Draftsim and The Command Zone, each with its terms URL and read date; no reader        | I-29 slice 0; L-53                   |
| 2   | Feed reader, `ContentItem`, a daily atomic run per source; no display                                                                           | 1; I-63's job route or I-67's runner |
| 3   | Matcher with I-67 aliases, I-17 precon names, title prefixes and categories; `ContentLink`; the labelled fixture and its precision test         | 2; I-67 slice 2; I-17 slice 1        |
| 4   | The content list on the commander page and on I-17's precon page, signed out, newest first, link-out, `noindex`; English and French             | 3; D-102                             |
| 5   | Creator submissions through verified links, I-36's timestamp syntax, operator removal in I-69                                                   | 4; I-72 5.1; I-69                    |
| 6   | YouTube metadata through oEmbed or the Data API with the 30-day refresh                                                                         | 5; L-53 (b)                          |

No slice can start now. Scheduled agents must not pick slice 0 (the owner's and the lawyer's), or any slice before L-53 and D-102 are answered.

## Open questions

1. **D-102.** Which sources at launch; the matcher's precision floor; YouTube through creator submissions with oEmbed, or the Data API; should content lists be indexable; how fast an opt-out applies. Recommended: the three feeds above, a floor of 0.95 because a wrong commander is worse than a missing item, creator-submitted YouTube links only, `noindex` until I-34 decides, and removal at the next daily run.
2. **L-53.** Is listing a title, author, date and link from a public RSS feed within each source's terms, and what do YouTube's policies require of a list that mixes sources? For the lawyer.
3. **French sources.** Which French creators publish feeds, and does [I-11](i11-localization-and-regional-experience.md) route them to French players first? Recommended: list them in slice 1's register when found; no routing in version 1.
4. **The commander page.** I-105 needs a commander page to live on. Recommended: start on `/commanders/[slug]/decks` as a second section, and move with the page when I-54 or I-34 builds a summary.

## Sources

Read on 2026-11-19 with the User-Agent `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`.

1. EDHREC, articles feed (`application/rss+xml`); titles and dates verified on 2026-11-19. <https://edhrec.com/articles/feed>
2. Draftsim, feed. <https://draftsim.com/feed/>
3. The Command Zone, podcast feed. <https://feeds.megaphone.fm/STU7163382979>
4. EDHREC, commander JSON for Atraxa, Praetors' Voice, `articles` panel. <https://json.edhrec.com/pages/commanders/atraxa-praetors-voice.json>
5. Library of Leng. <https://library-of-leng.com/>
6. metagame.info, Commander. <https://metagame.info/en-us/mtg/commander>
7. Google, YouTube API Services Developer Policies, III.C.5, III.E.2.a, III.E.4.c and III.F.2.a (the page shows no revision date). <https://developers.google.com/youtube/terms/developer-policies>
8. Scryfall API, card objects, `preview.source`, `preview.source_uri` and `preview.previewed_at`. <https://scryfall.com/docs/api/cards>
9. r/EDH (Arctic Shift snapshots): "[PRIMER] Dragonhawk is a fantastic mix of card advantage and raw damage…", 2026-10-15, 148 points, 84 comments, <https://www.reddit.com/r/EDH/comments/1x6kdfv/>; "What deck have you written a primer for?", 2026-09-22, 57 points, 82 comments, <https://www.reddit.com/r/EDH/comments/1wner45/>. Supply, not requests: the highest "deck tech" title in the windows read scored 21 points and asked no question about finding content.

## Feature contract (Full, 2026-11-19)

The roadmap entry is a link. This section is the player contract. The engineering slices above stay the build plan.

### Summary and problem

A player who has chosen a commander or bought a precon has to search YouTube, podcast apps and several article sites to learn how it plays or how to upgrade it. No site read lists that content by commander or precon across sources, and EDHREC's commander pages link only EDHREC's own articles.

### Goals

- On a commander, and on a precon in I-17's catalogue, a player sees a dated list of links to other people's deck techs, upgrade guides, primers and podcast episodes about it, each crediting its source and author.
- Each source is a reviewed record with its terms and read date; a removed source or an opted-out creator disappears at the next run.
- A creator with a verified link attaches their own work to the commander, precon or public deck it covers.

### Non-goals

- Hosting or summarising content, ranking creators, paid placement, scraping, spoiler news, comments, or presenting YouTube results as YouTube search.

### Personas

The casual pod player learning a new commander or precon; the content creator who wants to be found and credited; the bracket-focused player looking for a guide beside [I-28](i28-commander-deckbuilding-guide-by-bracket.md). See the roadmap persona table.

### User stories

#### US-105-01

As a player who picked a commander, I want the deck techs, primers and podcast episodes about it in one dated list, so that I can learn how it plays without searching five sites.

#### US-105-02

As a player who bought a precon, I want the upgrade guides published for that exact deck, with their dates, so that I can compare advice before I change my list.

#### US-105-03

As a creator, I want to attach my video, with timestamps, to the commander and the public deck it covers, so that players who look up that commander find my work and the link credits me.

#### US-105-04

As a signed-out visitor, I want to read the list without an account, so that the content is as open as the sources it links.

#### US-105-05

As a player using a keyboard or a screen reader, I want each link to name its title and its source, so that I know where it goes before I open it.

### Acceptance criteria

#### AC-105-01 Happy path

Given a commander with three matched items from two sources
When a signed-out visitor opens its content list
Then each item shows its title, kind, source, author and date, opens the source in a new tab, the list is newest first, and no item shows a view count

#### AC-105-02 Error and failure

Given a source's feed fails to parse
When the daily run completes
Then that source's items from the previous run stay, the other sources update, and the run records the failure for the operator

#### AC-105-03 Edge cases

Given an item whose title and categories match no commander name, alias or precon name exactly
When the matcher runs
Then the item attaches to nothing and appears on no list

#### AC-105-04 Guest and signed-in

Given the rollout
When a guest and a signed-in player open the same commander
Then both see the same list; only a signed-in creator with a verified link sees "Add your content"

#### AC-105-05 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When this feature adds a user-facing string
Then only `en` and `fr` are routed, and the other eight keep key parity with `en` and may reuse the English text until a person reviews them; item titles stay in the source's language

#### AC-105-06 Accessibility

Given a keyboard, a visible focus and a screen reader
When the player moves through the list without a pointer
Then each link's name includes its title and source, it is announced as opening a new tab, and the kind is a word, not a colour

#### AC-105-07 Link-only source

Given a source whose policy is link-only
When its item renders
Then no image, excerpt or text beyond the feed's title appears

#### AC-105-08 Removal

Given a source removed from the register or a creator's opt-out
When the next daily run completes
Then its items are gone from every list

### UX flow and states

A commander page and a precon page gain a section "Videos, articles and podcasts", folded by kind, newest first. A verified creator sees "Add your content", which takes a URL, a target and optional timestamps.

- Empty: "No linked content yet" with no call to action for players.
- Loading: a busy state that keeps the layout still.
- Error: the list from the last good run, with its date.
- Partial: a source that failed today shows yesterday's items, and the section says so.

### Data model and API

The types in [Data model / API](#data-model--api). Two tables and the register's records; three routes.

### Analytics and telemetry

`content_list_viewed {targetKind, itemCount}`, `content_item_opened {kind}`. Reserved for I-39's store; not emitted before that store exists. Counts and enums only: no email, name, username, deck name, card name, source name, title or URL.

### Rollout and feature flags

Slices 1 to 3 are invisible. Slice 4 ships behind an I-69 switch, `community.creatorContent`, off until D-102 is committed and L-53 is answered, then on for guests and signed-in players alike. The switch also hides every list at once if a source objects.

### Dependencies

[I-29](i29-cross-site-deck-index.md) slice 0 (the `SourcePolicy` shape); [I-67](i67-one-card-data-pipeline.md) slice 2 (commander names and aliases); [I-17](i17-precon-path-and-tiered-upgrades.md) slice 1 (precon identities); [I-54](i54-find-your-next-commander.md), [I-34](i34-commander-data-reports.md) or [I-08](i08-share-compare-and-learn.md) for the commander page; [I-72](i72-growth-loops-referrals-creators-and-return.md) 5.1, [I-36](i36-creator-and-embed-toolkit.md) 4.4, [I-69](i69-operator-console-support-moderation-and-kill-switches.md) and [I-38](i38-trust-safety-and-user-rights.md) for submissions and removal; L-53 and D-102.

### Risks and mitigations

- **A source's terms.** A feed may be readable but not reusable. Mitigation: L-53 before slice 1, a `SourcePolicy` per source with its read date, link-only by default, and the I-69 switch.
- **Matcher precision.** A deck tech attached to the wrong commander misleads. Mitigation: exact matches only, an owner-labelled fixture and a floor below which no list shows.
- **Link rot.** Old items point nowhere. Mitigation: the daily run drops items a feed no longer lists after the source's own retention, and a broken link is reportable.

### Kill criteria

None. This initiative is not in the Now band. Stop it if L-53's answer forbids listing titles and links from the launch sources.

### Open questions

See [Open questions](#open-questions) above: D-102, L-53, French sources and the commander page.

### Sources

See [Sources](#sources) above.

## Expanded scenarios

#### US-105-101 A precon's upgrade guides in release week

As a player who just opened a Star Trek precon, I want that week's upgrade guides listed with their dates, so that I see the advice while it is current.

#### AC-105-100 Happy path

Given The Command Zone's episodes #771, #773, #774 and #775 and a precon catalogue with the four Star Trek decks
When the matcher runs on titles that name each deck
Then each precon lists its own episode, dated, linking to the feed's episode URL

#### AC-105-101 Failure

Given an episode title that names two decks
When the matcher runs
Then the episode attaches to both decks only when each name matches exactly, and to neither otherwise

#### AC-105-102 Edge

Given an upgrade-guide article whose title names a commander that is also a precon's face commander
When the matcher runs
Then the item attaches to the commander, and to the precon only when the precon's name or category matches too

#### US-105-102 A creator's own submission

As a creator, I want to attach my deck tech to the public deck it shows, so that the deck page and the commander page both credit it.

#### AC-105-103 Happy path

Given a creator with a verified YouTube channel
When they submit a video URL for their public deck with a `{t=12:30}` section
Then the deck and its commander list the video as "Added by the creator", with "Watch from 12:30" on the deck page

#### AC-105-104 Failure

Given an account with no verified link
When it submits a URL
Then the submission is refused with a catalogue message, and nothing is stored

#### AC-105-105 Edge

Given an operator removes a submission
When any page renders the list
Then the item is gone from every list at once, and the creator sees why in their account

### UX states for this feature

| State            | What the player sees                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Empty            | "No linked content yet".                                                                                |
| Loading          | A busy state that keeps the layout still.                                                               |
| Error            | The last good list with its date.                                                                       |
| Partial          | A failed source's items from the last run, labelled.                                                    |
| Stale            | The list's run date when it is more than two days old.                                                  |
| Guest            | The full list; no submission control.                                                                   |
| Signed-in        | The same list; a verified creator also sees "Add your content".                                         |
| English          | New controls use the `en` catalogue; titles stay in the source's language.                              |
| French           | New controls use the `fr` catalogue; titles stay in the source's language.                              |
| Dormant catalogs | The eight other catalogs keep every new key and may reuse the English text until a person reviews them. |
| Keyboard         | Every link and the kind filter can be reached without a pointer.                                        |
| Screen reader    | Title, source, date and "opens in a new tab" are announced.                                             |
| Colour           | Kinds differ by a word and an icon as well as hue, in both themes.                                      |
| Success          | A creator's submission is confirmed with the targets it attached to.                                    |

### Alternate paths

- A creator asks to be removed. Their submissions and their feed's items disappear at the next run, and the source register records the opt-out with its date.
- A source changes its feed URL. The run fails for that source, the list keeps the last items, and the operator updates the register.
- The player switches locale mid-flow. Chrome switches; titles stay in the source's language.

### Roadmap record (2026-11-19)

This file is the record from the start; nothing was moved from the roadmap, whose row for I-105 is a link here.

## I-105: Creator Content Linked To Commanders And Precons

**Outcome:** a player who has picked a commander or bought a precon sees a dated list of links to the deck techs, upgrade guides, primers and podcast episodes other people published about it, each crediting its source and author and opening the original; sources are reviewed records, creators with a verified link can attach their own work, and nothing is hosted, summarised or ranked.

**Status:** Later
**Priority:** Later for every slice, behind I-29 slice 0, L-53 and D-102. Never paid.
**Impact / effort:** Medium / medium
**Risk:** Medium. Each source's terms, the matcher's precision and link rot; the register, an exact matcher with a floor and the I-69 switch answer them.
**Depends on:** I-29 slice 0 and L-53 for slice 1; I-67 slice 2 and I-17 slice 1 for slice 3; D-102 for slice 4; I-72 5.1 and I-69 for slice 5.

EDHREC's feed titles start with the commander's name, The Command Zone published four Star Trek precon upgrade guides in two weeks, and Draftsim publishes rules explainers on a feed. EDHREC's commander page lists only its own articles, Library of Leng indexes 237,891 articles with no commander organisation, and no per-commander index across videos, podcasts and articles was found. No r/EDH request for one was found either, so confidence is Low.

### Scope

- [ ] Content sources as reviewed `SourcePolicy` records (slice 1, after L-53).
- [ ] The feed reader with an atomic daily run (slice 2); the exact matcher with its labelled fixture (slice 3).
- [ ] The content list on the commander and precon pages, signed out, `noindex` (slice 4, after D-102).
- [ ] Later: creator submissions with timestamps and operator removal (slice 5); YouTube metadata with the 30-day refresh (slice 6).

### Engineering enablers

- `ContentKind` and the link target are discriminated unions with exhaustive `never` guards; the matcher is a pure function.
- Feed readers get a hand-written in-memory fake and one shared contract suite (ADR 0005).
- One transaction per source per run.

**Paid-tier angle:** none. Content stays free, and creators' traffic feeds I-72.

### Enrichment (2026-11-19)

**User story.** As a player who picked a commander, I want the deck techs and podcast episodes about it in one dated list, so that I learn how it plays without searching five sites.

**Acceptance.**

- Three matched items from two sources show title, kind, source, author and date, newest first, with no view count.
- An item matching no commander exactly attaches to nothing.
- A removed source's items are gone after the next run.
- A link-only source shows no image or excerpt.

**UX.** A "Videos, articles and podcasts" section on the commander and precon pages; "Add your content" for verified creators.

**Data and API.** `ContentItem`, `ContentLink` and I-29's register; three routes; a daily run.

**i18n and access.** English and French chrome; titles stay in the source's language. Links name their title and source.

**Telemetry.** `content_list_viewed {targetKind, itemCount}`, `content_item_opened {kind}`. Reserved for I-39.

**Rollout.** `community.creatorContent`, off until D-102 and L-53.

**Open questions.** D-102; L-53; French sources; the commander page.

### Definition of done

A signed-out visitor opens a commander with deck techs on EDHREC's feed and an episode on The Command Zone's feed, sees each item with its kind, source, author and date, newest first, opens one in a new tab, and sees no view count; a precon page lists its own upgrade guides; a verified creator attaches a video with a timestamp to a public deck; removing a source empties its items at the next run.

---
