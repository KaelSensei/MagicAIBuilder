/**
 * The deck dates line (I-92): the stored creation and update dates, in the
 * viewer's locale, and nothing for a date that was not stored.
 *
 * "Now" is fixed through the system clock, which next-intl's `useNow` reads.
 */
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import {
  hydrateWithIntl,
  renderToStringWithIntl,
} from "@/test/hydrate-with-intl";
import { DeckDatesLine } from "./DeckDatesLine";

const NOW = new Date("2026-11-21T12:00:00.000Z");
const CREATED = "2026-03-03T09:00:00.000Z";
const TWO_DAYS_AGO = "2026-11-19T12:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DeckDatesLine", () => {
  it("shows the creation date as a date and an update two days old as relative", () => {
    renderWithIntl(
      <DeckDatesLine createdAt={CREATED} updatedAt={TWO_DAYS_AGO} />
    );

    expect(screen.getByText(/^Created/).parentElement).toHaveTextContent(
      "Created Mar 3, 2026 · Updated 2 days ago"
    );
  });

  it("puts each stored instant in a time element titled with its full date and time", () => {
    renderWithIntl(
      <DeckDatesLine createdAt={CREATED} updatedAt={TWO_DAYS_AGO} />
    );

    const created = screen.getByText("Mar 3, 2026");
    expect(created.tagName).toBe("TIME");
    expect(created).toHaveAttribute("datetime", CREATED);
    expect(created.getAttribute("title")).toMatch(
      /^Tuesday, March 3, 2026 at 9:00\sAM$/
    );
    expect(screen.getByText("2 days ago")).toHaveAttribute(
      "datetime",
      TWO_DAYS_AGO
    );
  });

  it("reads a Date from the deck store the same as an ISO string from the API", () => {
    renderWithIntl(<DeckDatesLine updatedAt={new Date(TWO_DAYS_AGO)} />);

    expect(screen.getByText("2 days ago")).toHaveAttribute(
      "datetime",
      TWO_DAYS_AGO
    );
  });

  it("shows an update 30 days old as relative", () => {
    renderWithIntl(<DeckDatesLine updatedAt="2026-10-22T12:00:00.000Z" />);

    expect(screen.getByText(/^Updated/)).not.toHaveTextContent("2026");
  });

  it("shows an update 31 days old as a date", () => {
    renderWithIntl(<DeckDatesLine updatedAt="2026-10-21T12:00:00.000Z" />);

    expect(screen.getByText(/^Updated/)).toHaveTextContent(
      "Updated Oct 21, 2026"
    );
  });

  it("writes both dates in French for a French viewer", () => {
    renderWithIntl(
      <DeckDatesLine createdAt={CREATED} updatedAt={TWO_DAYS_AGO} />,
      {
        locale: "fr",
      }
    );

    expect(screen.getByText(/^Créé/).parentElement).toHaveTextContent(
      "Créé le 3 mars 2026 · Mis à jour il y a 2 jours"
    );
  });

  it("writes an old update as 'mis à jour le' and its date in French", () => {
    renderWithIntl(<DeckDatesLine updatedAt="2026-10-21T12:00:00.000Z" />, {
      locale: "fr",
    });

    expect(screen.getByText(/^Mis à jour/)).toHaveTextContent(
      "Mis à jour le 21 oct. 2026"
    );
  });

  it("shows only the update, with no separator, when the creation date is missing", () => {
    const { container } = renderWithIntl(
      <DeckDatesLine createdAt={null} updatedAt={TWO_DAYS_AGO} />
    );

    expect(container).toHaveTextContent(/^Updated 2 days ago$/);
  });

  it("shows only the creation date when the update date is missing", () => {
    const { container } = renderWithIntl(<DeckDatesLine createdAt={CREATED} />);

    expect(container).toHaveTextContent(/^Created Mar 3, 2026$/);
  });

  it("shows nothing when neither date was stored", () => {
    const { container } = renderWithIntl(
      <DeckDatesLine createdAt={null} updatedAt={undefined} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing for an unreadable date rather than guessing one", () => {
    const { container } = renderWithIntl(
      <DeckDatesLine createdAt="not a date" updatedAt="" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * The server renders the line at one instant and the browser hydrates it at
 * another. Around a unit boundary the relative text differs ("22 hours ago" on
 * the server, "1 day ago" in the browser), so the line must not depend on
 * "now" until it has hydrated.
 */
describe("DeckDatesLine across the server render and the hydration", () => {
  const UPDATED = "2026-11-20T13:00:00.000Z";
  const SERVER_NOW = new Date("2026-11-21T11:00:00.000Z");
  const BROWSER_NOW = new Date("2026-11-21T14:00:00.000Z");

  it("hydrates with no mismatch when the browser's clock has crossed a unit since the server render", async () => {
    vi.setSystemTime(SERVER_NOW);
    const html = renderToStringWithIntl(
      <DeckDatesLine createdAt={CREATED} updatedAt={UPDATED} />
    );
    vi.setSystemTime(BROWSER_NOW);

    const hydrated = await hydrateWithIntl(
      html,
      <DeckDatesLine createdAt={CREATED} updatedAt={UPDATED} />
    );

    expect(hydrated.mismatches).toEqual([]);
    hydrated.unmount();
  });

  it("sends the update as a date in the server HTML, so the first paint does not depend on the server's clock", () => {
    vi.setSystemTime(SERVER_NOW);

    const html = renderToStringWithIntl(<DeckDatesLine updatedAt={UPDATED} />);

    const page = document.createElement("div");
    page.innerHTML = html;
    expect(page).toHaveTextContent(/^Updated Nov 20, 2026$/);
    expect(page.querySelector("time")).toHaveAttribute("datetime", UPDATED);
  });

  it("reads the update as relative to the viewer's clock once hydrated, keeping its stored instant and full-date title", async () => {
    vi.setSystemTime(SERVER_NOW);
    const html = renderToStringWithIntl(<DeckDatesLine updatedAt={UPDATED} />);
    vi.setSystemTime(BROWSER_NOW);

    const hydrated = await hydrateWithIntl(
      html,
      <DeckDatesLine updatedAt={UPDATED} />
    );

    expect(hydrated.container).toHaveTextContent(/^Updated 1 day ago$/);
    const time = hydrated.container.querySelector("time");
    expect(time).toHaveAttribute("datetime", UPDATED);
    expect(time?.getAttribute("title")).toMatch(
      /^Friday, November 20, 2026 at 1:00\sPM$/
    );
    hydrated.unmount();
  });
});
