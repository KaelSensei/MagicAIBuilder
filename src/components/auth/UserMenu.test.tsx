import React from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enAuth from "@/messages/en/auth.json";
import frAuth from "@/messages/fr/auth.json";
import { UserMenu } from "./UserMenu";

vi.mock(import("next-auth/react"), () => ({
  useSession: () => ({
    status: "authenticated",
    data: {
      user: {
        id: "player-1",
        name: null,
        email: "player@example.test",
        image: "https://example.test/a.png",
      },
      expires: "2099-01-01T00:00:00.000Z",
    },
    update: vi.fn(),
  }),
  signOut: vi.fn(),
}));
vi.mock(import("@/components/onboarding/OnboardingProvider"), () => ({
  useOnboardingContext: () => ({ resetOnboarding: vi.fn() }),
}));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

function renderMenu(locale: "en" | "fr") {
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ auth: locale === "fr" ? frAuth : enAuth }}
    >
      <UserMenu />
    </NextIntlClientProvider>
  );
}

// An account without a display name fell back to the English alt "Avatar".
describe("UserMenu avatar", () => {
  it("describes a nameless account's picture in French", () => {
    renderMenu("fr");

    expect(
      screen.getByRole("img", { name: "Photo de profil" })
    ).toBeInTheDocument();
  });

  it("describes a nameless account's picture in English", () => {
    renderMenu("en");

    expect(screen.getByRole("img", { name: "Avatar" })).toBeInTheDocument();
  });
});
