import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import auth from "@/messages/en/auth.json";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Google sign-in failure", () => {
  beforeEach(() => signIn.mockReset());

  it("shows a recoverable error on the sign-up page too", async () => {
    signIn.mockRejectedValueOnce(new Error("Network unavailable"));
    render(
      <NextIntlClientProvider locale="en" messages={{ auth }}>
        <SignUpForm />
      </NextIntlClientProvider>
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    expect(
      await screen.findByText(
        "Unable to start Google sign-in. Please try again."
      )
    ).toBeVisible();
  });

  it("shows a recoverable error when Google sign-in cannot start", async () => {
    signIn.mockRejectedValueOnce(new Error("Network unavailable"));
    render(
      <NextIntlClientProvider locale="en" messages={{ auth }}>
        <SignInForm />
      </NextIntlClientProvider>
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    expect(
      await screen.findByText(
        "Unable to start Google sign-in. Please try again."
      )
    ).toBeVisible();
  });
});
