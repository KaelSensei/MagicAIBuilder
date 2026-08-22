"use client";
/**
 * API key management.
 *
 * The screen is built around one fact: a token is shown once and is not
 * recoverable. So the reveal is a blocking panel the user must actively
 * dismiss, not a toast that disappears on its own — a toast would let a
 * credential scroll away while its owner was looking elsewhere, and the only
 * remedy would be minting a second key and revoking the first.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, KeyRound, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useApiKeys, type ApiKeySummary } from "@/hooks/useApiKeys";
// From `scopes`, never `keys`: the latter imports node:crypto, and pulling it
// into a client component would ship the minting code to the browser.
import { API_SCOPES } from "@/lib/api/scopes";
import { cn } from "@/components/ui/utils";

/** Expiry choices offered; `0` means "until revoked". */
const EXPIRY_CHOICES = [0, 30, 90, 365] as const;

function FreshTokenPanel({
  token,
  onDismiss,
}: {
  readonly token: string;
  readonly onDismiss: () => void;
}) {
  const t = useTranslations("settings");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      // Clipboard access can be refused (insecure context, denied permission).
      // The token is on screen and selectable, so this is a lost convenience,
      // not a lost key — saying "copied" when nothing was would be worse.
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="fresh-token-heading"
      className="rounded-lg border border-[var(--accent)] bg-[var(--surface)] p-4 space-y-3"
    >
      <h2
        id="fresh-token-heading"
        className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
      >
        <ShieldAlert className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
        {t("apiKeys.tokenOnce.title")}
      </h2>
      <p className="text-xs text-[var(--text-secondary)]">
        {t("apiKeys.tokenOnce.body")}
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 break-all rounded bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]">
          {token}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 flex items-center gap-1.5 rounded border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {copied ? t("apiKeys.tokenOnce.copied") : t("apiKeys.tokenOnce.copy")}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        {t("apiKeys.tokenOnce.dismiss")}
      </button>
    </section>
  );
}

function KeyRow({
  apiKey,
  onRevoke,
}: {
  readonly apiKey: ApiKeySummary;
  readonly onRevoke: (id: string) => void;
}) {
  const t = useTranslations("settings");
  const [confirming, setConfirming] = useState(false);
  const revoked = apiKey.revokedAt !== null;
  const expired =
    apiKey.expiresAt !== null && new Date(apiKey.expiresAt).getTime() <= Date.now();

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] p-3",
        (revoked || expired) && "opacity-60"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {apiKey.name}
        </p>
        <p className="font-mono text-xs text-[var(--text-secondary)]">
          {apiKey.displayPrefix}…
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
          {apiKey.scopes.join(", ")} ·{" "}
          {apiKey.lastUsedAt
            ? t("apiKeys.lastUsed", {
                date: new Date(apiKey.lastUsedAt).toLocaleDateString(),
              })
            : t("apiKeys.neverUsed")}
        </p>
      </div>

      {revoked && (
        <span className="shrink-0 rounded bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300">
          {t("apiKeys.revoked")}
        </span>
      )}
      {!revoked && expired && (
        <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
          {t("apiKeys.expired")}
        </span>
      )}

      {!revoked &&
        (confirming ? (
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onRevoke(apiKey.id)}
              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 transition-colors"
            >
              {t("apiKeys.confirmRevoke")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {t("apiKeys.cancel")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 flex items-center gap-1.5 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-red-500 hover:text-red-400 transition-colors"
            // Revocation is immediate and cannot be undone, so the label names
            // the key rather than saying "revoke" twenty times over.
            aria-label={t("apiKeys.revokeNamed", { name: apiKey.name })}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t("apiKeys.revoke")}
          </button>
        ))}
    </li>
  );
}

export function ApiKeysPageClient() {
  const t = useTranslations("settings");
  const {
    keys,
    isLoading,
    isSubmitting,
    error,
    freshToken,
    createKey,
    revokeKey,
    dismissFreshToken,
  } = useApiKeys();

  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<readonly string[]>(["decks:read"]);
  const [expiresInDays, setExpiresInDays] = useState<number>(0);

  const canSubmit = name.trim().length > 0 && scopes.length > 0 && !isSubmitting;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const created = await createKey({
      name: name.trim(),
      scopes,
      expiresInDays: expiresInDays === 0 ? undefined : expiresInDays,
    });
    if (created) setName("");
  }

  function toggleScope(scope: string) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope]
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
          <KeyRound className="w-5 h-5 text-[var(--accent-text)]" aria-hidden="true" />
          {t("apiKeys.title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("apiKeys.intro")}</p>
      </header>

      {freshToken && (
        <FreshTokenPanel token={freshToken} onDismiss={dismissFreshToken} />
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="space-y-3 rounded-lg border border-[var(--border)] p-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="api-key-name"
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            {t("apiKeys.nameLabel")}
          </label>
          <input
            id="api-key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder={t("apiKeys.namePlaceholder")}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </div>

        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-[var(--text-secondary)]">
            {t("apiKeys.scopesLabel")}
          </legend>
          <div className="flex flex-wrap gap-3">
            {API_SCOPES.map((scope) => (
              <label key={scope} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                  className="accent-[var(--accent)]"
                />
                <code className="text-[var(--text-primary)]">{scope}</code>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1">
          <label
            htmlFor="api-key-expiry"
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            {t("apiKeys.expiryLabel")}
          </label>
          <select
            id="api-key-expiry"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {EXPIRY_CHOICES.map((days) => (
              <option key={days} value={days}>
                {days === 0
                  ? t("apiKeys.expiryNever")
                  : t("apiKeys.expiryDays", { days })}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-1.5 rounded bg-[var(--accent)] px-3 py-2 text-sm text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="w-4 h-4" aria-hidden="true" />
          )}
          {t("apiKeys.create")}
        </button>
      </form>

      <section aria-labelledby="api-keys-list-heading" className="space-y-2">
        <h2
          id="api-keys-list-heading"
          className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
        >
          {t("apiKeys.existing")}
        </h2>

        {isLoading && <p className="text-sm text-[var(--text-secondary)]">{t("apiKeys.loading")}</p>}

        {!isLoading && keys.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">{t("apiKeys.empty")}</p>
        )}

        {keys.length > 0 && (
          <ul className="space-y-2">
            {keys.map((apiKey) => (
              // `KeyRow` is the <li> itself — wrapping it in another would nest
              // list items, which is invalid and confuses a screen reader's
              // item count.
              <KeyRow
                key={apiKey.id}
                apiKey={apiKey}
                onRevoke={(id) => void revokeKey(id)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
