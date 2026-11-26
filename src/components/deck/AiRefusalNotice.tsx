"use client";
/**
 * The line the AI suggestions panel shows when a call was refused before a
 * model ran.
 *
 * Deck AI, presentation side. A server denial (monthly allowance, spend
 * ceiling) is worded by `useAiDenialMessage`. A missing session says that
 * suggestions need an account and links to both auth pages, each bringing
 * the player back to the page they were on (I-39 6.5, docs/product/specs/
 * i39-first-run-activation-and-measurement.md). Neither case offers a retry,
 * since repeating the call cannot succeed.
 * Not responsible for: reading the refusal (`lib/ai/usage/refusal.ts`).
 *
 * @module components/deck/AiRefusalNotice
 */
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAiDenialMessage } from "@/hooks/useAiDenialMessage";
import { Link, usePathname } from "@/i18n/navigation";
import { authPageHref, sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import type { AiCallDenial } from "@/lib/ai/usage/denial";
import type { AiCallRefusal } from "@/lib/ai/usage/refusal";

interface AiRefusalNoticeProps {
  readonly refusal: AiCallRefusal;
}

const LINK_CLASS = "font-semibold underline hover:no-underline";

/**
 * A polite live region holding why the call was refused, in the UI locale.
 *
 * @param refusal - the server's denial, or `sign_in_required`
 */
export function AiRefusalNotice({ refusal }: AiRefusalNoticeProps) {
  return (
    <output
      aria-live="polite"
      aria-atomic="true"
      className="flex items-start gap-2 text-amber-400 text-xs p-2 bg-amber-500/10 rounded-lg"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      {refusal.code === "sign_in_required" ? (
        <AccountRequired />
      ) : (
        <DenialMessage denial={refusal} />
      )}
    </output>
  );
}

/** The server's denial, worded with its limit and reset date. */
function DenialMessage({ denial }: { readonly denial: AiCallDenial }) {
  const describeDenial = useAiDenialMessage();
  return <span>{describeDenial(denial)}</span>;
}

/** "Suggestions need an account", with the way to make one and to sign in. */
function AccountRequired() {
  const t = useTranslations("deck.ai.account");
  const callbackUrl = sanitizeCallbackUrl(usePathname());

  return (
    <span>
      {t("required")}{" "}
      <Link
        href={authPageHref("/auth/signup", callbackUrl)}
        className={LINK_CLASS}
      >
        {t("signUp")}
      </Link>{" "}
      <Link
        href={authPageHref("/auth/signin", callbackUrl)}
        className={LINK_CLASS}
      >
        {t("signIn")}
      </Link>
    </span>
  );
}
