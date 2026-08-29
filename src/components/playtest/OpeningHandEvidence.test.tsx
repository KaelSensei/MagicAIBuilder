import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import builderMessages from "@/messages/en/builder.json";
import { OpeningHandEvidence } from "./OpeningHandEvidence";

function card(typeLine: string, id: string): DeckCard {
  return {
    id,
    scryfallId: id,
    name: id,
    quantity: 1,
    category: typeLine.includes("Land") ? "land" : "creature",
    zone: "main",
    manaCost: "",
    cmc: 0,
    typeLine,
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

function renderEvidence(landCount: number) {
  const hand = [
    ...Array.from({ length: landCount }, (_, index) =>
      card("Basic Land — Forest", `land-${index}`)
    ),
    ...Array.from({ length: 7 - landCount }, (_, index) =>
      card("Creature — Elf", `spell-${index}`)
    ),
  ];

  return render(
    <NextIntlClientProvider locale="en" messages={{ builder: builderMessages }}>
      <OpeningHandEvidence hand={hand} />
    </NextIntlClientProvider>
  );
}

describe("OpeningHandEvidence", () => {
  it("recommends a mulligan for a land-light opening hand", () => {
    renderEvidence(1);

    expect(screen.getByText("1 land in opening hand")).toBeDefined();
    expect(screen.getByText(/consider a mulligan/i)).toBeDefined();
  });

  it("identifies a balanced opening hand without urging a mulligan", () => {
    renderEvidence(3);

    expect(screen.getByText("3 lands in opening hand")).toBeDefined();
    expect(screen.getByText(/balanced start/i)).toBeDefined();
  });
});
