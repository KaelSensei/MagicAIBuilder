import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { UserChip } from "./UserChip";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

describe("UserChip", () => {
  // The fallback was the English literal "Anonymous", although the discovery
  // listing already shows the translated `deck.community.anonymous`.
  it("names an author without a name or username in French", () => {
    renderWithIntl(<UserChip name={null} username={null} image={null} />, {
      locale: "fr",
    });

    expect(screen.getByText("Anonyme")).toBeInTheDocument();
  });

  it("prefers the author's display name and links the profile", () => {
    renderWithIntl(<UserChip name="Ana" username="ana" image={null} />, {
      locale: "fr",
    });

    expect(screen.getByRole("link", { name: "Ana" })).toHaveAttribute(
      "href",
      "/u/ana"
    );
  });
});
