# Commander Game Changers List

**Last updated:** February 9, 2026 (verified via Scryfall API March 2026)
**Total:** 53 cards

Game Changers are cards that dramatically warp Commander games. They define bracket placement:
- **Bracket 1–2:** 0 Game Changers allowed
- **Bracket 3:** Up to 3 Game Changers allowed
- **Bracket 4:** Unlimited

---

## Live Source of Truth

Always use Scryfall for the authoritative current list:

**Web:** [scryfall.com/search?q=is:gamechanger](https://scryfall.com/search?as=grid&order=color&q=is:gamechanger)

**API (full list):**
```
GET https://api.scryfall.com/cards/search?q=is:gamechanger&order=color
```

**Per-card check:**
```
GET https://api.scryfall.com/cards/named?exact={card_name}
# Response includes: game_changer: true/false
```

**Implementation:** Fetch and cache on app init (24h TTL). Count matching cards on every decklist change.

Community mirrors (secondary, may lag):
- [Moxfield Game Changers](https://moxfield.com/commanderbrackets/gamechangers)
- [EDHREC Top Game Changers](https://edhrec.com/top/game-changers)
- [PlayingMTG Game Changers](https://playingmtg.com/game-changers/)

---

## Current List (53 cards — verified March 2026)

> Prices from Scryfall (USD, paper). `—` = reserved list / no regular printing.

### White (7)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Drannith Magistrate | 2 | $11 | Locks opponents out of casting from anywhere but hand — shuts commanders, cascades, flashback |
| Enlightened Tutor | 1 | $33 | Efficient unrestricted artifact/enchantment tutor at instant speed |
| Farewell | 6 | $7 | Modal exile board wipe hitting multiple permanent types; answers graveyard strategies simultaneously |
| Humility | 4 | — | Removes all creature abilities from everything on the board, warps the entire game |
| Serra's Sanctum | 0 | $363 | Generates obscene mana in enchantment-heavy decks; scales exponentially |
| Smothering Tithe | 4 | $50 | Generates massive treasure advantage passively; snowballs without immediate answer |
| Teferi's Protection | 3 | $52 | Complete immunity for a full turn cycle; hard counters nearly every win attempt |

### Blue (10)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Consecrated Sphinx | 6 | $33 | Draws 2 cards for every 1 each opponent draws; snowballs in multiplayer |
| Cyclonic Rift | 2 | $42 | One-sided instant-speed bounce of all nonland permanents; wins games on the spot |
| Fierce Guardianship | 3 | $55 | Free counterspell when you control your commander — asymmetric protection from turn 0 |
| Force of Will | 5 | $69 | Free counterspell from turn 0; stops any single spell with no mana investment |
| Gifts Ungiven | 4 | $5 | Finds any 4 cards and enables graveyard combos regardless of what opponent picks |
| Intuition | 3 | — | Finds any 3 cards and guarantees graveyard access regardless of what opponent picks |
| Mystical Tutor | 1 | $16 | Efficient instant/sorcery tutor for 1 mana at instant speed |
| Narset, Parter of Veils | 3 | $2 | Passive effect shuts down all opponents' extra card draw |
| Rhystic Study | 3 | $58 | Persistent card draw pressure every time an opponent casts a spell |
| Thassa's Oracle | 2 | $23 | Compact combo win condition (Thassa + Demonic Consultation / Tainted Pact) |

### Black (10)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Ad Nauseam | 5 | $32 | Draws enormous cards at instant speed by paying life; often draws 20+ cards |
| Bolas's Citadel | 6 | $16 | Play from top of library using life; typically wins the turn it resolves |
| Braids, Cabal Minion | 4 | $1 | Forces every player to sacrifice a permanent each upkeep; asymmetric in stax shells |
| Demonic Tutor | 2 | $63 | Finds any card for 2 mana with no downside |
| Imperial Seal | 1 | $147 | Vampiric Tutor as a sorcery; any-card tutor for 1 mana |
| Necropotence | 3 | $33 | Converts life to cards at an absurd rate; fully replaces your draw step |
| Opposition Agent | 3 | $26 | Hijacks opponents' tutors and all searches during your turn |
| Orcish Bowmasters | 2 | $44 | Punishes all card draw with damage + tokens; wrecks draw-heavy strategies |
| Tergrid, God of Fright | 5 | $22 | Steals everything opponents sacrifice or discard; oppressive in discard/sacrifice pods |
| Vampiric Tutor | 1 | $69 | Finds any card at instant speed for 1 mana |

### Red (3)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Gamble | 1 | $14 | 1-mana unrestricted tutor with random discard downside; mitigated by graveyard synergies |
| Jeska's Will | 3 | $43 | Generates massive mana + impulse draw with your commander in play |
| Underworld Breach | 2 | $13 | Enables graveyard combo loops for cheap; fuels storm and reanimator lines |

### Green (7)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Biorhythm | 8 | $42 | Sets each player's life total equal to their creature count; can instantly eliminate token-light players |
| Crop Rotation | 1 | $4 | Instant-speed land tutor; finds Gaea's Cradle, Dark Depths, Urborg |
| Gaea's Cradle | 0 | $1,174 | Scales mana with creature count; generates 5–15+ mana in creature-heavy decks |
| Natural Order | 4 | $30 | Sacrifice a green creature, tutor any green creature directly to the battlefield |
| Seedborn Muse | 5 | $11 | Untaps all your permanents on each opponent's turn; effectively multiplies your mana |
| Survival of the Fittest | 2 | — | Repeatable creature tutor that also fills the graveyard; enables reanimator and combo |
| Worldly Tutor | 1 | $26 | Efficient instant-speed creature tutor for 1 mana |

### Multicolor (4)

| Card | Colors | CMC | Price | Why |
|------|--------|-----|-------|-----|
| Aura Shards | GW | 3 | $26 | Destroys an artifact or enchantment on every creature ETB; passively dismantles boards |
| Coalition Victory | WUBRG | 8 | $5 | Instant win if you control one land and one creature of each basic land type and color |
| Grand Arbiter Augustin IV | WU | 4 | $17 | Taxes opponents' spells while discounting yours; warps the cost structure of the game |
| Notion Thief | UB | 4 | $2 | Steals all card draw from opponents at instant speed; flips wheels into one-sided draws |

### Colorless / Artifacts / Lands (12)

| Card | CMC | Price | Why |
|------|-----|-------|-----|
| Ancient Tomb | 0 | $113 | Taps for 2 colorless mana; accelerates by a full turn at cost of 2 life |
| Chrome Mox | 0 | $145 | Free mana turn 1 by exiling a colored card from hand |
| Field of the Dead | 0 | $36 | Passively generates zombies whenever 7+ differently named lands are in play; hard to interact with |
| Glacial Chasm | 0 | — | Prevents all damage to you; pairs with life-gain to stay indefinitely |
| Grim Monolith | 2 | $425 | Taps for 3 colorless; fast mana that accelerates first few turns significantly |
| Lion's Eye Diamond | 0 | — | Generates 3 mana of any color by discarding hand; enables storm and zero-land combo lines |
| Mana Vault | 1 | $100 | Taps for 3 colorless for 1 mana; fast mana staple |
| Mishra's Workshop | 0 | — | Taps for 3 mana usable only for artifacts; broken in artifact-heavy lists |
| Mox Diamond | 0 | — | Free mana (discard a land); 0-mana artifact acceleration |
| Panoptic Mirror | 5 | $28 | Imprint an instant or sorcery; copy and cast it every upkeep for free |
| The One Ring | 4 | $107 | Protection for a turn + card draw engine that scales; generates 3–6+ cards in a few turns |
| The Tabernacle at Pendrell Vale | 0 | — | Each creature costs 1 mana to keep each upkeep; taxes creature-dependent strategies |

---

## Game Changers Criteria

From WotC, a card qualifies as a Game Changer if it:
- Easily and dramatically warps Commander games
- Allows a player to run away with resources
- Shifts games in ways many players find unpleasant
- Blocks opponents from playing the game normally
- Efficiently searches for the strongest cards without meaningful downside
- Has outsized impact in the **early turns** (WotC shifted away from high-CMC entries after Oct 2025 — though some exceptions remain)

---

## Version History

### February 9, 2026 (+2 added)
- **Farewell** added (modal exile board wipe)
- **Biorhythm** added (unbanned + added to Game Changers simultaneously)
- Lutri, the Spellchaser unbanned from the Commander banlist (banned as companion only now)
- New category introduced: "banned as companion"

### October 21, 2025 (−10 removed)
Philosophy shift: high-CMC cards and legendary creatures delisted. Focus moved to early-turn warps.

| Removed | Reason |
|---------|--------|
| Deflecting Swat | High-CMC, conditional |
| Expropriate | High-CMC |
| Fierce Guardianship | Re-added later |
| Food Chain | Combo enabler, not standalone warp |
| Jin-Gitaxias, Core Augur | High-CMC legendary |
| Kinnan, Bonder Prodigy | Legendary commander |
| Sway of the Stars | High-CMC, niche |
| Urza, Lord High Artificer | Legendary commander |
| Vorinclex, Voice of Hunger | High-CMC legendary |
| Winota, Joiner of Forces | Legendary commander |
| Yuriko, the Tiger's Shadow | Legendary commander |

### April 22, 2025 (+18 added, −2 removed)
- +18 cards added (including several unbanned and moved to Game Changers)
- Trouble in Pairs removed
- Trinisphere removed
- Tutor restriction removed from bracket calculations (tutors no longer limit bracket by count)

### February 11, 2025 (initial list)
- First public release: 40 cards across 5W, 9U, 7B, 2R, 3G, 4 multi, 10 colorless

---

## Implementation Notes (Builder)

```typescript
// On app init — cache for 24h
const GC_CACHE_KEY = 'game_changers_v1';
const GC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

async function fetchGameChangers(): Promise<Set<string>> {
  const res = await fetch(
    'https://api.scryfall.com/cards/search?q=is:gamechanger&order=color'
  );
  const data = await res.json();
  return new Set(data.data.map((c: ScryfallCard) => c.name));
}

// Bracket limits
const BRACKET_GAME_CHANGER_LIMITS: Record<number, number> = {
  1: 0,
  2: 0,
  3: 3,
  4: Infinity,
};

// Validation
function checkBracket(deck: Card[], targetBracket: number): BracketViolation[] {
  const gcCount = deck.filter(c => gameChangers.has(c.name)).length;
  const limit = BRACKET_GAME_CHANGER_LIMITS[targetBracket];
  if (gcCount > limit) {
    return [{
      type: 'game_changer_limit',
      message: `${gcCount} Game Changers exceed bracket ${targetBracket} limit (${limit})`,
      cards: deck.filter(c => gameChangers.has(c.name)).map(c => c.name),
    }];
  }
  return [];
}
```
