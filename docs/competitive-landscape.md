# MTG Competitive Landscape

> **Last updated:** March 2026  
> **Purpose:** Product strategy reference for MagicAIBuilder (AI-powered Commander deck builder)  
> **Note:** Traffic/subscriber figures marked `~est.` are approximations based on publicly available data and community knowledge. Exact figures require direct access to analytics platforms.

---

## Executive Summary

1. **EDHREC dominates Commander recommendation** — it's the go-to data engine (44,808+ decks for top commanders) but its UX is dated and its "suggestions" are purely statistical, not contextual or personalized. This is MagicAIBuilder's primary disruption target.

2. **Moxfield owns the deck-building workflow** — clean UI, fast, social features, used by competitive and casual players alike. Any new tool must match or exceed its UX polish. It has no public API.

3. **No platform does true AI/LLM-powered deck building** — 17lands does data-driven draft assistance, but nobody has shipped a conversational or intent-based Commander deck builder. This is a clear market gap.

4. **The community is fragmented across many platforms** — YouTube, Reddit, Discord, TikTok all have distinct audiences. Content creators (Command Zone, Tolarian Community College) have massive influence on product adoption.

5. **Scryfall's free API is the critical infrastructure** — every competitor uses it. MagicAIBuilder should too. No need to reinvent card data.

---

## 1. Deck Builders

| Tool            | URL             | Key Features                                                                                                                           | Free/Paid               | Public API                  | ~Traffic / Users                            | Notes                                                                                              |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Moxfield**    | moxfield.com    | Fast editor, playtesting, collection tracking, social feed, printing, budget toggles, powerful filters                                 | Free (Premium ~$3/mo)   | ❌ None public              | ~3M+ registered users (~est.)               | Current gold standard for UX. Used by streamers/pros. Blocks scrapers.                             |
| **Archidekt**   | archidekt.com   | Visual deck builder, category labels, multi-price comparison (TCG/CK/Cardmarket), commander color identity helper, collaborative decks | Free (Pro ~$3/mo)       | ❌ Limited                  | ~500K users (~est.)                         | Built by Space Cow Media. Data from Scryfall + EDHREC. Good UI, strong Commander features.         |
| **TappedOut**   | tappedout.net   | Forum-first community, deck sharing, budget analysis, card set completion, long comment threads, legacy primer support                 | Free (Premium $5/mo)    | ✅ Partial REST             | ~400K+ registered users (~est.)             | Older platform, community is loyal but UI is dated. Good for discovering primers.                  |
| **EDHRec**      | edhrec.com      | Card recommendations by commander (statistical), theme pages, budget filter, salt score, combo finder, articles                        | Free (Patreon)          | ✅ Partial (edhrec.com/api) | #1 Commander site, ~5M visits/month (~est.) | Data powerhouse. 44,808 decks for Ur-Dragon alone. Pure recommendation, not a deck builder per se. |
| **Deckstats**   | deckstats.net   | Multi-format support, price tracking, collection management, draw simulator, export to MTGO/MTGA                                       | Free                    | ❌                          | ~200K users (~est.)                         | Less popular than Moxfield but solid feature set. Good for multi-format players.                   |
| **MtgGoldfish** | mtggoldfish.com | Meta analysis, price tracker, popular deck archetypes, Commander metagame data, Budget Commander articles                              | Free (Premium ads-free) | ❌                          | ~3M visits/month (~est.)                    | More analysis tool than deck builder. Very strong for metagame awareness.                          |
| **Aetherhub**   | aetherhub.com   | Deck builder, tier lists, meta snapshots, live card prices, MTGA integration                                                           | Free                    | ❌                          | ~200K visits/month (~est.)                  | Strong for MTGA players, growing Commander section.                                                |
| **Manastack**   | manastack.com   | Minimalist deck builder, basic collection tracking, price comparison                                                                   | Free                    | ❌                          | Small (~50K visits est.)                    | Niche, minimal community. Not a major competitor.                                                  |
| **Cube Cobra**  | cubecobra.com   | **Cube-focused** — cube drafting, virtual drafts, AI-powered card analysis, blog                                                       | Free (Open source)      | ✅ GitHub                   | ~100K cube creators (~est.)                 | Niche but technically impressive. Has ML-based card synergy scoring.                               |

### Key Takeaways — Deck Builders

- **Moxfield** is the UX benchmark. Any new product will be compared to it.
- **EDHREC** is the data king but lacks personalization and a real deck builder interface.
- **No competitor uses LLM/AI for intent-based suggestions** — this is the opportunity.
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
- Rate limit: ~10 req/sec (honor with delays)
- Bulk data downloads available (full card JSON)
- Cannot paywall access to Scryfall data
- Covers card text, legality, color identity, type line, oracle text — everything needed for AI processing

---

## 4. Mobile Apps

| App                          | Platform      | Key Features                                                                       | Rating             | Notes                                                                                       |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| **Manabox**                  | iOS / Android | Collection scanning (barcode), deck builder, price tracking, TCGPlayer integration | ⭐ 4.7 iOS (~est.) | Fastest-growing MTG mobile app. Excellent UX. **Biggest mobile threat.**                    |
| **TCGPlayer App**            | iOS / Android | Marketplace app, price scanning, collection selling                                | ⭐ 4.5 iOS (~est.) | Commerce-focused, not deck building.                                                        |
| **MTG Companion** (official) | iOS / Android | Official WotC app: event locator, life counter, dice, format rules                 | ⭐ 3.5 iOS (~est.) | Mediocre UX. Limited features. No deck building.                                            |
| **TopDecked**                | iOS / Android | Deck builder, meta tracker, collection manager, budget alerts                      | ⭐ 4.3 iOS (~est.) | Most fully-featured mobile deck builder. Paid premium (~$5/mo). Competitor in mobile space. |
| **DraftSim**                 | Web/Mobile    | Draft simulator, set reviews, AI opponent                                          | ⭐ 4.0 (~est.)     | Draft-focused; not a deck builder. Useful for Limited players.                              |

### Mobile Gap for MagicAIBuilder

- Manabox is excellent for collection/scanning but weak on AI suggestions
- TopDecked is solid but no AI features
- A mobile-first AI deck builder with voice/chat input is **uncontested territory**

---

## 5. SaaS / AI Tools

| Tool                         | URL                    | Type                      | AI Features                                                       | Notes                                                                                    |
| ---------------------------- | ---------------------- | ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **17lands**                  | 17lands.com            | Draft analytics           | Data-driven (not LLM) — pick rates, win rates, opening hand stats | Industry standard for MTG Arena Limited. Purely statistical. No Commander support.       |
| **Spellbook**                | commanderspellbook.com | Combo finder              | None                                                              | Largest Commander combo database. API available. Crucial data source for MagicAIBuilder. |
| **Moxfield AI**              | moxfield.com           | Deck suggestions          | Basic "similar cards" recommendations                             | Not LLM-based. Very limited AI.                                                          |
| **DraftAI / MTGDraftBot**    | various                | Draft                     | Experimental ML bots                                              | Small community tools, not production-grade.                                             |
| **ChatGPT/Claude (generic)** | —                      | General LLM               | Can discuss MTG but lacks real-time card data                     | Users already use these for deck ideas, but no structured MTG-aware interface.           |
| **MagicAIBuilder** _(us)_    | —                      | AI Commander deck builder | **Target: full LLM-powered intent-based deck building**           | **Direct gap in market. No real competitor.**                                            |

### Key Insight

There is **no production AI-native MTG deck builder** with:

- Conversational interface ("Build me a Yuriko ninja tribal on a $100 budget")
- Real-time Scryfall card data integration
- Commander-rules-aware suggestions (color identity, singleton, etc.)
- Synergy scoring beyond pure statistics

This is MagicAIBuilder's core value proposition.

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

| Creator                         | Platform                 | ~Followers    | Focus            | Content Style                                        |
| ------------------------------- | ------------------------ | ------------- | ---------------- | ---------------------------------------------------- | -------------------------------- |
| **Tolarian Community College**  | Twitter @TolarianCollege | ~200K (~est.) | All formats      | Reviews, announcements, takes                        |
| **The Command Zone**            | Twitter @CommandCast     | ~120K (~est.) | Commander        | Show updates, card reactions                         |
| **EDHREC**                      | Twitter @EDHRECast       | ~80K (~est.)  | Commander        | Data insights, new commander spotlights              |
| **MTGGoldfish**                 | Twitter @MTGGoldfish     | ~150K (~est.) | All formats      | Price alerts, meta updates, deck lists               |
| **Commanders Quarters**         | TikTok/Instagram         | ~50K+ (~est.) | Commander/Budget | Short-form deck teasers                              |
| **CalebDMTG**                   | Twitter/YouTube          | ~100K (~est.) | Commander/Spikes | Brewing content, spikey commander takes              |
| **Various TikTok MTG creators** | TikTok                   | 10K–100K      | Mixed            | Trending card reactions, pack openings, budget brews | Market growing rapidly on TikTok |

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

### 🎯 Primary Opportunity: AI-Native Commander Deck Builder

**Gap:** No tool offers conversational, intent-aware deck building. Users today must:

1. Go to EDHREC for card ideas (statistical, not contextual)
2. Manually add cards in Moxfield (no AI guidance)
3. Cross-reference combo databases manually

**MagicAIBuilder can own:** "Tell me what you want to play → get a complete, synergy-optimized, budget-aware Commander deck."

### 🏆 Features to Copy (Table Stakes)

- **Moxfield-level UI polish** — users have high expectations. Slow or ugly = instant churn.
- **Real-time pricing** — multi-source (TCGPlayer + Card Kingdom at minimum)
- **EDHREC data integration** — use their card popularity data as a signal layer
- **Scryfall card search** — don't reinvent this; integrate via API
- **Export formats** — MTGO, MTGA, text, PDF

### 🚀 Features to Differentiate

- **Conversational deck building** — "Build me Yuriko ninja tribal, $100 budget, avoiding infinite combos" → complete deck
- **Budget upgrade paths** — "Here's your $50 deck; here are the $5, $20, $50 upgrade milestones"
- **Synergy explanation** — natural language explanations of why cards were chosen together
- **Playgroup meta awareness** — "My playgroup is power level 6-7, no stax" → adjust recommendations
- **Commander Spellbook integration** — surface unintentional/intentional combo alerts
- **Mobile-first AI** — Manabox has the scanner; we add the brain

### ⚠️ Risks & Pitfalls

- **Scryfall dependency** — rate limits must be respected; cache aggressively and use bulk data
- **EDHREC competition** — they could add AI features at any time given their data advantage
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

_Research conducted March 2026. Data sourced via web fetch of platform homepages, EDHREC public commander rankings, Scryfall API documentation, and community knowledge. Subscriber/traffic figures are approximate estimates unless otherwise noted._
