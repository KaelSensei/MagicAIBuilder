import { describe, expect, it } from "vitest";
import { formatAcquisitionCsv } from "./acquisition-csv";

describe("formatAcquisitionCsv", () => {
  it("preserves printing IDs for cards with the same name", () => {
    const csv = formatAcquisitionCsv([
      {
        scryfallId: "printing-a", name: "Sol Ring", quantity: 1, price: 2,
        deckAllocations: [{ name: "Atraxa", quantity: 1 }],
      },
      {
        scryfallId: "printing-b", name: "Sol Ring", quantity: 2, price: 3,
        deckAllocations: [{ name: "Atraxa", quantity: 1 }, { name: "Breya", quantity: 1 }],
      },
    ]);

    expect(csv.split("\n")).toEqual([
      "Name,Quantity,Price (USD),Total (USD),Scryfall ID,Deck allocations",
      '"Sol Ring",1,2,2,"printing-a","Atraxa (1)"',
      '"Sol Ring",2,3,6,"printing-b","Atraxa (1); Breya (1)"',
    ]);
  });

  it("escapes text and leaves unknown prices blank", () => {
    const csv = formatAcquisitionCsv([
      { scryfallId: 'id,"one"', name: 'Jace, "Unraveler"', quantity: 1, price: null },
    ]);

    expect(csv.split("\n")[1]).toBe('"Jace, ""Unraveler""",1,,,"id,""one""",""');
  });

  it("exports a cent-accurate total for multiple copies", () => {
    const csv = formatAcquisitionCsv([
      { scryfallId: "printing-a", name: "Sol Ring", quantity: 3, price: 0.1 },
    ]);

    expect(csv.split("\n")[1]).toBe('"Sol Ring",3,0.1,0.3,"printing-a",""');
  });
});
