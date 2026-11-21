/**
 * The "Download my data" section of Settings → Account (I-38 requirement 7.1,
 * slice 5, export half).
 *
 * Sociable: the real section and the real catalogs. MSW stands in for
 * `GET /api/user/export`, so each test states the answer the route gives and
 * asserts what the player sees and which file the browser was asked to save.
 * The browser's save is observed at its edge: `URL.createObjectURL` receives
 * the file and the temporary link's click carries its name.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { AccountDataSection } from "./AccountDataSection";

const ENDPOINT = "/api/user/export";
const FILE_NAME = "magicaibuilder-account-2026-11-20.json";
const ARCHIVE = JSON.stringify({ schemaVersion: 1, decks: [] });

/** The route's 200 answer, headers as `src/app/api/user/export/route.ts` sets them. */
function archiveAnswer(): Response {
  return new HttpResponse(ARCHIVE, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
      "Cache-Control": "no-store",
    },
  });
}

const server = setupMsw(http.get(ENDPOINT, archiveAnswer));

/** The file names the browser was asked to save, in order. */
let savedNames: string[] = [];
let createObjectURL: ReturnType<typeof vi.fn<(blob: Blob) => string>>;

beforeEach(() => {
  savedNames = [];
  createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:account");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    savedNames.push(this.download);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** @returns the saved file's text, read the way a browser would save it */
function savedText(): Promise<string> {
  const blob = createObjectURL.mock.calls[0]?.[0];
  if (blob === undefined) throw new Error("No file was saved");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function downloadButton(): HTMLElement {
  return screen.getByRole("button", { name: "Download my data" });
}

describe("AccountDataSection — downloading the archive", () => {
  it("pressing Download my data fetches /api/user/export and saves the file the response names", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    await vi.waitFor(() => expect(savedNames).toEqual([FILE_NAME]));
    expect(await savedText()).toBe(ARCHIVE);
    expect(downloadButton()).toBeEnabled();
  });

  it("shows a busy, disabled button until the archive arrives", async () => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(ENDPOINT, async () => {
        await answered;
        return archiveAnswer();
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    expect(downloadButton()).toBeDisabled();
    expect(downloadButton()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing your archive…"
    );
    release();
    await vi.waitFor(() => expect(savedNames).toEqual([FILE_NAME]));
    expect(downloadButton()).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("saves under a dated default name when the answer names no file", async () => {
    server.use(
      http.get(ENDPOINT, () => new HttpResponse(ARCHIVE, { status: 200 }))
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    await vi.waitFor(() =>
      expect(savedNames).toEqual(["magicaibuilder-account.json"])
    );
  });

  it("says what the archive holds and that it is free, with no request to a person", () => {
    renderWithProviders(<AccountDataSection />);

    expect(
      screen.getByRole("heading", { name: "Download my data" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/One JSON file with everything tied to your account/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /It is free and ready straight away, with no request to anyone/
      )
    ).toBeInTheDocument();
  });
});

describe("AccountDataSection — the hourly limit", () => {
  it("a 429 says the player can try again later and keeps the button", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.json(
          { error: "Too many exports. Try again later." },
          { status: 429, headers: { "Retry-After": "1800" } }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    expect(
      await screen.findByText(
        "You downloaded your data less than an hour ago. You can download it again in 30 minutes."
      )
    ).toBeInTheDocument();
    expect(downloadButton()).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(savedNames).toEqual([]);
  });

  it("says 'later' when the 429 carries no Retry-After", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.json({ error: "Too many exports." }, { status: 429 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    expect(
      await screen.findByText(
        "You downloaded your data less than an hour ago. You can download it again later."
      )
    ).toBeInTheDocument();
  });

  it("names the wait in French, rounded up to a whole minute", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.json(
          { error: "Too many exports." },
          { status: 429, headers: { "Retry-After": "30" } }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />, { locale: "fr" });

    await user.click(
      screen.getByRole("button", { name: "Télécharger mes données" })
    );

    expect(
      await screen.findByText(
        "Vous avez téléchargé vos données il y a moins d’une heure. Vous pourrez les télécharger à nouveau dans 1 minute."
      )
    ).toBeInTheDocument();
  });
});

describe("AccountDataSection — when the export fails", () => {
  it("a 500 shows the catalogue message and a retry", async () => {
    server.use(
      http.get(
        ENDPOINT,
        () =>
          HttpResponse.json(
            { error: "Failed to export account" },
            { status: 500 }
          ),
        { once: true }
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Your data could not be downloaded. Try again in a moment."
    );
    expect(alert).not.toHaveTextContent("500");
    expect(savedNames).toEqual([]);

    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    await vi.waitFor(() => expect(savedNames).toEqual([FILE_NAME]));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("treats a network failure as a failed export", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.error()));
    const user = userEvent.setup();
    renderWithProviders(<AccountDataSection />);

    await user.click(downloadButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your data could not be downloaded."
    );
    expect(downloadButton()).toBeEnabled();
  });
});
