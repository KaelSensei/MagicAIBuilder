/**
 * A Commander Spellbook `POST /find-my-combos` response, recorded verbatim.
 *
 * Recorded on 2026-11-09 from https://backend.commanderspellbook.com/find-my-combos
 * (API 7.3.6, schema at https://backend.commanderspellbook.com/schema/) with the
 * request body in `FIND_MY_COMBOS_RECORDED_REQUEST`. Every variant is copied as
 * Spellbook sent it. Only the lists were shortened: all three `included` variants
 * are kept, `almostIncluded` keeps one of its 38 (Tainted Pact, which the deck
 * lacks), and the other buckets were already empty or are emptied.
 *
 * The three included variants cover what the parser must map: a generic extra
 * piece (`requires`), a notable prerequisite, and the mana a combo needs.
 */
export const FIND_MY_COMBOS_RECORDED_REQUEST = {
  commanders: [
    {
      card: "Kenrith, the Returned King",
    },
  ],
  main: [
    {
      card: "Thassa's Oracle",
    },
    {
      card: "Demonic Consultation",
    },
    {
      card: "Isochron Scepter",
    },
    {
      card: "Dramatic Reversal",
    },
    {
      card: "Hullbreaker Horror",
    },
    {
      card: "Sol Ring",
    },
    {
      card: "Wayfarer's Bauble",
    },
    {
      card: "Island",
    },
    {
      card: "Swamp",
    },
  ],
};

/** The recorded response body, as `fetch` would hand it to `response.json()`. */
export const FIND_MY_COMBOS_RECORDED = {
  count: null,
  next: null,
  previous: null,
  results: {
    identity: "WUBRG",
    included: [
      {
        id: "513-5034--46",
        of: [
          {
            id: 26516,
          },
        ],
        salt: 1.91,
        uses: [
          {
            card: {
              id: 513,
              name: "Hullbreaker Horror",
              faces: 1,
              spoiler: false,
              oracleId: "d4a84e78-d9b9-4c67-8a4b-4329e65f0f15",
              typeLine: "Creature — Kraken Horror",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/1/3/137acb70-a1fd-4ea9-a5d9-f4b438eb5e82.png?1783908162",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/1/3/137acb70-a1fd-4ea9-a5d9-f4b438eb5e82.webp?1783908162",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/1/3/137acb70-a1fd-4ea9-a5d9-f4b438eb5e82.webp?1783908162",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/1/3/137acb70-a1fd-4ea9-a5d9-f4b438eb5e82.webp?1783908162",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/1/3/137acb70-a1fd-4ea9-a5d9-f4b438eb5e82.webp?1783908162",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["B"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
          {
            card: {
              id: 5034,
              name: "Sol Ring",
              faces: 1,
              spoiler: false,
              oracleId: "6ad8011d-3471-4369-9d68-b264cc027487",
              typeLine: "Artifact",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.png?1793021181",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["B"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
        ],
        notes: "",
        prices: {
          tcgplayer: "6.71",
          cardmarket: "5.62",
          cardkingdom: "12.78",
        },
        status: "OK",
        spoiler: false,
        identity: "U",
        includes: [
          {
            id: 26516,
          },
        ],
        produces: [
          {
            feature: {
              id: 11,
              name: "Infinite colorless mana",
              status: "S",
              uncountable: true,
            },
            quantity: 1,
          },
          {
            feature: {
              id: 17,
              name: "Infinite storm count",
              status: "H",
              uncountable: true,
            },
            quantity: 1,
          },
        ],
        requires: [
          {
            quantity: 1,
            template: {
              id: 46,
              name: "Permanent Castable for {C}",
              scryfallApi:
                "https://api.scryfall.com/cards/search?q=%28mv%3C%3D1+%28mana%3D%7B0%7D+or+mana%3D%7B1%7D+or+mana%3D%7BC%7D%29+is%3Apermanent%29+legal%3Acommander",
              scryfallQuery:
                "mv<=1 (mana={0} or mana={1} or mana={C}) is:permanent",
            },
            zoneLocations: ["H"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
        ],
        legalities: {
          brawl: false,
          predh: false,
          legacy: false,
          modern: false,
          pauper: false,
          alchemy: false,
          pioneer: false,
          vintage: true,
          standard: false,
          commander: true,
          premodern: false,
          oathbreaker: false,
          standardBrawl: false,
          pauperCommander: false,
          competitiveBrawl: false,
          pauperCommanderMain: false,
        },
        popularity: 367460,
        bracketTag: "E",
        description:
          "Activate Sol Ring by tapping it, adding {C} {C}.\nCast the permanent that can be cast using {C} by paying its mana cost.\nHullbreaker Horror triggers, returning Sol Ring from the battlefield to your hand.\nCast Sol Ring by paying {1}. \nHullbreaker Horror triggers, returning the permanent cast in step 2 from the battlefield to your hand.\nRepeat.\nIf the permanent can be cast by paying {0}, this combo nets infinite colorless mana.",
        manaNeeded: "",
        variantCount: 1,
        saltVoteCount: 47,
        manaValueNeeded: 0,
        easyPrerequisites: "",
        notablePrerequisites: "",
      },
      {
        id: "742-1295",
        of: [
          {
            id: 355,
          },
        ],
        salt: 3.41,
        uses: [
          {
            card: {
              id: 742,
              name: "Demonic Consultation",
              faces: 1,
              spoiler: false,
              oracleId: "9a1412db-45ad-46ea-8f12-a85d203113d8",
              typeLine: "Instant",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/1/d/1d779f19-3068-4976-b96b-8f93d156900b.png?1783942624",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/1/d/1d779f19-3068-4976-b96b-8f93d156900b.webp?1783942624",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/1/d/1d779f19-3068-4976-b96b-8f93d156900b.webp?1783942624",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/1/d/1d779f19-3068-4976-b96b-8f93d156900b.webp?1783942624",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/1/d/1d779f19-3068-4976-b96b-8f93d156900b.webp?1783942624",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["H"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
          {
            card: {
              id: 1295,
              name: "Thassa's Oracle",
              faces: 1,
              spoiler: false,
              oracleId: "1de1b591-a73f-4974-b507-8c63e07a0868",
              typeLine: "Creature — Merfolk Wizard",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.png?1783931575",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["H"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
        ],
        notes: "",
        prices: {
          tcgplayer: "22.49",
          cardmarket: "22.88",
          cardkingdom: "32.98",
        },
        status: "OK",
        spoiler: false,
        identity: "UB",
        includes: [
          {
            id: 355,
          },
        ],
        produces: [
          {
            feature: {
              id: 88,
              name: "Exile your library",
              status: "H",
              uncountable: true,
            },
            quantity: 1,
          },
          {
            feature: {
              id: 2,
              name: "Win the game",
              status: "S",
              uncountable: true,
            },
            quantity: 1,
          },
        ],
        requires: [],
        legalities: {
          brawl: false,
          predh: false,
          legacy: false,
          modern: false,
          pauper: false,
          alchemy: false,
          pioneer: false,
          vintage: true,
          standard: false,
          commander: true,
          premodern: false,
          oathbreaker: true,
          standardBrawl: false,
          pauperCommander: false,
          competitiveBrawl: false,
          pauperCommanderMain: false,
        },
        popularity: 151040,
        bracketTag: "R",
        description:
          "Cast Demonic Consultation by paying {B}, naming Thassa's Oracle and thus exiling your library due to you not having a card named Thassa's Oracle in your library.\nCast Thassa's Oracle by paying {U}{U}.\nThassa's Oracle enters the battlefield, causing you to win the game.",
        manaNeeded: "{U}{U}{B}",
        variantCount: 1,
        saltVoteCount: 29,
        manaValueNeeded: 3,
        easyPrerequisites: "",
        notablePrerequisites: "",
      },
      {
        id: "4821-5261",
        of: [
          {
            id: 386,
          },
        ],
        salt: 2.43,
        uses: [
          {
            card: {
              id: 4821,
              name: "Dramatic Reversal",
              faces: 1,
              spoiler: false,
              oracleId: "da46904c-8fb8-44c2-b2ab-775a1cc12ec3",
              typeLine: "Instant",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/2/a/2ad14406-4504-4951-83f0-82c298964d6c.png?1783904806",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/2/a/2ad14406-4504-4951-83f0-82c298964d6c.webp?1783904806",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/2/a/2ad14406-4504-4951-83f0-82c298964d6c.webp?1783904806",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/2/a/2ad14406-4504-4951-83f0-82c298964d6c.webp?1783904806",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/2/a/2ad14406-4504-4951-83f0-82c298964d6c.webp?1783904806",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["E"],
            exileCardState: "exiled by Isochron Scepter",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
          {
            card: {
              id: 5261,
              name: "Isochron Scepter",
              faces: 1,
              spoiler: false,
              oracleId: "ddd649f4-dbaf-48ec-8ff7-95581257772d",
              typeLine: "Artifact",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/2/a/2aa24fe0-e275-4307-b26c-2a656068a451.png?1783930107",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/2/a/2aa24fe0-e275-4307-b26c-2a656068a451.webp?1783930107",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/2/a/2aa24fe0-e275-4307-b26c-2a656068a451.webp?1783930107",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/2/a/2aa24fe0-e275-4307-b26c-2a656068a451.webp?1783930107",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/2/a/2aa24fe0-e275-4307-b26c-2a656068a451.webp?1783930107",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["B"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
        ],
        notes: "",
        prices: {
          tcgplayer: "9.26",
          cardmarket: "6.20",
          cardkingdom: "10.18",
        },
        status: "OK",
        spoiler: false,
        identity: "U",
        includes: [
          {
            id: 386,
          },
          {
            id: 27841,
          },
        ],
        produces: [
          {
            feature: {
              id: 77,
              name: "Infinite magecraft triggers",
              status: "H",
              uncountable: true,
            },
            quantity: 1,
          },
          {
            feature: {
              id: 92,
              name: "Infinite mana nonland permanents you control can produce",
              status: "S",
              uncountable: true,
            },
            quantity: 1,
          },
          {
            feature: {
              id: 17,
              name: "Infinite storm count",
              status: "H",
              uncountable: true,
            },
            quantity: 1,
          },
          {
            feature: {
              id: 93,
              name: "Infinite untap of nonland permanents you control",
              status: "C",
              uncountable: true,
            },
            quantity: 1,
          },
        ],
        requires: [],
        legalities: {
          brawl: false,
          predh: false,
          legacy: true,
          modern: true,
          pauper: false,
          alchemy: false,
          pioneer: false,
          vintage: true,
          standard: false,
          commander: true,
          premodern: false,
          oathbreaker: true,
          standardBrawl: false,
          pauperCommander: false,
          competitiveBrawl: false,
          pauperCommanderMain: false,
        },
        popularity: 107684,
        bracketTag: "S",
        description:
          "Activate all mana-producing nonland permanents you control by tapping them, adding at least {3}.\nActivate Isochron Scepter by paying {2} and tapping it, casting a copy of Dramatic Reversal without paying it's mana cost.\nResolve Dramatic Reversal, untapping all nonland permanents you control.\nRepeat.",
        manaNeeded: "",
        variantCount: 1,
        saltVoteCount: 14,
        manaValueNeeded: 0,
        easyPrerequisites: "",
        notablePrerequisites:
          "Nonland permanents you control can tap to produce at least {3}.",
      },
    ],
    includedByChangingCommanders: [],
    almostIncluded: [
      {
        id: "1295-3093",
        of: [
          {
            id: 1776,
          },
        ],
        salt: 3.5,
        uses: [
          {
            card: {
              id: 3093,
              name: "Tainted Pact",
              faces: 1,
              spoiler: false,
              oracleId: "1a85ba2b-ae10-4917-954a-7709b75a9740",
              typeLine: "Instant",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/c/5/c513f51b-a0db-4c08-8acc-1e91060b93b7.png?1783945239",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/c/5/c513f51b-a0db-4c08-8acc-1e91060b93b7.webp?1783945239",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/c/5/c513f51b-a0db-4c08-8acc-1e91060b93b7.webp?1783945239",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/c/5/c513f51b-a0db-4c08-8acc-1e91060b93b7.webp?1783945239",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/c/5/c513f51b-a0db-4c08-8acc-1e91060b93b7.webp?1783945239",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["H"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
          {
            card: {
              id: 1295,
              name: "Thassa's Oracle",
              faces: 1,
              spoiler: false,
              oracleId: "1de1b591-a73f-4974-b507-8c63e07a0868",
              typeLine: "Creature — Merfolk Wizard",
              imageUriBackPng: null,
              imageUriFrontPng:
                "https://cards.scryfall.io/png/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.png?1783931575",
              imageUriBackLarge: null,
              imageUriBackSmall: null,
              imageUriBackNormal: null,
              imageUriFrontLarge:
                "https://cards.scryfall.io/display/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              imageUriFrontSmall:
                "https://cards.scryfall.io/thumb/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              layoutRotationFront: null,
              imageUriFrontNormal:
                "https://cards.scryfall.io/grid/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
              imageUriBackArtCrop: null,
              imageUriFrontArtCrop:
                "https://cards.scryfall.io/art/front/7/2/726e8b29-13e9-4138-b6a9-d2a0d8188d1c.webp?1783931575",
            },
            quantity: 1,
            usedFace: null,
            zoneLocations: ["H"],
            exileCardState: "",
            mustBeCommander: false,
            libraryCardState: "",
            graveyardCardState: "",
            battlefieldCardState: "",
          },
        ],
        notes: "",
        prices: {
          tcgplayer: "47.15",
          cardmarket: "29.85",
          cardkingdom: "58.98",
        },
        status: "OK",
        spoiler: false,
        identity: "UB",
        includes: [
          {
            id: 1776,
          },
        ],
        produces: [
          {
            feature: {
              id: 2,
              name: "Win the game",
              status: "S",
              uncountable: true,
            },
            quantity: 1,
          },
        ],
        requires: [],
        legalities: {
          brawl: false,
          predh: false,
          legacy: true,
          modern: false,
          pauper: false,
          alchemy: false,
          pioneer: false,
          vintage: true,
          standard: false,
          commander: true,
          premodern: false,
          oathbreaker: true,
          standardBrawl: false,
          pauperCommander: false,
          competitiveBrawl: true,
          pauperCommanderMain: false,
        },
        popularity: 132697,
        bracketTag: "R",
        description:
          "Cast Tainted Pact by paying {1}{B}, exiling your library.\nCast Thassa's Oracle by paying {U}{U}.\nThassa's Oracle enters the battlefield, causing you to win the game.",
        manaNeeded: "{1}{U}{U}{B}",
        variantCount: 3,
        saltVoteCount: 24,
        manaValueNeeded: 4,
        easyPrerequisites: "No two cards in library share a name.",
        notablePrerequisites: "",
      },
    ],
    almostIncludedByAddingColors: [],
    almostIncludedByChangingCommanders: [],
    almostIncludedByAddingColorsAndChangingCommanders: [],
  },
};
