import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/test/render-with-intl";
import { CollectionQuantityControl } from "./CollectionQuantityControl";

describe("CollectionQuantityControl", () => {
  it("commits a directly entered quantity when the field loses focus", async () => {
    const onQuantityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CollectionQuantityControl
        cardName="Island"
        quantity={4}
        onQuantityChange={onQuantityChange}
      />
    );

    const input = screen.getByRole("spinbutton", {
      name: "Quantity owned for Island",
    });
    await user.clear(input);
    await user.type(input, "24");
    await user.tab();

    expect(onQuantityChange).toHaveBeenCalledOnce();
    expect(onQuantityChange).toHaveBeenCalledWith(24);
  });

  it("increments and decrements the current quantity", async () => {
    const onQuantityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CollectionQuantityControl
        cardName="Island"
        quantity={4}
        onQuantityChange={onQuantityChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decrease Island quantity" }));
    await user.click(screen.getByRole("button", { name: "Increase Island quantity" }));

    expect(onQuantityChange).toHaveBeenNthCalledWith(1, 3);
    expect(onQuantityChange).toHaveBeenNthCalledWith(2, 5);
  });

  it("commits direct entry with Enter", async () => {
    const onQuantityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CollectionQuantityControl
        cardName="Island"
        quantity={4}
        onQuantityChange={onQuantityChange}
      />
    );

    const input = screen.getByRole("spinbutton", {
      name: "Quantity owned for Island",
    });
    await user.clear(input);
    await user.type(input, "12{Enter}");

    expect(onQuantityChange).toHaveBeenCalledOnce();
    expect(onQuantityChange).toHaveBeenCalledWith(12);
  });
});
