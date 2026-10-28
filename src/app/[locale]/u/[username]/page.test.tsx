import { afterEach, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/profile/PublicProfileView", () => ({ PublicProfileView: () => null }));

import UserProfilePage, { generateMetadata } from "./page";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("shows a retryable error instead of a 404 when the profile service fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "player" }) })
  ).rejects.toThrow("PROFILE_UNAVAILABLE");
});

it("bounds the profile request to 15 seconds", async () => {
  const signal = new AbortController().signal;
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "player" }) })
  ).rejects.toThrow("NOT_FOUND");
  expect(timeout).toHaveBeenCalledWith(15_000);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ signal })
  );
});

it("encodes reserved characters in the username before requesting the profile", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    UserProfilePage({ params: Promise.resolve({ locale: "en", username: "a#b" }) })
  ).rejects.toThrow("NOT_FOUND");
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/users/a%23b"),
    expect.any(Object)
  );
});

it("keeps an unavailable profile from producing a not-found metadata title", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", username: "player" }),
  });

  expect(metadata.title).toBe("Profile unavailable — MagicAIBuilder");
});
