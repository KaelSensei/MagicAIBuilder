import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkSelectBar } from "./BulkSelectBar";

const defaultProps = {
  selectedCount: 0,
  totalCount: 5,
  moveTargets: [
    { zone: "main" as const, label: "→ Main" },
    { zone: "maybeboard" as const, label: "→ Maybe" },
  ],
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
  onBulkMove: vi.fn(),
  onBulkDelete: vi.fn(),
};

describe("BulkSelectBar", () => {
  it("renders Select all button when nothing selected", () => {
    render(<BulkSelectBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /select all/i })).toBeInTheDocument();
  });

  it("calls onSelectAll when clicking Select all", async () => {
    const onSelectAll = vi.fn();
    const user = userEvent.setup();
    render(<BulkSelectBar {...defaultProps} onSelectAll={onSelectAll} />);
    await user.click(screen.getByRole("button", { name: /select all/i }));
    expect(onSelectAll).toHaveBeenCalledOnce();
  });

  it("renders Deselect all when all cards selected", () => {
    render(<BulkSelectBar {...defaultProps} selectedCount={5} />);
    expect(screen.getByRole("button", { name: /deselect all/i })).toBeInTheDocument();
  });

  it("calls onDeselectAll when clicking Deselect all", async () => {
    const onDeselectAll = vi.fn();
    const user = userEvent.setup();
    render(<BulkSelectBar {...defaultProps} selectedCount={5} onDeselectAll={onDeselectAll} />);
    await user.click(screen.getByRole("button", { name: /deselect all/i }));
    expect(onDeselectAll).toHaveBeenCalledOnce();
  });

  it("shows selection counter when cards selected", () => {
    render(<BulkSelectBar {...defaultProps} selectedCount={3} />);
    expect(screen.getByText(/3 cards selected/i)).toBeInTheDocument();
  });

  it("shows singular 'card' when 1 selected", () => {
    render(<BulkSelectBar {...defaultProps} selectedCount={1} />);
    expect(screen.getByText(/1 card selected/i)).toBeInTheDocument();
  });

  it("hides action buttons when nothing selected", () => {
    render(<BulkSelectBar {...defaultProps} selectedCount={0} />);
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByText("→ Main")).not.toBeInTheDocument();
  });

  it("shows move and delete buttons when cards selected", () => {
    render(<BulkSelectBar {...defaultProps} selectedCount={2} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByText("→ Main")).toBeInTheDocument();
    expect(screen.getByText("→ Maybe")).toBeInTheDocument();
  });

  it("calls onBulkMove with correct zone when clicking move button", async () => {
    const onBulkMove = vi.fn();
    const user = userEvent.setup();
    render(<BulkSelectBar {...defaultProps} selectedCount={2} onBulkMove={onBulkMove} />);
    await user.click(screen.getByText("→ Main"));
    expect(onBulkMove).toHaveBeenCalledWith("main");
  });

  it("calls onBulkDelete when clicking Delete", async () => {
    const onBulkDelete = vi.fn();
    const user = userEvent.setup();
    render(<BulkSelectBar {...defaultProps} selectedCount={2} onBulkDelete={onBulkDelete} />);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onBulkDelete).toHaveBeenCalledOnce();
  });
});
