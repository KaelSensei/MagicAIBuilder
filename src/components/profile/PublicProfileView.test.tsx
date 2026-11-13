import { describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

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
    renderWithIntl(
      <PublicProfileView profile={makeProfile()} canFollow={false} />,
      {
        locale: "en",
      }
    );

    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
  });

  // The date was formatted with a hardcoded toLocaleDateString("en-US"), so a
  // French visitor read "August 2026" on an otherwise French page.
  it("renders the month in French under the fr locale", () => {
    renderWithIntl(
      <PublicProfileView profile={makeProfile()} canFollow={false} />,
      {
        locale: "fr",
      }
    );

    expect(screen.getByText(/août 2026/)).toBeInTheDocument();
  });
});

describe("PublicProfileView avatar", () => {
  it("shows an accessible neutral fallback when the avatar image fails", () => {
    renderWithIntl(
      <PublicProfileView
        profile={{
          ...makeProfile(),
          image: "https://example.test/broken-avatar.png",
        }}
        canFollow={false}
      />,
      { locale: "en" }
    );

    const avatar = screen.getByRole("img", { name: "Totoro" });
    fireEvent.error(avatar);

    // The fallback is a bundled silhouette, not a retry of the broken URL.
    expect(screen.getByRole("img", { name: "Totoro" })).toHaveAttribute(
      "src",
      "/images/avatar-placeholder.svg"
    );
  });
});

describe("PublicProfileView deck art", () => {
  // Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
  // still store it.
  it("shows a stored JPEG art crop from Scryfall's WebP art", () => {
    const deck = {
      id: "deck-1",
      name: "Superfriends",
      description: null,
      format: "commander",
      targetBracket: 3,
      commanderId: null,
      isAIGenerated: false,
      createdAt: "2026-08-23T12:00:00Z",
      updatedAt: "2026-08-23T12:00:00Z",
      cards: [
        {
          name: "Atraxa",
          imageUri: "",
          artCropUri:
            "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
        },
      ],
    };

    renderWithIntl(
      <PublicProfileView
        profile={{ ...makeProfile(), decks: [deck] }}
        canFollow={false}
      />,
      { locale: "en" }
    );

    expect(screen.getByRole("img", { name: "Atraxa" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796"
    );
  });
});

// The deck tile badge was the English literal "✦ AI" under every locale.
describe("PublicProfileView AI badge", () => {
  it("marks an AI-generated deck in French", () => {
    const aiDeck = {
      id: "deck-1",
      name: "Robot deck",
      description: null,
      format: "commander",
      targetBracket: 2,
      commanderId: null,
      isAIGenerated: true,
      createdAt: "2026-08-23T12:00:00Z",
      updatedAt: "2026-08-23T12:00:00Z",
      cards: [],
    };
    renderWithIntl(
      <PublicProfileView
        profile={{ ...makeProfile(), decks: [aiDeck] }}
        canFollow={false}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText("IA")).toBeInTheDocument();
  });
});
