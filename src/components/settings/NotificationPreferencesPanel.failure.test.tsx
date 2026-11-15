/**
 * Characterization of the notification preferences page when the server
 * fails (master plan ID-01; server audit §6.9). The happy path lives in
 * `NotificationPreferencesPanel.test.tsx`.
 *
 * Sociable: the real panel and the real catalogs. MSW stands in for
 * `/api/user/notification-preferences`, so each test states the answer the
 * route gives and asserts what the player sees: today's route has no
 * try/catch (B2-13), so a database failure reaches the browser as Next's own
 * HTML 500 page, which is the "not JSON" case below.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";

const ENDPOINT = "/api/user/notification-preferences";
const ERROR_TEXT = "Your notification preferences could not be saved.";

const ALL_ON = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
};
const CONTROL_NAMES = ["Replies", "Mentions", "New followers", "Watched decks"];

const server = setupMsw(
  http.get(ENDPOINT, () => HttpResponse.json(ALL_ON)),
  http.patch(ENDPOINT, () => HttpResponse.json(ALL_ON))
);

/** The four event controls, in page order. */
function controls(): readonly HTMLElement[] {
  return CONTROL_NAMES.map((name) => screen.getByRole("checkbox", { name }));
}

describe("NotificationPreferencesPanel — when the read fails", () => {
  it("shows the alert with a retry and leaves every control unchecked and disabled", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.json({ error: "Internal error" }, { status: 500 })
      )
    );
    renderWithProviders(<NotificationPreferencesPanel />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(ERROR_TEXT);
    expect(
      within(alert).getByRole("button", { name: "Retry" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Loading your preferences…")
    ).not.toBeInTheDocument();
    for (const control of controls()) {
      expect(control).toBeDisabled();
      expect(control).not.toBeChecked();
    }
  });

  it("pins the alert wording: a failed load says the preferences could not be saved", async () => {
    // Follow-up: the catalog has one message for load and save failures
    // (`settings.notifications.error`), so a read failure talks about saving.
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json({}, { status: 503 }))
    );
    renderWithProviders(<NotificationPreferencesPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be saved"
    );
  });

  it("treats a non-JSON answer, such as Next's HTML 500 page, as a failed load", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.html(
          "<!DOCTYPE html><html><body>Internal Server Error</body></html>",
          {
            status: 500,
          }
        )
      )
    );
    renderWithProviders(<NotificationPreferencesPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_TEXT);
  });

  it("treats a 200 whose body is not a complete preference set as a failed load", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ replies: true })));
    renderWithProviders(<NotificationPreferencesPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_TEXT);
  });

  it("treats a network failure as a failed load", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.error()));
    renderWithProviders(<NotificationPreferencesPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_TEXT);
  });

  it("loads the preferences and clears the alert when the retry succeeds", async () => {
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json({}, { status: 500 }), {
        once: true,
      })
    );
    renderWithProviders(<NotificationPreferencesPanel />);
    const alert = await screen.findByRole("alert");

    await userEvent.click(within(alert).getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
    for (const control of controls()) {
      expect(control).toBeEnabled();
      expect(control).toBeChecked();
    }
  });
});

describe("NotificationPreferencesPanel — when the write fails", () => {
  async function loaded() {
    renderWithProviders(<NotificationPreferencesPanel />);
    const replies = await screen.findByRole("checkbox", { name: "Replies" });
    await waitFor(() => expect(replies).toBeEnabled());
    return replies;
  }

  it("keeps the control at its stored value, shows the alert and re-enables the controls", async () => {
    server.use(
      http.patch(ENDPOINT, () =>
        HttpResponse.json({ error: "Internal error" }, { status: 500 })
      )
    );
    const replies = await loaded();

    await userEvent.click(replies);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_TEXT);
    expect(replies).toBeChecked();
    for (const control of controls()) expect(control).toBeEnabled();
  });

  it("treats a network failure on save the same way", async () => {
    server.use(http.patch(ENDPOINT, () => HttpResponse.error()));
    const replies = await loaded();

    await userEvent.click(replies);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_TEXT);
    expect(replies).toBeChecked();
  });

  it("clears the alert and applies the change when the next save succeeds", async () => {
    server.use(
      http.patch(ENDPOINT, () => HttpResponse.json({}, { status: 500 }), {
        once: true,
      })
    );
    const replies = await loaded();
    await userEvent.click(replies);
    await screen.findByRole("alert");

    await userEvent.click(replies);

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
    expect(replies).not.toBeChecked();
  });

  it("pins that the alert has no retry for a failed save: the retry button reloads instead", async () => {
    // The one alert serves both failures, and its button always refetches the
    // stored preferences. After a failed save that is harmless (the stored
    // value is what the page already shows) but it does not retry the save.
    let patches = 0;
    server.use(
      http.patch(ENDPOINT, () => {
        patches += 1;
        return HttpResponse.json({}, { status: 500 });
      })
    );
    const replies = await loaded();
    await userEvent.click(replies);
    const alert = await screen.findByRole("alert");

    await userEvent.click(within(alert).getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
    expect(patches).toBe(1);
    expect(replies).toBeChecked();
  });
});
