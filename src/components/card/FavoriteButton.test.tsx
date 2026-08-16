import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { FavoriteButton } from "./FavoriteButton";

describe("FavoriteButton", () => {
  const defaultProps = {
    scryfallId: "abc123",
    isFavorited: false,
    onToggle: vi.fn(),
  };

  it("renders heart icon", () => {
    renderWithIntl(<FavoriteButton {...defaultProps} />);
    expect(screen.getByRole("button", { name: /favorite|add to favorites/i })).toBeDefined();
  });

  it("shows filled heart when favorited", () => {
    renderWithIntl(<FavoriteButton {...defaultProps} isFavorited={true} />);
    const btn = screen.getByRole("button", { name: /favorited|remove from favorites/i });
    expect(btn).toBeDefined();
  });

  it("calls onToggle with scryfallId when clicked", () => {
    const onToggle = vi.fn();
    renderWithIntl(<FavoriteButton {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /add to favorites/i }));
    expect(onToggle).toHaveBeenCalledWith("abc123");
  });

  it("calls onToggle when removing a favorite", () => {
    const onToggle = vi.fn();
    renderWithIntl(<FavoriteButton {...defaultProps} isFavorited={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /remove from favorites/i }));
    expect(onToggle).toHaveBeenCalledWith("abc123");
  });
});
