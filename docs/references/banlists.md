# MTG Banned & Restricted Lists

**Last updated:** February 9, 2026
**Official source:** [WotC Banned & Restricted](https://magic.wizards.com/en/banned-restricted-list)
**Commander-specific:** [Official Commander Website](https://mtgcommander.net/index.php/banned-list/)

---

## Live Verification

Always verify banlists via Scryfall (kept in sync with official announcements):

```
# All cards banned in Commander
https://api.scryfall.com/cards/search?q=banned:commander

# Check a specific card's legality
https://api.scryfall.com/cards/named?exact={card_name}
# Response includes: legalities.commander = "legal" | "banned" | "not_legal"
```

---

## Commander Banlist (42 individually named cards + categories)

### Category Bans
- **All cards with the Conspiracy card type** (e.g., Backup Plan, Brago's Favor)
- **All ante cards** (e.g., Contract from Below, Darkpact)
- **All cards removed by WotC for depicting racism** (e.g., Cleanse, Pradesh Gypsies, Invoke Prejudice)

### Individually Banned Cards

| Card | Colors | Reason |
|------|--------|--------|
| Ancestral Recall | U | Draws 3 for 1 mana, far too efficient |
| Balance | W | Looks fair but creates degenerate game states |
| Black Lotus | Colorless | Free 3 mana, the most broken card ever printed |
| Chaos Orb | Colorless | Requires physical dexterity (not a game mechanic) |
| Dockside Extortionist | R | Generates absurd treasure in multiplayer, enables infinite combos |
| Emrakul, the Aeons Torn | Colorless | Extra turn + annihilator 6 + uncounterable, unfun |
| Falling Star | R | Physical dexterity card |
| Flash | U | Enables turn-0 wins (Flash + Protean Hulk) |
| Golos, Tireless Pilgrim | Colorless | 5-color goodstuff commander, homogenized deckbuilding |
| Griselbrand | B | Draws 7+ cards per activation, trivially enables combos |
| Hullbreacher | U | Combines with wheels to lock opponents out of cards + generate treasure |
| Iona, Shield of Emeria | W | Names a color, locks mono-color players completely out |
| Jeweled Lotus | Colorless | Free 3 mana for commander, too explosive |
| Karakas | W | Repeatedly bounces commanders for 0 mana, oppressive |
| Leovold, Emissary of Trest | BUG | Shuts down card draw + punishes targeting |
| Library of Alexandria | Colorless | Free card draw every turn if hand is full |
| Limited Resources | W | Locks out land drops after 10 total lands |
| Lutri, the Spellchaser | UR | **Banned as companion only** (legal in deck, legal as commander) |
| Mana Crypt | Colorless | Free 2 mana every turn, too explosive for healthy games |
| Mox Emerald | G | Free mana (Power Nine) |
| Mox Jet | B | Free mana (Power Nine) |
| Mox Pearl | W | Free mana (Power Nine) |
| Mox Ruby | R | Free mana (Power Nine) |
| Mox Sapphire | U | Free mana (Power Nine) |
| Nadu, Winged Wisdom | UG | Generates uncontrollable value, warps games around it |
| Paradox Engine | Colorless | Untaps everything on each spell cast, infinite combo machine |
| Primeval Titan | G | Fetches any 2 lands on ETB and attack, too much value |
| Prophet of Kruphix | UG | Seedborn Muse + flash for creatures, oppressive advantage |
| Rofellos, Llanowar Emissary | G | Generates too much mana as commander |
| Shahrazad | W | Starts a sub-game, logistical nightmare |
| Sundering Titan | Colorless | Destroys multiple lands on ETB and death, oppressive with blink |
| Sway of the Stars | U | Resets entire game, miserable play experience |
| Sylvan Primordial | G | Destroys a noncreature permanent per opponent on ETB |
| Time Vault | Colorless | Infinite turns with Voltaic Key |
| Time Walk | U | Extra turn for 2 mana (Power Nine) |
| Tinker | U | Sacrifices artifact for any artifact to battlefield, broken |
| Tolarian Academy | U | Taps for blue per artifact, explosively broken |
| Trade Secrets | U | Infinite card draw loop between two players |
| Upheaval | U | Bounces everything, whoever floats mana wins |
| Yawgmoth's Bargain | B | Necropotence without the delay, draws your entire deck |

### Recent Changes (Feb 2026)
- **Unbanned:** Biorhythm (moved to Game Changers list instead)
- **Unbanned:** Gifts Ungiven (moved to Game Changers list instead)
- **Unbanned:** Panoptic Mirror (moved to Game Changers list instead)
- **Unbanned:** Lutri, the Spellchaser (banned as companion only, legal everywhere else)
- **New category:** "Banned as companion" (currently only Lutri)

---

## Format Legality Quick Reference

For the builder, check format legality via Scryfall's `legalities` object:

```json
{
  "legalities": {
    "standard": "not_legal",
    "modern": "legal",
    "legacy": "legal",
    "vintage": "restricted",
    "commander": "legal",
    "pauper": "not_legal",
    "pioneer": "legal",
    "brawl": "legal"
  }
}
```

Values: `"legal"`, `"not_legal"`, `"banned"`, `"restricted"`

---

## Other Format Banlists (for future multi-format support)

The builder is Commander-first, but for future expansion:

| Format | Banlist Source |
|--------|---------------|
| Standard | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Pioneer | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Modern | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Legacy | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Vintage | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) (restricted list) |
| Pauper | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Brawl | [WotC B&R](https://magic.wizards.com/en/banned-restricted-list) |
| Duel Commander | [mtgdc.info](https://www.mtgdc.info/banned-restricted) (separate ban list) |

All format legalities are available per-card via the Scryfall API, so the builder doesn't need to maintain its own banlist database. Query Scryfall and trust the `legalities` field.

---

## Implementation Notes

### Validation Pipeline
1. **On card add:** Check `legalities.commander` via Scryfall
2. **On bracket check:** Count Game Changers (separate list)
3. **Display:** Show banned cards with red indicator + reason
4. **Alert:** If user tries to add a banned card, show warning with explanation

### Edge Cases
- **Lutri:** Legal in deck and as commander, banned as companion only. Builder must handle the "banned as companion" category separately
- **Silver-border / Acorn cards:** Not legal in Commander by default, but some playgroups allow them. Builder should flag but allow with confirmation
- **Unofficial formats:** Duel Commander has its own separate banlist. If supporting DC format, use mtgdc.info as source
