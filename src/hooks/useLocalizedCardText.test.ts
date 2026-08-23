import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ScryfallCard } from "@/lib/scryfall/types";

const useLocale = vi.fn<() => string>();
const useCardPrintings = vi.fn();

vi.mock("next-intl", () => ({ useLocale: () => useLocale() }));
vi.mock("./useCardPrintings", () => ({
  useCardPrintings: (name: string | null, lang?: string) =>
    useCardPrintings(name, lang),
}));

const { useLocalizedCardText } = await import("./useLocalizedCardText");

const SOL_RING: ScryfallCard = {
  id: "en-1",
  name: "Sol Ring",
  cmc: 1,
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
  color_identity: [],
  lang: "en",
} as ScryfallCard;

const SOL_RING_FR: ScryfallCard = {
  ...SOL_RING,
  id: "fr-1",
  lang: "fr",
  printed_name: "Anneau solaire",
  printed_type_line: "Artefact",
  printed_text: "{T} : Ajoutez {C}{C}.",
};

function renderFor(card: ScryfallCard | null, locale: string, printings?: ScryfallCard[]) {
  useLocale.mockReturnValue(locale);
  useCardPrintings.mockReturnValue({
    data: printings ? { data: printings } : undefined,
  });
  return renderHook(() => useLocalizedCardText(card));
}

/**
 * Display text for one card in the viewer's language.
 *
 * Every failure mode here is silent: the wrong language code returns no
 * printings, which reads as "this card has no translation"; a missing
 * `printed_text` falls back per field, and getting that wrong blanks a card's
 * rules rather than erroring. Nothing about any of it shows up as a broken
 * page, so it has to be asserted directly.
 */
describe("useLocalizedCardText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no card is selected", () => {
    const { result } = renderFor(null, "fr");
    expect(result.current).toBeNull();
  });

  it("issues no lookup at all for an English viewer", () => {
    const { result } = renderFor(SOL_RING, "en");

    expect(useCardPrintings).toHaveBeenCalledWith(null, "en");
    expect(result.current?.name).toBe("Sol Ring");
    expect(result.current?.isLocalized).toBe(false);
  });

  it("issues no lookup when there is no card to look up", () => {
    renderFor(null, "fr");
    expect(useCardPrintings).toHaveBeenCalledWith(null, "fr");
  });

  it("shows the English text while the translated printing is in flight", () => {
    const { result } = renderFor(SOL_RING, "fr");

    expect(useCardPrintings).toHaveBeenCalledWith("Sol Ring", "fr");
    expect(result.current?.name).toBe("Sol Ring");
    expect(result.current?.isLocalized).toBe(false);
  });

  it("swaps in the translated printing once it arrives", () => {
    const { result } = renderFor(SOL_RING, "fr", [SOL_RING_FR]);

    expect(result.current?.name).toBe("Anneau solaire");
    expect(result.current?.typeLine).toBe("Artefact");
    expect(result.current?.oracleText).toBe("{T} : Ajoutez {C}{C}.");
    expect(result.current?.isLocalized).toBe(true);
  });

  it("keeps the English rules when the printing translates only the name", () => {
    const nameOnly = { ...SOL_RING_FR, printed_text: undefined };
    const { result } = renderFor(SOL_RING, "fr", [nameOnly]);

    expect(result.current?.name).toBe("Anneau solaire");
    expect(result.current?.oracleText).toBe("{T}: Add {C}{C}.");
  });

  it("asks Scryfall for zhs, not zh", () => {
    renderFor(SOL_RING, "zh");
    expect(useCardPrintings).toHaveBeenCalledWith("Sol Ring", "zhs");
  });

  it("treats an unprinted locale as English and skips the lookup", () => {
    renderFor(SOL_RING, "xx");
    expect(useCardPrintings).toHaveBeenCalledWith(null, "en");
  });
});
