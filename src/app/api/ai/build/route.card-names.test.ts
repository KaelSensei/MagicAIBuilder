/*
 * A requested commander reaches the build prompt under its exact card name,
 * and quotes inside the name cannot close the quoted value around it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock(import("@/lib/auth/helpers"), () => ({
  requireAuth: mocks.requireAuth,
}));
vi.mock(import("@/lib/rate-limit"), () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));
// The route reserves a metered AI call before it reaches the model.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), db);
});

import { resetAiUsageDb } from "@/test/ai-usage-db";
import { POST } from "./route";

/** The part of the Anthropic request body that carries the prompt. */
const PROVIDER_BODY = z.object({
  messages: z.array(z.object({ content: z.string() })).min(1),
});

/**
 * Posts a build request for `commanderName` and returns the prompt the route
 * sent. The provider answers 500: only the prompt matters here.
 */
async function promptSentFor(commanderName: string): Promise<string> {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response("{}", { status: 500 })
  );
  vi.stubGlobal("fetch", fetchMock);

  const response = await POST(
    new Request("http://localhost/api/ai/build", {
      method: "POST",
      body: JSON.stringify({
        budget: null,
        colors: ["B", "R", "G"],
        strategy: "Attack",
        commanderName,
        bracket: 3,
      }),
    })
  );
  await response.text();

  const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  return PROVIDER_BODY.parse(body).messages[0]?.content ?? "";
}

describe("POST /api/ai/build commander name", () => {
  beforeEach(() => {
    resetAiUsageDb(db);
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it("keeps the apostrophe in the commander's name", async () => {
    expect(await promptSentFor("Atraxa, Praetors' Voice")).toContain(
      `Use exactly "Atraxa, Praetors' Voice" as the commander`
    );
  });

  it("escapes quotes inside the commander's name", async () => {
    expect(await promptSentFor('Henzie "Toolbox" Torre')).toContain(
      String.raw`Use exactly "Henzie \"Toolbox\" Torre" as the commander`
    );
  });
});
