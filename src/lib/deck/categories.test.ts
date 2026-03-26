import { describe, it, expect } from "vitest";
import { categorizeCard, categorizeDfcCard, isDfcLayout, isMdfcWithLandBack, CATEGORY_LABELS } from "@/lib/deck/categories";
import type { ScryfallCard } from "@/lib/scryfall/types";

function makeCard(overrides: Partial<ScryfallCard>): ScryfallCard {
  return {
    id: "test-id",
    name: "Test Card",
    layout: "normal",
    cmc: 2,
    type_line: "Instant",
    color_identity: [],
    ...overrides,
  };
}

describe("categorizeCard", () => {
  it("categorizes basic lands as land", () => {
    const card = makeCard({ type_line: "Basic Land — Forest", cmc: 0 });
    expect(categorizeCard(card)).toBe("land");
  });

  it("categorizes non-basic lands as land", () => {
    const card = makeCard({ type_line: "Land", cmc: 0, oracle_text: "T: Add {G}." });
    expect(categorizeCard(card)).toBe("land");
  });

  it("categorizes planeswalkers", () => {
    const card = makeCard({ type_line: "Legendary Planeswalker — Liliana", cmc: 4 });
    expect(categorizeCard(card)).toBe("planeswalker");
  });

  it("categorizes ramp spells", () => {
    const card = makeCard({
      type_line: "Sorcery",
      oracle_text: "Search your library for a basic land card and put it onto the battlefield.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("ramp");
  });

  it("categorizes mana rocks as ramp", () => {
    const card = makeCard({
      type_line: "Artifact",
      oracle_text: "{T}: Add {C}{C}.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("ramp");
  });

  it("categorizes board wipes", () => {
    const card = makeCard({
      type_line: "Sorcery",
      oracle_text: "Destroy all creatures.",
      cmc: 4,
    });
    expect(categorizeCard(card)).toBe("boardWipe");
  });

  it("categorizes single-target removal", () => {
    const card = makeCard({
      type_line: "Instant",
      oracle_text: "Destroy target creature.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("removal");
  });

  it("categorizes card draw spells", () => {
    const card = makeCard({
      type_line: "Instant",
      oracle_text: "Draw two cards.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("draw");
  });

  it("categorizes creatures as creature when no functional category applies", () => {
    const card = makeCard({
      type_line: "Creature — Human Warrior",
      oracle_text: "First strike",
      cmc: 3,
    });
    expect(categorizeCard(card)).toBe("creature");
  });

  it("categorizes enchantments as enchantment when no functional category applies", () => {
    const card = makeCard({
      type_line: "Enchantment",
      oracle_text: "Creatures you control get +1/+1.",
      cmc: 3,
    });
    expect(categorizeCard(card)).toBe("enchantment");
  });

  it("defaults to other for unknown types", () => {
    const card = makeCard({
      type_line: "Conspiracy",
      oracle_text: "Some strange effect.",
      cmc: 0,
    });
    expect(categorizeCard(card)).toBe("other");
  });
});

describe("CATEGORY_LABELS", () => {
  it("has a label for every category", () => {
    const categories = [
      "commander", "creature", "instant", "sorcery", "artifact",
      "enchantment", "planeswalker", "land", "ramp", "draw",
      "removal", "boardWipe", "winCondition", "protection", "other",
    ];
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBeDefined();
    }
  });
});

function makeMdfc(o: Partial<ScryfallCard> = {}): ScryfallCard { return { id:"m1", name:"Shatterskull Smashing // Shatterskull, the Hammer Pass", layout:"modal_dfc", cmc:2, type_line:"Sorcery // Land", color_identity:["R"], card_faces:[{name:"Shatterskull Smashing",mana_cost:"{X}{R}{R}",type_line:"Sorcery",oracle_text:"Deals X damage.",image_uris:{normal:"https://ex.com/f.jpg"}},{name:"Shatterskull, the Hammer Pass",mana_cost:"",type_line:"Land",oracle_text:"Enters tapped.",image_uris:{normal:"https://ex.com/b.jpg"}}], ...o }; }
function makeTf(o: Partial<ScryfallCard> = {}): ScryfallCard { return { id:"t1", name:"Delver of Secrets // Insectile Aberration", layout:"transform", cmc:1, type_line:"Creature — Human Wizard // Creature — Human Insect", color_identity:["U"], card_faces:[{name:"Delver of Secrets",mana_cost:"{U}",type_line:"Creature — Human Wizard",oracle_text:"Look at top.",image_uris:{normal:"https://ex.com/d1.jpg"}},{name:"Insectile Aberration",mana_cost:"",type_line:"Creature — Human Insect",oracle_text:"Flying",image_uris:{normal:"https://ex.com/d2.jpg"}}], ...o }; }
describe("isDfcLayout", () => {
  it("modal_dfc → true", () => expect(isDfcLayout(makeMdfc())).toBe(true));
  it("transform → true", () => expect(isDfcLayout(makeTf())).toBe(true));
  it("normal → false", () => expect(isDfcLayout(makeCard({layout:"normal"}))).toBe(false));
  it("no faces → false", () => expect(isDfcLayout(makeMdfc({card_faces:undefined}))).toBe(false));
});
describe("isMdfcWithLandBack", () => {
  it("land back → true", () => expect(isMdfcWithLandBack(makeMdfc())).toBe(true));
  it("transform → false", () => expect(isMdfcWithLandBack(makeTf())).toBe(false));
  it("creature back → false", () => expect(isMdfcWithLandBack(makeMdfc({card_faces:[{name:"A",mana_cost:"{B}",type_line:"Sorcery",oracle_text:""},{name:"B",mana_cost:"",type_line:"Creature",oracle_text:""}]}))).toBe(false));
});
describe("categorizeDfcCard", () => {
  it("sorcery front → sorcery", () => expect(categorizeDfcCard(makeMdfc())).toBe("sorcery"));
  it("not land", () => expect(categorizeDfcCard(makeMdfc())).not.toBe("land"));
  it("creature front → creature", () => expect(categorizeDfcCard(makeTf())).toBe("creature"));
  it("ramp front → ramp", () => expect(categorizeDfcCard(makeMdfc({card_faces:[{name:"S",mana_cost:"{2}{G}",type_line:"Sorcery",oracle_text:"Search your library for a basic land card and put it onto the battlefield."},{name:"F",mana_cost:"",type_line:"Basic Land",oracle_text:""}]}))).toBe("ramp"));
  it("draw front → draw", () => expect(categorizeDfcCard(makeMdfc({card_faces:[{name:"D",mana_cost:"{2}{U}",type_line:"Sorcery",oracle_text:"Draw two cards."},{name:"I",mana_cost:"",type_line:"Land",oracle_text:""}]}))).toBe("draw"));
});
describe("CMC for MDFC/DFC", () => {
  it("Shatterskull cmc=2", () => expect(makeMdfc().cmc).toBe(2));
  it("Delver cmc=1", () => expect(makeTf().cmc).toBe(1));
});
