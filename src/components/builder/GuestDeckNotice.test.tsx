import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { GuestDeckNotice } from "./GuestDeckNotice";

const { session } = vi.hoisted(() => ({
  session: { status: "unauthenticated" },
}));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

/**
 * The notice used to promise that an account would "keep it safe", while
 * nothing ever copied the guest deck into the account.
 */
describe("GuestDeckNotice", () => {
  beforeEach(() => {
    session.status = "unauthenticated";
  });

  it("says the deck lives in this browser and what an account changes", () => {
    renderWithIntl(<GuestDeckNotice />);

    expect(
      screen.getByText(
        /Saved in this browser only\. Once you have an account, you can save it there and open it anywhere\./
      )
    ).toBeVisible();
    expect(screen.queryByText(/keep it safe/)).toBeNull();
  });

  it("brings a new account back to the guest builder", () => {
    renderWithIntl(<GuestDeckNotice />);

    expect(
      screen.getByRole("link", { name: "Create account" })
    ).toHaveAttribute("href", "/auth/signup?callbackUrl=/builder/guest");
  });

  it("says the same honestly in French", () => {
    renderWithIntl(<GuestDeckNotice />, { locale: "fr" });

    expect(
      screen.getByText(
        /Enregistré uniquement dans ce navigateur\. Avec un compte, vous pourrez l’y enregistrer et l’ouvrir partout\./
      )
    ).toBeVisible();
  });

  it("stands aside once signed in, where the offer to save the deck takes over", () => {
    session.status = "authenticated";

    renderWithIntl(<GuestDeckNotice />);

    expect(screen.queryByRole("link", { name: "Create account" })).toBeNull();
  });
});
