import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import playtestMessages from "@/messages/en/playtest.json";
import type { PlaytestSession } from "@/lib/playtest/analytics";
import { PlaytestComparisonPanel } from "./PlaytestComparisonPanel";

function session(
  id: string,
  snapshotId: string,
  result: PlaytestSession["result"],
  turns: number,
  mulliganCount: number
): PlaytestSession {
  return {
    id,
    deckId: "deck-1",
    userId: "user-1",
    snapshotId,
    result,
    turns,
    mulliganCount,
    createdAt: new Date(`2026-09-${id.padStart(2, "0")}T12:00:00.000Z`),
  };
}

function renderPanel(sessions: readonly PlaytestSession[]) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ playtest: playtestMessages }}
    >
      <PlaytestComparisonPanel sessions={sessions} />
    </NextIntlClientProvider>
  );
}

describe("PlaytestComparisonPanel", () => {
  it("stays hidden until two snapshot cohorts exist", () => {
    const { container } = renderPanel([
      session("1", "snapshot-a", "win", 7, 0),
    ]);
    expect(container.firstChild).toBeNull();
  });

  it("compares two selected snapshot cohorts", () => {
    renderPanel([
      session("1", "snapshot-a", "win", 8, 1),
      session("2", "snapshot-a", "loss", 6, 1),
      session("3", "snapshot-b", "win", 6, 0),
      session("4", "snapshot-b", "win", 4, 0),
    ]);

    fireEvent.change(screen.getByLabelText("Before version"), {
      target: { value: "snapshot-a" },
    });
    fireEvent.change(screen.getByLabelText("After version"), {
      target: { value: "snapshot-b" },
    });

    expect(screen.getByText("+50 pts")).toBeDefined();
    expect(screen.getByText("3 turns faster")).toBeDefined();
    expect(screen.getByText("1 fewer mulligans")).toBeDefined();
    expect(screen.getByText(/self-reported playtest evidence/i)).toBeDefined();
  });

  it("asks for distinct versions instead of comparing a cohort with itself", () => {
    renderPanel([
      session("1", "snapshot-a", "win", 8, 0),
      session("2", "snapshot-b", "loss", 6, 1),
    ]);

    fireEvent.change(screen.getByLabelText("Before version"), {
      target: { value: "snapshot-a" },
    });
    fireEvent.change(screen.getByLabelText("After version"), {
      target: { value: "snapshot-a" },
    });

    expect(screen.getByText("Choose two different versions.")).toBeDefined();
  });
});
