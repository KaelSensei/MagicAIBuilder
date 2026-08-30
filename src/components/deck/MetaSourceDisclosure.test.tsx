import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { MetaSourceDisclosure } from "./MetaSourceDisclosure";
import deckMessages from "@/messages/en/deck.json";

function renderDisclosure(
  source: "edhrec" | "tournament",
  observedAt: string,
  stale = false
) {
  render(
    <NextIntlClientProvider
      locale="en"
      messages={{ deck: deckMessages }}
      timeZone="UTC"
    >
      <MetaSourceDisclosure
        source={source}
        observedAt={observedAt}
        stale={stale}
      />
    </NextIntlClientProvider>
  );
}

describe("MetaSourceDisclosure", () => {
  it("identifies EDHREC and when its recommendations were observed", () => {
    renderDisclosure("edhrec", "2026-08-29T10:30:00.000Z");

    expect(screen.getByText(/source: edhrec/i)).toBeInTheDocument();
    expect(screen.getByText(/observed.*aug 29, 2026/i)).toBeInTheDocument();
  });

  it("warns when the displayed observation is stale", () => {
    renderDisclosure("tournament", "2026-08-20T10:30:00.000Z", true);

    expect(
      screen.getByText(/source: mtgtop8 \/ mtgdecks/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/last observed.*stale/i)).toBeInTheDocument();
  });

  it("keeps the source visible when the observation timestamp is invalid", () => {
    renderDisclosure("edhrec", "not-a-date");

    expect(screen.getByText(/source: edhrec/i)).toBeInTheDocument();
    expect(
      screen.getByText(/observation time unavailable/i)
    ).toBeInTheDocument();
  });
});
