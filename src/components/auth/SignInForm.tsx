"use client";

import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "./AuthPageShell";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { AuthDivider } from "./AuthDivider";

export function SignInForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/decks";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam ?? "");
  const [loading, setLoading] = useState(false);

  const handleCredentials = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      setLoading(false);

      if (result?.error) {
        setError(t("signIn.invalidCredentials"));
        return;
      }

      globalThis.location.href = callbackUrl;
    },
    [email, password, callbackUrl, t]
  );

  const handleGoogle = useCallback(() => {
    signIn("google", { callbackUrl });
  }, [callbackUrl]);

  const displayError =
    error === "OAuthAccountNotLinked"
      ? t("signIn.oauthAccountNotLinked")
      : error;

  return (
    <AuthPageShell subtitle={t("signIn.title")} error={displayError}>
      <GoogleSignInButton onClick={handleGoogle} />
      <AuthDivider />

      <form onSubmit={handleCredentials} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signIn.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder={t("signIn.emailPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signIn.authInputLabel")}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder={t("signIn.authInputHint")}
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("signIn.submitting") : t("signIn.submit")}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        {t("signIn.noAccount")}{" "}
        <Link href="/auth/signup" className="text-[var(--accent)] underline">
          {t("signIn.signUpLink")}
        </Link>
      </p>
    </AuthPageShell>
  );
}
