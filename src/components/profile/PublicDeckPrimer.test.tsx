import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
