# MagicAIBuilder — User Guide

## Getting Started

### Creating a Deck
1. Open the app at `http://localhost:3000`
2. Click **New Deck** in the header
3. Name your deck and it will appear in the deck list
4. Click the deck to open the builder

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

### Deck Statistics
The right panel shows:
- **Bracket score** (1–4) based on your deck's power level
- **Game Changers** count (cards that push bracket to 3+)
- **⚡ Game Changer badge** — any GC forces Bracket 3 minimum; >3 forces Bracket 4
- **∞ 2-card combo badge** — if your deck contains an infinite combo with exactly 2 cards, Bracket 4 is forced automatically (RC rule), shown with a red ∞ icon
- **AI suggestions** for improvement
- **Combo detection** via Commander Spellbook
- **Mana curve**, color distribution, category breakdown

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

| Action | Shortcut |
|--------|----------|
| Search | Type in the search bar |
| Commander mode | Click the Crown button |
| Rename deck | Click the deck name |

---

## Troubleshooting

**Cards not showing prices:** Prices come from Scryfall and may be null for some cards. Enter a price manually in the collection.

**Build shows too many results:** Use the Commander filter to narrow search to legal commander cards, or the Collection filter to show only owned cards.

**Deck not loading:** If you navigate directly to a deck URL, the app will reload the deck from the database automatically.
