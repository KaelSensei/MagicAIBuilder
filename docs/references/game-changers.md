# Commander Game Changers List

**Last updated:** February 9, 2026

Game Changers are cards that dramatically warp Commander games. They define bracket placement:
- **Bracket 1-2:** 0 Game Changers allowed
- **Bracket 3:** Up to 3 Game Changers allowed
- **Bracket 4:** Unlimited

---

## Official Sources (Chronological)

| Date | Announcement | Key Changes |
|------|-------------|-------------|
| Feb 11, 2025 | [Introducing Commander Brackets Beta](https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta) | Initial list: 40 cards (5W, 9U, 7B, 2R, 3G, 4 multi, 10 colorless) |
| Apr 22, 2025 | [Brackets Beta Update - April 2025](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-april-22-2025) | +18 added, -2 removed (Trouble in Pairs, Trinisphere). 5 cards unbanned and moved to Game Changers. Tutor restriction removed from brackets |
| Oct 21, 2025 | [Brackets Beta Update - October 2025](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025) | -10 removed (see below). Philosophy shift: fewer high-CMC cards, focus on early-turn warps |
| Feb 9, 2026 | [Brackets Beta Update - February 2026](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-february-9-2026) | +2 added (Farewell, Biorhythm). Biorhythm unbanned + added to GC. Lutri unbanned (banned as companion only). New "banned as companion" category |

---

## Live Source of Truth

Always use Scryfall for the current verified list:

**Web:** [scryfall.com/search?q=is:gamechanger](https://scryfall.com/search?as=grid&order=color&q=is:gamechanger)

**API:**
```
GET https://api.scryfall.com/cards/search?q=is:gamechanger
```

**Per-card check:**
```
GET https://api.scryfall.com/cards/named?exact={card_name}
# Response includes: game_changer: true/false
```

The `is:gamechanger` tag in Scryfall is maintained in sync with WotC announcements.

**Other community mirrors:**
- [Moxfield Game Changers page](https://moxfield.com/commanderbrackets/gamechangers)
- [EDHREC Top Game Changers](https://edhrec.com/top/game-changers)
- [PlayingMTG Game Changers](https://playingmtg.com/game-changers/)

---

## Current List (53 cards, Feb 2026)

### White (6)
| Card | Why |
|------|-----|
| Drannith Magistrate | Locks opponents out of casting from anywhere but hand |
| Enlightened Tutor | Efficient unrestricted artifact/enchantment tutor |
| Farewell | Modal exile board wipe, hits multiple permanent types |
| Humility | Removes all creature abilities, warps entire board |
| Smothering Tithe | Generates massive treasure advantage, snowballs fast |
| Teferi's Protection | Complete immunity for a turn cycle |

### Blue (10)
| Card | Why |
|------|-----|
| Consecrated Sphinx | Draws 2 for every 1 opponents draw |
| Cyclonic Rift | One-sided board wipe at instant speed |
| Force of Will | Free counterspell from turn 0 |
| Gifts Ungiven | Finds any 4 cards, enables graveyard combos |
| Intuition | Finds any 3 cards, guarantees graveyard access |
| Mystical Tutor | Efficient instant/sorcery tutor |
| Narset, Parter of Veils | Shuts down opponents' card draw |
| Rhystic Study | Constant card draw pressure |
| Serra's Sanctum | Explosive mana in enchantment decks |
| Thassa's Oracle | Compact combo win condition (Thoracle + Consultation) |

### Black (10)
| Card | Why |
|------|-----|
| Ad Nauseam | Draws enormous number of cards at cost of life |
| Bolas's Citadel | Play from top of library, often wins the turn it resolves |
| Braids, Cabal Minion | Forces sacrifice each upkeep |
| Demonic Tutor | Finds any card for 2 mana |
| Imperial Seal | Vampiric Tutor as sorcery |
| Necropotence | Converts life to cards at absurd rate |
| Opposition Agent | Hijacks opponents' tutors and searches |
| Orcish Bowmasters | Punishes all card draw, creates tokens |
| Tergrid, God of Fright | Steals everything opponents sacrifice or discard |
| Vampiric Tutor | Finds any card at instant speed for 1 mana |

### Red (3)
| Card | Why |
|------|-----|
| Gamble | 1-mana tutor with random discard |
| Jeska's Will | Massive mana + impulse draw |
| Underworld Breach | Enables graveyard combo loops |

### Green (7)
| Card | Why |
|------|-----|
| Biorhythm | Sets life totals to creature count, can instantly eliminate players |
| Crop Rotation | Instant-speed land tutor (finds Gaea's Cradle) |
| Gaea's Cradle | Scales mana with creature count |
| Natural Order | Sac green creature, tutor any green creature to battlefield |
| Seedborn Muse | Untaps all permanents on each opponent's turn |
| Survival of the Fittest | Repeatable creature tutor, fills graveyard |
| Worldly Tutor | Efficient creature tutor |

### Multicolor (4)
| Card | Why |
|------|-----|
| Aura Shards (GW) | Destroys artifact/enchantment on every creature ETB |
| Coalition Victory (WUBRG) | Instant win if conditions met |
| Grand Arbiter Augustin IV (WU) | Taxes opponents, discounts your spells |
| Notion Thief (UB) | Steals all opponents' card draw |

### Colorless / Artifacts / Lands (13)
| Card | Why |
|------|-----|
| Ancient Tomb | 2 colorless mana, accelerates by a full turn |
| Chrome Mox | Free mana turn 1 (exile from hand) |
| Field of the Dead | Creates zombies passively, hard to interact with |
| Glacial Chasm | Prevents all damage to you |
| Grim Monolith | Fast mana, 3 for 2 |
| Lion's Eye Diamond | Free 3 mana (discard hand), combo enabler |
| Mana Vault | 3 colorless for 1 |
| Mishra's Workshop | 3 mana for artifacts only |
| Mox Diamond | Free mana (discard a land) |
| The One Ring | Protection + massive card draw engine |
| The Tabernacle at Pendrell Vale | Taxes all creatures |

> **Note:** This list may contain inaccuracies from web research. Always verify against [Scryfall is:gamechanger](https://scryfall.com/search?as=grid&order=color&q=is:gamechanger) for the authoritative current list. Total count above is 53 but some cards may have shifted between updates.

---

## History: Cards Removed from Game Changers

### Oct 2025 Removals (-10)
High-CMC cards and legendary creatures delisted per philosophy shift:
- Deflecting Swat
- Expropriate
- Fierce Guardianship
- Food Chain
- Jin-Gitaxias, Core Augur
- Kinnan, Bonder Prodigy
- Sway of the Stars
- Urza, Lord High Artificer
- Vorinclex, Voice of Hunger
- Winota, Joiner of Forces
- Yuriko, the Tiger's Shadow

### Apr 2025 Removals (-2)
- Trouble in Pairs
- Trinisphere

---

## Game Changers Criteria

From WotC: Game Changers should be cards that:
- Easily and dramatically warp Commander games
- Allow a player to run away with resources
- Shift games in ways many players find unpleasant
- Block opponents from playing the game
- Efficiently search for strongest cards without meaningful downside
- Have outsized impact in early turns (WotC moved away from high-CMC entries after Oct 2025)

---

## Implementation Notes

For the builder's bracket validation:
1. Fetch `https://api.scryfall.com/cards/search?q=is:gamechanger` on app init (cache for 24h)
2. On decklist change, count cards matching the cached Game Changers set
3. Compare against bracket limit (0 for B1-B2, 3 for B3, unlimited for B4)
4. Flag violations with specific card names and bracket context
