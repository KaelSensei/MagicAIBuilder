/**
 * Characterization of what the sign-up form shows when `POST /api/auth/signup`
 * refuses (master plan ID-01; server audit §6.10 and S3.19). The callback-URL
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
 * The form reads every error body with `res.json()` and nothing catches a
 * failure of that read, so a non-JSON answer (a proxy's HTML 502) or a network
 * error leaves the handler as an unhandled rejection and the button stuck on
 * "Creating account...". B2-14 flips those two tests; until then they pin the
 * defect, and `escapedRejectionsDuring` keeps the escaped rejection from
 * failing the run so the test can assert it.
 */
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
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

/** Fills the three fields with a valid account and submits. */
async function submitValidAccount() {
  await userEvent.type(screen.getByLabelText("Name"), "Ada");
  await userEvent.type(screen.getByLabelText("Email"), "ada@example.test");
  await userEvent.type(
    screen.getByLabelText("Password"),
    "correct horse battery"
  );
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
}

/** The error banner `AuthPageShell` renders under the subtitle; `null` when absent. */
function banner(container: HTMLElement): Element | null {
  return container.querySelector(".text-red-400");
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
  it("currently shows no error and leaves the button stuck on a proxy's HTML 502 (pinned; see B2-14)", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.html(
          "<html><body><h1>502 Bad Gateway</h1></body></html>",
          {
            status: 502,
          }
        )
      )
    );
    const { container } = renderWithProviders(<SignUpForm />);

    const escaped = await escapedRejectionsDuring(submitValidAccount);

    expect(escaped).toHaveLength(1);
    expect(escaped[0]).toBeInstanceOf(SyntaxError);
    expect(banner(container)).toBeNull();
    expect(screen.queryByText(GENERIC_ERROR)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Creating account..." })
    ).toBeDisabled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("currently shows no error and leaves the button stuck when the network fails (pinned; see B2-14)", async () => {
    server.use(http.post(ENDPOINT, () => HttpResponse.error()));
    const { container } = renderWithProviders(<SignUpForm />);

    const escaped = await escapedRejectionsDuring(submitValidAccount);

    expect(escaped).toHaveLength(1);
    expect(escaped[0]).toBeInstanceOf(TypeError);
    expect(banner(container)).toBeNull();
    expect(screen.queryByText(GENERIC_ERROR)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Creating account..." })
    ).toBeDisabled();
  });
});
