import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
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
    renderWithIntl(<ThemeToggle />);

    await userEvent.click(screen.getByRole("button", { name: "Use system theme" }));

    expect(useThemeStore.getState().preference).toBe("system");
    expect(useThemeStore.getState().theme).toBe("light");
    expect(screen.getByRole("button", { name: "Use system theme" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  // Design audit S3: the chosen icon only changed colour, 1.18:1 from the
  // others. It now carries the segmented control's marker, `data-state="on"`.
  it("marks the system choice, and only it, when the player follows the system", () => {
    useThemeStore.setState({ theme: "dark", preference: "system" });

    renderWithIntl(<ThemeToggle />);

    const system = screen.getByRole("button", { name: "Use system theme" });
    expect(screen.getAllByRole("button", { pressed: true })).toEqual([system]);
    expect(system).toHaveAttribute("data-state", "on");
    expect(
      screen.getByRole("button", { name: "Use dark theme" })
    ).toHaveAttribute("data-state", "off");
  });
});
