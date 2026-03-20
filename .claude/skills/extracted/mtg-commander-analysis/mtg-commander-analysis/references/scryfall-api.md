# Scryfall API Reference

Scryfall is the single source of truth for card data: oracle text, legality, prices, and rulings.

**Base URL:** `https://api.scryfall.com`

## Rate Limits
- 10 requests/second max (50-100ms delay between requests)
- Must include `User-Agent` and `Accept` headers
- Prefer `/cards/collection` for batch lookups (up to 75 cards per request)

## Key Endpoints

### Card Search
```
GET /cards/search?q={query}&order={order}&unique={unique}&page={page}
```
Returns paginated list (175 cards/page).

**Search syntax (q parameter):**

| Operator | Example | Description |
|----------|---------|-------------|
| `c:` or `color:` | `c:rug`, `c>=wb` | Color / color identity |
| `id:` | `id:mardu`, `id<=rg` | Color identity (for Commander!) |
| `t:` or `type:` | `t:legendary t:creature` | Card type, supertype, subtype |
| `o:` or `oracle:` | `o:"draw a card"` | Oracle text search |
| `m:` or `mana:` | `m:{2}{U}{U}` | Mana cost |
| `cmc:` or `mv:` | `cmc<=3` | Mana value |
| `pow:` / `tou:` | `pow>=5 tou<=2` | Power / toughness |
| `f:` or `format:` | `f:commander` | Format legality |
| `legal:` / `banned:` | `banned:commander` | Legality status |
| `r:` or `rarity:` | `r:mythic` | Rarity |
| `s:` or `set:` | `s:mh3` | Set code |
| `is:` | `is:commander`, `is:fetchland` | Card properties |
| `has:` | `has:watermark` | Card features |
| `usd<` / `eur<` | `usd<5` | Price filter |
| `year:` | `year>=2024` | Release year |
| `keyword:` | `keyword:flying` | Keyword abilities |

**Operators:** `=`, `!=`, `<`, `>`, `<=`, `>=`, `:` (partial match)
**Logic:** `or`, `-` (negate), `()` for grouping

**Order options:** `name`, `set`, `released`, `rarity`, `color`, `usd`, `tix`, `eur`, `cmc`, `power`, `toughness`, `edhrec` (EDHREC rank), `penny`, `artist`, `review`

**Unique options:** `cards` (default), `art`, `prints`

### Card by Exact Name
```
GET /cards/named?exact={name}
GET /cards/named?fuzzy={name}
```
Use `exact` for precise matches, `fuzzy` for approximate. Returns full card object with oracle text, legality, prices, etc.

### Card by ID
```
GET /cards/{id}
GET /cards/{set}/{collector_number}
```

### Batch Lookup (preferred for multiple cards)
```
POST /cards/collection
Body: { "identifiers": [{"name": "Sol Ring"}, {"name": "Command Tower"}, ...] }
```
Up to 75 cards per request. Much more efficient than individual lookups.

### Rulings
```
GET /cards/{id}/rulings
GET /cards/{set}/{collector_number}/rulings
```
Returns official Gatherer rulings for a card.

### Bulk Data
```
GET /bulk-data
```
Returns download links for complete datasets:
- `oracle_cards` - One entry per card name (unique oracle text)
- `all_cards` - Every printing
- `rulings` - All rulings
- `default_cards` - Default printing per card

### Catalog (useful for autocomplete)
```
GET /catalog/card-names
GET /catalog/creature-types
GET /catalog/keyword-abilities
```

## Card Object Key Fields

```json
{
  "name": "Sol Ring",
  "mana_cost": "{1}",
  "cmc": 1.0,
  "type_line": "Artifact",
  "oracle_text": "{T}: Add {C}{C}.",
  "colors": [],
  "color_identity": [],
  "keywords": [],
  "legalities": { "commander": "legal", "standard": "not_legal", ... },
  "edhrec_rank": 1,
  "prices": { "usd": "1.50", "usd_foil": "3.00", "eur": "1.20" },
  "rarity": "uncommon",
  "set": "cmm",
  "set_name": "Commander Masters"
}
```

## Common Queries for Commander Analysis

```
# Find all legal commanders in a color identity
f:commander t:legendary t:creature id<=bg

# Find removal in color identity under $2
f:commander id<=wr o:destroy usd<2

# Find ramp cards in green under $1
f:commander id<=g (o:"search your library" o:"add" t:land) cmc<=3 usd<1

# Find card draw in blue
f:commander id<=u (o:"draw" -o:"opponent draws") t:instant or t:sorcery

# Check a specific card's commander legality
f:commander exact:"Cyclonic Rift"
```
