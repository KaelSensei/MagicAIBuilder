# Magic: The Gathering Fundamentals

Everything a new player needs to understand to play their first game.

## The Big Picture

Magic is a card game where two or more players are wizards ("planeswalkers") casting spells against each other. Each player starts with 20 life (40 in Commander). Reduce your opponent to 0 life, and you win.

Your weapons are your cards. Your fuel is mana. Your strategy is how you combine them.

## The Five Colors of Magic

Every card in Magic belongs to one or more of five colors. Each color has a philosophy, strengths, and weaknesses:

| Color         | Symbol     | Mana Source | Philosophy                   | Strengths                                              | Weaknesses                                               |
| ------------- | ---------- | ----------- | ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **White** {W} | Sun        | Plains      | Order, law, community        | Small creatures, lifegain, board wipes, protection     | Weak card draw, struggles to close games fast            |
| **Blue** {U}  | Water drop | Island      | Knowledge, control, patience | Counterspells, card draw, flying creatures, bounce     | Weak creature removal, slow to develop                   |
| **Black** {B} | Skull      | Swamp       | Power at any cost, ambition  | Creature removal, discard, reanimation, tutors         | Pays life for advantage, weak vs. artifacts/enchantments |
| **Red** {R}   | Fireball   | Mountain    | Freedom, chaos, emotion      | Direct damage, haste, artifact destruction, impulse    | Poor long-game, weak enchantment removal                 |
| **Green** {G} | Tree       | Forest      | Nature, growth, strength     | Big creatures, mana ramp, enchantment/artifact removal | Almost no removal for creatures, weak flyers             |

There's also **Colorless** {C} (artifacts, Eldrazi, some lands) which doesn't have a philosophy but provides utility to any deck.

Colors matter because they define what your deck can and can't do. A red deck burns fast but runs out of gas. A blue deck controls the game but needs time to set up. Multicolor decks combine strengths but need more complex mana bases.

## Card Types

### Lands

Lands produce mana. You can play **one land per turn**, only during your main phase, and only when the stack is empty.

- **Basic lands** come in 5 types: Plains ({W}), Island ({U}), Swamp ({B}), Mountain ({R}), Forest ({G})
- **Nonbasic lands** do special things but you can only run a certain number
- Lands are NOT spells. Playing a land doesn't use the stack and can't be responded to

> Example: **Command Tower** taps for one mana of any color in your commander's color identity. It's the most played land in Commander.

### Creatures

Creatures fight for you. They have **power** (damage they deal) and **toughness** (damage they can take).

- A 3/4 creature deals 3 damage and can take 4 damage before dying
- Creatures can attack during your combat phase (if they don't have "summoning sickness")
- Creatures can block attacking creatures during your opponent's combat phase
- **Summoning sickness:** A creature can't attack or use tap abilities the turn it enters, unless it has haste

> Example: **Llanowar Elves** (1/1 for {G}, tap: add {G}). A classic turn-1 play: play a Forest, cast Llanowar Elves, and on turn 2 you have 3 mana available instead of 2.

### Instants

Instants are spells you can cast at almost any time, including on your opponent's turn. They resolve and go to the graveyard.

> Example: **Lightning Bolt** ({R}, deal 3 damage to any target). The most iconic instant. Can kill a creature or finish off a player at instant speed.

### Sorceries

Sorceries are like instants but can only be cast during your main phase when the stack is empty. They tend to be more powerful because of this restriction.

> Example: **Wrath of God** ({2}{W}{W}, destroy all creatures). A board wipe. Powerful but you can only cast it on your turn.

### Enchantments

Enchantments stay on the battlefield and provide ongoing effects. Some attach to creatures (Auras), others just sit there providing value.

> Example: **Rhystic Study** ({2}{U}). Whenever an opponent casts a spell, you draw a card unless they pay {1}. One of the most powerful card draw engines in Commander.

### Artifacts

Artifacts are colorless permanents that provide utility. Equipment attaches to creatures, other artifacts provide mana or effects.

> Example: **Sol Ring** ({1}, tap: add {C}{C}). The most played card in Commander. Costs 1 mana, produces 2 every turn.

### Planeswalkers

Planeswalkers are powerful allies with loyalty counters. They enter with a set number of loyalty and you activate one ability per turn (+ abilities add loyalty, - abilities remove it). Opponents can attack your planeswalkers.

> Example: **Liliana, Dreadhorde General** enters with 6 loyalty. Her -4 ability forces each player to sacrifice two creatures. Her ultimate (-9) makes opponents sacrifice everything.

## Turn Structure

A turn follows this exact sequence:

### 1. Beginning Phase

- **Untap step:** Untap all your tapped permanents. No player gets priority (can't cast spells here).
- **Upkeep step:** "At the beginning of your upkeep" triggers happen. Players can respond.
- **Draw step:** Draw a card. "At the beginning of your draw step" triggers happen. Players can respond.

### 2. First Main Phase

- Play a land (if you haven't this turn)
- Cast creatures, sorceries, enchantments, artifacts, planeswalkers
- Activate abilities

### 3. Combat Phase

- **Beginning of combat:** Triggers happen. Last chance to tap/remove creatures before attackers are declared
- **Declare attackers:** Choose which of your untapped creatures will attack. They tap (unless they have vigilance)
- **Declare blockers:** Defending player assigns untapped creatures to block attackers
- **Combat damage:** Creatures deal damage simultaneously (first strike/double strike creatures deal damage first)
- **End of combat:** Cleanup triggers

### 4. Second Main Phase

Same as the first main phase. Good time to play creatures after combat (so opponents couldn't kill them before you attacked).

### 5. Ending Phase

- **End step:** "At the beginning of your end step" triggers happen. Last chance to do things before the turn ends
- **Cleanup step:** Discard down to 7 cards (hand size limit). Damage is removed from creatures. "Until end of turn" effects expire. Normally no one gets priority here

## The Stack

The stack is how Magic handles timing. When you cast a spell or activate an ability, it goes on the **stack**. Before it resolves, each player gets a chance to respond.

Think of it like a stack of plates. The last thing added resolves first (LIFO - Last In, First Out).

### Example: The Stack in Action

1. You cast **Giant Growth** (+3/+3) on your 2/2 creature
2. Your opponent responds with **Lightning Bolt** (3 damage) targeting the same creature
3. The stack is now: Lightning Bolt on top, Giant Growth on bottom
4. Lightning Bolt resolves first: 3 damage to a 2/2 creature. It dies.
5. Giant Growth tries to resolve but its target is gone. It "fizzles" (does nothing)

**Your opponent's bolt resolved first because it was added to the stack LAST.**

If you had cast Giant Growth, waited for it to resolve (making the creature 5/5), and THEN your opponent bolted it, the creature would survive (3 damage on a 5/5 = lives). Timing matters.

### What Uses the Stack

- Casting spells (creatures, instants, sorceries, enchantments, artifacts, planeswalkers)
- Activating abilities (unless they're mana abilities)
- Triggered abilities ("When...", "Whenever...", "At the beginning of...")

### What Does NOT Use the Stack

- Playing a land
- Mana abilities (tapping a land for mana)
- Special actions (turning a face-down creature face up)
- State-based actions (creature with 0 toughness dying)

## Key Concepts

### Priority

Priority determines who can act. The active player (whose turn it is) gets priority first. After they pass, the next player gets it. When ALL players pass priority in succession, the top item on the stack resolves.

### Summoning Sickness

A creature can't attack or use abilities with the {T} symbol unless you've controlled it since the start of your most recent turn. Haste bypasses this.

### Damage and Toughness

Damage doesn't reduce toughness. A 4/4 that takes 3 damage is still a 4/4 with 3 damage marked on it. If damage marked equals or exceeds toughness, it dies (state-based action). Damage clears at end of turn.

### "Destroy" vs. "Sacrifice" vs. "Exile"

- **Destroy:** Card goes to graveyard. Can be prevented by indestructible
- **Sacrifice:** Card goes to graveyard. Can't be prevented (it's a cost, not an effect)
- **Exile:** Card is removed from the game entirely. Almost nothing prevents this
- **Bounce:** Card returns to owner's hand. Not destruction, not exile

## Essential Keywords

| Keyword               | What It Does                                                             | Example Card             |
| --------------------- | ------------------------------------------------------------------------ | ------------------------ |
| **Flying**            | Can only be blocked by creatures with flying or reach                    | Serra Angel              |
| **Reach**             | Can block flying creatures                                               | Silklash Spider          |
| **Trample**           | Excess combat damage carries over to the player/planeswalker             | Craterhoof Behemoth      |
| **Haste**             | Can attack and use {T} abilities immediately                             | Goblin Guide             |
| **Vigilance**         | Doesn't tap to attack                                                    | Serra Angel              |
| **First Strike**      | Deals combat damage before normal creatures                              | Boros Reckoner           |
| **Double Strike**     | Deals first strike AND normal combat damage                              | Mirran Crusader          |
| **Deathtouch**        | Any amount of damage it deals to a creature is lethal                    | Baleful Strix            |
| **Lifelink**          | Damage it deals also gains you that much life                            | Vampire Nighthawk        |
| **Hexproof**          | Can't be targeted by opponents' spells/abilities                         | Carnage Tyrant           |
| **Ward {N}**          | Opponent must pay {N} extra when targeting it, or the spell is countered | Ledger Shredder          |
| **Indestructible**    | Can't be destroyed by damage or "destroy" effects                        | Avacyn, Angel of Hope    |
| **Flash**             | Can be cast at instant speed (any time)                                  | Teferi, Mage of Zhalfir  |
| **Menace**            | Can only be blocked by two or more creatures                             | Rankle, Master of Pranks |
| **Protection from X** | Can't be damaged, enchanted, equipped, blocked, or targeted by X         | Kor Firewalker (pro red) |

## Building Your First Deck (60-card format)

A basic deck needs:

- **24 lands** (adjust based on mana curve)
- **~24 creatures** (your primary way to win)
- **~12 noncreature spells** (removal, card draw, combat tricks)

**Start with 1-2 colors.** More colors = more powerful options but harder mana base. Mono-color or two-color decks are easiest to build and play.

**Have a plan.** Every deck should answer: "How do I win?" Don't just jam good cards together.
