"use client";

import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { AuthPageShell } from "./AuthPageShell";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { AuthDivider } from "./AuthDivider";

export function SignUpForm() {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("signUp.genericError"));
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/decks",
      });

      setLoading(false);

      if (result?.error) {
        setError(t("signUp.signInFailed"));
        return;
      }

      globalThis.location.href = "/decks";
    },
    [name, email, password, t]
  );

  const handleGoogle = useCallback(() => {
    signIn("google", { callbackUrl: "/decks" });
  }, []);

  return (
    <AuthPageShell subtitle={t("signUp.title")} error={error}>
      <GoogleSignInButton onClick={handleGoogle} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signUp.nameLabel")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder={t("signUp.namePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signUp.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder={t("signUp.emailPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signUp.passwordLabel")}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder={t("signUp.passwordPlaceholder")}
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("signUp.submitting") : t("signUp.submit")}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        {t("signUp.hasAccount")}{" "}
        <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">
          {t("signUp.signInLink")}
        </Link>
      </p>
    </AuthPageShell>
  );
}
