import { describe, expect, it, vi } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

import { PublicProfileView } from "./PublicProfileView";

function makeProfile() {
  return {
    id: "user-1",
    name: "Totoro",
    username: "totoro",
    image: null,
    createdAt: "2026-08-23T12:00:00Z",
    decks: [],
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    badges: [],
  };
}

describe("PublicProfileView — member-since date", () => {
  it("renders the month in English under the en locale", () => {
    renderWithIntl(<PublicProfileView profile={makeProfile()} canFollow={false} />, {
      locale: "en",
    });

    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
  });

  // The date was formatted with a hardcoded toLocaleDateString("en-US"), so a
  // French visitor read "August 2026" on an otherwise French page.
  it("renders the month in French under the fr locale", () => {
    renderWithIntl(<PublicProfileView profile={makeProfile()} canFollow={false} />, {
      locale: "fr",
    });

    expect(screen.getByText(/août 2026/)).toBeInTheDocument();
  });
});
