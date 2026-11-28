/**
 * The segmented control: a named group of toggle buttons, one of them chosen.
 * Pins what a player and a screen reader get from it (design audit S3): the
 * chosen option is pressed and marked without colour alone, every option is a
 * target of 28 px or more, and an icon-only option still has a name.
 *
 * jsdom lays nothing out, so the sizes and the marker are checked through the
 * classes that draw them; `e2e/deck-editor-visual.spec.ts` measures the boxes
 * in a browser.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";

type View = "list" | "grid";

const VIEWS: readonly SegmentedOption<View>[] = [
  { value: "list", label: "List view" },
  { value: "grid", label: "Grid view" },
];

/** The minimum width and height classes of an option, by size: 28 px and 32 px. */
const TARGETS: readonly {
  readonly size: "sm" | "md";
  readonly target: readonly string[];
}[] = [
  { size: "sm", target: ["min-h-7", "min-w-7"] },
  { size: "md", target: ["min-h-8", "min-w-8"] },
];

/** Renders the view control on `value`, with a spy for its presses. */
function renderViews(value: View) {
  const onChange = vi.fn<(view: View) => void>();
  render(
    <SegmentedControl
      aria-label="Layout"
      options={VIEWS}
      value={value}
      onChange={onChange}
    />
  );
  return { onChange };
}

describe("SegmentedControl", () => {
  it("names its group after the caller's label", () => {
    renderViews("list");

    const group = screen.getByRole("group", { name: "Layout" });
    expect(within(group).getAllByRole("button")).toHaveLength(2);
  });

  it("presses the chosen option and only that one", () => {
    renderViews("grid");

    expect(screen.getAllByRole("button", { pressed: true })).toEqual([
      screen.getByRole("button", { name: "Grid view" }),
    ]);
    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("reports the value of the option the player presses", async () => {
    const { onChange } = renderViews("list");

    await userEvent.click(screen.getByRole("button", { name: "Grid view" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("grid");
  });

  // The builder's search tabs start afresh when the open tab is pressed again
  // (#1973), so a press on the chosen option is reported too.
  it("reports a press on the chosen option too, so a caller can start it afresh", async () => {
    const { onChange } = renderViews("list");

    await userEvent.click(screen.getByRole("button", { name: "List view" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("list");
  });

  it("names an icon-only option by its label, read to screen readers only", () => {
    render(
      <SegmentedControl
        aria-label="Cards per row"
        options={[
          { value: "4", label: "4 cards per row", icon: "4", hideLabel: true },
          { value: "6", label: "6 cards per row", icon: "6", hideLabel: true },
        ]}
        value="6"
        onChange={vi.fn()}
      />
    );

    const four = screen.getByRole("button", {
      name: "4 cards per row",
      pressed: false,
    });
    expect(within(four).getByText("4 cards per row")).toHaveClass("sr-only");
    expect(within(four).getByText("4")).toHaveAttribute("aria-hidden", "true");
  });

  // The tooltip sits on the face, which fills the button: a `title` on the
  // button itself would become its accessible description (see the next tests).
  it("shows an icon-only option's label as a tooltip wherever the pointer rests on it", () => {
    render(
      <SegmentedControl
        aria-label="Cards per row"
        options={[
          { value: "4", label: "4 cards per row", icon: "4", hideLabel: true },
          { value: "6", label: "6 cards per row", icon: "6", hideLabel: true },
        ]}
        value="6"
        onChange={vi.fn()}
      />
    );

    const four = screen.getByRole("button", { name: "4 cards per row" });
    const face = within(four).getByTitle("4 cards per row");
    expect(face).toHaveTextContent("4");
    expect(face).toHaveClass("flex-1", "self-stretch");
  });

  // The visible label is the tooltip already.
  it("gives an option whose label shows no tooltip", () => {
    render(
      <SegmentedControl
        aria-label="Layout"
        options={[
          {
            value: "list",
            label: "List view",
            icon: <svg data-testid="list-icon" />,
          },
          { value: "grid", label: "Grid view" },
        ]}
        value="list"
        onChange={vi.fn()}
      />
    );

    for (const option of screen.getAllByRole("button")) {
      expect(option).not.toHaveAttribute("title");
      expect(within(option).queryByTitle(/./)).not.toBeInTheDocument();
    }
  });

  // A screen reader reads the name, then the description: a tooltip that
  // became the description would make it say "4 cards per row" twice.
  it("names an icon-only option once: the label is its name, and the tooltip adds no description", () => {
    render(
      <SegmentedControl
        aria-label="Cards per row"
        options={[
          { value: "4", label: "4 cards per row", icon: "4", hideLabel: true },
          { value: "6", label: "6 cards per row", icon: "6", hideLabel: true },
        ]}
        value="6"
        onChange={vi.fn()}
      />
    );

    const four = screen.getByRole("button", { name: "4 cards per row" });
    expect(four).toHaveAccessibleName("4 cards per row");
    expect(four).toHaveAccessibleDescription("");
  });

  it("shows a text option's label and keeps its icon away from screen readers", () => {
    render(
      <SegmentedControl
        aria-label="Layout"
        options={[
          {
            value: "list",
            label: "List view",
            icon: <svg data-testid="list-icon" />,
          },
          { value: "grid", label: "Grid view" },
        ]}
        value="list"
        onChange={vi.fn()}
      />
    );

    const list = screen.getByRole("button", { name: "List view" });
    expect(within(list).getByText("List view")).not.toHaveClass("sr-only");
    expect(within(list).getByTestId("list-icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("marks the chosen option with data-state, which its styles target", () => {
    renderViews("grid");

    expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
      "data-state",
      "on"
    );
    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "data-state",
      "off"
    );
  });

  // WCAG 2.2 SC 1.4.1 and 1.4.11: the chosen option is raised onto --surface
  // and outlined in --border, 4.13:1 on the dark track and 3.38:1 on the light
  // one, so it does not rely on its text colour.
  it("draws the chosen option raised and outlined, as a resting ring rather than a focus ring", () => {
    renderViews("grid");

    expect(screen.getByRole("button", { name: "Grid view" })).toHaveClass(
      "data-[state=on]:bg-[var(--surface)]",
      "data-[state=on]:text-[var(--text-primary)]",
      "data-[state=on]:shadow-[var(--lumen-shadow-sm)]",
      "data-[state=on]:ring-1",
      "data-[state=on]:ring-inset",
      "data-[state=on]:ring-[var(--border)]"
    );
  });

  // Choosing an option must not change the track's width: the weight stays the same.
  it("gives every option the same weight, chosen or not", () => {
    renderViews("grid");

    for (const option of screen.getAllByRole("button")) {
      expect(option).toHaveClass("font-medium");
      expect(option.className).not.toContain("data-[state=on]:font-");
    }
  });

  it("keeps an icon-only option a square of its target, with no side padding", () => {
    render(
      <SegmentedControl
        aria-label="Layout"
        options={[
          { value: "list", label: "List view", icon: "L", hideLabel: true },
          { value: "grid", label: "Grid view", icon: "G", hideLabel: true },
        ]}
        value="list"
        onChange={vi.fn()}
        size="md"
      />
    );

    for (const option of screen.getAllByRole("button")) {
      expect(option).toHaveClass("min-h-8", "min-w-8", "px-0");
    }
  });

  // The builder's search panel can be 220 px wide: three French tabs must still fit.
  it("pads the options of a full-width track lightly, so long labels fit a narrow panel", () => {
    render(
      <SegmentedControl
        aria-label="Layout"
        options={VIEWS}
        value="list"
        onChange={vi.fn()}
        size="md"
        fullWidth
      />
    );

    for (const option of screen.getAllByRole("button")) {
      expect(option).toHaveClass("flex-1", "px-1");
      expect(option).not.toHaveClass("px-3");
    }
  });

  // WCAG 2.2 SC 2.5.8 asks for 24 px; the control aims for 28 px and more.
  it.each(TARGETS)(
    "gives every option a target of at least 28 px at size $size",
    ({ size, target }) => {
      render(
        <SegmentedControl
          aria-label="Layout"
          options={VIEWS}
          value="list"
          onChange={vi.fn()}
          size={size}
        />
      );

      for (const option of screen.getAllByRole("button")) {
        expect(option).toHaveClass(...target);
      }
    }
  );

  it("renders plain buttons, so a press inside a form never submits it", () => {
    renderViews("list");

    for (const option of screen.getAllByRole("button")) {
      expect(option).toHaveAttribute("type", "button");
    }
  });
});
