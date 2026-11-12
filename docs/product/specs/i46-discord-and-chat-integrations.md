# I-46: Discord And Chat Integrations For Pods And Creators

> **Initiative:** I-46, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for link previews (slices 1 to 3, no bot); Later for webhook feeds and the Discord app (slices 4 to 15) · **Written 2026-11-09**
> **Research:** one dated note on Discord's developer documentation and policies, Magic bots in 2025–2026, Scryfall's and Wizards' rules, and three other chat apps. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** how product links unfurl in chat apps (tags, oEmbed, Discord component embeds and their conformance test), the Discord app (install, interactions endpoint, server settings, privacy, rate limits), the commands that need no account (`/deck`, `/bracket-check`, `/combo`, `/lineup`, `/gamenight`, `/card`), and deck-update feeds posted by webhook. **Does not own:** the deck image `/og/deck/{id}` and the public projection ([I-36](i36-creator-and-embed-toolkit.md) slices 1 and 2); account linking and consented Rule 0 sheets in Discord, the future `/pod` ([I-23](i23-the-pods-own-surface.md)); pods and sheets ([I-15](i15-rule-zero-sheets-and-pod-profiles.md)); bracket rules and the check against bracket N ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)); store nights and the store plan ([I-41](i41-store-commander-nights.md)); the event contract ([I-39](i39-first-run-activation-and-measurement.md)); the privacy policy, terms and report form ([I-38](i38-trust-safety-and-user-rights.md)); plans and billing ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

Playgroups, stores and creators organise Commander on Discord. Tournament, league and card bots already live there, and the reference sites grew partly because Discord communities asked for their links ([I-36](i36-creator-and-embed-toolkit.md#what-the-market-does)). This initiative brings MagicAIBuilder into those rooms in two ways that differ in cost and risk.

**A link that unfurls well** needs no bot, stores no data and falls under no app policy. It works in Discord, Slack, WhatsApp and Telegram. Today a deck link shows a small art thumbnail without the artist's name, and every other page shows no image, because the default image is an SVG and Discord does not read SVG [1].

**A Discord app with slash commands** answers questions about public decks where the pod argues about them: legality, declared and estimated brackets, combos, and a side-by-side line-up of the evening's decks. It reads only the commands addressed to it, never the conversation, and every answer comes from the same deterministic code as the web page.

It passes three tests. A deck link pasted into Discord shows the commander art with its artist, the deck's name and author, its bracket labelled as declared, its legality, and an "Open deck" button. A pod types `/lineup` with four deck links and sees the decks side by side with the bracket spread. A creator's server gets one post when the creator publishes a deck update, without installing a bot.

**Why this priority.** Card lookup and combo search are free in chat already: Scryfall's bot [3], Commander Spellbook's bot [5] and Otterly MTG [7]. A bot is a support surface: Discord's data rules apply from the first install, and verification from 100 servers [14], [16]. Previews, by contrast, are cheap, measurable and missing today, so slices 1 to 3 are Next. Feeds (slices 4 and 5) need no bot and can be pulled forward once I-36's public projection ships. The app is Later: its distinctive command, `/lineup`, is worth most once [I-28](i28-commander-deckbuilding-guide-by-bracket.md) slice 7 can label an estimated bracket, and the support question in I-23 is still open.

**Relation to I-23.** I-23 puts a pod's dated bracket and consented Rule 0 sheet in Discord, starting with account linking. This spec builds the app I-23's commands run in and answers its requirement 1 for public decks without any linking. I-23 keeps linking, consent and `/pod`. Open question 2 asks whether to merge them.

## What the market does

All rows were read on 2026-11-09 unless dated otherwise. Install counts are not public for most bots; top.gg answered HTTP 403.

| Product                     | What it does in chat                                                                                                                                                                               | Reads messages                        | Price and size                                                                                       | Source   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Scryfall bots               | Discord and Slack: `[[card]]` posts Oracle text; `[[!card]]` an image, `[[$card]]` prices, `[[?card]]` rulings, `[[#card]]` legality                                                               | Yes: "listens to all text channels"   | Free; no count published                                                                             | [3], [4] |
| Commander Spellbook bot     | `{{query}}` inline search, `/search`, `/combos <card>`, `/find-my-combos <decklist URL>` reading Archidekt, Deckstats, Moxfield, Scryfall and TappedOut; Telegram and Reddit bots in the same repo | Yes: `intents.message_content = True` | Free, MIT-licensed source                                                                            | [5], [6] |
| Otterly MTG                 | `/card`, `/price`, `/rulings`, `/deckbuilder`, trivia; `/analyzedeck` explains a Moxfield or Archidekt deck against the brackets; a verified Discord app                                           | Not stated                            | Donations page, no premium tier; "242+" servers and "28.2K+" users, self-reported                    | [7], [8] |
| TopDeck.gg bot              | Posts pairings and standings, `/report_match`, store event alerts, looking-for-game lobbies                                                                                                        | Not stated                            | No price on the bot page; I-41 records TopDeck's $12-a-month store plan                              | [9]      |
| Playgroup                   | `/leaderboard members`, `/leaderboard deck`, `/invite`, and game-result posts to a channel                                                                                                         | Not stated                            | Free; extra leagues need a subscription, price not listed; 7,945 Playgroup Live players in Oct. 2026 | [10]     |
| EDHREC, Moxfield, Archidekt | No official bot found by search. Their presence in chat is the link preview                                                                                                                        | —                                     | —                                                                                                    | search   |

I-23 lists Scry / Mana Grove's `/bracket` and an open-source companion bot. **What no bot found does:** compare a pod's decks side by side, or show a declared bracket beside an estimate with the date of the rules behind it. That is the opening for `/lineup` and `/bracket-check`. It is an absence of evidence, so check again before a slice claims it.

**Link previews, measured on 2026-11-09** by reading each page's `<head>` with a plain HTTP request [11]. Archidekt decks use `summary_large_image` with a WEBP art crop, an orange `theme-color` and "Created by" and "Format" labels. Commander Spellbook generates a PNG per combo with alt text and a large-image card. EDHREC commander pages use the small `summary` card. Scryfall card pages declare oEmbed and a large card image. Moxfield answered 403, so its tags were not read.

**Discord's rules for previews** [1], [2]. Discord makes one `GET`, reads only server-rendered tags, needs a 2xx answer, follows at most 5 redirects and gives up after 10 seconds, image measurement included. `twitter:card` `summary_large_image` gives the large image; without a layout tag the image is a small thumbnail. `theme-color` sets the accent. Images may be PNG, GIF, JPEG, WEBP or AVIF, not SVG. Titles are trimmed at 70 bytes and descriptions at 350 bytes; an `og:site_name` over 256 characters kills the preview. oEmbed (JSON only) is the only way to show an author line. Previews are cached for about 30 minutes. A **component embed**, a JSON payload of at most 3,000 bytes in the page, replaces the preview with Discord components, link buttons included, and needs no bot. The crawler identifies as `Discordbot/2.0`.

**Discord's rules for apps.**

- **Privacy.** Slash commands need no privileged intent; the interaction payload carries the member data a command needs. `MESSAGE_CONTENT` is privileged [12]. Since 2026-06-10 privileged intents need a review once an app reaches 10,000 users, renewed yearly [13].
- **Verification.** Required "to scale past 100 servers", with the team owner's identity checked through Stripe [14]. Discord opened it to bots in more than 75 servers in 2020 [15].
- **Data** (Developer Policy, effective 2024-07-08). Use API data only for the stated function; do not profile users; do not obtain data of people under 13 or the local minimum age; do not sell it or pass it to ad networks; do not train models on message content; give users a way to report problems [16]. The Developer Terms require a privacy policy that says how to request deletion, and deletion when data is no longer needed [17].
- **Money.** Since 2024-10-07, in regions where Premium Apps exist, an app that offers paid features must also sell them through Discord at a price no higher than elsewhere [16]. The developer receives 85% of payments, less processing fees, until cumulative sales reach $1 million, then 70% [18]. Premium Apps need a verified app, a team owner aged 18 or more, terms and privacy links, and a team in the US, EU or UK [19].
- **Limits and controls.** A first response is due within 3 seconds; the token then lasts 15 minutes [20]. Interaction responses are exempt from the 50-requests-per-second global limit; 10,000 invalid requests in 10 minutes trigger a temporary ban [21]. Admins restrict each command by role and channel under Server Settings → Integrations, and `default_member_permissions: "0"` hides a command from everyone but admins [22]. Without `USE_EXTERNAL_APPS`, a user-installed app's replies are ephemeral [23]. Native polls take up to 10 answers and run up to 32 days [24]. Channel webhooks "do not require a bot user or authentication" [25].

**Scryfall and Wizards.** Scryfall forbids paywalling its data, and requiring anyone to "make payments … agree to subscriptions … join chat servers" for it. Software may not "simply repackage, republish, or proxy" Scryfall data. An `art_crop` needs the artist name and copyright "elsewhere in the same interface" [26]. `/cards/named` and `/cards/search` are limited to 2 requests a second, and Scryfall asks clients to cache for at least 24 hours [27]. The Fan Content Policy forbids payments, subscriptions or email registration to access fan content, and allows ads, sponsorships and donations. It names websites and streams as fan content and says nothing specific about apps or bots [28].

**Other chat surfaces, briefly.** Slack's classic unfurl reads Open Graph and X card tags; richer unfurls need an app with `links:read`, and its event carries no message text [29]. WhatsApp wants non-empty `og:title`, `og:description` and `og:url`, a `<head>` within the first 300 KB, and an image under 600 KB, at least 300 px wide [30]. Telegram reads Open Graph; in October and November 2026 site owners reported that its cache-refresh bot claimed success while previews stayed empty [31]. One correct set of tags serves all four; no bot is planned outside Discord.

## Current state in this codebase

Verified on `dev` on 2026-11-09 (commit `61792c1`):

- **No chat code.** `discord`, `webhook`, `slack`, `telegram` and `oembed` appear nowhere in `src/`, `prisma/` or `scripts/`. Sign-in offers Google and credentials only (`src/lib/auth/config.ts`). The schema has no `Pod` model.
- **Deck previews are minimal.** `src/app/[locale]/deck/[id]/page.tsx` sets `og:title` ("{name} by {author}"), a description ("Commander: X · Bracket {targetBracket}") and an `og:image` pointing at the commander's Scryfall `artCropUri`, with no width, height or alt. It sets no `twitter:card` and no `theme-color`, so Discord shows a small thumbnail [1]. "Bracket N" is the owner's `targetBracket`, not labelled as a declaration. `DeckCard` stores `artCropUri` without the artist, so the art crop reaches chat without the credit Scryfall requires [26]; `CardCache.data` holds Scryfall's card object, artist included.
- **The page fetches itself.** `fetchPublicDeck` (`src/lib/deck/public-deck.ts`) calls `/api/deck/{id}` over HTTP with a 15-second timeout, above Discord's 10-second budget for the whole preview [1].
- **Share pages** (`src/app/[locale]/share/[token]/page.tsx`) set `summary_large_image`, the art crop with alt text, and `noindex`. A pasted share link shows the deck's name and commander in the channel.
- **The default image is an SVG.** `src/app/[locale]/layout.tsx` declares `/og-image.svg` at 1200×630, which Discord ignores [1]; home, profile and commander pages unfurl without an image.
- **Images in progress.** `src/app/api/og/route.tsx` draws free text for any caller and is unused (I-36). `/og/deck/{id}` is I-36 slice 2; the branch `feat/deck-og-image-from-stored-data` held no commit of its own on 2026-11-09.
- **Routing.** English pages are unprefixed (`localePrefix: "as-needed"`, `src/i18n/routing.ts`) and pass through the next-intl middleware (`src/middleware.ts`); whether locale detection ever redirects a crawler is untested. `robots.ts` disallows `/api/` and `/share/`.
- **Deterministic engines exist.** `scoreBracket(deck, stats, combos)` (`src/lib/deck/bracket.ts`), `getColorIdentityViolations` (`src/lib/deck/color-identity.ts`; the unused `validateDeck` engine was deleted on 2026-11-12 (P1-32)), the Commander Spellbook client with a one-hour in-memory cache (`src/lib/combos/spellbook.ts`), and a local card-name index (`src/lib/scryfall/name-index.ts`).
- **Limits.** `/api/v1` allows 120 requests a minute per key (`src/lib/api/authenticate.ts`) through an in-memory, per-instance limiter (`src/lib/rate-limit.ts`).

## Functional requirements

### 1. Ground rules

1.1 **Deterministic.** Every reply is computed by the functions the web page uses. No chat path calls a language model, and the copilot is unreachable from chat ([strategic boundaries](../roadmap.md#strategic-boundaries)).
1.2 **Commands only.** The app receives interactions over HTTP, opens no Gateway connection, declares no intent and never requests `MESSAGE_CONTENT`. There is no `[[card]]` inline syntax, because it needs every message in the channel [4], [12].
1.3 **Public decks only.** Commands and feeds read decks through I-36's public projection. Private, deleted, missing and share-token decks get the same "not found or not public" reply. No reply accepts or echoes a share token.
1.4 **Labels travel.** A bracket is labelled "declared by the owner" or "estimated, rules of {date}"; legality names the failing rule; card data shows its date. `/help` and the app's description carry the Fan Content notice [28].
1.5 **Language.** Replies follow the interaction's `locale` when it is English or French, otherwise English.

### 2. Link previews, with no bot

2.1 Deck, profile, commander, guide and home pages render in server HTML: `og:title`, `og:description`, `og:url`, `og:site_name` ("MagicAIBuilder"), `og:type`, `og:image` with `og:image:width`, `og:image:height` and `og:image:alt`, `twitter:card` (`summary_large_image`) and `theme-color` from the Lumen accent ([I-13](i13-visual-direction.md)).
2.2 **Budgets.** Titles at most 70 bytes, cut at a grapheme boundary and ending in "…", keeping the author; descriptions at most 350 bytes; every URL at most 2,048 characters [1]. Images are PNG or JPEG, 1200×630, under 600 KB [30]. No SVG.
2.3 **Deck description.** Commander or partners; card count; "Bracket N, declared" and, once I-28 slice 7 ships, the estimate; "Legal" or "Not legal: {rule}"; "Art: {artist}" whenever the image is an art crop. When the artist is unknown, the preview uses the full card image instead, which carries its own credit.
2.4 The site default image becomes a PNG of the same size.
2.5 A private, deleted or missing deck answers 404 with the generic site tags, so no deck name reaches a channel.
2.6 Share-token pages keep their preview and `noindex`. The share dialog states that a chat app keeps a preview it already showed after the link is revoked (to confirm in slice 1's manual check).
2.7 **oEmbed.** `GET /oembed?url={deck or profile URL}&format=json`, outside `/api/` because robots.txt disallows it, returns `type` `link`, `author_name`, `author_url` (the profile), `provider_name` and `provider_url`. Deck and profile pages link it with `type="application/json+oembed"`. Other URLs get 404.
2.8 **Discord component embed.** Deck pages carry an inline `discord:component-embed` payload under 3,000 bytes, escapes included [2]: one container in the accent colour; the name and author; the commander's full card image as thumbnail; lines for brackets, legality, card count and last update; link buttons "Open deck" and "Playtest". The Open Graph tags stay as the fallback.
2.9 **Crawler path.** A request with the Discord, Slack, WhatsApp or Telegram crawler user agent gets 200 HTML with no redirect and no `Set-Cookie`, at p95 under 2 seconds for a cached deck (a target, not measured). Building metadata reads the database directly, not the page's own API over HTTP.
2.10 **Freshness.** Deck image URLs carry `?v={updatedAt}` so an edited deck shows its new image after Discord's 30-minute cache [1].

### 3. The Discord app: install, privacy, server controls

3.1 One app, installable to a server or to a user, with the `applications.commands` scope and no bot permissions. Polls and replies travel as interaction responses [20], [24].
3.2 `POST /api/discord/interactions` checks `X-Signature-Ed25519` and `X-Signature-Timestamp`, answers `PING` with `PONG` [32], rejects a timestamp older than five minutes and returns 401 on a bad signature.
3.3 A reply computed within 2 seconds is sent at once; otherwise the endpoint defers within 3 seconds and edits the original response within 15 minutes [20], using Next.js `after()` so the work outlives the response.
3.4 **Stored data.** One `DiscordGuildSettings` row per server that changed a setting, and daily counters with no server or user id (7.1). No message text, Discord user id, username or member data is stored or logged; rate-limit keys stay in memory.
3.5 **Visibility.** `/deck`, `/bracket-check`, `/combo`, `/lineup` and `/gamenight` reply publicly by default; errors, `/settings`, `/privacy` and `/help` reply ephemerally. A server setting makes every reply ephemeral.
3.6 **`/settings`**, hidden from non-admins by `default_member_permissions: "0"` [22]: reply visibility, card images on or off, language (auto, English, French), disabled commands. `/help` explains Discord's own per-role and per-channel controls [22] and `USE_EXTERNAL_APPS` [23].
3.7 **Deletion.** `/settings reset` deletes the server's row. Without a Gateway the app cannot see itself removed, so a row unused for 180 days is deleted. `/privacy` lists what is stored and links the privacy policy [17].
3.8 **Age and reporting.** The app is not aimed at people under 13 or the local minimum age [16]; no command asks for age or personal data. `/help` links I-38's report form, as the Developer Policy requires a reporting path [16].
3.9 **Verification.** The install link is published only once I-38's privacy policy and terms exist, and verification is requested once the app passes 75 servers, before the 100-server cap [14], [15].

### 4. Commands

| Command          | Input                                                         | Reply                                                                                                                                               |
| ---------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/deck`          | A public deck URL or id                                       | Commanders, card count, legality with the failing rule, declared bracket, estimate when available, last update, "Open deck" button                  |
| `/bracket-check` | Deck, optional target bracket N                               | I-28's hard rules and soft targets against N; the counted signals (named Game Changers, two-card combos, extra turns, mass land denial); rules date |
| `/combo`         | Deck                                                          | At most five combos present in the deck, linked to Commander Spellbook with its credit, and a link to the rest                                      |
| `/lineup`        | Two to six public deck URLs                                   | One table: commander, declared and estimated bracket, Game Changer count, combos, legality; the bracket spread flagged above one                    |
| `/gamenight`     | A question, then up to 10 typed options or the bracket preset | A native Discord poll of 1 to 168 hours; nothing stored, no votes read                                                                              |
| `/card`          | An exact card name, autocompleted from the local index        | Commander facts only: colour identity, Commander legality, Game Changer status, the bracket rule it touches, data date, link to Scryfall            |

4.1 Every reply is built by one pure formatter from the public projection, shared with feeds (section 5), within Discord's embed limits. Images are unaltered full Scryfall card images, never art crops without credit, and appear only where the server allows card images [26].
4.2 Links to other deckbuilding sites get a reply offering import ([I-10](i10-interoperability-and-integrations.md)). Chat never fetches another site's deck ([I-29](i29-cross-site-deck-index.md) source policy).
4.3 `/card` adds Commander facts Scryfall's bot does not show and reposts neither Oracle text nor prices, so it does not "simply repackage" Scryfall data [26]. It never calls Scryfall live for autocomplete.
4.4 `/lineup` shows I-15's mismatch prompts once I-15 slice 4 ships; before that, only the spread and legality.
4.5 `/pod` (a consented sheet) is reserved for I-23.

### 5. Deck-update feeds, by webhook

5.1 A deck owner pastes a Discord channel webhook URL, which a server admin creates [25], on a public deck or on their profile ("all my public decks"). The URL must match Discord's webhook pattern, is stored encrypted, is shown afterwards only as its last four characters, and is never logged.
5.2 A post goes out only on an explicit "Publish update", never on autosave: name, link, up to ten added and removed cards from the snapshot diff, and bracket or legality changes. No prices.
5.3 At most one post per deck per hour. A 429 is retried after `retry_after`; three consecutive 401 or 404 answers disable the feed and notify the owner in the product.
5.4 Posting a pod's decks before a night from the web reuses this path once I-15 pods exist; a store's night line-up reuses it under I-41.

### 6. Rate limits

6.1 Per Discord user, 10 commands a minute; per server, 60; overall, 20 a second (targets, not measured). Over a limit, an ephemeral reply gives the wait. The limiter is shared across instances ([I-36](i36-creator-and-embed-toolkit.md) requirement 7.4, [I-05](i05-production-safety.md)).
6.2 Commands read stored deck rows and `CardCache`; none calls Scryfall live. Any lookup that must reach Scryfall stays under 2 requests a second with a 24-hour cache [27].
6.3 Commander Spellbook calls reuse the existing cache and run one at a time per command.
6.4 Discord 429s are honoured; 401 and 403 are never retried, keeping invalid requests far below 10,000 in 10 minutes [21].
6.5 The endpoint runs on the existing hosting. No queue or service is added ([strategic boundaries](../roadmap.md#strategic-boundaries)).

### 7. Measurement, for I-39

7.1 Daily counters only, proposed for I-39's `DailyCounter`: installs by context from `APPLICATION_AUTHORIZED` events [33]; commands by name and outcome (ok, not public, rate-limited, error); preview fetches by crawler family; visits arriving through app links, which carry `?via=discord`. None is joined to an account. Since 2026-11-10 `discord` is one value of [I-72](i72-growth-loops-referrals-creators-and-return.md#2-the-loops-and-how-a-visitor-enters)'s `via` enum (`embed`, `discord`, `recap`), which a sign-up stores once in `User.signupVia`.
7.2 I-39 owns the event contract; this list is a request to it.

### 8. Free and paid ([I-30](i30-business-model-and-paid-tier.md))

8.1 **Free, always:** previews, oEmbed, component embeds, every command, polls and one feed per deck. Viewers and pods need them; Scryfall forbids requiring payment or joining a chat server for its data [26]; the Fan Content Policy forbids gating fan content [28]; and Scryfall, Commander Spellbook and Otterly answer card and combo questions free [3], [5], [7].
8.2 **No paid feature inside the Discord app.** It would also have to be sold through Discord, at no more than the web price, with Discord keeping 15% and later 30% of each sale [16], [18].
8.3 **Paid candidates, on the web:** (a) [I-41](i41-store-commander-nights.md)'s store plan posting night line-ups and pods by bracket to the store's server through section 5, since organisers pay where players do not and TopDeck charges $12 a month for store tools; (b) [I-36](i36-creator-and-embed-toolkit.md)'s creator analytics, adding visits that arrive from chat. Both are tools over the buyer's own nights or decks. Case: weak to medium. Whether webhook delivery from a paid web plan counts as a paid feature "for their Application" is open question 1.

## Data model / API

```
DiscordGuildSettings  guildId String @id, replyVisibility (public | ephemeral), showCardImages Boolean,
                      locale (auto | en | fr), disabledCommands String[], lastUsedAt DateTime, updatedAt DateTime
ChatFeed              id, userId, deckId String?, scope (deck | profile), webhookUrlEnc Bytes, webhookHint String (4 chars),
                      createdAt, lastPostedAt DateTime?, consecutiveFailures Int, disabledAt DateTime?

POST /api/discord/interactions     Ed25519-verified: PING, APPLICATION_COMMAND, APPLICATION_COMMAND_AUTOCOMPLETE
POST /api/discord/events           Ed25519-verified webhook events: APPLICATION_AUTHORIZED, APPLICATION_DEAUTHORIZED
GET  /oembed?url&format=json       deck and profile URLs only
```

A schema test fails if any column holds a Discord user id, a username, message text or a webhook URL in clear.

## Non-goals

- Reading conversations: no inline `[[card]]` syntax, no `MESSAGE_CONTENT`, no moderation, no chat logs.
- Card search, prices and rulings in chat; Scryfall's free bot serves them [3].
- A table companion (life, dice, timers), [ruled out in 2027](README.md#what-the-sweep-ruled-out-for-2027), and tournament pairings, which TopDeck's bot posts [9].
- Any write from chat to a deck, collection, sheet or game log (I-23 requirement 4; I-35).
- Language-model replies or the copilot in chat.
- A paid Discord app or Premium Apps products.
- Bots on Slack, Telegram or WhatsApp. They get correct previews only.
- Direct messages the user did not ask for, which the Developer Policy restricts [16].

## Testing strategy

- **Preview conformance.** A test parses the server HTML of each page type with Discord's tag rules [1] and asserts every tag in 2.1, the byte budgets with long Unicode names, image dimensions and type, and the absence of SVG. The component embed stays under 3,000 bytes for the longest fixture and uses only link buttons [2].
- **Crawler route.** Discordbot, Slackbot, WhatsApp and TelegramBot user agents get 200 for English and French deck URLs, with no redirect and no `Set-Cookie`; a private deck gets 404 with the generic tags.
- **Manual record.** Each preview slice's PR attaches a Discord Embed Debugger capture [1] and one WhatsApp and Slack phone check.
- **Signature.** Valid, invalid and stale signatures; `PING`.
- **Determinism and parity.** One deck gives the same reply bytes twice; legality and bracket values equal the web page's; a dependency test fails if the interactions route imports the AI client.
- **Privacy.** The schema test above; log redaction for webhook URLs and interaction tokens; the app manifest declares no intent.
- **Visibility.** Private, deleted, share-token and missing decks give identical replies.
- **Limits.** Token buckets on a fake clock, the shared limiter across two instances, and the deferred path when a reply takes longer than 2 seconds.
- **Feeds.** Hourly debounce, `retry_after`, disabling after three failures, encryption at rest.

## Delivery slices

| #   | Slice                                                                                                                                        | Depends on                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Preview contract for every public page: full tags, `theme-color`, byte budgets, art credit, PNG default, crawler route and conformance tests | —                                            |
| 2   | Deck previews switch to `/og/deck/{id}` with dimensions, alt and `?v=`                                                                       | 1; I-36 slice 2                              |
| 3   | `/oembed` author line and the Discord component embed on deck pages                                                                          | 1                                            |
| 4   | Chat deck formatter: a pure function from the public projection to a Discord message, with limit tests                                       | I-36 slice 1                                 |
| 5   | Deck-update feeds by webhook on explicit publish                                                                                             | 4; I-63 slices 1 to 3 for the failure notice |
| 6   | App skeleton: signed endpoint, `PING`, `/help`, `/privacy`, `/settings`, `DiscordGuildSettings`, install link kept unlisted                  | I-38 slice 6                                 |
| 7   | Shared rate limits on commands and Discord 429 handling _(the store is I-05 M2's; one owner, decided 2026-11-10)_                            | 6; I-05 M2's shared limiter                  |
| 8   | `/deck`, with the determinism and visibility tests                                                                                           | 4, 7                                         |
| 9   | `/bracket-check` with declared and estimated brackets and the rules date                                                                     | 8; I-28 slice 7                              |
| 10  | `/combo` with Commander Spellbook credit                                                                                                     | 8                                            |
| 11  | `/lineup` for two to six decks                                                                                                               | 9; I-15 slice 4 for prompts only             |
| 12  | `/gamenight` native poll                                                                                                                     | 7                                            |
| 13  | `/card` Commander facts with local autocomplete                                                                                              | 7                                            |
| 14  | Install and command counters                                                                                                                 | 6; I-39 slice 10                             |
| 15  | Verification and public install link: terms and privacy links, team, Stripe identity                                                         | 6; I-38 slices 6 and 7; owner action         |
| —   | `/pod` and account linking                                                                                                                   | Owned by I-23 slices 1 and 3                 |
| —   | Store night line-ups by webhook                                                                                                              | Owned by I-41; reuses slice 5                |

Slice 1 ships alone and fixes what every chat app shows today. Slices 1 to 5 need no bot and no Discord policy review. Slice 11 is the differentiator; it is worth shipping only after slice 9 can show an estimate.

## Open questions

1. **For the lawyer and for Discord (research, not legal advice).** (a) Does a paid web plan whose output reaches a server by webhook (store line-ups, creator feeds) count as "paid features or capabilities for their Application" under the Developer Policy [16]? Ask Discord developer support in writing. (b) Is a Discord user id, held only in memory for rate limiting, personal data the privacy policy must name? (c) Does `/card`'s reply create "additional value" under Scryfall's terms, or should Scryfall be asked [26]?
2. **Merge I-23 into I-46?** This spec answers I-23 requirement 1 for public decks without linking. Keeping I-23 for linking, consent and `/pod` is the recommendation; the integrator or the owner decides.
3. **Who answers when the bot is down?** I-23 raised it. Proposal: if errors exceed 5% of commands for seven days, commands reply with a maintenance notice and the install link is hidden. The owner decides whether to run a support server; Discord expects developers to be reachable [16].
4. **User installs from day one?** They let a player run `/lineup` in a server whose admins never installed the app, and admins keep control of public replies [23]. They also widen the support surface.
5. **Inline `[[card]]` syntax** is the convenience Scryfall's and Commander Spellbook's bots are known for, and it needs every message [4], [5]. This spec refuses it on privacy grounds. Does the owner accept that trade?
6. **Commander Spellbook's `/find-my-combos`** reads decks from five sites [6]. Offering a parser for public MagicAIBuilder decks to its MIT repository could bring traffic at little cost, if a stable plain-text export of public decks exists. Worth proposing to them?

## Sources

Read 2026-11-09 unless dated. Discord's developer pages were read from their source in the `discord/discord-api-docs` repository; help-centre articles through the help centre's public API, because the pages answered 403.

1. Discord, [Link Previews](https://docs.discord.com/developers/link-previews/overview), source last changed 2026-10-06.
2. Discord, [Component Embeds](https://docs.discord.com/developers/link-previews/component-embeds), source last changed 2026-10-06.
3. Scryfall, [Slack and Discord Bots](https://scryfall.com/bots).
4. Scryfall, [Discord Bot Documentation](https://scryfall.com/docs/discord-bot).
5. Commander Spellbook, [Discord bot source](https://github.com/SpaceCowMedia/commander-spellbook-backend/blob/master/bot/discord/spellbook_discord.py), MIT licence; last commit under `bot/` 2026-11-02.
6. Commander Spellbook, [deck URL parsers](https://github.com/SpaceCowMedia/commander-spellbook-backend/tree/master/backend/website/services).
7. [Otterly MTG website](https://otterly-mtg.com), page stamped "Last updated: 11/9/2026"; verification status from Discord's public [application RPC endpoint](https://discord.com/api/v10/applications/1460038857427910861/rpc).
8. [Otterly MTG on top.gg](https://top.gg/bot/1460038857427910861), `/analyzedeck` description from a search snippet; the page answered 403 on 2026-11-09.
9. TopDeck.gg, [Discord Bot](https://discord.topdeck.gg).
10. Playgroup, [Run your Commander community on Playgroup Live](https://playgroup.gg/playgroup-live/for-communities), October 2026 figures.
11. Own reading of `<head>` tags on 2026-11-09: [Archidekt deck 28247803](https://archidekt.com/decks/28247803), [Commander Spellbook combo](https://commanderspellbook.com/combo/1414-2730-5131-5256/), [EDHREC Atraxa page](https://edhrec.com/commanders/atraxa-praetors-voice), [Scryfall card page](https://scryfall.com/card/sld/1838/sol-ring); `moxfield.com` answered 403.
12. Discord, [You Might Not Need a Privileged Intent](https://docs.discord.com/developers/gateway/you-might-not-need-a-privileged-intent), source last changed 2026-10-30.
13. Discord, [Change log](https://docs.discord.com/developers/change-log), "Changes to Privileged Intent Access for Discord Apps", 2026-06-10.
14. Discord Developer Support, [How Do I Get My App Verified?](https://support-dev.discord.com/hc/en-us/articles/23926564536471-How-Do-I-Get-My-App-Verified), edited 2024-08-30.
15. Discord, [The future of bots on Discord](https://discord.com/blog/the-future-of-bots-on-discord), 2020-04-07.
16. Discord, [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy), effective 2024-07-08.
17. Discord, [Developer Terms of Service](https://support-dev.discord.com/hc/en-us/articles/8562894815383-Discord-Developer-Terms-of-Service), effective 2024-07-08.
18. Discord Developer Support, [Premium Apps Payout](https://support-dev.discord.com/hc/articles/17299902720919), edited 2025-09-19.
19. Discord, [Enabling Monetization](https://docs.discord.com/developers/monetization/enabling-monetization), source last changed 2026-02-10.
20. Discord, [Receiving and Responding](https://docs.discord.com/developers/interactions/receiving-and-responding).
21. Discord, [Rate Limits](https://docs.discord.com/developers/topics/rate-limits).
22. Discord, [Application Commands](https://docs.discord.com/developers/interactions/application-commands), permissions and contexts.
23. Discord, [Permissions](https://docs.discord.com/developers/topics/permissions), `USE_EXTERNAL_APPS`.
24. Discord, [Poll resource](https://docs.discord.com/developers/resources/poll).
25. Discord, [Webhook resource](https://docs.discord.com/developers/resources/webhook).
26. Scryfall, [API documentation](https://scryfall.com/docs/api), "Use of Scryfall Data and Images".
27. Scryfall, [Rate Limits](https://scryfall.com/docs/api/rate-limits).
28. Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy), last updated 2017-11-15.
29. Slack, [Unfurling links in messages](https://docs.slack.dev/messaging/unfurling-links-in-messages/), undated.
30. Meta, [WhatsApp Business Platform: link previews](https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/), undated.
31. Telegram Bugs and Suggestions, [link previews not shown](https://bugs.telegram.org/c/61650), comments from 22 October to 8 November 2026.
32. Discord, [Interactions overview](https://docs.discord.com/developers/interactions/overview), endpoint validation.
33. Discord, [Webhook Events](https://docs.discord.com/developers/events/webhook-events).

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

### Goals

- A deck link pasted in Discord shows the commander art with its artist, the name, author, declared bracket and legality, and an "Open deck" button; every public page unfurls with a PNG image; a pod runs `/lineup` on four public decks and sees the bracket spread; and a creator's server gets one post per published update with no bot installed.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-46-01

As a player pasting a deck link into chat, I want the preview to show the commander, the artist and the bracket, so that the link is worth posting.

#### US-46-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-46-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-46-01 Happy path

Given a signed-in player and the English locale
When a public deck unfurls with a PNG, the artist credit, the name and the declared bracket.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-46-02 Happy path

Given a signed-in player and the English locale
When a private deck does not unfurl.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-46-03 Happy path

Given a signed-in player and the English locale
When the preview contains no collection and no note.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-46-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-46-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-46-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Public decks only, no account required to preview. A flag can turn previews back to the plain title if an image source fails.

#### AC-46-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-46-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-46-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

The image is the deck's, from stored fields. SVG is not the preview, because chat apps do not render it.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Open Graph and oEmbed read the public projection. No bot in this slice. Webhooks stay Later.

### Analytics and telemetry

`link_preview_served {surface: deck or other}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Public decks only, no account required to preview. A flag can turn previews back to the plain title if an image source fails.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

Whether a paid plan that posts to Discord is a paid feature of a Discord app is a lawyer and Discord question. This slice does not post.

### Sources

- https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-46-101

As a player, I want the product to a preview contract for every public page: full Open Graph and Twitter tags, theme-color, byte budgets, and a crawler path with no redirect and no cookie, under conformance tests (slice 1)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-100 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: A preview contract for every public page: full Open Graph and Twitter tags, theme-color, byte budgets, and a crawler path with no redirect and no cookie, under conformance tests (slice 1). Metadata must read the database directly: today fetchPublicDeck (src/lib/deck/public-deck.ts) calls the page's own API with a 15-second timeout, above Discord's 10-second budget for a whole preview.

#### AC-46-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-46-102

As a player, I want the product to show deck previews large and credit the artist (slice 1)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Show deck previews large and credit the artist (slice 1). Today src/app/[locale]/deck/[id]/page.tsx sets og:image to the commander's Scryfall artCropUri with no twitter:card, so Discord shows only a small thumbnail, and DeckCard stores no artist, so the art crop reaches chat without the artist credit Scryfall requires.

#### AC-46-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-105 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-46-103

As a player, I want the product to replace the SVG default image with a PNG (slice 1)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Replace the SVG default image with a PNG (slice 1). src/app/[locale]/layout.tsx declares /og-image.svg, and Discord does not render SVG, so every page other than a deck or share page unfurls with no image.

#### AC-46-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-108 Edge

Given the French locale
When the new controls render
Then they come from the French catalogue and are not hard-coded English

#### US-46-104

As a player, I want the product to deck previews from I-36's /og/deck/{id} with dimensions, alt text and a version parameter, then an oEmbed author line and a Discord component embed with "Open deck" and "Playtest" buttons (slices 2–3)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Deck previews from I-36's /og/deck/{id} with dimensions, alt text and a version parameter, then an oEmbed author line and a Discord component embed with "Open deck" and "Playtest" buttons (slices 2–3).

#### AC-46-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-111 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-46-105

As a player, I want the product to a pure chat formatter from the public projection, then deck-update feeds by channel webhook on an explicit "Publish update", at most one post per deck an hour, with the webhook URL stored encrypted (slices 4–5)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: A pure chat formatter from the public projection, then deck-update feeds by channel webhook on an explicit "Publish update", at most one post per deck an hour, with the webhook URL stored encrypted (slices 4–5).

#### AC-46-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-46-106

As a player, I want the product to the Discord app: a signed interactions endpoint with no Gateway connection and no MESSAGE_CONTENT, server settings, shared rate limits, then /deck, /bracket-check, /combo, /lineup, /gamenight and /card (slices 6–13)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The Discord app: a signed interactions endpoint with no Gateway connection and no MESSAGE_CONTENT, server settings, shared rate limits, then /deck, /bracket-check, /combo, /lineup, /gamenight and /card (slices 6–13).

#### AC-46-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-117 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-46-107

As a player, I want the product to install and command counters for I-39, then verification and a public install link once I-38's privacy policy and terms exist (slices 14–15)., so that a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

#### AC-46-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Install and command counters for I-39, then verification and a public install link once I-38's privacy policy and terms exist (slices 14–15).

#### AC-46-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-46-120 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

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

## I-46: Discord And Chat Integrations For Pods And Creators

**Spec:** [`specs/i46-discord-and-chat-integrations.md`](i46-discord-and-chat-integrations.md)

**Outcome:** a deck link pasted into Discord, Slack, WhatsApp or Telegram shows the commander art with its artist, the deck's name and author, its declared bracket and its legality; a pod compares its decks with a slash command; and a creator's server receives deck updates by webhook. No bot reads the conversation.

**Status:** Next
**Priority:** Next for link previews (slices 1 to 3, no bot); Later for webhook feeds and the Discord app (slices 4 to 15)
**Impact / effort:** Medium / small for previews; medium for the app
**Depends on:** I-36 slices 1 and 2 for the public projection and the deck image; I-38 slices 6 and 7 before the app's install link is public; I-28 slice 7 for estimated brackets; the rate limiter shared across instances of I-05 M2 (one owner, decided 2026-11-10).

Playgroups, stores and creators organise Commander on Discord, and the reference sites grew partly because those communities asked for their links. Card lookup and combo search are already free in chat: Scryfall's bot, Commander Spellbook's bot and Otterly MTG, which reports "242+" servers and "28.2K+" users itself. No bot found compares a pod's decks side by side or shows a declared bracket beside an estimate with the date of its rules. A link that unfurls well needs no bot, stores no data and falls under no app policy, and today MagicAIBuilder's links unfurl poorly. A bot is a support surface: Discord's data rules apply from the first install, verification from 100 servers, and since 2024-10-07 an app that sells paid features must also sell them through Discord at no more than the web price, with Discord keeping 15% and later 30% ([Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)). So previews come first, and the app reads only the commands addressed to it. [I-23](i23-the-pods-own-surface.md) keeps account linking, consent and `/pod`.

### Scope

- [ ] A preview contract for every public page: full Open Graph and Twitter tags, `theme-color`, byte budgets, and a crawler path with no redirect and no cookie, under conformance tests (slice 1). Metadata must read the database directly: today `fetchPublicDeck` (`src/lib/deck/public-deck.ts`) calls the page's own API with a 15-second timeout, above Discord's 10-second budget for a whole preview.
- [ ] Show deck previews large and credit the artist (slice 1). Today `src/app/[locale]/deck/[id]/page.tsx` sets `og:image` to the commander's Scryfall `artCropUri` with no `twitter:card`, so Discord shows only a small thumbnail, and `DeckCard` stores no artist, so the art crop reaches chat without the artist credit Scryfall requires.
- [ ] Replace the SVG default image with a PNG (slice 1). `src/app/[locale]/layout.tsx` declares `/og-image.svg`, and Discord does not render SVG, so every page other than a deck or share page unfurls with no image.
- [ ] Deck previews from I-36's `/og/deck/{id}` with dimensions, alt text and a version parameter, then an oEmbed author line and a Discord component embed with "Open deck" and "Playtest" buttons (slices 2–3).
- [ ] A pure chat formatter from the public projection, then deck-update feeds by channel webhook on an explicit "Publish update", at most one post per deck an hour, with the webhook URL stored encrypted (slices 4–5).
- [ ] The Discord app: a signed interactions endpoint with no Gateway connection and no `MESSAGE_CONTENT`, server settings, shared rate limits, then `/deck`, `/bracket-check`, `/combo`, `/lineup`, `/gamenight` and `/card` (slices 6–13).
- [ ] Install and command counters for I-39, then verification and a public install link once I-38's privacy policy and terms exist (slices 14–15).

### Engineering enablers

- A conformance test parses each page type's server HTML with Discord's tag rules, checks the byte budgets with long Unicode names and the image size and type, and fails on SVG.
- One deck gives the same reply bytes twice, legality and brackets equal the web page's, and a dependency test fails if the interactions route imports the AI client.
- A schema test fails if any column holds a Discord user id, a username, message text or a webhook URL in clear.
- Private, deleted, share-token and missing decks get identical replies.

**Paid-tier angle:** previews, oEmbed, component embeds, every command, polls and one feed per deck stay free, and no paid feature lives inside the Discord app, because it would also have to be sold through Discord. The candidates are on the web: I-41's store plan posting night line-ups to the store's server, and I-36's creator analytics counting visits from chat. The spec rates the case weak to medium. Whether webhook delivery from a paid web plan counts as a paid feature of the app is a question for the lawyer and for Discord.

### Enrichment (2026-11-11)

**User story.** As a player pasting a deck link into chat, I want the preview to show the commander, the artist and the bracket, so that the link is worth posting.

**Acceptance.**
- A public deck unfurls with a PNG, the artist credit, the name and the declared bracket.
- A private deck does not unfurl.
- The preview contains no collection and no note.

**UX.** The image is the deck's, from stored fields. SVG is not the preview, because chat apps do not render it.

**Data and API.** Open Graph and oEmbed read the public projection. No bot in this slice. Webhooks stay Later.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `link_preview_served {surface: deck or other}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Public decks only, no account required to preview. A flag can turn previews back to the plain title if an image source fails.

**Open questions.** Whether a paid plan that posts to Discord is a paid feature of a Discord app is a lawyer and Discord question. This slice does not post.

### Definition of done

A deck link pasted in Discord shows the commander art with its artist, the name, author, declared bracket and legality, and an "Open deck" button; every public page unfurls with a PNG image; a pod runs `/lineup` on four public decks and sees the bracket spread; and a creator's server gets one post per published update with no bot installed.

---

