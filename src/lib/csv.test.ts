import { describe, expect, it } from "vitest";
import { csvText, neutralizeFormula } from "./csv";

describe("csvText", () => {
  it.each([
    ["an equals sign", "=1+1", `"'=1+1"`],
    ["a plus sign", "+2 Mace", `"'+2 Mace"`],
    ["a minus sign", "-1", `"'-1"`],
    ["an at sign", "@SUM(1+1)", `"'@SUM(1+1)"`],
    ["a tab", "\t=1+1", `"'\t=1+1"`],
    ["a carriage return", "\r=1+1", `"'\r=1+1"`],
    ["a line feed", "\n=1+1", `"'\n=1+1"`],
    ["a full-width equals sign", "＝1+1", `"'＝1+1"`],
    ["a full-width plus sign", "＋1", `"'＋1"`],
    ["a full-width minus sign", "－1", `"'－1"`],
    ["a full-width at sign", "＠SUM(1)", `"'＠SUM(1)"`],
  ])("keeps a cell that starts with %s as text", (_label, text, cell) => {
    expect(csvText(text)).toBe(cell);
  });

  it("leaves a formula character after the first one alone", () => {
    expect(csvText("Sol Ring = 1 mana, +2 colorless")).toBe(
      '"Sol Ring = 1 mana, +2 colorless"'
    );
  });

  it.each([
    ['=1+2";=1+2', `"'=1+2"";=1+2"`],
    [`=1+2'" ;,=1+2`, `"'=1+2'"" ;,=1+2"`],
  ])("escapes OWASP's example %s as OWASP does", (text, cell) => {
    expect(csvText(text)).toBe(cell);
  });

  it("doubles the quotes of an ordinary name", () => {
    expect(csvText('Kongming, "Sleeping Dragon"')).toBe(
      '"Kongming, ""Sleeping Dragon"""'
    );
  });
});

describe("neutralizeFormula", () => {
  it("prefixes a formula without quoting it", () => {
    expect(neutralizeFormula("=1+1")).toBe("'=1+1");
  });

  it("returns ordinary text unchanged", () => {
    expect(neutralizeFormula("Atraxa, Praetors' Voice")).toBe(
      "Atraxa, Praetors' Voice"
    );
  });
});
