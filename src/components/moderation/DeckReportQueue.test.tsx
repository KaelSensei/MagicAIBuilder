import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/community/community-contracts";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckReportQueue } from "./DeckReportQueue";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

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

  it("labels every report reason with its moderation wording", async () => {
    // Keyed by the shared union, so a new reason fails to compile here until
    // the queue's wording for it is pinned too.
    const labels: Readonly<Record<ReportReason, string>> = {
      spam: "Spam",
      harassment: "Harassment",
      illegal_content: "Illegal content",
      other: "Other",
    };
    const reports = REPORT_REASONS.map((reason) => ({
      ...REPORT,
      id: `report-${reason}`,
      reason,
      deck: { ...REPORT.deck, id: `deck-${reason}`, name: `Deck ${reason}` },
    }));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ reports }), { status: 200 })
    );

    renderWithIntl(<DeckReportQueue />);

    expect(await screen.findByText("Deck spam")).toBeInTheDocument();
    for (const reason of REPORT_REASONS) {
      expect(screen.getByText(labels[reason])).toBeInTheDocument();
    }
  });

  it("currently lists a report whose stored reason is outside REPORT_REASONS (pinned; see the COM-03 follow-up)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ reports: [{ ...REPORT, reason: "rude" }] }),
        {
          status: 200,
        }
      )
    );

    renderWithIntl(<DeckReportQueue />);

    expect(await screen.findByText("Suspicious deck")).toBeInTheDocument();
    expect(
      screen.getByText("deck.moderation.reasons.rude")
    ).toBeInTheDocument();
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
