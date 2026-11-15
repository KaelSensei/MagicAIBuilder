/**
 * Characterization of what the sign-up form shows when `POST /api/auth/signup`
 * refuses (master plan ID-01) and what it shows when the answer cannot be read
 * as JSON (B2-14; server audit §6.10 and S3.19). The callback-URL
 * and Google paths live in `AuthCallbackUrl.test.tsx` and
 * `GoogleSignInFailure.test.tsx`.
 *
 * Sociable: the real form and the real catalogs. MSW stands in for the sign-up
 * route, so each test states the server's answer. `next-auth/react` and
 * `next/navigation` are mocked: the first would reach Auth.js, the second has
 * no app router in jsdom. The one internal module replaced is
 * `@/i18n/navigation`: next-intl's navigation imports `next/navigation`
 * without an extension, which Vitest cannot load outside a bundler, so every
 * component test uses the shared typed stub (`src/test/i18n-navigation-stub.tsx`).
 * Inlining next-intl in the Vitest config would remove this seam.
 *
 * Before B2-14 the form read every error body with `res.json()` and nothing
 * caught a failure of that read, so a proxy's HTML 502 or a network error
 * escaped the submit handler as an unhandled rejection and left the button
 * stuck on "Creating account...". `escapedRejectionsDuring` collects what
 * escapes one submit, so each test can assert that nothing does.
 */
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { SignUpForm } from "./SignUpForm";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock(import("next-auth/react"), () => ({ signIn }));
vi.mock(import("next/navigation"), async (importOriginal) => {
  const { ReadonlyURLSearchParams } = await importOriginal();
  return {
    useSearchParams: () => new ReadonlyURLSearchParams(new URLSearchParams()),
  };
});
// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const ENDPOINT = "/api/auth/signup";
const GENERIC_ERROR = "Failed to create account";
const UNAVAILABLE_EN =
  "We could not create your account. Try again in a moment.";
const UNAVAILABLE_FR =
  "Nous n'avons pas pu créer votre compte. Réessayez dans un instant.";

const server = setupMsw(
  http.post(ENDPOINT, () =>
    HttpResponse.json(
      { id: "user-1", name: "Ada", email: "ada@example.test" },
      { status: 201 }
    )
  )
);

beforeEach(() => {
  signIn.mockReset();
});

/** Fills the three fields with a valid account (English labels). */
async function fillValidAccount() {
  await userEvent.type(screen.getByLabelText("Name"), "Ada");
  await userEvent.type(screen.getByLabelText("Email"), "ada@example.test");
  await userEvent.type(
    screen.getByLabelText("Password"),
    "correct horse battery"
  );
}

/** Fills the three fields with a valid account and submits. */
async function submitValidAccount() {
  await fillValidAccount();
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
}

/**
 * Runs `action` and returns the promise rejections that nothing handled while
 * it ran. Vitest's own listener is taken off `process` for the duration, since
 * it would fail the run on the very rejection the test asserts, and is put
 * back afterwards. Node reports an unhandled rejection after the microtask
 * queue drains, so the helper yields one macrotask before collecting.
 */
async function escapedRejectionsDuring(
  action: () => Promise<void>
): Promise<readonly unknown[]> {
  const suspended = process.listeners("unhandledRejection");
  for (const listener of suspended) process.off("unhandledRejection", listener);
  const escaped: unknown[] = [];
  const collect = (reason: unknown): void => {
    escaped.push(reason);
  };
  process.on("unhandledRejection", collect);
  try {
    await action();
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    return escaped;
  } finally {
    process.off("unhandledRejection", collect);
    for (const listener of suspended)
      process.on("unhandledRejection", listener);
  }
}

describe("SignUpForm — JSON error answers", () => {
  it("shows the server's message when the email is taken, and lets the player try again", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      )
    );
    renderWithProviders(<SignUpForm />);

    await submitValidAccount();

    expect(
      await screen.findByText("An account with this email already exists")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows only the summary of a validation refusal, not its details", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json(
          {
            error: "Invalid input",
            details: ["Too small: expected string to have >=8 characters"],
          },
          { status: 400 }
        )
      )
    );
    renderWithProviders(<SignUpForm />);

    await submitValidAccount();

    expect(await screen.findByText("Invalid input")).toBeVisible();
    expect(screen.queryByText(/expected string/)).not.toBeInTheDocument();
  });

  it("shows the server's untranslated message as is, even under another locale (pinned; see B2-14)", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<SignUpForm />, { locale: "fr" });

    await userEvent.type(screen.getByLabelText("Nom"), "Ada");
    await userEvent.type(screen.getByLabelText("E-mail"), "ada@example.test");
    await userEvent.type(
      screen.getByLabelText("Mot de passe"),
      "correct horse battery"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Créer un compte" })
    );

    expect(await screen.findByText("Failed to create account")).toBeVisible();
  });

  it("falls back to the generic message when the JSON error body has no `error`", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json({ message: "nope" }, { status: 400 })
      )
    );
    renderWithProviders(<SignUpForm />);

    await submitValidAccount();

    expect(await screen.findByText(GENERIC_ERROR)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
  });

  it("clears the previous error when the player submits again", async () => {
    server.use(
      http.post(
        ENDPOINT,
        () =>
          HttpResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
          ),
        { once: true }
      )
    );
    signIn.mockResolvedValue({ error: "CredentialsSignin" });
    renderWithProviders(<SignUpForm />);
    await submitValidAccount();
    await screen.findByText("An account with this email already exists");

    await userEvent.click(
      screen.getByRole("button", { name: "Create Account" })
    );

    expect(
      await screen.findByText(
        "Account created but sign-in failed. Please sign in manually."
      )
    ).toBeVisible();
    expect(
      screen.queryByText("An account with this email already exists")
    ).not.toBeInTheDocument();
  });
});

describe("SignUpForm — answers that are not JSON", () => {
  it("shows a localized error and lets the player try again on a proxy's HTML 502", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.html(
          "<html><body><h1>502 Bad Gateway</h1></body></html>",
          { status: 502 }
        )
      )
    );
    renderWithProviders(<SignUpForm />);

    const escaped = await escapedRejectionsDuring(submitValidAccount);

    expect(escaped).toEqual([]);
    expect(await screen.findByText(UNAVAILABLE_EN)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.test");
    expect(screen.getByLabelText("Password")).toHaveValue(
      "correct horse battery"
    );
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows a localized error and lets the player try again when the network fails", async () => {
    server.use(http.post(ENDPOINT, () => HttpResponse.error()));
    renderWithProviders(<SignUpForm />, { locale: "fr" });
    await userEvent.type(screen.getByLabelText("Nom"), "Ada");
    await userEvent.type(screen.getByLabelText("E-mail"), "ada@example.test");
    await userEvent.type(
      screen.getByLabelText("Mot de passe"),
      "correct horse battery"
    );

    const escaped = await escapedRejectionsDuring(() =>
      userEvent.click(screen.getByRole("button", { name: "Créer un compte" }))
    );

    expect(escaped).toEqual([]);
    expect(await screen.findByText(UNAVAILABLE_FR)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Créer un compte" })
    ).toBeEnabled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("gives up on a sign-up that stalls for fifteen seconds and lets the player try again", async () => {
    server.use(
      http.post(ENDPOINT, async () => {
        await delay("infinite");
        return HttpResponse.json({}, { status: 201 });
      })
    );
    renderWithProviders(<SignUpForm />);
    await fillValidAccount();

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
      // The abort lands inside the advanced timers, and with it the form's
      // state updates, so the advance runs under act.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
    } finally {
      vi.useRealTimers();
    }

    expect(await screen.findByText(UNAVAILABLE_EN)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
    expect(signIn).not.toHaveBeenCalled();
  });
});
