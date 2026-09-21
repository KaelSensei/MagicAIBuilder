import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicDeckPrimer } from "./PublicDeckPrimer";

describe("PublicDeckPrimer", () => {
  it("renders primer headings, lists and paragraphs as readable sections", () => {
    render(
      <PublicDeckPrimer
        description={
          "## Game plan\n\nBuild resources.\n\n- Protect the commander\n- Hold interaction"
        }
      />
    );

    expect(
      screen.getByRole("heading", { name: "Game plan", level: 2 })
    ).toBeVisible();
    expect(screen.getByText("Build resources.")).toBeVisible();
    expect(screen.getByRole("list")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("opens external links safely without changing the public deck page", () => {
    render(
      <PublicDeckPrimer
        description={"Read the [combo guide](https://example.com/guide)."}
      />
    );

    expect(screen.getByRole("link", { name: "combo guide" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "combo guide" })).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
  });

  it("does not interpret raw HTML or expose unsafe link destinations", () => {
    render(
      <PublicDeckPrimer
        description={
          '<script>alert("owned")</script>\n\n[Unsafe](javascript:alert("owned"))'
        }
      />
    );

    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Unsafe")).toBeVisible();
  });

  it("builds anchored navigation from primer headings", () => {
    render(
      <PublicDeckPrimer
        description={"## Game plan\n\nPlan.\n\n## Win conditions\n\nWin."}
      />
    );
    expect(
      screen.getByRole("navigation", { name: "Primer contents" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Game plan" })).toHaveAttribute(
      "href",
      "#primer-game-plan"
    );
    expect(screen.getByRole("heading", { name: "Game plan" })).toHaveAttribute(
      "id",
      "primer-game-plan"
    );
  });

  it("copies the complete Markdown primer", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const description = "## Game plan\n\nBuild resources.";
    render(<PublicDeckPrimer description={description} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy primer" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(description));
    expect(screen.getByRole("button", { name: "Primer copied" })).toBeVisible();
  });

  it("offers the original primer as a Markdown download", () => {
    render(
      <PublicDeckPrimer description={"## Game plan\n\nBuild resources."} />
    );
    const download = screen.getByRole("link", { name: "Download primer" });
    expect(download).toHaveAttribute("download", "deck-primer.md");
    expect(download.getAttribute("href")).toContain(
      "data:text/markdown;charset=utf-8,"
    );
  });
});
