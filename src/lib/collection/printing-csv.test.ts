import { describe, expect, it } from "vitest";
import { formatCollectionPrintingCsv } from "./printing-csv";

describe("formatCollectionPrintingCsv", () => {
  it("keeps printings distinct when their names are the same", () => {
    const csv = formatCollectionPrintingCsv([
      { scryfallId: "printing-a", name: "Sol Ring", quantity: 1, foil: false, condition: "NM", price: 2 },
      { scryfallId: "printing-b", name: "Sol Ring", quantity: 2, foil: true, condition: "LP", price: 4 },
    ]);

    expect(csv.split("\n")).toEqual([
      "Name,Quantity,Foil,Condition,Price (USD),Scryfall ID",
      '"Sol Ring",1,No,NM,2,"printing-a"',
      '"Sol Ring",2,Yes,LP,4,"printing-b"',
    ]);
  });

  it("quotes identifiers and names without losing CSV structure", () => {
    const csv = formatCollectionPrintingCsv([
      { scryfallId: 'id,"one"', name: 'Jace, "Unraveler"', quantity: 1, foil: false, condition: null, price: null },
    ]);

    expect(csv.split("\n")[1]).toBe('"Jace, ""Unraveler""",1,No,,,"id,""one"""');
  });
});
