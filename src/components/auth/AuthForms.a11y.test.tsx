/**
 * What a password manager and a screen reader get from the sign-in and
 * sign-up forms (I-04 slice 14, accessibility bundle 4).
 *
 * - WCAG 1.3.5: each field names its purpose with `autoComplete`, so a
 *   password manager fills the right field and offers a new password on
 *   sign-up.
 * - WCAG 4.1.3: an error the form shows is an alert, so a screen reader says
 *   it without the player moving focus.
 *
 * Sociable: the real forms, the real shell and the real catalogs. MSW stands
 * in for the sign-up route. Auth.js's `signIn` is replaced (it would reach
 * the server), and `useSearchParams` has no app router in jsdom.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

const SIGN_UP_ENDPOINT = "/api/auth/signup";

const server = setupMsw(
  http.post(SIGN_UP_ENDPOINT, () => HttpResponse.json({}, { status: 201 }))
);

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock(import("next-auth/react"), async (importOriginal) => ({
  ...(await importOriginal()),
  signIn,
}));
vi.mock(import("next/navigation"), async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useSearchParams: () =>
      new original.ReadonlyURLSearchParams(new URLSearchParams()),
  };
});

beforeEach(() => {
  signIn.mockReset();
});

describe("SignInForm — autocomplete", () => {
  it("the sign-in password field asks for the current password", () => {
    renderWithProviders(<SignInForm />);

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  it("the sign-in email field asks for the player's email", () => {
    renderWithProviders(<SignInForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email"
    );
  });
});

describe("SignInForm — errors", () => {
  it("a sign-in failure is announced as an alert", async () => {
    signIn.mockResolvedValue({ error: "CredentialsSignin" });
    renderWithProviders(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "wrong password");

    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password"
    );
  });
});

describe("SignUpForm — errors", () => {
  it("a sign-up failure is announced as an alert", async () => {
    server.use(
      http.post(SIGN_UP_ENDPOINT, () =>
        HttpResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      )
    );
    renderWithProviders(<SignUpForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.test");
    await userEvent.type(
      screen.getByLabelText("Password"),
      "correct horse battery"
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Create Account" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists"
    );
  });

  it("shows no alert before anything went wrong", () => {
    renderWithProviders(<SignUpForm />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SignUpForm — autocomplete", () => {
  it.each([
    { label: "Name", purpose: "name" },
    { label: "Email", purpose: "email" },
    { label: "Password", purpose: "new-password" },
  ])("the sign-up $label field asks for $purpose", ({ label, purpose }) => {
    renderWithProviders(<SignUpForm />);

    expect(screen.getByLabelText(label)).toHaveAttribute(
      "autocomplete",
      purpose
    );
  });
});
