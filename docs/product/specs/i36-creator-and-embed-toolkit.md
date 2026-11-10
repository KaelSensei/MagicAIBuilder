# I-36: Creator And Embed Toolkit

> **Initiative:** I-36, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Later; slices 1 and 2 Next since 2026-11-10, because slices of I-46, I-50, I-53, I-55 and I-60 wait for them · **Written 2026-11-09**
> **Research:** dated notes on creator tooling, the growth of reference sites, player demand and monetization (2026-11-09). They are not committed, so every external fact below cites a numbered entry in [Sources](#sources). Legal points are research, not legal advice.
> **Owns:** deck embeds, shareable deck images, video and card links in primers, the creator page, fork attribution outside the deck page, the public read endpoints of `/api/v1` and their terms, and view counts. **Does not own:** deck visibility, forking policy, the primer template, comments and moderation ([I-08](../roadmap.md#i-08-share-compare-and-learn)); the playtester and its hand-hidden view ([I-07](../roadmap.md#i-07-playtest-and-iteration)); owner-scoped API endpoints, import and export ([I-10](../roadmap.md#i-10-interoperability-and-integrations)); the verification endpoint ([I-22](i22-verification-as-a-public-surface.md)); Discord commands ([I-23](i23-the-pods-own-surface.md)); search across all public decks ([I-29](i29-cross-site-deck-index.md)); data report pages ([I-34](i34-commander-data-reports.md)); the primer editor's layout ([I-37](i37-editor-depth.md)); the paid tier's price and gating ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

Reference sites in this category grew because other people linked to them, and habit kept the players who came: direct visits were 47% of TappedOut's traffic and 79% of Archidekt's in September 2026, by Semrush estimates [1], [2]. This initiative makes MagicAIBuilder the link a creator, a community and a developer choose to post.

It passes three tests. A creator pastes one snippet into an article, and readers see a fast, accessible, honest list that links back. A deck link pasted into Discord shows the deck, not a logo. A developer reads a public deck through a documented, rate-limited, attributed API. Primers also gain video sections with timestamps, which no reviewed competitor offers.

The constraints are fixed: nothing a viewer needs is paid, nothing tracks a viewer without consent, and no visibility is sold.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise. Moxfield's pages answered HTTP 403, so its row rests on its 2020 wiki, a 2021 community primer and a search snippet.

| Product             | Creator and community features                                                                                                                                                                                           | Source        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Moxfield            | Unique views, likes, comments and notifications. Primers with `[[Card]]` links, tables and images; YouTube only as a linked image. An "Embedding Decks" help article exists, but its mechanism and terms were unreadable | [3], [4], [5] |
| Archidekt           | A playtester popout that hides the hand for screen sharing                                                                                                                                                               | [6]           |
| TappedOut           | "TappedOut.js Blog Widget". Feature Tokens (5 for $5, 25 for $20) buy a Featured Decks slot; the $3/month Supporter tier shows featured decks "to 20% more people"                                                       | [7]           |
| Discord bots        | Otterly MTG `/analyzedeck` explains a Moxfield or Archidekt link against the brackets; I-23 lists the others                                                                                                             | [8]           |
| Scryfall            | The free API others build on: about 47.43M backlinks from 12.7K domains (Semrush estimate, September 2026). Its terms forbid paywalling its data and require software to "create additional value"                       | [9], [10]     |
| Commander Spellbook | A public "Backend REST API" under MIT code, "used to power" EDHREC's combo feature                                                                                                                                       | [11]          |

**What no reviewed site documents:** video as a primer section, YouTube or Twitch fields on a deck, a creator page with links, or per-deck analytics for the author. This is absence of evidence, and Moxfield could not be read directly, so check in a browser before a slice claims an advantage.

**How the reference sites grew.** EDHREC credits The Mana Source, Tolarian Community College and The Command Zone with amplifying it early (2025-10-16) [12]. In 2020 the cEDH Decklist Database said it would "no longer support tappedout lists", and the PlayEDH Discord asked for lists "on Moxfield, Archidekt or Scryfall" [13]; the gatekeepers' link format helped Moxfield displace TappedOut. Scryfall and Commander Spellbook became infrastructure as free APIs [9], [11]. Players still choose on presentation: "Moxfield for play-testing because it's easier to frame in OBS for Spelltable" (78 points, October 2026) [14], and "Whenever someone posts a deck to review here and I see Archidekt I sigh" (29 points, June 2026), in a comment that also credits Archidekt with "the sponsor race for all the influencers" [15].

**The gap.** MagicAIBuilder already has an evaluative social layer: ratings, reviews, votes, feedback questions and attributed forks. The layer creators broadcast with does not exist: embeds, link previews, view counts, a creator page and a public read contract.

## Current state in this codebase

Verified on `dev` (commit `49983a9`) on 2026-11-09:

- **No embed route; framing is refused everywhere.** No path under `src/app` contains `embed`. `src/lib/security-headers.ts`, applied to `/(.*)` by `next.config.ts`, sends `frame-ancestors 'none'`, `X-Frame-Options: DENY` and `Cross-Origin-Resource-Policy: same-origin`. The CSP has no `frame-src`, so `default-src 'self'` would block a YouTube or Twitch iframe.
- **`/api/og` is unused and spoofable.** `src/app/api/og/route.tsx` renders a 1200×630 image from free-text `title`, `commander` and `colors` parameters for any caller; no page or test references it. `/deck/[id]` and `/share/[token]` use the commander's Scryfall art crop as `og:image`, and only the share page sets `twitter:` tags. The site default is `/og-image.svg`, while X's card documentation lists JPG, PNG, WEBP and GIF and excludes SVG [16]. `src/app/robots.ts` disallows `/api/`, and site owners report that X skips card images robots.txt blocks [17].
- **Primers.** `src/components/profile/PublicDeckPrimer.tsx` renders `Deck.description` as headings, paragraphs, lists and http, https or mailto links, with a table of contents, copy and download. There are no card links, images, tables or video. `headingId` slugs to ASCII without de-duplicating, so repeated headings share an anchor and non-Latin headings all become `primer-section`.
- **Forks.** `src/lib/deck/fork.ts` copies cards and primer, starts the fork private and snapshots `forkedFromDeckId`, `forkedFromDeckName` and `forkedFromUserName`; `PublicDeckActions.tsx` shows "Forked from X by Y". No source deck shows its forks.
- **Profiles and views.** `/u/[username]` lists public decks with follower and following counts and ratings (`src/app/api/users/[username]/route.ts`). `User` has `name`, `username` and `image`, but no bio, link or pinned deck. `prisma/schema.prisma` has no view field.
- **Telemetry.** `src/app/[locale]/layout.tsx` loads Vercel Speed Insights, and `src/instrumentation-client.ts` runs Sentry session replay on 1% of sessions and on every error. No consent mechanism was found.
- **`/api/v1` is owner-scoped.** Hashed Bearer keys carry `decks:read` or `collection:read`, limited to 120 requests per minute per key by an in-memory, per-instance limiter (`src/lib/rate-limit.ts`). `/api/v1/openapi` is public. There are no API terms and no license or attribution field. `src/app/api/v1/decks/route.ts` explains the missing public listing: such an API "is a scraping endpoint with a login on it".
- **An undocumented public JSON route exists.** `GET /api/deck/[id]` serves a public deck to anyone, with no key and no rate limit (the middleware matcher skips `/api`). It returns every `Deck` and `DeckCard` column except `shareToken`, including `folderId`, `budget`, sideboard and maybeboard rows, and per-card `notes`.
- **Caching, visibility and moderation.** Anonymous public-deck reads revalidate every 60 seconds (`src/lib/api/viewer-request.ts`). The sitemap lists only `isPublic` decks and claimed profiles. A moderation decision only marks a report `reviewed` or `dismissed`; none hides a deck.
- **Badge inputs and playtest.** `validateDeck` (`src/lib/deck/validation.ts`) and `src/lib/deck/bracket.ts` are deterministic. `DeckCard.price` is a Scryfall USD figure with no stored date. `PlaytestModal.tsx` is a modal with no popout and no hand-hidden view.

## Functional requirements

### 1. Ground rules for every public creator surface

1.1 **Free to view.** Embeds, deck images, primers with video, creator pages, view counts and the public API at its documented quota need no payment; only the API needs an account. The Fan Content Policy says "Free means FREE" [18], and Scryfall forbids paywalling its data [10].
1.2 **No tracking without consent.** The embed, the deck image and the view counter set no cookie, write no browser storage and load no third-party script or pixel. Sentry replay and Speed Insights never load in an embed.
1.3 **Public decks only.** Only `isPublic` decks embed, render a deck image or appear in the public API, and no snippet or image URL carries a share token. Within 60 seconds of a deck turning private or being deleted, every surface shows a generic "unavailable" state without the deck's name.
1.4 **One public projection.** One server function lists the fields a public surface may show. The deck page, embed, image and API use it, and so does `/api/deck/[id]` for every caller but the owner. It excludes `folderId`, `budget`, `notes`, `shareEnabled`, `manualBracket` and `userId`.
1.5 **Labels travel.** The AI-generated label, fork attribution, the declared-bracket label and the price date appear wherever the deck appears.

### 2. Deck embeds

2.1 An "Embed" action on a public deck produces an `<iframe>` snippet with `title`, `loading="lazy"`, 100% width and `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`.
2.2 `/embed/deck/{id}` renders on the server, without client JavaScript: commanders, the main deck grouped by category with quantities, the card count, and a visible "View on MagicAIBuilder" link to the canonical deck page in a new tab. It carries `<link rel="canonical">` to that page and `X-Robots-Tag: noindex`.
2.3 `theme` is `light`, `dark` or `auto` (follows `prefers-color-scheme`), built from Lumen tokens ([I-13](i13-visual-direction.md)); `lang` picks a shipped locale, English by default. The layout works from 320 px wide without horizontal scrolling.
2.4 It meets WCAG 2.2 AA contrast in both themes, uses headings per category and list semantics, gives mana symbols text alternatives and works by keyboard. It reuses [I-24](i24-decks-a-screen-reader-can-play-from.md)'s spoken output when that exists.
2.5 Optional badges, off by default: **legality** from `validateDeck`, naming the failing rule; **bracket**, labeled as the owner's declaration, with the estimate beside it once [I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 2 ships; **price**, a dated USD estimate, hidden while no date exists.
2.6 Hovering or focusing a card loads its Scryfall image on demand, unaltered.
2.7 **Budget** (targets set here, not measured): at most 30 KB compressed HTML and CSS for a 100-card deck; no image request before interaction except the commander; server p95 at most 300 ms for a cached deck. An optional script of at most 2 KB resizes the iframe from `postMessage` events of our origin only.
2.8 Only `/embed/*` sends `frame-ancestors *` without `X-Frame-Options`; it and the image route send `Cross-Origin-Resource-Policy: cross-origin`. Every other route keeps `'none'`, `DENY` and `same-origin`.
2.9 The owner can turn embedding off per deck, which turns existing embeds into the "unavailable" state. An embed never shows comments, ratings, primer video or another site's content.

### 3. Shareable deck images

3.1 `/og/deck/{id}`, outside `/api/` and allowed by robots.txt, returns a 1200×630 PNG built only from stored data: deck name, author, commander, color identity, card count, declared bracket label, an optional dated price and the fork line. It takes no free-text parameter, and the free-text `/api/og` is removed so no one can print arbitrary text under the product's name.
3.2 Card art follows Scryfall's image rules: no cropped artist or copyright line, no distortion, color shift or watermark [10]. The artist's name is printed beside any art crop.
3.3 `/deck/{id}` points `og:image`, `og:image:alt`, `twitter:card` (`summary_large_image`) and `twitter:image` at this route, and the site default image becomes a PNG.
3.4 Images are cached per deck and `updatedAt`. A private or missing deck gets the generic site image; share-token pages keep their current preview.

### 4. Primers with video and card links

4.1 **Card links.** `[[Card Name]]` and `[[Card Name|SET]]` render as links with a hover and focus preview, resolved against the deck's cards first, then Scryfall. The editor preview lists unresolved names, which render as plain text.
4.2 **Video blocks.** A line holding only a YouTube video URL or a Twitch VOD URL (`twitch.tv/videos/<id>`) renders as a video block; other hosts stay links.
4.3 **Click to load.** The block shows a neutral placeholder with the author's caption and contacts YouTube or Twitch only after a click. YouTube then loads from `www.youtube-nocookie.com`, whose privacy-enhanced mode keeps embedded views from influencing the viewer's YouTube experience [19]. Twitch loads `player.twitch.tv` with `parent` set to our domain, at 400×300 or more [20].
4.4 **Timestamped sections.** A heading may end with `{t=12:30}`. It renders a "Watch from 12:30" control that loads or seeks the primer's first video: `start=` in seconds for YouTube [19], `time=0h12m30s` for Twitch [20]. The table of contents shows each timestamp.
4.5 **Stable anchors.** Heading anchors are unique within a primer (`-2`, `-3` suffixes), and a heading that slugs to nothing gets a positional anchor.
4.6 `frame-src` lists exactly `https://www.youtube-nocookie.com` and `https://player.twitch.tv`. The parser keeps its URL allowlist and renders no raw HTML and no image from an arbitrary host.

### 5. Stream-friendly views

5.1 **Hand-hidden playtest view, owned by I-07.** The creator requirement recorded here: a popout showing battlefield, graveyard, exile, life and phase, synchronized with the main window, never the hand. Archidekt ships one [6], and players cite OBS framing when choosing a playtester [14].
5.2 **Overlay layout.** `/embed/deck/{id}?layout=overlay` renders the list without chrome on a transparent background, with a large-text option, for an OBS browser source. It shows no card notes and no copilot.

### 6. Creator page and attribution

6.1 `/u/{username}` gains an optional plain-text bio of at most 280 characters, up to five https links (YouTube, Twitch, website, Bluesky, other) with `rel="ugc nofollow noopener"`, up to six pinned public decks, and a "Primers" list marking those with video.
6.2 Each public deck shows how many public forks it has and links to them; private forks are counted nowhere.
6.3 Fork attribution appears on the fork's page, embed, image and API response. While the source is public it shows the author's current name and links to it; otherwise it shows the stored names without a link.
6.4 A published fork whose primer is still the source's text shows "Primer by" the source author until the forker edits it.
6.5 No creator badge is sold. Any badge needs a published, non-monetary criterion.

### 7. Public read API and its terms

7.1 A new scope, `public:read`, that any account can mint at no cost.
7.2 `GET /api/v1/public/decks/{id}` returns the public projection of one public deck: commanders, main-deck cards with quantities, author, fork attribution, `isAIGenerated`, timestamps, the canonical URL and an `attribution` object. A private, missing or share-only deck returns the same `not_found`.
7.3 `GET /api/v1/public/users/{username}/decks` lists one creator's public decks, at most 50 per page. No endpoint lists or searches all public decks; that stays under I-29's rules.
7.4 The quota is documented, and every 429 carries `Retry-After`. Before these endpoints open, the limiter is shared across instances, preferably in the existing database, since a new service needs an exit path ([strategic boundaries](../roadmap.md#strategic-boundaries)). Responses carry an `ETag` from `updatedAt` and `Cache-Control: public, max-age=60`.
7.5 A terms page, reviewed by a lawyer, is published before the endpoints open. Use is free; the `attribution` text and link appear beside any deck displayed; deck data is not mirrored or resold in bulk; Scryfall-derived fields stay under Scryfall's terms [10]; the Fan Content notice applies [18]; keys are revocable for abuse; a version keeps working for a stated overlap after its successor ([I-22](i22-verification-as-a-public-surface.md) requirement 3). The OpenAPI document describes each endpoint, scope, quota and the attribution field.

### 8. View counts and privacy

8.1 A view is counted on the server when the public deck page or an embed is served to someone who is neither the owner nor a known bot, with no cookie, browser storage or fingerprinting script.
8.2 Daily de-duplication hashes deck id, IP address and user agent with a salt replaced and deleted every 24 hours. No address, user agent or hash outlives its day. Daily counters per deck and surface (page or embed), and embed loads per host origin from `Referer`, are all that remain; after 25 months they fold into monthly totals.
8.3 The deck page shows total views, and the owner can hide the number. Views rank nothing here, not discovery, search or the creator page; any ranking use is an I-08 decision under the roadmap's rule that popularity is not advice.
8.4 The privacy notice describes the counter. The CNIL exempts audience-measurement trackers from consent when they serve only audience measurement, produce anonymous statistics, are not combined with other processing and do not follow people across sites, and it recommends keeping collected data at most 25 months [21]. This counter stores nothing on the device; whether it needs consent is a lawyer question.

### 9. What could be paid ([I-30](i30-business-model-and-paid-tier.md))

9.1 **Free:** everything a viewer, a reader or a developer within the quota needs. Creators post a link only if their audience can open it, and the Fan Content Policy and Scryfall forbid gating access [18], [10].
9.2 **Paid candidate: creator analytics.** Views per day per deck, embed loads per host site, forks over time and a CSV export, on an owner-only page. They are personal analytics on the author's own work, which fits [I-29](i29-cross-site-deck-index.md) requirement 7.3: paid features are tools on a player's own decks. Moxfield tracks unique views [3]; per-day or per-host analytics for the author appeared in no reviewed source.
9.3 Paid analytics read the same daily counters as group 8, so paying never buys more data about viewers.
9.4 **Never paid:** placement, featuring, reach, removing the link back, or card data. A higher commercial API quota waits for legal review, because Scryfall forbids requiring payment "in exchange for access to Scryfall data" [10].

## Data model / API

```
Deck            + allowEmbed Boolean @default(true), showViewCount Boolean @default(true)
User            + bio String? (≤ 280), links Json (≤ 5 × {kind, url}), pinnedDeckIds String[] (≤ 6)
DeckViewDaily   deckId, day, surface (page | embed), views Int     @@id([deckId, day, surface])
EmbedHostDaily  deckId, day, host (origin only), loads Int         @@id([deckId, day, host])
ViewDedupe      keyHash Bytes @id, day                             deleted with its salt daily
ViewSalt        day @id, salt Bytes                                deleted after 24 hours

GET /embed/deck/{id}?theme&lang&badges&layout                      HTML, no auth
GET /og/deck/{id}                                                  PNG, no auth
GET /api/v1/public/decks/{id}                                      key with public:read → { data, attribution }
GET /api/v1/public/users/{username}/decks                          key with public:read → { data, pagination }
```

No table stores an IP address or a user agent, and a schema test guards that absence.

## Non-goals

- Paid promotion, featured slots or reach sold for money, as TappedOut's tokens do [7]. The roadmap's [non-goal](../roadmap.md#deliberate-non-goals-from-the-benchmark) stands, and views rank nothing.
- Hosting or transcoding video, live streaming, chat overlays or webcam scenes.
- A Discord bot, owned by I-23. This initiative supplies only the link preview a chat app shows.
- Embedding or framing another site's decks ([I-29](i29-cross-site-deck-index.md) requirement 3.3), or an API listing every public deck.
- Creator revenue shares, tips or affiliate splits; affiliate links are [I-32](i32-seller-handoff-and-affiliate-carts.md)'s question.
- Third-party analytics, advertising or pixels on any surface here.
- Contests and community programming, which are operations rather than product.

## Testing strategy

- **Headers:** `/embed/*` allows framing; a test enumerates every other route family and asserts `frame-ancestors 'none'` and `DENY`. `frame-src` names exactly the two video hosts.
- **No tracking:** embed and image responses carry no `Set-Cookie`; the embed bundle holds no Sentry replay or Speed Insights code; a rendered embed requests no third-party origin before interaction.
- **Visibility and projection:** private, deleted, share-only and embedding-disabled decks render the generic state on embed, image and API. A snapshot test fails if `notes`, `folderId`, `budget`, `shareEnabled`, `manualBracket` or `userId` appears in any public response, `/api/deck/[id]` included.
- **Budget and accessibility:** CI fails a 100-card embed above 2.7's size; axe runs on light, dark and overlay layouts at 320 px and 1280 px, plus a keyboard-only pass.
- **Primer parser:** YouTube and Twitch URL forms become video blocks and other hosts stay links; no iframe exists before a click; `{t=1:02:03}` maps to `start=3723` and `time=1h2m3s`; repeated and non-Latin headings get unique anchors; `[[Name|SET]]` resolves and unknown names render as text; injection fixtures render inert.
- **Deck image and attribution:** query parameters do not change the image; a private deck gets the generic one; art crops carry the artist's name; robots.txt allows the route. A fork's embed, image and API response carry the source, and lose only the link once the source turns private.
- **API:** a missing scope returns 403; private and missing decks return identical bodies; 429 carries `Retry-After`; the limit holds across two instances; every response has `attribution`; the OpenAPI document matches the routes.
- **Views:** two loads from one client on one day count once; owner and bot loads count zero; no hash survives the salt rotation.

## Delivery slices

| #   | Slice                                                                                                                              | Depends on                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Public projection used by the deck page and `/api/deck/[id]`, with the field snapshot test                                         | —                                                                        |
| 2   | `/og/deck/{id}` from stored data; deck-page Open Graph and Twitter tags; PNG default; free-text `/api/og` removed                  | 1                                                                        |
| 3   | Embed route: list layout, themes, locale, canonical link, scoped headers, no-tracking tests, snippet dialog, per-deck switch       | 1                                                                        |
| 4   | Embed badges: legality, declared bracket, dated price _(prices re-pointed 2026-11-10 to I-67 slice 5)_                             | 3; dated prices from I-67 slice 5; bracket estimate from I-28 slice 2    |
| 5   | Overlay layout and the auto-height script                                                                                          | 3                                                                        |
| 6   | Primer card links with preview and unresolved-name disclosure                                                                      | — (editor placement agreed with I-37)                                    |
| 7   | Unique heading anchors and timestamp syntax in the primer parser                                                                   | —                                                                        |
| 8   | Click-to-load video blocks, `frame-src`, timestamp controls                                                                        | 7                                                                        |
| 9   | Fork attribution on embed and image, fork counts, current-name fallback, "Primer by"                                               | 2, 3                                                                     |
| 10  | Creator page: bio, links, pinned decks, primer list                                                                                | —                                                                        |
| 11  | Public read API: scope, two endpoints, attribution, a limiter on I-05 M2's shared store _(one owner, decided 2026-11-10)_, OpenAPI | 1; I-05 M2's shared store; the terms page is **blocked** on legal review |
| 12  | View counter with public count and owner toggle                                                                                    | 1; **blocked** on the legal answer to open question 1                    |
| 13  | Creator analytics page for the owner                                                                                               | 12; paid gating waits for the I-30 decision                              |
| —   | Hand-hidden playtest popout                                                                                                        | Owned by I-07; listed for tracking only                                  |

Slices 2 and 3 ship alone and close the two largest gaps: a deck link that previews well and a deck that embeds. Slice 8 is the differentiator.

## Open questions

1. **For the lawyer (add to the list from I-29's research).** (a) Is a daily-salted hash of IP address and user agent personal data, and does the counter need consent or only notice? (b) May a share image combine Scryfall art with our text, and must an art crop name its artist? (c) Can API terms require attribution and forbid resale when responses contain Scryfall-derived fields? (d) Do paid creator analytics fit the Fan Content Policy? Research, not legal advice.
2. **Public view counts by default?** Moxfield tracks unique views [3]; whether it shows them publicly was not checked. A public number invites the popularity reading the roadmap rejects. This spec shows it, lets the owner hide it and ranks nothing by it.
3. **Keyless reads.** `/api/deck/[id]` already serves public decks without a key, version or limit. Close it to non-browser callers once slice 11 ships, or keep a keyless, per-IP-limited read for widgets?
4. **oEmbed discovery** would let some publishing tools embed a pasted deck link automatically. Which tools honor it for an unlisted provider was not researched.
5. **Boundaries with I-08 and I-37:** may a creator block forks of a deck or only of its primer (I-08's fork policy), and where do the primer editor's card-link autocomplete and split preview live?

## Sources

1. Semrush, [tappedout.net overview](https://www.semrush.com/website/tappedout.net/overview/), September 2026 estimates, read 2026-11-09.
2. Semrush, [archidekt.com overview](https://www.semrush.com/website/archidekt.com/overview/), September 2026 estimates, read 2026-11-09.
3. Moxfield, [Features wiki](https://github.com/moxfield/moxfield-public/wiki/Features), last edited 2020-10-14.
4. Jerakin, [Moxfield community primer](https://gist.github.com/Jerakin/24be913c6106546136c45d1d028f9af9), 2021-08-01.
5. Moxfield, ["Embedding Decks" help article](https://moxfield.com/help/help-articles/embedding-decks), search snippet only; the page answered 403 on 2026-11-09.
6. Archidekt, [FAQ](https://archidekt.com/faq), read 2026-11-09.
7. TappedOut, [Level up](https://tappedout.net/help-desk/level-up/), ©2026, read 2026-11-09.
8. [Otterly MTG on top.gg](https://top.gg/bot/1460038857427910861), read 2026-11-09.
9. Semrush, [scryfall.com overview](https://www.semrush.com/website/scryfall.com/overview/), September 2026 estimates, read 2026-11-09.
10. Scryfall, [API documentation](https://scryfall.com/docs/api), data-use and image rules, read 2026-11-09.
11. Commander Spellbook, [About](https://commanderspellbook.com/about/), read 2026-11-09.
12. Nick Wolf, [EDHREC founder Don Miner to speak at MV Con 2025](https://edhrec.com/articles/edhrec-founder-don-miner-to-speak-at-mv-con-2025), EDHREC, 2025-10-16.
13. TappedOut forum, ["Is TappedOut dying?"](https://tappedout.net/mtg-forum/tappedout/is-tappedout-dying), 19–23 November 2020, quoting a cEDH Decklist Database notice dated "11/08/2020" and a PlayEDH post dated "8/24/2020".
14. r/EDH, [thread comparing deckbuilders](https://www.reddit.com/r/EDH/comments/1wv8mf7/), October 2026; scores from the Arctic Shift archive.
15. r/EDH, [thread comparing Moxfield and Archidekt](https://www.reddit.com/r/EDH/comments/1uav2g2/), June 2026; scores from the Arctic Shift archive.
16. X (Twitter) Developers, [Summary card with large image](https://dev.twitter.com/cards/types/summary-large-image), archived page as quoted by search results on 2026-11-09; the current page answered 402.
17. Discourse Meta, [Default robots.txt blocks Twitter Card images](https://meta.discourse.org/t/default-robots-txt-blocks-twitter-card-images/181762), practitioner report found by search on 2026-11-09.
18. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15, read 2026-11-09.
19. YouTube Help, [Embed videos and playlists](https://support.google.com/youtube/answer/171780?hl=en), privacy-enhanced mode and start time, read 2026-11-09.
20. Twitch Developers, [Embedding video and clips](https://dev.twitch.tv/docs/embed/video-and-clips/), `parent`, minimum size and `time`, read 2026-11-09.
21. CNIL, [Cookies : solutions pour les outils de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience), published 2025-07-04, read 2026-11-09.
