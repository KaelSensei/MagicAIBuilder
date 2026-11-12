import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "./LocaleSwitcher";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock(import("@/i18n/navigation"), async () => ({
  ...(await import("@/test/i18n-navigation-stub")),
  usePathname: () => "/decks",
}));

describe("LocaleSwitcher", () => {
  it("announces its expanded state and selected locale", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    const trigger = screen.getByRole("button", { name: "locale.switchLocale" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitemradio", { name: /locale\.en/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: /locale\.fr/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });
});
