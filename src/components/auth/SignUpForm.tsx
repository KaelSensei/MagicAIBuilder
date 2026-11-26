"use client";

import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authPageHref, sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { AuthPageShell } from "./AuthPageShell";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { AuthDivider } from "./AuthDivider";

/** How long the form waits for the sign-up route before it lets the player try again. */
const SIGN_UP_TIMEOUT_MS = 15_000;

interface SignUpPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

/**
 * The sign-up route's answer, as the form needs it.
 *
 * - `created`: the account exists and the form can sign the player in.
 * - `refused`: the route declined with a JSON body; `message` is its `error`
 *   string, or `null` when the body carries none.
 * - `unavailable`: the answer could not be read as JSON (a proxy's HTML 502),
 *   the network failed or the request timed out.
 */
type SignUpAnswer =
  | { readonly kind: "created" }
  | { readonly kind: "refused"; readonly message: string | null }
  | { readonly kind: "unavailable" };

type SignUpFailure = Exclude<SignUpAnswer, { kind: "created" }>;

/** Translator for the two catalog messages a failed sign-up can show. */
type FailureTranslator = (
  key: "signUp.genericError" | "signUp.unavailable"
) => string;

/** The `error` string of a refusal body, or `null` when the body carries none. */
function refusalMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message: unknown = Reflect.get(body, "error");
  return typeof message === "string" ? message : null;
}

/**
 * Posts the account to the sign-up route and classifies its answer.
 *
 * Never throws: a non-JSON answer, a network failure and a timeout all become
 * `unavailable`, so the form can tell the player to retry instead of leaving
 * the submit handler as an unhandled rejection with the button stuck (B2-14).
 */
async function requestSignUp(payload: SignUpPayload): Promise<SignUpAnswer> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SIGN_UP_TIMEOUT_MS),
    });
    if (res.ok) return { kind: "created" };
    const body: unknown = await res.json();
    return { kind: "refused", message: refusalMessage(body) };
  } catch {
    return { kind: "unavailable" };
  }
}

/**
 * The message to show for a failed sign-up. A refusal keeps the route's own
 * text (the route sends no error code to translate yet); anything else gets
 * the localized "try again" message.
 */
function failureMessage(answer: SignUpFailure, t: FailureTranslator): string {
  if (answer.kind === "refused") {
    return answer.message ?? t("signUp.genericError");
  }
  return t("signUp.unavailable");
}

export function SignUpForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
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

      const answer = await requestSignUp({ name, email, password });
      if (answer.kind !== "created") {
        setError(failureMessage(answer, t));
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      setLoading(false);

      if (result?.error) {
        setError(t("signUp.signInFailed"));
        return;
      }

      globalThis.location.href = callbackUrl;
    },
    [name, email, password, callbackUrl, t]
  );

  const handleGoogle = useCallback(() => {
    void signIn("google", { callbackUrl }).catch(() => {
      setError(t("google.failed"));
    });
  }, [callbackUrl, t]);

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
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
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
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
            placeholder={t("signUp.emailPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
          >
            {t("signUp.authInputLabel")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
            placeholder={t("signUp.authInputHint")}
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
        <Link
          href={authPageHref("/auth/signin", callbackUrl)}
          className="text-[var(--accent-text)] hover:underline"
        >
          {t("signUp.signInLink")}
        </Link>
      </p>
    </AuthPageShell>
  );
}
