/**
 * Pins the typed `@/i18n/navigation` stand-in that component tests mock the
 * module with: what its `Link` renders, and that it stays assignable to the
 * real module, which is what `vi.mock(import("@/i18n/navigation"), …)` checks.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type * as LocalizedNavigation from "@/i18n/navigation";
import * as stub from "./i18n-navigation-stub";

describe("i18n navigation stub", () => {
  it("renders Link as a plain anchor that keeps the href and the DOM props", () => {
    render(
      <stub.Link href="/decks/42" className="deck-link" prefetch={false}>
        Open deck
      </stub.Link>
    );

    const link = screen.getByRole("link", { name: "Open deck" });
    expect(link.getAttribute("href")).toBe("/decks/42");
    expect(link.className).toBe("deck-link");
    expect(link.hasAttribute("prefetch")).toBe(false);
  });

  it("renders an object href as its pathname", () => {
    render(
      <stub.Link href={{ pathname: "/rules", query: { q: "903" } }}>
        Rules
      </stub.Link>
    );

    expect(
      screen.getByRole("link", { name: "Rules" }).getAttribute("href")
    ).toBe("/rules");
  });

  it("answers the router and the pathname without navigating", () => {
    const router = stub.useRouter();
    router.push("/decks");

    expect(router.push).toHaveBeenCalledWith("/decks");
    expect(stub.usePathname()).toBe("/");
  });

  it("is assignable to the real module, so typed vi.mock factories may return it", () => {
    const asModule: Partial<typeof LocalizedNavigation> = stub;

    expect(asModule.Link).toBe(stub.Link);
  });
});
