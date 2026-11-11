/**
 * Commander cards for the partner-pairing tests, one or more per partner
 * ability of CR 702.124 and per near miss.
 *
 * Names, type lines and Oracle texts are copied from Scryfall's card data,
 * read on 2026-11-10. Two entries are marked as not current Oracle text:
 * one keeps an older wording that saved deck rows still hold, and one is a
 * hypothetical type line that pins a clause no printed card exercises.
 *
 * @module deck/fixtures/partner-cards
 */
import type { PairingCard } from "../partner-abilities";

export const TYMNA: PairingCard = {
  name: "Tymna the Weaver",
  typeLine: "Legendary Creature — Human Cleric",
  oracleText:
    "Lifelink\nAt the beginning of each of your postcombat main phases, you may pay X life, where X is the number of opponents that were dealt combat damage this turn. If you do, draw X cards.\nPartner (You can have two commanders if both have partner.)",
};

export const THRASIOS: PairingCard = {
  name: "Thrasios, Triton Hero",
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText:
    "{4}: Scry 1, then reveal the top card of your library. If it's a land card, put it onto the battlefield tapped. Otherwise, draw a card.\nPartner (You can have two commanders if both have partner.)",
};

export const KRAUM: PairingCard = {
  name: "Kraum, Ludevic's Opus",
  typeLine: "Legendary Creature — Zombie Horror",
  oracleText:
    "Flying, haste\nWhenever an opponent casts their second spell each turn, draw a card.\nPartner (You can have two commanders if both have partner.)",
};

export const ISHAI: PairingCard = {
  name: "Ishai, Ojutai Dragonspeaker",
  typeLine: "Legendary Creature — Bird Monk",
  oracleText:
    "Flying\nWhenever an opponent casts a spell, put a +1/+1 counter on Ishai.\nPartner (You can have two commanders if both have partner.)",
};

export const TANA: PairingCard = {
  name: "Tana, the Bloodsower",
  typeLine: "Legendary Creature — Elf Druid",
  oracleText:
    "Trample\nWhenever Tana deals combat damage to a player, create that many 1/1 green Saproling creature tokens.\nPartner (You can have two commanders if both have partner.)",
};

export const PIR: PairingCard = {
  name: "Pir, Imaginative Rascal",
  typeLine: "Legendary Creature — Human",
  oracleText:
    "Partner with Toothy, Imaginary Friend (When this creature enters, target player may put Toothy into their hand from their library, then shuffle.)\nIf one or more counters would be put on a permanent your team controls, that many plus one of each of those kinds of counters are put on that permanent instead.",
};

export const TOOTHY: PairingCard = {
  name: "Toothy, Imaginary Friend",
  typeLine: "Legendary Creature — Illusion",
  oracleText:
    "Partner with Pir, Imaginative Rascal (When this creature enters, target player may put Pir into their hand from their library, then shuffle.)\nWhenever you draw a card, put a +1/+1 counter on Toothy.\nWhen Toothy leaves the battlefield, draw a card for each +1/+1 counter on it.",
};

export const BRALLIN: PairingCard = {
  name: "Brallin, Skyshark Rider",
  typeLine: "Legendary Creature — Human Shaman",
  oracleText:
    "Partner with Shabraz, the Skyshark (When this creature enters, target player may put Shabraz into their hand from their library, then shuffle.)\nWhenever you discard a card, put a +1/+1 counter on Brallin and it deals 1 damage to each opponent.\n{R}: Target Shark gains trample until end of turn.",
};

export const SHABRAZ: PairingCard = {
  name: "Shabraz, the Skyshark",
  typeLine: "Legendary Creature — Shark Bird",
  oracleText:
    "Partner with Brallin, Skyshark Rider\nFlying\nWhenever you draw a card, put a +1/+1 counter on Shabraz and you gain 1 life.\n{W/U}: Target Human gains flying until end of turn.",
};

export const ROWAN: PairingCard = {
  name: "Rowan Kenrith",
  typeLine: "Legendary Planeswalker — Rowan",
  oracleText:
    "+2: During target player's next turn, each creature that player controls attacks if able.\n−2: Rowan Kenrith deals 3 damage to each tapped creature target player controls.\n−8: Target player gets an emblem with \"Whenever you activate an ability that isn't a mana ability, copy it. You may choose new targets for the copy.\"\nPartner with Will Kenrith\nRowan Kenrith can be your commander.",
};

export const WILL: PairingCard = {
  name: "Will Kenrith",
  typeLine: "Legendary Planeswalker — Will",
  oracleText:
    '+2: Until your next turn, up to two target creatures each have base power and toughness 0/3 and lose all abilities.\n−2: Target player draws two cards. Until your next turn, instant, sorcery, and planeswalker spells that player casts cost {2} less to cast.\n−8: Target player gets an emblem with "Whenever you cast an instant or sorcery spell, copy it. You may choose new targets for the copy."\nPartner with Rowan Kenrith\nWill Kenrith can be your commander.',
};

export const AMY_POND: PairingCard = {
  name: "Amy Pond",
  typeLine: "Legendary Creature — Human",
  oracleText:
    "Partner with Rory Williams (When this creature enters, target player may put Rory into their hand from their library, then shuffle.)\nWhenever Amy Pond deals combat damage to a player, choose a suspended card you own and remove that many time counters from it.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
};

export const RORY_WILLIAMS: PairingCard = {
  name: "Rory Williams",
  typeLine: "Legendary Creature — Human Soldier",
  oracleText:
    'Partner with Amy Pond\nFirst strike, lifelink\nThe Last Centurion — When you cast this spell from anywhere other than exile, exile it with three time counters on it. It gains suspend. Then investigate. (Create a Clue token. It\'s an artifact with "{2}, Sacrifice this token: Draw a card.")',
};

export const CLARA_OSWALD: PairingCard = {
  name: "Clara Oswald",
  typeLine: "Legendary Creature — Human Advisor",
  oracleText:
    "Impossible Girl — If Clara Oswald is your commander, choose a color before the game begins. Clara Oswald is the chosen color.\nIf a triggered ability of a Doctor you control triggers, that ability triggers an additional time.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
};

export const ROSE_TYLER: PairingCard = {
  name: "Rose Tyler",
  typeLine: "Legendary Creature — Human",
  oracleText:
    "Rose Tyler gets +1/+1 for each time counter on it.\nBad Wolf — Whenever Rose Tyler attacks, put a time counter on it for each suspended card you own and each other permanent you control with a time counter on it.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
};

export const SUSAN_FOREMAN: PairingCard = {
  name: "Susan Foreman",
  typeLine: "Legendary Creature — Time Lord",
  oracleText:
    "If you would planeswalk, instead look at the top two cards of your planar deck, put one on the bottom of your planar deck and the other on top, then planeswalk.\n{T}: Add {G}.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
};

export const K9_MARK_I: PairingCard = {
  name: "K-9, Mark I",
  typeLine: "Legendary Artifact Creature — Robot Dog",
  oracleText:
    "Negative — As long as K-9 is untapped, other legendary creatures you control have ward {1}.\nAffirmative — {1}{U}, {T}: Target legendary creature can't be blocked this turn.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
};

export const TENTH_DOCTOR: PairingCard = {
  name: "The Tenth Doctor",
  typeLine: "Legendary Creature — Time Lord Doctor",
  oracleText:
    "Allons-y! — Whenever you attack, exile cards from the top of your library until you exile a nonland card. Put three time counters on it. If it doesn't have suspend, it gains suspend.\nTimey-Wimey — {7}: Time travel three times. Activate only as a sorcery. (For each suspended card you own and each permanent you control with a time counter on it, you may add or remove a time counter. Then do it two more times.)",
};

export const FIRST_DOCTOR: PairingCard = {
  name: "The First Doctor",
  typeLine: "Legendary Creature — Time Lord Doctor",
  oracleText:
    "When The First Doctor enters, search your library and/or graveyard for a card named TARDIS, reveal it, and put it into your hand. If you search your library this way, shuffle.\nWhenever you cast a spell with cascade, put a +1/+1 counter on target artifact or creature.",
};

export const DOCTOR_STRANGE: PairingCard = {
  name: "Doctor Strange, Surgeon",
  typeLine: "Legendary Creature — Human Doctor Hero",
  oracleText:
    "Lifelink\nIf you would gain life, you gain twice that much life instead.\nAt the beginning of each combat, if you have at least 10 life more than your starting life total, creatures you control get +2/+2 and gain vigilance until end of turn.",
};

export const MASTER_FORMED_ANEW: PairingCard = {
  name: "The Master, Formed Anew",
  typeLine: "Legendary Creature — Time Lord Rogue",
  oracleText:
    "Body Thief — When you cast this spell, you may exile a creature you control and put a takeover counter on it.\nYou may have The Master enter as a copy of a creature card in exile with a takeover counter on it.",
};

export const WILSON: PairingCard = {
  name: "Wilson, Refined Grizzly",
  typeLine: "Legendary Creature — Bear Warrior",
  oracleText:
    "This spell can't be countered.\nReach, vigilance, trample\nWard {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\nChoose a Background (You can have a Background as a second commander.)",
};

export const JAHEIRA: PairingCard = {
  name: "Jaheira, Friend of the Forest",
  typeLine: "Legendary Creature — Human Elf Druid",
  oracleText:
    'Tokens you control have "{T}: Add {G}."\nChoose a Background (You can have a Background as a second commander.)',
};

export const RAISED_BY_GIANTS: PairingCard = {
  name: "Raised by Giants",
  typeLine: "Legendary Enchantment — Background",
  oracleText:
    "Commander creatures you own have base power and toughness 10/10 and are Giants in addition to their other types.",
};

export const CANDLEKEEP_SAGE: PairingCard = {
  name: "Candlekeep Sage",
  typeLine: "Legendary Enchantment — Background",
  oracleText:
    'Commander creatures you own have "When this creature enters or leaves the battlefield, draw a card."',
};

export const CLAN_CRAFTER: PairingCard = {
  name: "Clan Crafter",
  typeLine: "Legendary Enchantment — Background",
  oracleText:
    'Commander creatures you own have "{2}, Sacrifice an artifact: Put a +1/+1 counter on this creature and draw a card."',
};

export const BJORNA: PairingCard = {
  name: "Bjorna, Nightfall Alchemist",
  typeLine: "Legendary Creature — Human",
  oracleText:
    "{T}, Sacrifice an artifact: Bjorna, Nightfall Alchemist deals 1 damage to target creature. Goad that creature. (Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)\nPartner—Friends forever (You can have two commanders if both have this ability.)",
};

export const CECILY: PairingCard = {
  name: "Cecily, Haunted Mage",
  typeLine: "Legendary Creature — Human Wizard",
  oracleText:
    "Your maximum hand size is eleven.\nWhenever Cecily, Haunted Mage attacks, you draw a card and you lose 1 life. Then if you have eleven or more cards in your hand, you may cast an instant or sorcery spell from your hand without paying its mana cost.\nPartner—Friends forever (You can have two commanders if both have this ability.)",
};

export const ELLIE: PairingCard = {
  name: "Ellie, Vengeful Hunter",
  typeLine: "Legendary Creature — Human Survivor",
  oracleText:
    "Pay 2 life, Sacrifice another creature: Ellie deals 2 damage to target player and gains indestructible until end of turn.\nPartner—Survivors (You can have two commanders if both have this ability.)",
};

export const JOEL: PairingCard = {
  name: "Joel, Resolute Survivor",
  typeLine: "Legendary Creature — Human Survivor",
  oracleText:
    "Menace\nWhenever a creature token dies, put a +1/+1 counter on Joel and draw a card. This ability triggers only once each turn.\nPartner—Survivors (You can have two commanders if both have this ability.)",
};

export const KRATOS: PairingCard = {
  name: "Kratos, Stoic Father",
  typeLine: "Legendary Creature — God Warrior",
  oracleText:
    "Whenever you attack with one or more Gods and whenever a God dies, you get an experience counter.\nAt the beginning of your end step, put a number of +1/+1 counters on target creature equal to the number of experience counters you have.\nPartner—Father & son (You can have two commanders if both have this ability.)",
};

export const ATREUS: PairingCard = {
  name: "Atreus, Impulsive Son",
  typeLine: "Legendary Creature — God Archer",
  oracleText:
    "Reach\n{3}, {T}: Draw a card for each experience counter you have, then discard a card. Atreus deals 2 damage to each opponent.\nPartner—Father & son (You can have two commanders if both have this ability.)",
};

export const LEONARDO: PairingCard = {
  name: "Leonardo, the Balance",
  typeLine: "Legendary Creature — Mutant Ninja Turtle",
  oracleText:
    "Whenever a token you control enters, you may put a +1/+1 counter on each creature you control. Do this only once each turn.\n{W}{U}{B}{R}{G}: Creatures you control gain menace, trample, and lifelink until end of turn.\nPartner—Character select (You can have two commanders if both have this ability.)",
};

export const DONATELLO: PairingCard = {
  name: "Donatello, the Brains",
  typeLine: "Legendary Creature — Mutant Ninja Turtle",
  oracleText:
    "If one or more tokens would be created under your control, those tokens plus a Mutagen token are created instead.\nPartner—Character select (You can have two commanders if both have this ability.)",
};

export const SEFRIS: PairingCard = {
  name: "Sefris of the Hidden Ways",
  typeLine: "Legendary Creature — Human Wizard",
  oracleText:
    "Whenever one or more creature cards are put into your graveyard from anywhere, venture into the dungeon. This ability triggers only once each turn. (To venture into the dungeon, enter the first room or advance to the next room.)\nCreate Undead — Whenever you complete a dungeon, return target creature card from your graveyard to the battlefield.",
};

export const ATRAXA: PairingCard = {
  name: "Atraxa, Praetors' Voice",
  typeLine: "Legendary Creature — Phyrexian Angel Horror",
  oracleText:
    "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
};

/**
 * Cecily as deck rows saved before Oracle renamed "Friends forever" to
 * "Partner—Friends forever" still store her. Not current Oracle text.
 */
export const CECILY_SAVED_BEFORE_RENAME: PairingCard = {
  name: "Cecily, Haunted Mage",
  typeLine: "Legendary Creature — Human Wizard",
  oracleText:
    "Your maximum hand size is eleven.\nWhenever Cecily, Haunted Mage attacks, you draw a card and you lose 1 life. Then if you have eleven or more cards in your hand, you may cast an instant or sorcery spell from your hand without paying its mana cost.\nFriends forever (You can have two commanders if both have friends forever.)",
};

/**
 * Hypothetical: no printed Doctor has a third creature type. It pins the
 * "has no other creature types" clause of CR 702.124m.
 */
export const HYPOTHETICAL_DOCTOR_WIZARD: PairingCard = {
  name: "Hypothetical Doctor Wizard",
  typeLine: "Legendary Creature — Time Lord Doctor Wizard",
  oracleText: "Flying",
};
