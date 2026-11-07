# MTG Competitive Landscape

> **Last updated:** 2026-11-07 (sections 1, 3, 4 and 5 revised; the rest still dates from March 2026 and is unverified)  
> **Purpose:** Product strategy reference for MagicAIBuilder (AI-powered Commander deck builder)  
> **Note:** Traffic/subscriber figures marked `~est.` are approximations based on publicly available data and community knowledge. Exact figures require direct access to analytics platforms.

---

## Executive Summary

1. **EDHREC dominates Commander recommendation** — it's the go-to data engine (44,808+ decks for top commanders) but its UX is dated and its "suggestions" are purely statistical, not contextual or personalized. This is MagicAIBuilder's primary disruption target.

2. **Moxfield owns the deck-building workflow** — clean UI, fast, social features, used by competitive and casual players alike. Any new tool must match or exceed its UX polish. It has no public API.

3. **The AI gap closed during 2026** — this doc previously claimed nobody had shipped a conversational Commander deck builder. ManaTap, Farseek, MTG Master, ManaForge and a long tail of smaller sites now do, most with a free entry tier. The remaining defensible ground is not "we use AI" but "our AI output is deterministically validated, explained, and testable against evidence the player can inspect." See section 5.

4. **The community is fragmented across many platforms** — YouTube, Reddit, Discord, TikTok all have distinct audiences. Content creators (Command Zone, Tolarian Community College) have massive influence on product adoption.

5. **Scryfall's free API is the critical infrastructure** — every competitor uses it. MagicAIBuilder should too. No need to reinvent card data.

---

## 1. Deck Builders

| Tool            | URL             | Key Features                                                                                                                           | Free/Paid               | Public API                  | ~Traffic / Users                            | Notes                                                                                                                                                                                                                                                                           |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moxfield**    | moxfield.com    | Fast editor, playtesting, collection tracking, social feed, printing, budget toggles, powerful filters                                 | Free (Premium ~$3/mo)   | ❌ None public              | ~3M+ registered users (~est.)               | Current gold standard for UX; largest fork/comment community. No public API: programmatic requests sit behind Cloudflare and its internal endpoints require auth headers, so third-party tools have moved to paste/CSV import.                                                  |
| **Archidekt**   | archidekt.com   | Visual deck builder, category labels, multi-price comparison (TCG/CK/Cardmarket), commander color identity helper, collaborative decks | Free (Pro ~$3/mo)       | ❌ Limited                  | ~500K users (~est.)                         | Built by Space Cow Media. Data from Scryfall + EDHREC. 2026 added a playtester interaction simulator, deck-help requests, a mobile UI overhaul and a multi-vendor price breakdown by category and price band.                                                                   |
| **TappedOut**   | tappedout.net   | Forum-first community, deck sharing, budget analysis, card set completion, long comment threads, legacy primer support                 | Free (Premium $5/mo)    | ✅ Partial REST             | ~400K+ registered users (~est.)             | Older platform, community is loyal but UI is dated. Good for discovering primers.                                                                                                                                                                                               |
| **EDHRec**      | edhrec.com      | Card recommendations by commander (statistical), theme pages, budget filter, salt score, combo finder, articles                        | Free (Patreon)          | ✅ Partial (edhrec.com/api) | #1 Commander site, ~5M visits/month (~est.) | Data powerhouse. Redesigned in October 2026; replaced Synergy with **Lift** (a co-occurrence ratio centred on 1) on /commanders, /combos and /tags on 2026-10-01. Pure recommendation, not a deck builder. No AI product: EDHREChat was a 2023 April Fools page, offline since. |
| **Deckstats**   | deckstats.net   | Multi-format support, price tracking, collection management, draw simulator, export to MTGO/MTGA                                       | Free                    | ❌                          | ~200K users (~est.)                         | Less popular than Moxfield but solid feature set. Good for multi-format players.                                                                                                                                                                                                |
| **MtgGoldfish** | mtggoldfish.com | Meta analysis, price tracker, popular deck archetypes, Commander metagame data, Budget Commander articles                              | Free (Premium ads-free) | ❌                          | ~3M visits/month (~est.)                    | More analysis tool than deck builder. Very strong for metagame awareness.                                                                                                                                                                                                       |
| **Aetherhub**   | aetherhub.com   | Deck builder, tier lists, meta snapshots, live card prices, MTGA integration                                                           | Free                    | ❌                          | ~200K visits/month (~est.)                  | Strong for MTGA players, growing Commander section.                                                                                                                                                                                                                             |
| **Manastack**   | manastack.com   | Minimalist deck builder, basic collection tracking, price comparison                                                                   | Free                    | ❌                          | Small (~50K visits est.)                    | Niche, minimal community. Not a major competitor.                                                                                                                                                                                                                               |
| **Cube Cobra**  | cubecobra.com   | **Cube-focused** — cube drafting, virtual drafts, AI-powered card analysis, blog                                                       | Free (Open source)      | ✅ GitHub                   | ~100K cube creators (~est.)                 | Niche but technically impressive. Has ML-based card synergy scoring.                                                                                                                                                                                                            |

### Key Takeaways — Deck Builders

- **Moxfield** is the UX benchmark. Any new product will be compared to it.
- **EDHREC** is the data king but lacks personalization and a real deck builder interface.
- **Several competitors now use LLMs for intent-based suggestions** (see section 5). The opportunity moved from having AI to having AI whose output is validated and explained.
- Most tools are ad-supported or freemium with ~$3/month premium.

---

## 2. Tournament / Meta Databases

| Tool                 | URL                      | Format Focus                         | Key Features                                                                   | Notes                                                                        |
| -------------------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **MTGTop8**          | mtgtop8.com              | All competitive formats              | Largest historical database of Top 8 decklists; filter by format, date, event  | Extremely sparse UI (circa 2005) but irreplaceable data. No Commander focus. |
| **MTGDecks.net**     | mtgdecks.net             | All formats                          | Deck browser, meta stats, tournament results                                   | More modern than MTGTop8. Commander meta section growing.                    |
| **MTGGoldfish Meta** | mtggoldfish.com/metagame | Standard, Modern, Pioneer, Commander | Visual meta breakdowns, archetype share, price tracking by tier                | Best-in-class meta visualization. Commander section uses EDHREC data.        |
| **Melee.gg**         | melee.gg                 | Competitive (all games)              | Tournament management & registration, bracket software, deck submission portal | Used for large WotC-adjacent events, RCQs. B2B tournament tool.              |
| **Start.gg**         | start.gg                 | FGC + TCG                            | Tournament registration, brackets, streaming integration                       | Less MTG-specific; used for local events. Owned by Meta.                     |

---

## 3. Card Databases & Price Tools

| Tool             | URL             | Purpose                                         | Free API                            | Notes                                                                                                              |
| ---------------- | --------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Scryfall**     | scryfall.com    | Card search, images, rulings, legality, sets    | ✅ Free REST API (api.scryfall.com) | **The industry standard.** Every competitor uses it. 270k+ cards. Full image access. MagicAIBuilder must use this. |
| **TCGPlayer**    | tcgplayer.com   | US card marketplace, price data                 | ✅ Partner API (approval required)  | Largest US card market. Price data used by Moxfield, Archidekt, etc.                                               |
| **Card Kingdom** | cardkingdom.com | US buy/sell/buylist, price data                 | ❌ No public API                    | Trusted retailer; popular buylist tool for collection liquidation.                                                 |
| **Cardmarket**   | cardmarket.com  | EU card marketplace                             | ✅ API (approval required)          | Dominant in Europe. Used by Archidekt for EU pricing.                                                              |
| **Manabox**      | manabox.app     | Collection tracking, CSV import, price tracking | ❌ Mobile-first                     | App with good barcode scanner. Growing fast. See Mobile section.                                                   |
| **Card Trader**  | cardtrader.com  | EU marketplace                                  | ❌ Limited                          | Smaller than Cardmarket in EU.                                                                                     |

### Scryfall API — Critical Notes for MagicAIBuilder

- Free, no auth required for read operations
- Rate limit: keep sustained traffic under ~10 req/sec, and note that per-endpoint limits are tighter (card search is reported at 2/sec). Repeated overload after warnings risks a ban. **Confirm the current figures on scryfall.com — it blocks automated fetching, so this needs a human read.**
- Bulk data downloads available, now served as gzipped JSONL (plain JSON was reported to end on 2026-07-20), refreshed twice a day and including prices
- Cannot paywall access to Scryfall data
- Covers card text, legality, color identity, type line, oracle text — everything needed for AI processing

---

## 4. Mobile Apps

| App                          | Platform      | Key Features                                                                       | Rating             | Notes                                                                                                                                                                                                                                     |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manabox**                  | iOS / Android | Collection scanning (barcode), deck builder, price tracking, TCGPlayer integration | ⭐ 4.7 iOS (~est.) | Fastest-growing MTG mobile app. Excellent UX. **Biggest mobile threat.** 2026 added grid/stack deck views, collection data inside the scanner (PRO), QR-code deck sharing, and first-class proxy, playtest-card and signed-card tracking. |
| **TCGPlayer App**            | iOS / Android | Marketplace app, price scanning, collection selling                                | ⭐ 4.5 iOS (~est.) | Commerce-focused, not deck building.                                                                                                                                                                                                      |
| **MTG Companion** (official) | iOS / Android | Official WotC app: event locator, life counter, dice, format rules                 | ⭐ 3.5 iOS (~est.) | Mediocre UX. Limited features. No deck building.                                                                                                                                                                                          |
| **TopDecked**                | iOS / Android | Deck builder, meta tracker, collection manager, budget alerts                      | ⭐ 4.3 iOS (~est.) | Most fully-featured mobile deck builder. Paid premium (~$5/mo). Competitor in mobile space.                                                                                                                                               |
| **DraftSim**                 | Web/Mobile    | Draft simulator, set reviews, AI opponent                                          | ⭐ 4.0 (~est.)     | Draft-focused; not a deck builder. Useful for Limited players.                                                                                                                                                                            |

### Mobile Gap for MagicAIBuilder

- Manabox is excellent for collection/scanning but weak on AI suggestions
- TopDecked is solid but no AI features
- The 2026 AI builders (section 5) are web-first, so a mobile-first AI deck builder with voice/chat input remains **comparatively open** — but no longer uncontested in the browser

---

## 5. SaaS / AI Tools

> **Revised 2026-11-07.** The March 2026 version of this section concluded there was no production AI-native MTG deck builder. That is no longer true. The tools below were checked against their own public pages on 2026-11-07; marketing copy is a claim, not evidence.

### AI-native Commander builders

| Tool           | URL                                                                                             | What it ships                                                                                                                                                                                                                                                      | Pricing                                              | Gaps vs MagicAIBuilder                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **ManaTap**    | manatap.ai                                                                                      | Collection-aware AI chat, iterative "AI Workshop", Deck Checker scoring legality/curve/ramp/draw/removal/threats/synergy, deterministic legality and colour-identity validation, budget swaps, deck compare, price tracker, mulligan simulator, tournament manager | Free tier with limits; Pro ~$12.99/mo                | No playtest-session evidence, no printing-level acquisition planning, no source/freshness disclosure |
| **Farseek**    | farseek.ai                                                                                      | Claude-backed assistant that reads the whole decklist and argues why a card fits, live Scryfall lookups per recommendation, bracket + persistent budget constraints, commander finder, imports from Moxfield/Archidekt/ManaBox/text                                | Free weekly AI allowance; ~$9.99/mo or $1.99 one-off | States no deterministic legality validation; no ownership or playtest loop                           |
| **MTG Master** | mtgmaster.app                                                                                   | Bracket-aware and collection-aware 100-card generation enforcing legal commander, colour identity and singleton, with mana/draw/interaction/win-condition targets                                                                                                  | Free, optional Pro credits                           | Per-card explainability, evidence history, acquisition planning                                      |
| **ManaForge**  | manaforge.tools                                                                                 | Build-from-collection generation (paper or Arena), commander-swap suggestions, automatic re-validation of saved decks against live ban lists, Arena wildcard awareness                                                                                             | Free tier; from ~€9.99/mo                            | No Commander bracket analysis, no scanning, no playtest evidence                                     |
| Long tail      | mtg-agents.com, aidecktutor.com, onemoredeck.com, counterdeck.com, edhgen.ai, krakenthemeta.com | Prompt-to-decklist generation; some add live metagame web search (krakenthemeta) or name their model (onemoredeck uses Gemini)                                                                                                                                     | Mostly free                                          | Durable deck state, ownership, evidence, rules depth                                                 |

### Adjacent AI and data tools

| Tool                         | URL                    | Type                | AI Features                                                       | Notes                                                                                                                                       |
| ---------------------------- | ---------------------- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **17lands**                  | 17lands.com            | Draft analytics     | Data-driven (not LLM) — pick rates, win rates, opening hand stats | Industry standard for MTG Arena Limited. Purely statistical. No Commander support.                                                          |
| **Spellbook**                | commanderspellbook.com | Combo finder        | None                                                              | Largest Commander combo database. v0.84.0 (2026-10-20) added per-deck and per-card combo endpoints. Crucial data source for MagicAIBuilder. |
| **Moxfield AI**              | moxfield.com           | Deck suggestions    | Basic "similar cards" recommendations                             | Not LLM-based. Very limited AI.                                                                                                             |
| **EDHREC**                   | edhrec.com             | Recommendation data | None shipped                                                      | Lift replaced Synergy on 2026-10-01 — statistical, not generative. EDHREChat was a 2023 April Fools page, offline since 2023-04-04.         |
| **DraftAI / MTGDraftBot**    | various                | Draft               | Experimental ML bots                                              | Small community tools, not production-grade.                                                                                                |
| **ChatGPT/Claude (generic)** | —                      | General LLM         | Can discuss MTG but lacks real-time card data                     | Users already use these for deck ideas, but no structured MTG-aware interface.                                                              |

### Key Insight

The conversational-deckbuilding gap is closed, and closed cheaply. What is still rare is **AI output a player can check**:

- **Deterministic validation separated from generation.** ManaTap validates; Farseek explains; few do both and say which is which. MagicAIBuilder's validator runs after generation and the LLM never decides legality, colour identity, quantities or bracket rules.
- **Evidence the player produced.** Snapshot comparison and recorded playtest sessions let a recommendation be traced to data the player can inspect, not only to a model's confidence. No competitor checked here ships this loop.
- **Printing-level ownership and acquisition.** A cross-deck acquisition plan with known-price subtotals and explicit unpriced-copy disclosure is a different thing from a budget-swap suggestion.
- **Source and freshness disclosure.** Competitors present recommendations without saying where they came from or how stale they are.

The risk is now the inverse of March 2026: not that the market lacks AI builders, but that "AI Commander deck builder" reads as commodity. Positioning must lead with validation, explanation and evidence.

---

## 6. YouTube Channels (Commander/EDH Focus)

| Channel                        | URL                                   | ~Subscribers   | Format Focus | Content Style                                                                         |
| ------------------------------ | ------------------------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------- |
| **The Command Zone**           | youtube.com/@CommandZone              | ~700K (~est.)  | Commander    | Weekly show: gameplay, decktech, theory. Most professional production. Gold standard. |
| **EDHREC**                     | youtube.com/@EDHRECast                | ~250K (~est.)  | Commander    | Card breakdowns, commander spotlight, meta analysis. Data-driven.                     |
| **Tolarian Community College** | youtube.com/@TolarianCommunityCollege | ~800K+ (~est.) | All formats  | Product reviews, deck techs, Budget Commander series. Huge beginner influence.        |
| **Commander Sphere**           | youtube.com/@CommanderSphere          | ~150K (~est.)  | Commander    | Relaxed gameplay, casual focus, deck brewing                                          |
| **PlayingWithPower**           | youtube.com/@PlayingWithPower         | ~200K (~est.)  | cEDH         | Competitive Commander gameplay, high-power decklists.                                 |
| **Ranking Every Card**         | youtube.com/@RankingEveryCard         | ~200K (~est.)  | Commander    | Set reviews ranking every card for Commander. Very useful for brewers.                |
| **The Spike Feeders**          | youtube.com/@TheSpikeFeedersMTG       | ~150K (~est.)  | cEDH         | High-power Commander gameplay and discussion.                                         |
| **Play to Win**                | youtube.com/@PlaytoWin                | ~80K (~est.)   | cEDH         | cEDH theory and gameplay.                                                             |
| **Commanders Quarters**        | youtube.com/@CommandersQuarters       | ~350K+ (~est.) | Commander    | Budget-focused Commander decks ($25–$50 builds). Very popular with beginners.         |

### YouTube Strategy for MagicAIBuilder

- **Tolarian Community College** reviews products — a review/mention could be a major acquisition driver
- **Commanders Quarters** audience = budget players = potential early adopters for AI budgeting features
- Partnership content with Commander channels (sponsored deckbuilds using MagicAIBuilder) is an effective GTM channel

---

## 7. Social Media (TikTok / Instagram / Twitter)

| Creator | Platform | ~Followers | Focus | Content Style |
| ------------------------------- | ------------------------ | ------------- | ---------------- | ---------------------------------------------------- | -------------------------------- |
| **Tolarian Community College** | Twitter @TolarianCollege | ~200K (~est.) | All formats | Reviews, announcements, takes |
| **The Command Zone** | Twitter @CommandCast | ~120K (~est.) | Commander | Show updates, card reactions |
| **EDHREC** | Twitter @EDHRECast | ~80K (~est.) | Commander | Data insights, new commander spotlights |
| **MTGGoldfish** | Twitter @MTGGoldfish | ~150K (~est.) | All formats | Price alerts, meta updates, deck lists |
| **Commanders Quarters** | TikTok/Instagram | ~50K+ (~est.) | Commander/Budget | Short-form deck teasers |
| **CalebDMTG** | Twitter/YouTube | ~100K (~est.) | Commander/Spikes | Brewing content, spikey commander takes |
| **Various TikTok MTG creators** | TikTok | 10K–100K | Mixed | Trending card reactions, pack openings, budget brews | Market growing rapidly on TikTok |

### Social Media Notes

- **Twitter/X** remains the primary MTG discourse platform (spoiler reactions, bans, meta discussions)
- **TikTok** has an emerging MTG audience but skews younger/casual — opportunity for MagicAIBuilder short-form demos
- **Instagram** dominated by card photography, collection showcases, and alters

---

## 8. Forums & Communities

### Reddit

| Subreddit            | URL                         | ~Members       | Focus        | Notes                                                                          |
| -------------------- | --------------------------- | -------------- | ------------ | ------------------------------------------------------------------------------ |
| **r/magicTCG**       | reddit.com/r/magicTCG       | ~600K (~est.)  | General MTG  | News, spoilers, discussion, memes. Largest MTG community on Reddit.            |
| **r/EDH**            | reddit.com/r/EDH            | ~500K+ (~est.) | Commander    | Deck help, showcase, rules questions, casual focus. Very active daily.         |
| **r/CompetitiveEDH** | reddit.com/r/CompetitiveEDH | ~100K (~est.)  | cEDH         | High-power decklists, meta discussion, tier lists. Discerning audience.        |
| **r/mtgfinance**     | reddit.com/r/mtgfinance     | ~200K (~est.)  | Card finance | Buylist alerts, price spikes, speculation. Not deck building but market-aware. |

### Discord Servers (Major)

| Server                         | Focus                 | ~Members       | Notes                                            |
| ------------------------------ | --------------------- | -------------- | ------------------------------------------------ |
| **The Command Zone**           | Commander             | ~150K (~est.)  | Official server for the show. Very active.       |
| **EDHREC Official**            | Commander             | ~80K (~est.)   | Data discussion, commander brews                 |
| **cEDH**                       | Competitive Commander | ~50K (~est.)   | High-signal deck discussion, tier list debates   |
| **MTG Arena Official**         | MTGA                  | ~200K+ (~est.) | WotC-adjacent digital game community             |
| **Budget Commander**           | Budget EDH            | ~30K (~est.)   | $50 or less builds, Commanders Quarters adjacent |
| **Tolarian Community College** | All formats           | ~60K (~est.)   | Product discussions, brews                       |

### Forums

| Forum            | URL              | Status       | Notes                                                                                                                |
| ---------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **MTGSalvation** | mtgsalvation.com | 🔴 Declining | Long-running forum (via Fandom). Used to be THE MTG forum. Now largely replaced by Reddit. Still has legacy content. |
| **MTGNexus**     | mtgnexus.com     | 🟡 Niche     | Formed by ex-MTGSalvation community. Custom cards, design discussion. Small but dedicated.                           |

---

## 9. Podcasts & Twitch

### Top MTG Podcasts

| Podcast                      | Feed                      | ~Weekly Listeners | Format           | Notes                                                          |
| ---------------------------- | ------------------------- | ----------------- | ---------------- | -------------------------------------------------------------- |
| **The Command Zone Podcast** | commandzone.transistor.fm | ~100K+ (~est.)    | Commander        | The most downloaded MTG podcast. Same team as YouTube channel. |
| **EDHRECast**                | —                         | ~30K+ (~est.)     | Commander        | Weekly Commander card discussions. Data-informed.              |
| **Commander Cookout**        | —                         | ~20K (~est.)      | Commander        | Budget/gameplay focus. Friendly format.                        |
| **The Spike Feeders**        | —                         | ~15K (~est.)      | cEDH             | High-power Commander discussion.                               |
| **Scryings**                 | —                         | ~10K (~est.)      | Cube/All formats | Cube-focused. Niche but respected.                             |
| **Deckmaster's Domain**      | —                         | Emerging          | Commander        | Newer entry.                                                   |

### Twitch Streamers

| Streamer          | Channel                 | ~Avg Viewers   | Format             | Notes                                  |
| ----------------- | ----------------------- | -------------- | ------------------ | -------------------------------------- |
| **NumotTheNummy** | twitch.tv/numotthenummy | ~3K (~est.)    | All formats        | Veteran streamer. Draft + constructed. |
| **Merchant**      | twitch.tv/merchant      | ~2K (~est.)    | MTGA               | MTGA-focused, lots of brews and jank   |
| **CovertGoBlue**  | twitch.tv/covertgoblue  | ~2K (~est.)    | All formats        | Well-known for draft content           |
| **JeffHoogland**  | twitch.tv/jeffhoogland  | ~1.5K (~est.)  | Modern/Competitive | Spike-focused, modern content          |
| **Command Zone**  | twitch.tv/commandzone   | ~1K–3K (~est.) | Commander          | Stream events, gameplay shows          |

---

## 10. Key Data Sources & APIs for MagicAIBuilder

| Source                  | URL                        | Data Type                                    | Access                        | Priority                             |
| ----------------------- | -------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------------ |
| **Scryfall API**        | api.scryfall.com           | Cards, images, rulings, legality, sets       | ✅ Free, no auth              | 🔴 Critical                          |
| **Commander Spellbook** | commanderspellbook.com/api | Commander combo database                     | ✅ Free                       | 🟠 High                              |
| **EDHREC API**          | edhrec.com/api             | Commander card recommendations, synergy data | ⚠️ Unofficial/rate-limited    | 🟠 High                              |
| **Moxfield**            | moxfield.com               | Deck data                                    | ❌ No public API              | 🟡 Consider scraping or partnerships |
| **TCGPlayer**           | tcgplayer.com              | Card prices (US)                             | ✅ Partner program (approval) | 🟡 Medium (for pricing features)     |
| **Cardmarket**          | cardmarket.com             | Card prices (EU)                             | ✅ Approval required          | 🟡 Medium (EU users)                 |

---

## Strategic Insights for MagicAIBuilder

### 🎯 Primary Opportunity: Checkable AI, Not AI

**Revised 2026-11-07.** The original framing — "no tool offers conversational, intent-aware deck building" — is obsolete. Several shipped tools do (section 5), several are free, and one is explicitly Claude-backed.

**The real gap:** no competitor closes the loop between generation, deterministic validation, player-produced evidence and ownership. Today a player must still:

1. Generate a list from one AI tool that may not validate its own output
2. Re-check legality, colour identity, singleton and bracket rules somewhere else
3. Test the deck and keep the results in their head or a spreadsheet
4. Work out separately which printings they already own and what the rest costs

**MagicAIBuilder can own:** "Tell me what you want to play → get a deck whose every claim is checked, explained, testable and costed."

### 🏆 Features to Copy (Table Stakes)

- **Moxfield-level UI polish** — users have high expectations. Slow or ugly = instant churn.
- **Real-time pricing** — multi-source (TCGPlayer + Card Kingdom at minimum)
- **EDHREC data integration** — use their card popularity data as a signal layer
- **Scryfall card search** — don't reinvent this; integrate via API
- **Export formats** — MTGO, MTGA, text, PDF

### 🚀 Features to Differentiate

- ~~**Conversational deck building**~~ — now table stakes, not a differentiator. Keep it excellent; do not market it as the edge.
- **Validated output with a visible verdict** — show which claims were checked against card data and which are the model reasoning
- **Budget upgrade paths** — "Here's your $50 deck; here are the $5, $20, $50 upgrade milestones"
- **Synergy explanation** — natural language explanations of why cards were chosen together
- **Playgroup meta awareness** — "My playgroup is power level 6-7, no stax" → adjust recommendations
- **Commander Spellbook integration** — surface unintentional/intentional combo alerts
- **Playtest evidence that feeds the next suggestion** — no competitor checked on 2026-11-07 ships this loop
- **Printing-level ownership and a cross-deck acquisition plan** — deeper than a budget-swap suggestion
- **Mobile-first AI** — ManaBox has the scanner; the AI builders are web-first, so mobile remains comparatively open

### ⚠️ Risks & Pitfalls

- **Scryfall dependency** — rate limits must be respected; cache aggressively and use bulk data
- **Commoditized AI** — entry tiers are free and several tools generate decks instantly. Speed and volume are lost battles; being checkable is the defensible one.
- **EDHREC competition** — still no shipped AI product, but their data advantage means they could add one; Lift shows they prefer statistical rigour to generation
- **Upstream contract drift** — EDHREC changed its synergy metric, Moxfield closed programmatic access, Scryfall changed bulk format and tightened limits, all within 2026. Integrations need contract tests and an explicit fallback, not optimism.
- **Moxfield's moat** — their social features and history are hard to replicate; don't compete head-on; integrate instead
- **AI hallucination** — LLMs suggest non-existent cards or wrong color identities; must validate every card against Scryfall before output
- **cEDH vs casual divide** — power level calibration is critical; getting this wrong alienates both audiences

### 📊 Market Size Signals

- r/EDH: ~500K members (Commander casual)
- r/CompetitiveEDH: ~100K (cEDH)
- EDHREC: ~5M monthly visits (Commander players actively building)
- Moxfield: ~3M registered users
- **~$1B+** global secondary card market (price data is a key feature pull)

### 🤝 Distribution Channels

1. **Reddit** (r/EDH, r/CompetitiveEDH) — genuine community engagement, not spam
2. **Tolarian Community College** — a product review here = 10K+ signups
3. **Discord servers** (Command Zone, EDHREC) — demo clips, beta invites
4. **TikTok** — 30-second "AI builds a deck in real time" clips = viral potential
5. **EDHREC partnership / API integration** — if EDHREC recommends using MagicAIBuilder, game over

---

_Sections 1, 3, 4 and 5 and the strategic insights were revised on 2026-11-07 against the platforms' own public pages. The remaining sections date from March 2026 and are unverified: subscriber, traffic and rating figures are approximate estimates, and competitor capabilities change without notice._
