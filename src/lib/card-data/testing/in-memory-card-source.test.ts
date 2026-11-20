// @vitest-environment node
/**
 * The in-memory `CardSource` fake against the shared contract, so the slice 2 loader can trust
 * it in place of Scryfall.
 *
 * @module card-data/testing/in-memory-card-source.test
 */
import { describe, expect, it } from "vitest";
import { CARD_SOURCE_CONTRACT_CASES } from "./card-source-contract";
import { createRecordedCardSource } from "./in-memory-card-source";

describe("the in-memory card source honours the CardSource contract", () => {
  it.each(CARD_SOURCE_CONTRACT_CASES)("$name", async ({ run }) => {
    await expect(run(createRecordedCardSource())).resolves.toBeUndefined();
  });
});
