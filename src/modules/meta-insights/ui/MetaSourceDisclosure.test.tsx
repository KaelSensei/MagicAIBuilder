import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render-with-intl";
import { MetaSourceDisclosure } from "./MetaSourceDisclosure";

function renderDisclosure(
  source: "edhrec" | "tournament",
  observedAt: string,
  stale = false,
  health?: { readonly status: "available" | "unavailable"; readonly attempts: number }
) {
  renderWithIntl(
    <MetaSourceDisclosure
      source={source}
      observedAt={observedAt}
      stale={stale}
      health={health}
    />
  );
}

describe("MetaSourceDisclosure", () => {
  it("identifies EDHREC and when its recommendations were observed", () => {
    renderDisclosure("edhrec", "2026-08-29T10:30:00.000Z");

    expect(screen.getByText(/source: edhrec/i)).toBeInTheDocument();
    expect(screen.getByText(/observed.*aug 29, 2026/i)).toBeInTheDocument();
  });

  it("discloses when EDHREC does not publish a trustworthy sample window", () => {
    renderDisclosure("edhrec", "2026-08-29T10:30:00.000Z");

    expect(
      screen.getByText(/sample window unavailable from edhrec/i)
    ).toBeInTheDocument();
  });

  it("warns when the displayed observation is stale", () => {
    renderDisclosure("tournament", "2026-08-20T10:30:00.000Z", true);

    expect(
      screen.getByText(/source: mtgtop8 \/ mtgdecks/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/last observed.*stale/i)).toBeInTheDocument();
  });

  it("discloses an unavailable source after failed requests", () => {
    renderDisclosure("tournament", "2026-08-20T10:30:00.000Z", false, {
      status: "unavailable",
      attempts: 2,
    });

    expect(
      screen.getByText(/source health: unavailable after 2 attempts/i)
    ).toBeInTheDocument();
  });

  it("keeps the source visible when the observation timestamp is invalid", () => {
    renderDisclosure("edhrec", "not-a-date");

    expect(screen.getByText(/source: edhrec/i)).toBeInTheDocument();
    expect(
      screen.getByText(/observation time unavailable/i)
    ).toBeInTheDocument();
  });
});
