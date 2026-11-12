/**
 * The sign-in bootstrap as the rest of the app sees it: one request answers
 * the onboarding status and the collection, `useInitContext` reports its
 * progress, and what happens with the payload is composed by the app
 * providers through `onInitialized` (master plan P1-38, audit arch 1.11).
 *
 * Sociable: the real Auth.js `SessionProvider` reads the session from MSW,
 * so no module of this repository is mocked.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { SessionProvider, useSession } from "next-auth/react";
import { setupMsw } from "@/test/msw";
import type { UserInitData } from "@/lib/auth/user-init";
import { InitProvider, useInitContext } from "./InitProvider";

/** What GET /api/auth/session answers for a signed-in player. */
const SIGNED_IN_SESSION = {
  user: { id: "user-1" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** What GET /api/user/init answers for a player who owns two Sol Rings. */
const BOOTSTRAP_PAYLOAD: UserInitData = {
  onboardingDone: true,
  collection: [
    {
      id: "row-1",
      scryfallId: "scry-sol-ring",
      name: "Sol Ring",
      quantity: 2,
      foil: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

/** Shows the session and the bootstrap context the pages read, and offers the retry button. */
function BootstrapProbe() {
  const { status } = useSession();
  const { onboardingDone, initializationStatus, retryInitialization } =
    useInitContext();
  return (
    <>
      <output aria-label="session">{status}</output>
      <output aria-label="status">{initializationStatus}</output>
      <output aria-label="onboarding">{String(onboardingDone)}</output>
      <button type="button" onClick={retryInitialization}>
        retry
      </button>
    </>
  );
}

function renderProvider(onInitialized: (data: UserInitData) => void) {
  return render(
    <SessionProvider refetchOnWindowFocus={false}>
      <InitProvider onInitialized={onInitialized}>
        <BootstrapProbe />
      </InitProvider>
    </SessionProvider>
  );
}

describe("InitProvider", () => {
  const server = setupMsw(
    http.get("/api/auth/session", () => HttpResponse.json(SIGNED_IN_SESSION)),
    http.get("/api/user/init", () => HttpResponse.json(BOOTSTRAP_PAYLOAD))
  );

  it("stays idle and leaves the onboarding status unknown while nobody is signed in", async () => {
    // Auth.js answers `null` when there is no session.
    server.use(http.get("/api/auth/session", () => HttpResponse.json(null)));
    const onInitialized = vi.fn();

    renderProvider(onInitialized);

    await waitFor(() => {
      expect(screen.getByLabelText("session")).toHaveTextContent(
        "unauthenticated"
      );
    });
    expect(screen.getByLabelText("status")).toHaveTextContent("idle");
    expect(screen.getByLabelText("onboarding")).toHaveTextContent("null");
    expect(onInitialized).not.toHaveBeenCalled();
  });

  it("hands the bootstrap payload to the composed callback and reports ready once the request answers", async () => {
    const onInitialized = vi.fn();

    renderProvider(onInitialized);

    await waitFor(() => {
      expect(screen.getByLabelText("status")).toHaveTextContent("ready");
    });
    expect(screen.getByLabelText("onboarding")).toHaveTextContent("true");
    expect(onInitialized).toHaveBeenCalledTimes(1);
    expect(onInitialized).toHaveBeenCalledWith(BOOTSTRAP_PAYLOAD);
  });

  it("reports an error when the request fails, keeps the payload callback silent, and asks again on retry", async () => {
    server.use(
      http.get(
        "/api/user/init",
        () => HttpResponse.json({ error: "down" }, { status: 500 }),
        { once: true }
      )
    );
    const onInitialized = vi.fn();

    renderProvider(onInitialized);

    await waitFor(() => {
      expect(screen.getByLabelText("status")).toHaveTextContent("error");
    });
    expect(onInitialized).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "retry" }));

    await waitFor(() => {
      expect(screen.getByLabelText("status")).toHaveTextContent("ready");
    });
    expect(onInitialized).toHaveBeenCalledWith(BOOTSTRAP_PAYLOAD);
  });
});
