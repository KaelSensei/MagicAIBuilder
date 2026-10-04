import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import deckMessages from "@/messages/en/deck.json";
import { MAX_DECK_BRIEF_FIELD_LENGTH } from "@/lib/ai/deck-brief";
import { AIDeckBriefFields } from "./AIDeckBriefFields";

describe("AIDeckBriefFields", () => {
  it("updates one preference without losing the others", () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
        <AIDeckBriefFields
          value={{
            theme: "Artifacts",
            playPattern: "Incremental value",
            dislikes: "Extra turns",
          }}
          onChange={onChange}
        />
      </NextIntlClientProvider>
    );

    const theme = screen.getByLabelText("Theme");
    expect(theme).toHaveAttribute("maxLength", String(MAX_DECK_BRIEF_FIELD_LENGTH));
    fireEvent.change(theme, { target: { value: "Phyrexians" } });

    expect(onChange).toHaveBeenCalledWith({
      theme: "Phyrexians",
      playPattern: "Incremental value",
      dislikes: "Extra turns",
    });
  });
});
