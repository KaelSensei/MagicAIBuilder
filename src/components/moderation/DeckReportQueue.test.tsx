import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckReportQueue } from "./DeckReportQueue";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => <a href={href}>{children}</a>,
}));

const REPORT = {
  id: "report-1",
  reason: "spam",
  status: "pending",
  createdAt: "2026-09-20T10:00:00.000Z",
  deck: { id: "deck-1", name: "Suspicious deck", user: { username: "owner" } },
  user: { username: "reporter" },
};

describe("DeckReportQueue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads pending reports and resolves one without reloading the page", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ reports: [REPORT] }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "reviewed" }), { status: 200 })
      );

    renderWithIntl(<DeckReportQueue />);

    expect(await screen.findByText("Suspicious deck")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mark reviewed/i }));

    await waitFor(() =>
      expect(screen.queryByText("Suspicious deck")).toBeNull()
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/moderation/deck-reports/report-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "reviewed" }),
      })
    );
  });

  it("shows a restricted-access message when the API forbids the viewer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 403 })
    );

    renderWithIntl(<DeckReportQueue />);

    expect(
      await screen.findByText(/moderation access is required/i)
    ).toBeInTheDocument();
  });
});
