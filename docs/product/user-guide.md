# MagicAIBuilder — User Guide

_Last updated: 2026-04-06_

## Landing Page

When you first visit MagicAIBuilder without being logged in, you'll see an immersive 3D spellbook scene:

- **ARCHITECT** (indigo glyph, left page) — click to Sign In
- **RECRUIT** (green glyph, right page) — click to Sign Up
- The camera zooms cinematically into your chosen glyph before redirecting

On mobile devices or with `prefers-reduced-motion`, a clean 2D fallback is shown instead.

---

## Getting Started

### Creating a Deck

1. Open the app and sign in
2. Click **New Deck** in the header
3. Choose your **format** (Commander, Standard, Modern, Pioneer, Legacy, Vintage, Pauper, Brawl, Oathbreaker)
4. Name your deck and it will appear in the deck list
5. Click the deck to open the builder

### Format Rules

Each format has different rules that are automatically enforced:

| Format      | Deck Size | Copies        | Commander | Bracket |
| ----------- | --------- | ------------- | --------- | ------- |
| Commander   | 100       | 1 (singleton) | Required  | Yes     |
| Brawl       | 60        | 1 (singleton) | Required  | No      |
| Oathbreaker | 60        | 1 (singleton) | Required  | No      |
| Standard    | 60        | Up to 4       | No        | No      |
| Pioneer     | 60        | Up to 4       | No        | No      |
| Modern      | 60        | Up to 4       | No        | No      |
| Legacy      | 60        | Up to 4       | No        | No      |
| Vintage     | 60        | Up to 4       | No        | No      |
| Pauper      | 60        | Up to 4       | No        | No      |

Search results are automatically filtered to show only cards legal in your deck's format.

### Building a Deck

The builder has three panels:

- **Left** — Card search
- **Center** — Deck editor
- **Right** — Stats & analysis

#### Searching for Cards

- Use the **Name** tab to search by card name
- Use **By Set** to browse cards from a specific expansion
- Use **By Color** to browse by color identity
- Click **Show filters** to filter by CMC, price, color

#### Adding Cards

- Click a card to add it to your deck
- Drag a card from search into the deck editor
- The printing selector lets you pick your preferred art
- **Cards are added to the active zone** — if you're on the Sideboard tab, clicking or dragging adds there

#### Deck Zones (Main / Sideboard / Considering)

The deck editor has three tabs:

- **Main** — your 99-card main deck
- **Sideboard** — cards available for sideboard play
- **Considering** — cards you're evaluating but haven't committed to

Switch tabs to view, add, or move cards between zones. The card count in the header only reflects Main zone cards.

#### Grid vs List View

Toggle between **Grid** (card images) and **List** (categorized rows) using the icons in the toolbar.

In **Grid mode**, a density picker appears (2 / 3 / 4 / 6 / 8 columns). Default is 6.

- Hover a card to see the **remove** button (×) and zone move shortcuts
- Click any card (including commander) to open the **printing selector**

#### Setting Your Commander

1. Enable **Commander** mode in the search panel
2. Search for your commander
3. Click to set them as commander

#### Partner / Background (second commander slot)

Some commanders support a **second slot** (shown next to the Commander button):

- **Partner / Partner With / Friends Forever / Doctor’s Companion**: enable the second-slot button, search, then click the card to set it.
- **Choose a Background** commanders (e.g. Jaheira): the second-slot button becomes **Background**. Use it to search and select a **Background** enchantment.

Notes:

- The **Background** search targets Background cards (not commanders).
- If you accidentally click a Background while Commander mode is enabled, the app will treat it as the **Background slot** (it won’t replace your commander).

#### Ikoria Companion (outside the 99)

This is **not** the same as the Partner / Background slot — it is the optional **[Companion](https://mtg.fandom.com/wiki/Companion)** mechanic: **at most one** card, **outside** your 99, listed in the companion zone for deck registration (separate from arbitrary **Sideboard** tab cards).

1. Set your **commander** first (the **Companion** button stays disabled until then).
2. Enable **Companion** in the search row (next to **Commander** / **Partner**). Results are filtered to Companion keyword cards (`keyword:companion`, Commander-legal).
3. Click a card to set it as your companion. It appears under **Companion (sideboard)** above the zone tabs — **not** inside the Sideboard list. In **grid (image) view**, the companion’s **card image** is also shown in the main deck grid **right after** your commander (and partner, if any), with a **COMP** badge; hover the tile and use **×** to clear, or use **Clear** in the companion block.
4. Use **Clear** in that block to remove the companion.

The editor shows a **short rule summary** where the app encodes it (for example Lurrus → each card’s mana value ≤ 2) and **warnings** if commander color identity or that mechanical check fails. For companions we only describe as **custom**, verify the printed **Companion —** rule yourself; **Lutri** is blocked as a companion in Commander in-app.

### Deck Statistics

The right panel shows:

- **Bracket score** (1–4) based on your deck's power level
- **Game Changers** count (cards that push bracket to 3+)
- **⚡ Game Changer badge** — any GC forces Bracket 3 minimum; >3 forces Bracket 4
- **∞ 2-card combo badge** — if your deck contains an infinite combo with exactly 2 cards, Bracket 4 is forced automatically (RC rule), shown with a red ∞ icon
- **AI suggestions** for improvement
- **Combo detection** via Commander Spellbook
- **Mana curve**, color distribution, category breakdown

For **non-Commander decks** the panel swaps the Commander benchmarks for checks that fit the format:

- **Curve** — the average mana value your format tends to want. Legacy and Vintage decks are expected to be cheaper than Standard ones.
- **Threats** — creatures, planeswalkers and win conditions, as a share of your non-land cards. Too few and the deck never closes a game.
- **Interaction** — removal, board wipes and protection, same share. Too little and you cannot answer what the opponent does.

The card count is also measured against your format's real deck size (60 rather than 100), and the Commander-only bracket targets are hidden.

These bands are **guidance, not rules** — a deliberate combo deck can sit far outside them and still be excellent. Treat an out-of-range reading as a reason to look, not a verdict.

### Playtesting a Deck

Click **Playtest** in the builder toolbar to goldfish your deck — play it solo, with no opponent, to see how it opens and flows.

**Starting a game.** Choose _Draw opening hand_ to shuffle and deal seven cards.

**Mulligans.** _Mulligan_ reshuffles and deals one card fewer, following the London rule. Because there is no opponent to play against, the app keeps a random `7 − N` hand rather than asking you to put cards on the bottom — statistically the same result, one step fewer. Mulligans are offered only while the opening hand is still in question: once you advance a turn or put a permanent onto the battlefield, the button greys out. You can take at most six.

**Turn structure.** The phase tracker walks the turn: Untap → Upkeep → Draw → Main 1 → Combat → Main 2 → End. _Next phase_ steps one at a time and rolls into the next turn after End, untapping everything. _Next turn_ skips straight ahead and draws a card.

**Life total.** Starts at the total for your deck's format — 40 in Commander, 30 in Brawl, 20 in Standard, Modern, Pioneer, Legacy, Vintage, Pauper and Oathbreaker. Use the ±1 / ±5 buttons or type any amount. Every change is logged with its turn and phase, and _Undo last action_ steps back through the last ten actions.

**Zones.** Click a card in hand to send it to the **battlefield** or the **graveyard**. On the battlefield you can tap and untap it, add or remove counters, or move it to the graveyard. Graveyard and exile are collapsible lists, and any card in them can be returned to another zone.

**Restart** deals the whole deck again from scratch, clearing mulligans, life changes and every zone. Closing the playtest discards the game — reopening always starts fresh.

---

## Community Decks

### Browsing decks for a commander

Every commander has a public page listing the decks other players have shared for it: `/commanders/<commander-slug>/decks` — for example `/commanders/atraxa-praetors-voice/decks`. You can also reach it from the **Meta** panel in the builder, via _Browse community decks for this commander_.

The page is public: anyone can read it, signed in or not. Decks are ordered by community votes, and each row shows the deck's star average and its **Community Favourite** badge when it has earned one.

If nobody has published a deck for that commander yet, the page says so rather than showing an error.

### Voting

Each deck has an up/down arrow. Voting says "this deck belongs near the top of the list" — it is a separate signal from the 1–5 stars, which say "this deck is good".

- Click the arrow again to take your vote back.
- Changing your mind replaces your vote; you never get two.
- You cannot vote on your own deck.
- You need to be signed in — the arrows are visible but disabled otherwise.

---

## Collection Mode

The Collection Mode lets you track your physical MTG card collection so you can see which cards you already own when building decks.

### Adding Cards to Your Collection

**From the Collection page:**

1. Navigate to **Collection** in the header
2. Click **Add Card**
3. Search for a card by name
4. Set the quantity, condition, and whether it's foil
5. Click **Add to Collection**

**Conditions:** NM (Near Mint), LP (Lightly Played), MP (Moderately Played), HP (Heavily Played), DMG (Damaged)

### Viewing Your Collection

The `/collection` page shows:

- **Unique Cards** — how many distinct cards you own
- **Total Cards** — total physical copies across all entries
- **Total Value** — estimated value based on purchase prices entered

Switch between **Grid view** (card art) and **List view** (table with quantity controls) using the icons in the top right.

Use the **search bar** to filter your collection by card name.

### Seeing Card Art + Changing Printings

- **List view**: hover a card name to see its **image preview**.
- **Grid view**: hover a card and click **Art** to open the **printings modal**.
- **List view**: hover a row and click the small **image** icon to open the **printings modal**.

Selecting a printing updates the saved art/printing for that collection entry.

### Managing Quantities

**In List view:** Use the `−` and `+` buttons next to each card to adjust quantity. Setting to 0 removes the card.

**In Grid view:** Hover over a card to see quantity controls and a Remove button.

### Seeing Your Collection in the Deck Builder

When you have cards in your collection:

**In Search Results:**

- Cards you own show a green **In Collection (xN)** badge
- Use the **📦 Show only collection cards** toggle in the filters to limit search results to cards you own

**In the Deck Editor:**

- Each card in your deck shows either:
  - **📦 Owned** (green) — you have this card in your collection
  - **🛒 Buy** (amber) — you need to acquire this card

This lets you instantly see what you need to buy to complete a deck.

### Tips

- The collection filter only appears if you have at least one card in your collection
- Foil and non-foil copies are tracked separately
- Collection data is stored in the same PostgreSQL database as your decks

---

## Import / Export

### Importing a Deck

Click **Import** in the deck builder header to paste a decklist in:

- Plain text format (one card per line: `1 Card Name`)
- MTGO format
- Arena format

### Exporting a Deck

Click **Export** in the deck builder to copy your deck in various formats.

---

## Keyboard Shortcuts

| Action         | Shortcut               |
| -------------- | ---------------------- |
| Search         | Type in the search bar |
| Commander mode | Click the Crown button |
| Rename deck    | Click the deck name    |

---

## Troubleshooting

**Cards not showing prices:** Prices come from Scryfall and may be null for some cards. Enter a price manually in the collection.

**Build shows too many results:** Use the Commander filter to narrow search to legal commander cards, or the Collection filter to show only owned cards.

**Deck not loading:** If you navigate directly to a deck URL, the app will reload the deck from the database automatically.
