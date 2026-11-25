/**
 * Every kind of line the playtest engine logs, rendered by the row in English and in French.
 *
 * The engine records a message key and its parameters (#1853). The English column is the sentence
 * the engine wrote before, word for word, so English reads exactly as it did; the French column
 * is the catalog's wording. Card names stay as the card data gives them in both.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlaytestLogMessage } from "@/lib/playtest/engine";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { ActionLogEntryRow } from "./ActionLogEntryRow";

interface Line {
  readonly message: PlaytestLogMessage;
  readonly en: string;
  readonly fr: string;
}

const LINES: readonly Line[] = [
  {
    message: {
      key: "startedWithChosenCards",
      params: { cards: ["Smothering Tithe", "Sol Ring"] },
    },
    en: "Started with chosen cards: Smothering Tithe, Sol Ring",
    fr: "Partie commencée avec les cartes choisies : Smothering Tithe, Sol Ring",
  },
  {
    message: { key: "freeMulligan" },
    en: "Free mulligan: drew a new seven",
    fr: "Mulligan gratuit : nouvelle main de sept cartes",
  },
  {
    message: { key: "mulligan", params: { toBottom: 1 } },
    en: "Mulligan: drew a new seven, 1 card to put on the bottom",
    fr: "Mulligan : nouvelle main de sept cartes, 1 carte à mettre au-dessous",
  },
  {
    message: { key: "mulligan", params: { toBottom: 2 } },
    en: "Mulligan: drew a new seven, 2 cards to put on the bottom",
    fr: "Mulligan : nouvelle main de sept cartes, 2 cartes à mettre au-dessous",
  },
  {
    message: {
      key: "bottomed",
      params: { cards: ["Sol Ring", "Lightning Bolt"] },
    },
    en: "Put Sol Ring, Lightning Bolt on the bottom of the library",
    fr: "Tu as mis Sol Ring, Lightning Bolt au-dessous de ta bibliothèque",
  },
  {
    message: { key: "drewCard" },
    en: "Drew a card",
    fr: "Tu as pioché une carte",
  },
  {
    message: { key: "drewFirstTurnCard" },
    en: "Drew a card for turn 1",
    fr: "Tu as pioché une carte pour le tour 1",
  },
  {
    message: { key: "startedTurn", params: { turn: 3 } },
    en: "Started turn 3",
    fr: "Début du tour 3",
  },
  {
    message: { key: "startedTurnAndDrew", params: { turn: 3 } },
    en: "Started turn 3 and drew a card",
    fr: "Début du tour 3 : tu as pioché une carte",
  },
  {
    message: { key: "advancedToPhase", params: { phase: "Main1" } },
    en: "Advanced to Main1",
    fr: "Étape suivante : Principale 1",
  },
  {
    message: { key: "advancedToPhase", params: { phase: "Upkeep" } },
    en: "Advanced to Upkeep",
    fr: "Étape suivante : Entretien",
  },
  {
    message: { key: "tapped", params: { card: "Llanowar Elves" } },
    en: "Tapped Llanowar Elves",
    fr: "Tu as engagé Llanowar Elves",
  },
  {
    message: { key: "untapped", params: { card: "Llanowar Elves" } },
    en: "Untapped Llanowar Elves",
    fr: "Tu as dégagé Llanowar Elves",
  },
  {
    message: { key: "untappedAll" },
    en: "Untapped all permanents",
    fr: "Tu as dégagé tous tes permanents",
  },
  {
    message: { key: "createdCopy", params: { card: "Llanowar Elves" } },
    en: "Created a copy of Llanowar Elves",
    fr: "Tu as créé une copie de Llanowar Elves",
  },
  {
    message: { key: "created", params: { card: "1/1 Soldier token" } },
    en: "Created 1/1 Soldier token",
    fr: "Tu as créé 1/1 Soldier token",
  },
  {
    message: { key: "counterAdded", params: { card: "Llanowar Elves" } },
    en: "Added a counter to Llanowar Elves",
    fr: "Tu as ajouté un marqueur sur Llanowar Elves",
  },
  {
    message: { key: "counterRemoved", params: { card: "Llanowar Elves" } },
    en: "Removed a counter from Llanowar Elves",
    fr: "Tu as retiré un marqueur de Llanowar Elves",
  },
  {
    message: { key: "removedCopy", params: { card: "Sol Ring" } },
    en: "Removed Sol Ring from the battlefield",
    fr: "Tu as retiré Sol Ring du champ de bataille",
  },
  {
    message: { key: "castFromCommandZone", params: { card: "Kenrith" } },
    en: "Cast Kenrith from the command zone",
    fr: "Tu as lancé Kenrith depuis la zone de commandement",
  },
  {
    message: { key: "returnedToCommandZone", params: { card: "Kenrith" } },
    en: "Returned Kenrith to the command zone",
    fr: "Tu as renvoyé Kenrith dans la zone de commandement",
  },
  {
    message: {
      key: "moved",
      params: { card: "Forest", from: "hand", to: "battlefield" },
    },
    en: "Moved Forest from hand to battlefield",
    fr: "Tu as déplacé Forest de ta main vers le champ de bataille",
  },
  {
    message: {
      key: "moved",
      params: { card: "Sol Ring", from: "library", to: "graveyard" },
    },
    en: "Moved Sol Ring from library to graveyard",
    fr: "Tu as déplacé Sol Ring de ta bibliothèque vers ton cimetière",
  },
  {
    message: {
      key: "moved",
      params: { card: "Kenrith", from: "command", to: "exile" },
    },
    en: "Moved Kenrith from command to exile",
    fr: "Tu as déplacé Kenrith de la zone de commandement vers l’exil",
  },
  {
    message: {
      key: "moved",
      params: { card: "Forest", from: "exile", to: "library" },
    },
    en: "Moved Forest from exile to library",
    fr: "Tu as déplacé Forest de l’exil vers ta bibliothèque",
  },
  {
    message: {
      key: "moved",
      params: { card: "Forest", from: "graveyard", to: "hand" },
    },
    en: "Moved Forest from graveyard to hand",
    fr: "Tu as déplacé Forest de ton cimetière vers ta main",
  },
  {
    message: {
      key: "moved",
      params: { card: "Forest", from: "battlefield", to: "exile" },
    },
    en: "Moved Forest from battlefield to exile",
    fr: "Tu as déplacé Forest du champ de bataille vers l’exil",
  },
  {
    message: { key: "libraryShuffled" },
    en: "Library shuffled",
    fr: "Tu as mélangé ta bibliothèque",
  },
  {
    message: { key: "rolledDie", params: { sides: 20, result: 17 } },
    en: "Rolled d20: 17",
    fr: "Lancer d’un d20 : 17",
  },
  {
    message: { key: "lostLife", params: { amount: 3 } },
    en: "Lost 3 life: damage",
    fr: "Tu as perdu 3 points de vie : blessures",
  },
  {
    message: { key: "lostLifeTo", params: { amount: 1, cause: "combat" } },
    en: "Lost 1 life: combat",
    fr: "Tu as perdu 1 point de vie : combat",
  },
  {
    message: { key: "gainedLife", params: { amount: 4 } },
    en: "Gained 4 life",
    fr: "Tu as gagné 4 points de vie",
  },
  {
    message: { key: "producedMana", params: { amount: 3 } },
    en: "Produced 3 mana",
    fr: "Tu as produit 3 mana",
  },
  {
    message: {
      key: "commanderDamage",
      params: {
        opponent: 3,
        amount: 5,
        card: "Kenrith, the Returned King",
        total: 9,
      },
    },
    en: "Opponent 3 took 5 combat damage from Kenrith, the Returned King (9 in total)",
    fr: "L’adversaire 3 a subi 5 blessures de combat de Kenrith, the Returned King (9 au total)",
  },
  {
    message: {
      key: "playerCountersGained",
      params: { counter: "poison", count: 2, total: 2 },
    },
    en: "Gained 2 poison counters (2 in total)",
    fr: "Tu as reçu 2 marqueurs poison (2 au total)",
  },
  {
    message: {
      key: "playerCountersGained",
      params: { counter: "experience", count: 1, total: 4 },
    },
    en: "Gained 1 experience counter (4 in total)",
    fr: "Tu as reçu 1 marqueur d’expérience (4 au total)",
  },
  {
    message: {
      key: "playerCountersLost",
      params: { counter: "energy", count: 1, total: 2 },
    },
    en: "Lost 1 energy counter (2 in total)",
    fr: "Tu as perdu 1 marqueur d’énergie (2 au total)",
  },
  {
    message: { key: "gotCitysBlessing" },
    en: "Got the city's blessing",
    fr: "Tu as obtenu la bénédiction de la cité",
  },
  {
    message: { key: "dayNightBegan", params: { to: "night" } },
    en: "It became night",
    fr: "Il fait désormais nuit",
  },
  {
    message: { key: "dayNightBegan", params: { to: "day" } },
    en: "It became day",
    fr: "Il fait désormais jour",
  },
  {
    message: { key: "dayNightSwapped", params: { to: "day" } },
    en: "Night became day",
    fr: "La nuit devient le jour",
  },
  {
    message: { key: "dayNightSwapped", params: { to: "night" } },
    en: "Day became night",
    fr: "Le jour devient la nuit",
  },
  {
    message: { key: "becameMonarch" },
    en: "Became the monarch",
    fr: "Tu deviens le monarque",
  },
  {
    message: { key: "opponentBecameMonarch" },
    en: "An opponent became the monarch",
    fr: "Un adversaire devient le monarque",
  },
  {
    message: { key: "tookInitiative" },
    en: "Took the initiative",
    fr: "Tu prends l’initiative",
  },
  {
    message: { key: "opponentTookInitiative" },
    en: "An opponent took the initiative",
    fr: "Un adversaire prend l’initiative",
  },
  {
    message: { key: "ringTempted", params: { total: 2 } },
    en: "The Ring tempted you (2 in total)",
    fr: "L’Anneau t’a tenté (2 au total)",
  },
  {
    message: { key: "note", params: { text: "Opponent at 12" } },
    en: "Opponent at 12",
    fr: "Opponent at 12",
  },
];

/**
 * Every message key, checked by the compiler: a key added to `PlaytestLogMessage` fails to compile
 * here until it is listed, and the coverage test then asks for its English and French lines.
 */
const EVERY_KEY = {
  startedWithChosenCards: true,
  freeMulligan: true,
  mulligan: true,
  bottomed: true,
  drewCard: true,
  drewFirstTurnCard: true,
  startedTurn: true,
  startedTurnAndDrew: true,
  advancedToPhase: true,
  tapped: true,
  untapped: true,
  untappedAll: true,
  createdCopy: true,
  created: true,
  counterAdded: true,
  counterRemoved: true,
  removedCopy: true,
  castFromCommandZone: true,
  returnedToCommandZone: true,
  moved: true,
  libraryShuffled: true,
  rolledDie: true,
  lostLife: true,
  lostLifeTo: true,
  gainedLife: true,
  producedMana: true,
  commanderDamage: true,
  playerCountersGained: true,
  playerCountersLost: true,
  gotCitysBlessing: true,
  dayNightBegan: true,
  dayNightSwapped: true,
  becameMonarch: true,
  opponentBecameMonarch: true,
  tookInitiative: true,
  opponentTookInitiative: true,
  ringTempted: true,
  note: true,
} satisfies Record<PlaytestLogMessage["key"], true>;

/** Renders one row of the log, not being edited, in `locale`. */
function renderRow(message: PlaytestLogMessage, locale: TestLocale) {
  renderWithProviders(
    <ul>
      <ActionLogEntryRow
        entry={{ id: 1, turn: 2, phase: "Main1", message }}
        editing={false}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancelEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    </ul>,
    { locale }
  );
}

describe("ActionLogEntryRow", () => {
  it.each(LINES)(
    "says $message.key in English as the engine did: $en",
    ({ message, en }) => {
      renderRow(message, "en");

      expect(screen.getByText(en)).toBeInTheDocument();
    }
  );

  it.each(LINES)("says $message.key in French: $fr", ({ message, fr }) => {
    renderRow(message, "fr");

    expect(screen.getByText(fr)).toBeInTheDocument();
  });

  it("covers every kind of line the engine logs", () => {
    const covered = new Set<string>(LINES.map((line) => line.message.key));

    expect(Object.keys(EVERY_KEY).filter((key) => !covered.has(key))).toEqual(
      []
    );
  });
});
