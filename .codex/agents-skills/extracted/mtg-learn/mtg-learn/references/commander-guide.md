# Commander (EDH) Format Guide

Everything you need to transition from knowing Magic basics to playing Commander. Commander is the most popular way to play Magic, and it's a completely different experience from 1v1 60-card formats.

## What Makes Commander Different

| Aspect            | Standard 60-card            | Commander                                           |
| ----------------- | --------------------------- | --------------------------------------------------- |
| Players           | 2 (usually)                 | 4 (free-for-all)                                    |
| Deck size         | 60 cards minimum            | Exactly 100 cards                                   |
| Starting life     | 20                          | 40                                                  |
| Copies of a card  | Up to 4                     | 1 (singleton, except basic lands)                   |
| Commander         | No                          | Yes, a legendary creature that leads your deck      |
| Color restriction | None beyond format legality | Only cards matching your commander's color identity |

## The Commander

Your commander is a legendary creature (or certain other card types) that defines your entire deck.

### Choosing a Commander

- Your commander sits in the **command zone** (a special zone), visible to all players from the start
- You can cast your commander from the command zone at any time you could normally cast it
- Your commander defines your **color identity**: the colors in its mana cost AND rules text
- Every card in your 99 must fit within that color identity

### Color Identity Rules

Color identity includes ALL mana symbols on the card, not just the casting cost.

> Example: **Kenrith, the Returned King** costs {4}{W} but has abilities costing {R}, {G}, {U}, and {B}. His color identity is all five colors (WUBRG). You can put any card in a Kenrith deck.

> Example: **Meren of Clan Nel Toth** costs {2}{B}{G}. Her color identity is black and green. Every card in your deck must be black, green, both, or colorless. No white, blue, or red cards or mana symbols allowed.

Reminder text (italicized text in parentheses) doesn't count for color identity. Extort's reminder text mentions {W/B} but doesn't add those colors to identity.

### Commander Tax

When your commander dies, gets exiled, or goes anywhere you don't want, you can send it back to the command zone. Casting it again costs {2} more each time:

- First cast: normal cost
- Second cast: +{2} to the normal cost
- Third cast: +{4}
- And so on...

This means aggressive commanders (cheap to cast) recover better from removal, while expensive commanders can get locked out if killed repeatedly.

### Commander Damage

If a single commander deals **21 or more combat damage** to a player over the course of the game, that player loses. This is tracked per-commander, not combined, and only counts **combat damage** (not ability damage).

This is why Voltron strategies (loading up one creature with equipment and auras) work in Commander: even if a player has 40 life, 21 commander damage kills them.

## Deck Construction

### The 100-Card Singleton Rule

- Exactly 100 cards (including your commander)
- No card can appear more than once, except basic lands
- Every card must match your commander's color identity

### The 8x8 Framework (Starting Point)

A classic way to think about your 99:

```
Commander:     1
Lands:        36-38
Ramp:          8-10  (mana acceleration)
Card Draw:     8-10  (keep your hand full)
Removal:       6-8   (deal with threats)
Board Wipes:   2-3   (reset when behind)
Win Conditions: 2-4  (how you actually win)
Synergy cards: 25-30 (cards that work with your commander's strategy)
```

This is a starting framework, not a rigid recipe. Aggressive decks run less removal. Control decks run more interaction. Combo decks dedicate more slots to combo pieces and tutors.

### Mana Base Basics

With 40 life and longer games, your mana base matters a lot:

**Mono-color:** Easy. Run 30-32 basics + 5-6 utility lands (Command Tower, Reliquary Tower, etc.)

**Two-color:**

- Command Tower (auto-include)
- 5-8 dual lands (check lands, pain lands, battle lands based on budget)
- Remaining split between basics, favoring the color you need more of

**Three+ colors:**

- Every multicolor land you can afford
- Command Tower, Exotic Orchard, City of Brass, Mana Confluence
- Fetch lands if budget allows (they're the most efficient color fixing)
- Fewer basics (8-12 total across all colors)

## Multiplayer Dynamics

This is the biggest adjustment from 1v1. Commander is a **political** game.

### Threat Assessment

In 1v1, your opponent is always your threat. In 4-player, the question is always: "Who's winning, and what should I do about it?"

- **Don't attack the weakest player** unless you have a strategic reason. The table will punish you.
- **Don't play your strongest card early** without protection. Three players will want to remove it.
- **Don't spend removal on minor threats.** Save it for game-warping plays.

### The Archenemy Problem

If you build up too fast (turn 1 Sol Ring into turn 2 commander), the other three players will team up against you. This is natural and healthy. It's also why consistency sometimes matters more than explosiveness in Commander.

### Table Politics

Commander rewards social play:

- "I won't attack you this turn if you don't board-wipe."
- "I'll use my removal on that creature if you let my enchantment live."
- "Let's deal with the combo player first, then sort things out."

Cards that say "target player" or "target opponent" enable deals. Cards that say "each opponent" don't discriminate and can make you the archenemy.

### Board Wipes Are Normal

With 4 players building boards, someone will wipe eventually. Build with recovery in mind:

- Card draw refills your hand after a wipe
- Creatures with ETB effects are still useful even if they die
- Indestructible/regenerate creatures survive Wrath of God effects
- Graveyard recursion turns wipes into fuel

## Pregame Conversation

Before shuffling, Commander groups have a **pregame conversation** to set expectations. This is where the bracket system comes in.

### The Bracket System (Official since 2024)

| Bracket | Name       | Power Level | Game Changers | Feel                                           |
| ------- | ---------- | ----------- | ------------- | ---------------------------------------------- |
| 1       | Exhibition | Low         | 0             | Precons, jank, fun-first. Games go 10+ turns   |
| 2       | Core       | Medium      | 0             | Upgraded precons, focused strategies. 6+ turns |
| 3       | Upgraded   | Medium-High | Up to 3       | Optimized but still casual. 4+ turns           |
| 4       | Optimized  | High        | Unlimited     | High power, fast mana, compact combos          |

**Game Changers** are specific cards designated by Wizards of the Coast that dramatically warp games. They include things like fast mana (Mana Crypt), free counterspells (Force of Will, Fierce Guardianship), powerful engines (Rhystic Study, Smothering Tithe), and efficient tutors (Demonic Tutor, Vampiric Tutor).

### What to Say in a Pregame Conversation

- "My deck is Bracket 2, it's an upgraded precon. I run a Meren aristocrats deck that wins through draining opponents with Blood Artist effects."
- "No infinite combos, no stax. My most powerful card is probably Grave Pact."
- "I can win around turn 8-10 if unanswered."

Be honest. Nobody has fun when someone says "it's casual" and then combos off on turn 4.

## Key Commander Archetypes

### Aggressive / Combat

- **Voltron:** Suit up your commander with equipment/auras, swing for 21 commander damage
- **Tokens/Go-Wide:** Generate masses of creature tokens, buff them with anthems, attack everyone
- **Tribal:** Build around a creature type (Elves, Zombies, Dragons) using lords and tribal synergy

### Value / Midrange

- **Aristocrats:** Sacrifice creatures for value (Blood Artist, Zulaport Cutthroat drain life on death)
- **Landfall:** Play extra lands per turn, trigger effects on each land entering (Omnath, Locus of Creation)
- **Reanimator:** Fill your graveyard with big threats, then bring them back cheaply (Meren, Muldrotha)

### Control

- **Draw-Go:** Counter threats, draw cards, win with one big finisher after exhausting opponents
- **Stax:** Slow everyone down with tax effects (Thalia, Rhystic Study). Bracket 3-4 territory
- **Pillowfort:** Make yourself unattractive to attack (Propaganda, Ghostly Prison) and win slowly

### Combo

- **Infinite Combo:** Assemble 2-3 specific cards to win on the spot. Bracket 3-4 depending on speed
- **Storm:** Cast many cheap spells in one turn, multiply effects with storm count payoffs

## Budget Considerations

Commander is the most budget-friendly competitive format because:

- You only need 1 copy of each card (vs. 4 in Standard/Modern)
- Games are longer and more forgiving, so slightly suboptimal cards still perform
- Precons ($40-50) are genuinely playable and fun

**Budget tiers:**

- **$25-50:** Budget builds. Powerful and fun, just slower mana bases and fewer staples
- **$50-150:** Mid-range. Smooth mana, solid staples, competitive at Bracket 2-3
- **$150-500:** Optimized. Strong mana base, premium removal, Bracket 3-4
- **$500+:** Full power. Fetch lands, Force of Will, fast mana. Bracket 4/cEDH

The single biggest upgrade for any deck is the **mana base**. Budget duals that enter tapped (like gain lands) work but slow you down. Investing in untapped duals (pain lands, check lands, shock lands) makes every game smoother.

## First Game Checklist

Before your first Commander game:

1. **Know your commander's abilities.** Read them several times. Know the mana cost by heart.
2. **Know your win condition.** "How does this deck actually kill people?"
3. **Count your categories.** How many lands, ramp, draw, and removal pieces do you have?
4. **Mulligan wisely.** You want 3-4 lands and at least 1 piece of ramp or card draw in your opening 7.
5. **Don't be afraid to ask questions.** Commander tables are usually friendly. If you don't know how an interaction works, ask.
6. **Don't overextend.** In a 4-player game, the board WILL get wiped. Don't dump your whole hand onto the battlefield.
7. **Have fun.** Commander is a social format. Chat, make deals, laugh at ridiculous board states. That's the point.
