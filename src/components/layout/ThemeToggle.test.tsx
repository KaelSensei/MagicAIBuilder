import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enCommon from "@/messages/en/common.json";
import { useThemeStore } from "@/hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark", preference: "dark" });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({ matches: false }))
    );
  });

  it("selects system and paints the light mode when the OS is light", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ common: enCommon }}>
        <ThemeToggle />
      </NextIntlClientProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Use system theme" }));

    expect(useThemeStore.getState().preference).toBe("system");
    expect(useThemeStore.getState().theme).toBe("light");
    expect(screen.getByRole("button", { name: "Use system theme" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
