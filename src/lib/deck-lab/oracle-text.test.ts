import { describe, expect, it } from "vitest";
import { manaAbilityOf } from "./oracle-text";

describe("manaAbilityOf — reminder text", () => {
  it("reads no ability from a line that is only reminder text", () => {
    // A basic land's "({T}: Add {G}.)" is read from its land type, not its text (CR 305.6).
    expect(manaAbilityOf("({T}: Add {G}.)")).toBeUndefined();
  });

  it("reads the ability on a line after reminder text", () => {
    expect(
      manaAbilityOf(
        "Flying (This creature can't be blocked except by creatures with flying or reach.)\n{T}: Add {G}."
      )
    ).toEqual({
      produces: { kind: "colours", colours: ["G"] },
      dependsOnOpponents: false,
      out: 1,
      filters: false,
    });
  });

  it("removes each reminder text up to its own closing parenthesis", () => {
    expect(
      manaAbilityOf("(Reminder.) {T}: Add {U}. (Another reminder.)")
    ).toMatchObject({ produces: { kind: "colours", colours: ["U"] }, out: 1 });
  });

  it("keeps an unclosed parenthesis and the text after it", () => {
    expect(manaAbilityOf("{T}: Add {R}. (")).toMatchObject({
      produces: { kind: "colours", colours: ["R"] },
    });
    expect(manaAbilityOf("(no closing\n({T}: Add {R}.")).toMatchObject({
      produces: { kind: "colours", colours: ["R"] },
    });
  });
});
