import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows current page and total pages", () => {
    render(
      <Pagination currentPage={2} totalPages={8} onPageChange={vi.fn()} />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("disables Précédent on first page", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables Suivant on last page", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange with page - 1 when clicking Précédent", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with page + 1 when clicking Suivant", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("does not call onPageChange when Précédent is disabled", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange when Suivant is disabled", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
