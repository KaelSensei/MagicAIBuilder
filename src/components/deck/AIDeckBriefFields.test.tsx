import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MAX_DECK_BRIEF_FIELD_LENGTH } from "@/lib/ai/deck-brief";
import { renderWithIntl } from "@/test/render-with-intl";
import { AIDeckBriefFields } from "./AIDeckBriefFields";

describe("AIDeckBriefFields", () => {
  it("updates one preference without losing the others", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <AIDeckBriefFields
        value={{
          theme: "Artifacts",
          playPattern: "Incremental value",
          dislikes: "Extra turns",
        }}
        onChange={onChange}
      />
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
