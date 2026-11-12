import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

const { signIn, searchParams } = vi.hoisted(() => ({
  signIn: vi.fn(),
  searchParams: { current: new URLSearchParams() },
}));
vi.mock(import("next-auth/react"), () => ({ signIn }));
vi.mock(import("next/navigation"), async (importOriginal) => {
  const { ReadonlyURLSearchParams } = await importOriginal();
  return {
    useSearchParams: () => new ReadonlyURLSearchParams(searchParams.current),
  };
});
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/** The page the browser is sent to once the session exists. */
const location = { href: "" };

function openWith(query: string): void {
  searchParams.current = new URLSearchParams(query);
}

function renderForm(form: React.ReactElement): void {
  renderWithIntl(form);
}

function fillCredentials(): void {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "correct-horse" },
  });
}

async function signUp(): Promise<void> {
  renderForm(<SignUpForm />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "New Player" },
  });
  fillCredentials();
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
  await waitFor(() => expect(location.href).not.toBe(""));
}

/**
 * The guest notice links to sign-up with `callbackUrl=/builder/guest`. Sign-up
 * used to drop it and always land on /decks; sign-in followed any value it was
 * given, foreign hosts included.
 */
describe("auth forms and callbackUrl", () => {
  beforeEach(() => {
    signIn.mockReset();
    signIn.mockResolvedValue({ error: undefined });
    location.href = "";
    vi.stubGlobal("location", location);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 201 }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a new account to the page that sent it to sign-up", async () => {
    openWith("callbackUrl=/builder/guest");

    await signUp();

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ callbackUrl: "/builder/guest" })
    );
    expect(location.href).toBe("/builder/guest");
  });

  it("keeps a localized callback path through sign-up", async () => {
    openWith("callbackUrl=/fr/builder/guest");

    await signUp();

    expect(location.href).toBe("/fr/builder/guest");
  });

  it("sends a new account to the deck list when callbackUrl names another site", async () => {
    openWith("callbackUrl=https://evil.com/decks");

    await signUp();

    expect(location.href).toBe("/decks");
  });

  it("passes the safe callback to Google sign-up", () => {
    openWith("callbackUrl=/builder/guest");
    renderForm(<SignUpForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );

    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/builder/guest",
    });
  });

  it("refuses a protocol-relative callback on sign-in", async () => {
    openWith("callbackUrl=//evil.com");
    renderForm(<SignInForm />);
    fillCredentials();

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(location.href).toBe("/decks"));
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ callbackUrl: "/decks" })
    );
  });

  it("refuses a foreign callback for Google sign-in", () => {
    openWith("callbackUrl=https://evil.com");
    renderForm(<SignInForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/decks" });
  });

  it("keeps the callback when the visitor switches between sign-up and sign-in", () => {
    openWith("callbackUrl=/builder/guest");
    renderForm(<SignUpForm />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fbuilder%2Fguest"
    );
  });
});
