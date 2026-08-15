import { test, expect } from "@playwright/test";

type ImportCard = {
  readonly name: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: "main" | "sideboard" | "maybeboard";
};

function normalizeMoxfieldLine(line: string): { name: string; quantity: number } | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.toUpperCase() === "SIDEBOARD:") return null;
  const m = /^(\d+)\s+(.+)$/.exec(trimmed);
  if (!m) return null;
  const qty = Number.parseInt(m[1] ?? "", 10);
  const raw = (m[2] ?? "").trim();
  // Remove trailing set/collector info:
  // - "Name (PLST) THB-231" → "Name"
  // - "Name (SLD) 1155" → "Name"
  const name = raw.replace(/\s*\([^)]*\)\s*[A-Z0-9-]+\s*$/, "").trim();
  return { name, quantity: Number.isFinite(qty) && qty > 0 ? qty : 1 };
}

function cardKey(name: string): string {
  const canonical = name
    .replace(/\s*\/\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
  return canonical.toLowerCase();
}

function addToCountMap(map: Map<string, number>, name: string, quantity: number): void {
  const k = cardKey(name);
  map.set(k, (map.get(k) ?? 0) + quantity);
}

function buildCountMap(cards: readonly ImportCard[], zone: ImportCard["zone"]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of cards) {
    if (c.zone !== zone) continue;
    addToCountMap(map, c.name, c.quantity);
  }
  return map;
}

/**
 * Tagged @external because it calls the live Moxfield API against a deck owned
 * by a third party. When that deck's visibility changed the whole pre-push gate
 * went red with no code change on our side ("Deck is private or access denied").
 *
 * The gate excludes @external by default; the parser itself is covered
 * hermetically in src/lib/import/url-import.test.ts. Run this deliberately with
 * PLAYWRIGHT_GREP_INVERT="" to verify the live contract.
 */
test.describe("Moxfield import", () => {
  test("@external imports Esika deck and includes expected main + sideboard cards", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const url = "https://moxfield.com/decks/8wdob7tqoUujv-Ifp0S3cw";

    // Retry a couple of times in case Moxfield transiently blocks or rate-limits.
    let lastText = "";
    let res: Awaited<ReturnType<typeof request.post>> | null = null;
    for (const waitMs of [0, 1500, 4000, 8000]) {
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      res = await request.post("/api/import/url", { data: { url } });
      lastText = await res.text();
      if (res.ok()) break;
    }

    expect(res?.ok(), `import failed: ${lastText}`).toBe(true);

    const json = JSON.parse(lastText) as { name?: string; source?: string; cards?: ImportCard[] };
    expect(json.source).toBe("moxfield");
    expect(typeof json.name).toBe("string");

    const cards = json.cards ?? [];
    const mainMap = buildCountMap(cards, "main");
    const sideMap = buildCountMap(cards, "sideboard");

    const expectedLines = [
      "1 Esika, God of the Tree / The Prismatic Bridge (SLD) 1155",
      "1 Altar of the Pantheon (PLST) THB-231",
      "1 Arcane Signet (PLST) ELD-331",
      "1 Archangel Avacyn / Avacyn, the Purifier (SLD) 1156",
      "1 Arlinn Kord / Arlinn, Embraced by the Moon (PLST) SOI-243",
      "1 Arlinn, the Pack's Hope / Arlinn, the Moon's Fury (PLST) MID-211",
      "1 Azor's Gateway / Sanctum of the Sun (PLST) RIX-176",
      "1 Bala Ged Recovery / Bala Ged Sanctuary (PLST) ZNR-180",
      "1 Barkchannel Pathway / Tidechannel Pathway (PLST) KHM-251",
      "1 Beast Whisperer (PLST) GRN-123",
      "1 Beast Within (PLST) NPH-103",
      "1 Blightstep Pathway / Searstep Pathway (PLST) KHM-252",
      "1 Bloodline Keeper / Lord of Lineage (SLD) 1157",
      "1 Branchloft Pathway / Boulderloft Pathway (PLST) ZNR-258",
      "1 Brightclimb Pathway / Grimclimb Pathway (PLST) ZNR-259",
      "1 Butcher of Malakir (PLST) WWK-53",
      "1 Chandra, Fire of Kaladesh / Chandra, Roaring Flame (PLST) ORI-135",
      "1 Chromatic Lantern (PLST) RTR-226",
      "1 Clearwater Pathway / Murkwater Pathway (PLST) ZNR-260",
      "1 Command Tower (PLST) CMD-269",
      "1 Commander's Sphere (PLST) C14-54",
      "1 Cosima, God of the Voyage / The Omenkeel (PLST) KHM-50",
      "1 Cragcrown Pathway / Timbercrown Pathway (PLST) ZNR-261",
      "1 Darkbore Pathway / Slitherbore Pathway (PLST) KHM-254",
      "1 Dennick, Pious Apprentice / Dennick, Pious Apparition (PLST) MID-217",
      "1 Diluvian Primordial (PLST) GTC-33",
      "1 Dowsing Dagger / Lost Vale (PLST) XLN-235",
      "1 Elbrus, the Binding Blade / Withengar Unbound (PLST) DKA-147",
      "1 Emmara, Soul of the Accord (PLST) GRN-168",
      "1 Evolving Wilds (PLST) RIX-186",
      "1 Exotic Orchard (PLST) CON-142",
      "1 Farseek (PLST) RAV-163",
      "1 Fellwar Stone (PLST) CMD-248",
      "1 Forest (PLST) HOU-199",
      "1 Forest (PLST) AKH-268",
      "1 Forest (PLST) HOU-198",
      "1 Frontier Bivouac (PLST) KTK-234",
      "1 Garruk Relentless / Garruk, the Veil-Cursed (PLST) ISD-181",
      "1 Guardian Project (PLST) RNA-130",
      "1 Hadana's Climb / Winged Temple of Orazca (PLST) RIX-158",
      "1 Hagra Mauling / Hagra Broodpit (PLST) ZNR-106",
      "1 Harmonize (PLST) C20-173",
      "1 Hengegate Pathway / Mistgate Pathway (PLST) KHM-260",
      "1 Island (PLST) AKH-258",
      "1 Jace, Vryn's Prodigy / Jace, Telepath Unbound (PLST) ORI-60",
      "1 Jolrael, Mwonvuli Recluse (PLST) M21-191",
      "1 Journey to Eternity / Atzal, Cave of Eternity (PLST) RIX-160",
      "1 Jungle Shrine (PLST) ALA-226",
      "1 Kinnan, Bonder Prodigy (PLST) IKO-192",
      "1 Kolvori, God of Kinship / The Ringhart Crest (PLST) KHM-181",
      "1 Kytheon, Hero of Akros / Gideon, Battle-Forged (PLST) ORI-23",
      "1 Legion's Landing / Adanto, the First Fort (PLST) XLN-22",
      "1 Liliana, Heretical Healer / Liliana, Defiant Necromancer (PLST) ORI-106",
      "1 Ludevic, Necrogenius / Olag, Ludevic's Hubris (PLST) MID-233",
      "1 Meteor Golem (PLST) M19-241",
      "1 Mila, Crafty Companion / Lukka, Wayward Bonder (PLST) STX-153",
      "1 Mountain (PLST) AKH-264",
      "1 Needleverge Pathway / Pillarverge Pathway (PLST) ZNR-263",
      "1 Nicol Bolas, the Ravager / Nicol Bolas, the Arisen (SLD) 1158",
      "1 Nissa, Vastwood Seer / Nissa, Sage Animist (PLST) ORI-189",
      "1 Ondu Inversion / Ondu Skyruins (PLST) ZNR-30",
      "1 Opulent Palace (PLST) KTK-238",
      "1 Path of Ancestry (PLST) C17-56",
      "1 Plains (PLST) AKH-256",
      "1 Plargg, Dean of Chaos / Augusta, Dean of Order (PLST) STX-155",
      "1 Pongify (PLST) PLC-44",
      "1 Putrefy (PLST) KHC-91",
      "1 Rhys the Redeemed (PLST) SHM-237",
      "1 Rimewood Falls (PLST) KHM-266",
      "1 Riverglide Pathway / Lavaglide Pathway (PLST) ZNR-264",
      "1 Sandsteppe Citadel (PLST) KTK-241",
      "1 Sandstone Oracle (PLST) C15-52",
      "1 Savage Lands (PLST) ALA-228",
      "1 Scattered Groves (PLST) AKH-247",
      "1 Search for Azcanta / Azcanta, the Sunken Ruin (PLST) XLN-74",
      "1 Seaside Citadel (PLST) ALA-229",
      "1 Shaile, Dean of Radiance / Embrose, Dean of Shadow (PLST) STX-158",
      "1 Sheltered Thicket (PLST) AKH-248",
      "1 Sisay, Weatherlight Captain (PLST) MH1-29",
      "1 Sol Ring (PLST) CMD-261",
      "1 Sphinx of the Second Sun (PLST) CMR-99",
      "1 Swamp (PLST) HOU-195",
      "1 Terramorphic Expanse (PLST) TSP-279",
      "1 Thaumatic Compass / Spires of Orazca (PLST) XLN-249",
      "1 The World Tree (PLST) KHM-275",
      "1 Time Wipe (PLST) WAR-223",
      "1 Tireless Provisioner (PLST) MH2-180",
      "1 Tovolar's Huntmaster / Tovolar's Packleader (PLST) MID-204",
      "1 Treasure Map / Treasure Cove (PLST) XLN-250",
      "1 Triplicate Titan (PLST) C21-79",
      "1 Urza's Ruinous Blast (PLST) DMC-107",
      "1 Utter End (PLST) KTK-210",
      "1 Valakut Awakening / Valakut Stoneforge (PLST) ZNR-174",
      "1 Valentin, Dean of the Vein / Lisette, Dean of the Root (PLST) STX-161",
      "1 Valki, God of Lies / Tibalt, Cosmic Impostor (PLST) KHM-114",
      "1 Vivid Grove (PLST) LRW-277",
      "1 Voldaren Pariah / Abolisher of Bloodlines (PLST) EMN-111",
      "1 Westvale Abbey / Ormendahl, Profane Prince (SLD) 1159",
      "1 Woodland Chasm (PLST) KHM-274",
      "1 Zetalpa, Primal Dawn (PLST) RIX-30",
    ];

    const expectedMain = new Map<string, number>();
    for (const line of expectedLines) {
      const parsed = normalizeMoxfieldLine(line);
      if (!parsed) continue;
      addToCountMap(expectedMain, parsed.name, parsed.quantity);
    }

    const expectedSide = new Map<string, number>();
    addToCountMap(expectedSide, "Delver of Secrets / Insectile Aberration", 1);

    // Compare expected ↔ actual (multiset by name)
    expect(mainMap).toEqual(expectedMain);
    expect(sideMap).toEqual(expectedSide);
  });
});

