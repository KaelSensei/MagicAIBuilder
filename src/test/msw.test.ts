import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { useMsw } from "@/test/msw";

const PROVIDER_URL = "https://provider.example.test/answer";
// `.test` is reserved (RFC 2606): even a request that escaped MSW could not reach a real host.
const UNSERVED_URL = "https://unserved.example.test/anything";

async function providerAnswer(): Promise<unknown> {
  const response = await fetch(PROVIDER_URL);
  return response.json();
}

describe("useMsw", () => {
  const server = useMsw(
    http.get(PROVIDER_URL, () => HttpResponse.json({ answer: "recorded" }))
  );

  it("answers a request from the handlers the test file registered", async () => {
    expect(await providerAnswer()).toEqual({ answer: "recorded" });
  });

  // The next two tests run in order on purpose: the second proves that the first one's override
  // did not outlive it.
  it("lets one test replace a handler with server.use", async () => {
    server.use(
      http.get(PROVIDER_URL, () => HttpResponse.json({ answer: "override" }))
    );

    expect(await providerAnswer()).toEqual({ answer: "override" });
  });

  it("restores the file's handlers once that test has ended", async () => {
    expect(await providerAnswer()).toEqual({ answer: "recorded" });
  });

  describe("a request no handler serves", () => {
    let outcome: "answered" | "rejected" | "not sent" = "not sent";
    let failures: readonly string[] = [];

    // `fails` inverts the result: this test passes only because useMsw failed it. The body
    // swallows the network error, as `requestDeckCombos` and most provider clients do, to
    // show that the helper does not rely on the code under test to surface the error.
    it.fails(
      "fails the test that sent it, even when the code swallowed the error",
      async ({ onTestFailed }) => {
        onTestFailed(({ task }) => {
          failures = (task.result?.errors ?? []).map((error) => error.message);
        });

        outcome = await fetch(UNSERVED_URL).then(
          () => "answered",
          () => "rejected"
        );
      }
    );

    it("was blocked before the network, and the failure names it", () => {
      expect(outcome).toBe("rejected");
      expect(failures).toEqual([
        expect.stringContaining(`GET ${UNSERVED_URL}`),
      ]);
    });
  });
});
