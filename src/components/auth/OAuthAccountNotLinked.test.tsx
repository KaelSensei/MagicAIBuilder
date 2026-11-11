import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enAuth from "@/messages/en/auth.json";
import frAuth from "@/messages/fr/auth.json";
import { SignInForm } from "./SignInForm";

vi.mock(import("next-auth/react"), () => ({ signIn: vi.fn() }));
vi.mock(import("next/navigation"), async (importOriginal) => {
  const { ReadonlyURLSearchParams } = await importOriginal();
  return {
    useSearchParams: () =>
      new ReadonlyURLSearchParams(
        new URLSearchParams({ error: "OAuthAccountNotLinked" })
      ),
  };
});
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/**
 * Auth.js redirects a Google sign-in whose email already belongs to another
 * account to `/auth/signin?error=OAuthAccountNotLinked`.
 */
describe("Google sign-in refused for an email that already has an account", () => {
  it.each([
    [
      "en",
      enAuth,
      "An account already exists for this email. Sign in with your email and password instead. Linking Google to an existing account is not available yet.",
    ],
    [
      "fr",
      frAuth,
      "Un compte existe déjà pour cet e-mail. Connectez-vous plutôt avec votre e-mail et votre mot de passe. Il n’est pas encore possible de lier Google à un compte existant.",
    ],
  ])(
    "tells the %s reader to sign in with the password",
    (locale, auth, message) => {
      render(
        <NextIntlClientProvider locale={locale} messages={{ auth }}>
          <SignInForm />
        </NextIntlClientProvider>
      );

      expect(screen.getByText(message)).toBeVisible();
    }
  );
});
