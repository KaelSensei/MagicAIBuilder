# I-61: Account Security: Passkeys, Two-Step Sign-In And Sessions

> **Initiative:** I-61, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next. Slices 1 to 10 and 15 need neither an email sender nor counsel; slices 11 to 14 wait for [I-38](i38-trust-safety-and-user-rights.md)'s email sender. Never paid · **Written 2026-11-10**
> **Research:** one dated note on Auth.js, OWASP ASVS 5.0, NIST SP 800-63B-4, the CNIL's password recommendation, the Pwned Passwords API and five competitors. It is not committed, so every external fact links its own source in [Sources](#sources). Legal points are research, not legal advice; each goes to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate) through I-38's slice 0.
> **Owns:** how a person proves who they are and how long that proof lasts: passwords and their storage, the breached-password check, passkeys, two-step sign-in and recovery codes, the session registry and the sessions page, re-authentication before sensitive actions, email verification, password reset and account recovery, linking Google from settings, sign-in throttling rules, and security notices. **Does not own:** the shared rate-limit store ([I-05](../roadmap.md#i-05-production-safety) M2); the `callbackUrl` fix (I-05 H1, done in [I-39](i39-first-run-activation-and-measurement.md) slice 2); the transactional email sender and the retention job (I-38 slices 13 and 14); account deletion, its cascade and the export (I-38 requirements 6 and 7); billing ([I-30](i30-business-model-and-paid-tier.md)).

## Overview

A MagicAIBuilder account will soon hold more than decks. [I-44](i44-trade-lists-within-the-pod.md) adds trade proposals and a trade reputation, [I-51](i51-cards-lent-and-borrowed.md) records cards lent to friends, [I-56](i56-wishlists-friends-can-buy-from.md) lets relatives reserve gifts, and [I-30](i30-business-model-and-paid-tier.md) would attach a subscription. The collection itself records what real cards a player owns and what they paid. Today all of it sits behind one password, with no way to change it, reset it, see where the account is signed in or add a second factor.

The code also fails several Level 1 requirements of OWASP ASVS 5.0, its lowest level [8][9]. Passwords are silently cut at 72 bytes, users cannot change a password, nothing blocks common passwords, signing out does not stop a copied session token, and the login limit can be spread across server instances or turned against a victim. A player who forgets their password has no way back, and an address squatted before #1321 stays with the squatter.

I-61 fixes the floor and adds what a careful product offers: passkeys, optional two-step sign-in with recovery codes, a sessions page with "sign out everywhere else", notices of new sign-ins, and throttling that slows an attacker without locking out the owner. **None of it is paid.** It argues for **Next** because most of it needs no email sender and no legal answer, and because I-44, I-51, I-56 and I-30 raise the cost of a stolen account.

## What the market does

Read 2026-11-10. Moxfield's sign-in page, Scryfall's FAQ and TCGplayer's help article answered HTTP 403, so those rows rely on secondary sources and say so.

| Product             | Two-step sign-in                                                                                                                                          | Passkeys      | Devices and sessions                        | Recovery of a lost factor                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------- | ------------------------------------------------------------ |
| **Cardmarket** [17] | Codes from "any OTP compatible application"; the user picks which actions need it; "We STRONGLY recommend that all users enable" it, "especially sellers" | Not mentioned | A trusted device skips the code for 30 days | Message "with a valid photo ID"; no recovery codes mentioned |
| **Scryfall** [18]   | Authenticator-app codes (TOTP), per a community directory entry present since 2021-05-26; Scryfall's own pages answered 403                               | Not found     | Not found                                   | Not found                                                    |
| **Moxfield** [19]   | Not found: sign-in page 403, the public wiki (last edited 2020-10-14) has no account page, no directory entry                                             | Not found     | Not found                                   | Not found                                                    |
| **Archidekt** [20]  | Not found: the FAQ covers no sign-in or security topic, no directory entry                                                                                | Not found     | Not found                                   | Not found                                                    |
| **TCGplayer** [21]  | Not found: "Your Account Security" answered 403; a search summary describes card verification by a small refund, not a second factor                      | Not found     | Not found                                   | Not found                                                    |

Three findings:

1. **Only a marketplace and the card database offer a second factor.** Cardmarket documents authenticator-app codes; a community directory lists the same for Scryfall. No deckbuilder read documents one, but blocked pages make this "not found", not "absent".
2. **No product read offers passkeys.** The standards now expect them: NIST says a verifier at AAL2 "SHALL offer at least one phishing-resistant authentication option" and accepts synced passkeys there [10].
3. **Cardmarket recovers a lost device with a photo ID.** This spec does not, because I-38 collects no identity documents; [open question 1](#open-questions) decides the last-resort path.

**Standards and the library**, read 2026-11-10:

| Source                                            | What it requires or states                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OWASP ASVS 5.0.0** (2025-05-30) [8][9]          | L1: passwords of at least 8, "15 or more strongly recommended" (6.2.1); users can change a password (6.2.2) with the current one (6.2.3); a check against at least 3,000 common passwords (6.2.4); no truncation (6.2.8); documented limits that avoid malicious lockout (6.1.1); logout blocks further use, by a revocation list for self-contained tokens (7.4.1); deletion ends all sessions (7.4.2). L2: at least 64 characters (6.2.9); breached-password check (6.2.12); reset does not bypass MFA (6.4.3); option to end other sessions after a factor change (7.4.3); re-authentication before changing email, MFA or recovery data (7.5.1); view and end sessions (7.5.2); TOTP codes single use and at most 30 seconds (6.5.1, 6.5.5) |
| **NIST SP 800-63B-4** (final 2025-07-31) [10]     | 15 characters for a password used alone, 8 with another factor; at least 64 allowed; a blocklist; no composition rules or periodic changes; a forced change on evidence of compromise; no truncation; at most 100 consecutive failures; synced passkeys allowed at AAL2 with the user-verified flag checked; a notice whenever an authenticator is bound or an account is recovered; saved recovery codes of at least 64 bits, hashed, single use                                                                                                                                                                                                                                                                                               |
| **CNIL**, deliberation 2022-100 (2022-07-21) [11] | Entropy, not rules. 80 bits for a password alone; 50 bits with access restriction (a delay after failures, attempts per period, a CAPTCHA, or a block after 10 failures whose unlock method weighs impersonation and denial-of-service risks); salted or keyed one-way storage citing scrypt and Argon2; a forced change after compromise; no periodic change for ordinary accounts                                                                                                                                                                                                                                                                                                                                                             |
| **Pwned Passwords** [12]                          | `GET https://api.pwnedpasswords.com/range/{first 5 SHA-1 hex}` returns suffixes and counts; no key; "There is no rate limit"; `Add-Padding: true` pads each answer to 800–1,000 rows; no licence or attribution requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Auth.js** [1]–[7]                               | The passkey provider "is experimental and not recommended for production use", needs `experimental.enableWebAuthn`, an `Authenticator` table and `@simplewebauthn` 9.0.x (published 2024-02-16; the current major is 14, 2026-11-06). A JWT cannot be expired early without a server-side list. Better Auth took over Auth.js on 2025-09-22 and promises "security patches and urgent issues"; v5 "is still in beta" (2026-07-21)                                                                                                                                                                                                                                                                                                               |

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10.

- **Two sign-in paths.** `src/lib/auth/config.ts` configures Google and a Credentials provider with `PrismaAdapter`. Since #1321 the Google provider no longer sets `allowDangerousEmailAccountLinking` (lines 17–25), so a Google sign-in for an email that already has a password account returns `OAuthAccountNotLinked`; `src/app/api/auth/[...nextauth]/route.test.ts` asserts it. The message says "Linking Google to an existing account is not available yet" (`src/messages/en/auth.json`).
- **Sessions are self-contained JWTs.** `src/lib/auth/edge-config.ts` (lines 33–37) sets `strategy: "jwt"`, a 7-day `maxAge` and a daily `updateAge`, so an active session rolls forever and no absolute lifetime exists. The `Session` model (`prisma/schema.prisma` line 95) is never written. In installed `@auth/core` 0.41.3, a Credentials sign-in always encodes a JWT cookie, whatever the strategy (`lib/actions/callback/index.js` lines 227–276), so switching to database sessions would break password sign-in.
- **Revocation is partial.** `requireAuth` (`src/lib/auth/helpers.ts` lines 113–157) looks the user up on every request since #1319, so a deleted account gets 401. Sign-out only clears the cookie (`src/components/auth/UserMenu.tsx` line 127); a copied token stays valid up to 7 days. Ten call sites read `auth()` without that lookup: four pages (`commanders/[slug]/decks`, `deck/[id]`, `moderation/reports`, `u/[username]`) and six API routes (community commander decks, comments, ratings, votes, `deck/[id]`, `users/[username]`).
- **Passwords.** Signup (`src/app/api/auth/signup/route.ts`) accepts 8 to 128 characters (line 15) and hashes with `bcryptjs` cost 12 (line 55). bcryptjs 3.0.3 reads at most 72 bytes and "is not implicitly checked" [23], so two passwords sharing their first 72 bytes both work. No common or breached password is refused. The password fields carry no `autocomplete` attribute (`SignInForm.tsx`, `SignUpForm.tsx`).
- **No change, reset or recovery.** No route changes or resets a password; `PATCH /api/user/profile` accepts `name` and `image` only (lines 42–50); the sign-in page has no "forgot password" link. A player who forgets the password, or whose address was squatted before #1321, has no way back.
- **No email.** No mail library is installed. `emailVerified` (schema line 18) is never set by the app, and Auth.js creates Google users with `emailVerified: null` (`handle-login.js` line 260), so every account reads as unverified. `VerificationToken` (line 104) is unused. `docs/security/production-checklist.md` marks "Confirmed email" as failing.
- **Throttling is per instance and abusable.** `src/lib/rate-limit.ts` keeps counters in a `Map` per serverless instance (line 25). Login allows 10 attempts per 15 minutes keyed on the email only (`config.ts` lines 10–11 and 40), successful ones included, and answers a throttled attempt with `null`, which the form shows as "Invalid email or password". Signup allows 5 per 15 minutes per IP. Signup's 409 reveals which addresses have an account (lines 48–53).
- **Sensitive actions need no re-authentication.** `DELETE /api/user/profile` (lines 106–122) and `POST /api/user/api-keys` act on the session alone.
- **No second factor, no passkey.** No `@simplewebauthn` or OTP package is installed. `Permissions-Policy` (`src/lib/security-headers.ts` line 85) does not block WebAuthn, and a server-side breach check needs no CSP change.
- **Google tokens are stored unused.** `PrismaAdapter` saves `access_token`, `refresh_token` and `id_token` in `Account` (schema lines 76–93); no code under `src/` reads them.
- **A prior decision.** `docs/references/better-auth-evaluation.md` (2026-08-22) advised staying on Auth.js and reopening the question "if two-factor or passkeys become a requirement". This spec reopens it and keeps Auth.js (requirement 3.2).

**Open audit findings that bear on accounts.** The 2026-11-10 API audit of `dev` at `65e6230` is not committed, so each finding is restated here; the roadmap tracks them under I-05:

| Finding | What it says                                                                                                                                                                                       | Where I-61 meets it                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **M2**  | Every limit is per-instance memory, and the login limit is keyed on the email only, so one password tried across many emails is never limited; ten failures lock a victim's email on that instance | Group 8 sets the login rules; the shared store stays I-05's, and slice 1 depends on it                |
| **M1**  | `POST /api/ai/suggest` puts unbounded fields into the prompt; free, unverified accounts make the cost attack cheap                                                                                 | `emailVerified` becomes real (group 6); whether AI needs it is [open question 6](#open-questions)     |
| **M3**  | Collection writes have no length limit or row cap, so one account can fill the 500 MB database (the cache part is fixed)                                                                           | Per-IP signup limits on the shared store slow mass account creation; the caps stay I-05's             |
| **L2**  | The middleware skips `/api`, so a route that forgets its guard is public; an inventory test is proposed                                                                                            | Every route added here declares its access class in that inventory (10.5)                             |
| **L5**  | No community write is rate limited                                                                                                                                                                 | Same as M1: throwaway accounts are cheaper while email is unverified; the limits stay I-38's slice 12 |

L6, the unbounded commander discovery query, does not touch accounts and stays with I-08.

**Overlap with I-38 and I-05**, by line in the docs as of 2026-11-10:

| Where                                                    | What it says                                                                                   | Resolution                                                                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [I-38 spec](i38-trust-safety-and-user-rights.md) line 5  | I-38 does not own "the API rate limit (I-05)"                                                  | Login, signup, reset and second-step limits are I-61's rules (group 8); the store is I-05's M2                                                                          |
| I-38 lines 95–96 (6.1, 6.2) and roadmap line 2198        | Deletion after re-authentication; deletion ends the session, with a 7-day email tombstone      | I-61 supplies re-authentication (group 2) and server-side revocation (1.7); I-38 keeps the deletion flow. Once slice 2 ships, this spec proposes dropping the tombstone |
| I-38 line 129 (8.1)                                      | Expired verification tokens are deleted daily                                                  | `AuthToken` follows that row; 10.3 adds rows for sessions and security events                                                                                           |
| I-38 line 161                                            | `User` gains `lastSignInAt`                                                                    | Derived from `UserSession`; I-38 reads it for the inactive-account rule                                                                                                 |
| I-38 lines 201 and 205 (slice 13)                        | The email sender, not to be picked before counsel answers                                      | Slices 11 to 14 depend on it; [open question 2](#open-questions) asks whether security mail may go first                                                                |
| I-38 line 144 (10.1)                                     | Rights and safety controls are free on every plan                                              | Extended to every control here (11.1)                                                                                                                                   |
| [Roadmap](../roadmap.md#i-05-production-safety) line 824 | End the session when an account is deleted                                                     | Closed by slice 2 for every device                                                                                                                                      |
| Roadmap line 826 (H1)                                    | Same-origin `callbackUrl` at sign-in                                                           | Stays with I-39 slice 2; re-authentication limits its damage (2.3)                                                                                                      |
| Roadmap line 827 (H2)                                    | "The 409, email verification and linking Google from settings wait for an email sender (I-38)" | All three move here: 6.3, 6.2 and 10.1                                                                                                                                  |
| Roadmap line 830 (M2)                                    | Shared store and a per-IP login limit                                                          | The store stays in I-05; the per-IP login rule is slice 1 here                                                                                                          |

## Functional requirements

### 1. Sessions a player can see and end

1.1 Every sign-in creates a `UserSession` row. The JWT carries its random 128-bit id (`sid`); the token stays self-contained for the edge middleware, which ASVS 7.4.1 allows with a server-side revocation list [9].
1.2 One resolver checks the row on every server read of the session: `requireAuth` and the ten direct `auth()` call sites. A missing, revoked or expired row means signed out: 401 for an API, the cookie cleared for a page. The middleware stays an optimistic redirect; no private data renders from the JWT alone.
1.3 Timeouts are constants in one module and documented in `docs/security/` (ASVS 7.1.1): 7 days of inactivity, as today, and an absolute 30 days, after which the player signs in again.
1.4 `lastSeenAt` is written at most once an hour per session, as `ApiKey.lastUsedAt` already is.
1.5 **Settings → Security** lists active sessions: a device label parsed from the user agent (browser and system; the raw string is discarded), the country from the host's geolocation header (never the IP address), the sign-in method, first and last seen, and "this device".
1.6 The player can end one session or choose "Sign out everywhere else", after re-authentication (ASVS 7.5.2).
1.7 Sign-out revokes the row, not only the cookie (ASVS 7.4.1). Account deletion revokes every row in the same transaction (ASVS 7.4.2), which fulfils [I-38 6.2](i38-trust-safety-and-user-rights.md#6-account-deletion) on every device.
1.8 After a password change, a passkey removal or a two-step change, the player is offered to end every other session, preselected (ASVS 7.4.3). A password reset always ends every session.
1.9 The owner can end all sessions of one account with a script, for an incident (ASVS 7.4.5).

### 2. Re-authentication before sensitive actions

2.1 These actions need a re-authentication within the last 10 minutes on the current session: changing the password, adding or removing a passkey, turning two-step on or off, creating recovery codes, changing the email, linking or unlinking Google, ending sessions, creating an API key, deleting the account ([I-38 6.1](i38-trust-safety-and-user-rights.md#6-account-deletion)), and later billing changes (I-30).
2.2 Re-authentication uses a passkey, the password (with the second step when it is on), or a fresh Google sign-in for an account without either. It sets `reauthenticatedAt` on the session row.
2.3 This also limits the H1 class of attack: a script injected through a sign-in link cannot delete the account or mint an API key without the factor.

### 3. Passkeys

3.1 A signed-in player adds a passkey from Settings → Security after re-authentication. No account is created by a passkey in v1 ([open question 5](#open-questions)).
3.2 The server uses the current major of `@simplewebauthn/server`, behind its own routes, and starts the Auth.js session through a Credentials provider whose `authorize` verifies the assertion. The experimental Auth.js passkey provider is not used: it is labelled not for production and pins a 2024 major [1][7], and a signed-out registration creates a new account (`lib/utils/webauthn-utils.js` lines 22–29 in installed `@auth/core` 0.41.3).
3.3 The relying party ID is the production domain and the origin is checked. Each challenge is random, single use and expires after 5 minutes.
3.4 Sign-in requires user verification and checks the flag, so a passkey sign-in counts as two factors and skips the second step [10]. Synced passkeys are accepted; the backup flag is recorded, never used to refuse one [10].
3.5 The sign-in page offers "Sign in with a passkey" and browser autofill (`autocomplete="username webauthn"` on the email field).
3.6 The player sees each passkey with an editable name, its creation and last use, and whether it is synced, and can rename or remove it. A non-zero signature counter that goes backwards refuses the sign-in and records a security event.
3.7 Adding or removing a passkey sends a notice (group 9) [10].

### 4. Two-step sign-in and recovery codes

4.1 Optional, for any account. Enrolment, after re-authentication, shows a QR code and the key in text, and turns on only after one valid code.
4.2 Codes follow RFC 6238 [22]: six digits, 30-second steps, one step of drift each way, server time. Each accepted step is stored so a code works once (ASVS 6.5.1, 6.5.5, 6.5.8). The secret comes from a cryptographic generator, is at least 160 bits and is encrypted at rest with a key held outside the database.
4.3 Enrolment issues ten recovery codes of at least 112 bits each, shown once and downloadable as text, so a plain SHA-256 may store them (ASVS 6.5.2). Each works once; creating new codes voids the old ones; Settings shows how many remain.
4.4 When two-step is on, every path that starts a session asks for it: password and Google. Only a user-verified passkey skips it (3.4). Each pending second step expires after 5 minutes and allows five attempts.
4.5 Turning two-step off needs a code or a passkey, then sends a notice.
4.6 No SMS codes: they cost money per message and depend on the phone network.

### 5. Passwords

5.1 A new or changed password has 12 to 128 characters and is verified in full, never truncated (ASVS 6.2.8, 6.2.9). **Computed:** 12 lowercase letters give 12 × log2(26) ≈ 56 bits, above the CNIL's 50 bits with access restriction [11]. Existing shorter passwords keep working; Settings suggests a longer one. [Open question 3](#open-questions) weighs NIST's 15.
5.2 No composition rules, no periodic change. Paste, password managers and a show-password toggle work, and the fields carry `autocomplete="current-password"` or `"new-password"` [8][10].
5.3 **Breached-password check** at signup, change and reset. The server hashes the password with SHA-1, sends only the first five hex characters to the range API with `Add-Padding: true`, and compares the suffixes locally [12]. Neither the email, the password nor the full hash leaves the server. A match is refused with a plain explanation. On a timeout of 2 seconds, a bundled list of at least the 10,000 most common passwords decides instead (ASVS 6.2.4), so signup never depends on the API.
5.4 The same check runs after a successful password sign-in. On a match, the session is limited to the change-password screen until the password changes, as NIST and the CNIL require on evidence of compromise [10][11].
5.5 New hashes use Argon2id with at least OWASP's minimum (19 MiB, 2 iterations, parallelism 1), tuned to the function's measured time [15]. A bcrypt hash is replaced at the next successful sign-in [15]. The column stores a self-describing hash string.
5.6 Changing the password needs the current one (ASVS 6.2.3), or re-authentication by passkey, and offers to end other sessions (1.8).
5.7 No password hints or security questions (ASVS 6.4.2).

### 6. Email verification

6.1 Uses I-38's sender (slice 13). Until it exists, nothing here sends mail.
6.2 Signup sends a verification link: a 256-bit random token, stored hashed, single use, valid 24 hours [10]. An unverified account can still sign in and use the product, as [I-39 requirement 1](i39-first-run-activation-and-measurement.md#1-value-before-sign-up) keeps value before sign-up under the Fan Content Policy it cites.
6.3 Signup answers the same way whether or not the address has an account. When it has one, the email says so and offers sign-in and reset, closing the 409 enumeration [13].
6.4 A Google sign-in records `emailVerified` from Google's `email_verified` claim, at the first sign-in and later ones. This needs no sender and ships in slice 10.
6.5 **Provisional factors.** On an account whose email was never verified, factors are provisional. When someone proves the mailbox by a reset link, the password, sessions, passkeys and two-step added before that proof are removed, and the account is marked verified. This returns a squatted address to its owner. Once verified, a reset never removes a second factor (ASVS 6.4.3).
6.6 Changing the email needs re-authentication and a link sent to the new address. The old address gets a notice with a 7-day link that reverts the change and ends every session (ASVS 6.3.7, 7.5.1).

### 7. Password reset and account recovery

7.1 "Forgot password?" on the sign-in page. The request answers with the same message and similar timing for any address [13][14].
7.2 The link carries a 256-bit token, stored hashed, single use, valid 30 minutes; a new request voids older links. It is built from the configured base URL, never the `Host` header [14].
7.3 Requests are limited per account and per IP, and so are attempts to use a token [14].
7.4 The reset page checks the new password (5.1, 5.3), ends every session and pending link, sends a confirmation, and does not sign the player in [14]. When two-step is on, the next sign-in still asks for it (ASVS 6.4.3).
7.5 **Accounts that only use Google.** Settings warns "You can only sign in with Google" and offers a passkey (slice 8) or a password set through a reset link sent to the account's address (slice 12). Unlinking Google, or removing the last passkey or the password, is refused while it is the last way in.
7.6 Google's Cross-Account Protection can tell the product when a Google account is hijacked or its sessions are revoked; the receiver ends the linked account's sessions for those events [16].
7.7 A player with two-step on who has lost the authenticator, every passkey and the recovery codes cannot remove two-step by email alone (ASVS 6.4.3, 6.4.4), and no person overrides it in v1. A player who has also lost the mailbox cannot be recovered. [Open question 1](#open-questions) decides whether a delayed path exists.

### 8. Throttling that cannot be turned against a victim

8.1 Counters live in I-05's shared store (M2), never in instance memory.
8.2 **Per IP:** password attempts across all addresses (closing M2's spraying gap), signups, reset requests and second-step attempts each have a bucket.
8.3 **Per address:** consecutive password failures are counted on the normalised submitted address, whether or not an account exists, so the throttle reveals nothing [13]. After 5 failures each further attempt waits longer, doubling to a 15-minute cap. At 100 consecutive failures the password is disabled until a reset, the NIST ceiling [10]. A success resets the count.
8.4 **Only the password is throttled.** Passkey sign-in, Google sign-in and password reset stay open while password attempts wait, as OWASP and the CNIL advise for lockouts [11][13].
8.5 **The owner's devices keep their own bucket.** A browser that completed a sign-in to this account in the last 30 days holds a signed device cookie; its failures count separately, so an attacker elsewhere cannot slow the owner. This is this spec's design, not a cited practice.
8.6 A throttled attempt says so and names the wait, the passkey and the reset; it is the same for an unknown address. An unknown address still runs a dummy hash, so timing matches [13].
8.7 No third-party CAPTCHA. Logs record the decision with a hashed address and no password.
8.8 `docs/security/` documents every limit, its key and how it avoids malicious lockout (ASVS 6.1.1).

### 9. Security notices

9.1 Settings → Security shows the last 90 days of events: sign-ins with method, device label and country; failed second steps; factor, email and password changes; sessions ended; recovery codes used.
9.2 An email goes out for a sign-in from a new device (no valid device cookie for this account), a password change or reset, an email change, a passkey added or removed, two-step turned on or off, recovery codes used or renewed, and a disabled password (8.3) [10].
9.3 Each email names the event, the device label, the country and the time, never the IP address, with a "This wasn't me" link that ends every session and starts a reset. Security notices cannot be turned off and carry no tracking or marketing.

### 10. Google linking, storage and scope

10.1 A signed-in player can link Google from Settings after re-authentication; the sign-in page message from #1321 then points there. Unlinking follows 7.5.
10.2 `Account` keeps no Google token the product does not use; existing tokens are cleared by a migration.
10.3 Personal data added here (device labels, countries, security events) gets retention rows in I-38's table: events 90 days, session rows until expiry plus 30 days, tokens deleted daily as [I-38 8.1](i38-trust-safety-and-user-rights.md#8-retention) already plans for verification tokens.
10.4 I-38's privacy policy (1.4) lists the Pwned Passwords API as a recipient of a five-character hash prefix and Google's Cross-Account Protection once slice 15 ships.
10.5 Every route added here appears in the L2 route inventory with its access class.

### 11. Free on every plan

11.1 Everything in this spec is free on every plan, never a paid lever, and never limited by expiry or downgrade, extending [I-38 10.1](i38-trust-safety-and-user-rights.md#10-the-paid-tier-boundary) and I-30 1.2.
11.2 Its value to I-30 is the precondition, not the product: a subscription, trade reputations and gift reservations are only worth selling or keeping on an account that cannot be quietly taken. **Inference:** free deckbuilders skip it because little is at stake on their accounts; Cardmarket, which holds money, urges it on every user [17]. If the owner ever climbs [I-33](i33-marketplace-ladder.md)'s ladder, two-step for sellers is the obvious first rule.

## Data model / API

```
UserSession    id, userId, sid (unique, 128-bit random), method (password|google|passkey), secondFactor (none|totp|recovery|passkey),
               deviceLabel, country?, deviceId?, createdAt, lastSeenAt, reauthenticatedAt?, absoluteExpiresAt, revokedAt?, revokedReason?
Passkey        id, userId, credentialId (unique), publicKey, counter, transports[], backedUp, name, createdAt, lastUsedAt?
TotpFactor     userId (unique), secretCiphertext, keyVersion, confirmedAt?, lastAcceptedStep, createdAt
RecoveryCode   id, userId, codeHash (unique), usedAt?, createdAt
AuthChallenge  id, userId?, kind (passkeyRegister|passkeySignIn|secondStep), challenge, attempts, expiresAt, consumedAt?
AuthToken      id, userId, purpose (verifyEmail|resetPassword|changeEmail|revertEmail), tokenHash (unique), newEmail?, expiresAt, consumedAt?
SecurityEvent  id, userId, type, sessionId?, deviceLabel?, country?, createdAt
DeviceCookie   id, userId, createdAt, lastUsedAt                     -- signed cookie value carries the id
User           + passwordAlgo, passwordUpdatedAt?, passwordDisabledAt?, twoStepEnabledAt?, verifiedBy (link|google)?
```

The unused Auth.js `Session` and `VerificationToken` models stay until a cleanup slice proves nothing writes them. Routes: `GET /api/user/security`; `POST /api/user/reauth`; `DELETE /api/user/sessions/[id]`; `POST /api/user/sessions/revoke-others`; `POST /api/user/passkeys/options`, `POST /api/user/passkeys`, `PATCH|DELETE /api/user/passkeys/[id]`; `POST /api/auth/passkey/options` and the `passkey` Credentials provider; `POST|DELETE /api/user/two-step`, `POST /api/user/two-step/confirm`, `POST /api/user/recovery-codes`; `POST /api/auth/password/check`, which returns a one-time ticket for the `ticket` Credentials provider or asks for the second step; `PUT /api/user/password`; `POST /api/auth/password-reset` and `/confirm`; `POST /api/auth/verify-email`; `POST /api/user/email`; `POST /api/user/google/link`; `POST /api/auth/google-risc`.

## Non-goals

- SMS or voice codes (4.6), security questions (5.7), and a third-party CAPTCHA (8.7).
- Identity documents for recovery, which Cardmarket uses [17] and I-38's data minimisation rules out.
- Moving to Better Auth or a hosted identity provider. Auth.js stays for the session cookie and Google; passkeys and two-step sit beside it (3.2). A later migration is a separate decision.
- Database sessions in Auth.js: they break the Credentials provider (current state), and the edge middleware cannot read the database (`edge-config.ts` imports no Prisma).
- Mandatory two-step for everyone, risk scoring, or storing IP addresses.
- Any paid security feature (11.1).

## Testing strategy

- **Sessions (sociable, PostgreSQL):** sign in on two devices, list both, end one and replay its JWT: 401 and the cookie cleared; "sign out everywhere else" keeps the current one; deletion ends all; the inactivity and absolute limits hold at their boundaries; each of the ten `auth()` call sites ignores a revoked session.
- **Throttling (sociable, shared store):** 11 failures across 11 addresses from one IP are refused (M2's failing test); failures from another IP do not slow a device-cookie bucket; a passkey and a reset still work while the password waits; an unknown address gets the same body and runs the dummy hash; the 100th failure disables the password.
- **Passkeys:** a virtual authenticator in Playwright (Chromium's WebAuthn emulation) registers and signs in; wrong origin, reused challenge, expired challenge, missing user verification and a backwards counter are refused; registration without a recent re-authentication is refused.
- **Two-step (solitary):** RFC 6238's SHA-1 test vectors [22]; a replayed code fails; drift of one step passes, two fails; recovery codes work once and new ones void old ones; a Google sign-in for an account with two-step stops at the second step.
- **Passwords:** a password longer than 72 bytes fails when only its 73rd byte differs (the truncation regression); a bcrypt hash becomes Argon2id after sign-in; the breach client sends exactly five characters and the padding header, and falls back to the local list on timeout; 11 characters are refused, 128 accepted, 129 refused.
- **Reset and verification:** an unknown address gets the same answer; a token works once and expires; a forged `Host` header does not change the link; reset ends all sessions and does not sign in; a never-verified account loses its provisional factors; a verified one keeps two-step.
- **Guard:** the L2 inventory test lists every route added here with its access class.

## Delivery slices

| #   | Slice                                                                                                                                                               | Depends on       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Login throttling of group 8 on the shared store: per-IP bucket, per-address backoff, 100-failure disable, same answers, dummy hash, `docs/security` page            | I-05 M2; 2       |
| 2   | Session registry: `UserSession`, `sid` in the JWT, one resolver for `requireAuth` and the ten `auth()` sites, sign-out and deletion revoke, timeouts, device cookie | —                |
| 3   | Re-authentication by password or Google round trip; applied to API key creation and account deletion                                                                | 2                |
| 4   | Settings → Security: sessions list, end one, sign out everywhere else, in-app event log                                                                             | 2, 3             |
| 5   | Argon2id with upgrade on sign-in, full-length verification, 12–128 rule for new passwords, `autocomplete` and show-password                                         | —                |
| 6   | Change password with the current one, and the offer to end other sessions                                                                                           | 3, 5             |
| 7   | Breached-password check at signup, change and sign-in, with the forced change and the local fallback list                                                           | 5, 6             |
| 8   | Passkeys: register, sign in with autofill, list, rename, remove, last-way-in rule; passkey as a re-authentication                                                   | 3, 4             |
| 9   | Two-step with recovery codes; second step after password and Google sign-in through the ticket provider                                                             | 3, 4             |
| 10  | `emailVerified` from Google's claim; link Google from Settings; clear unused Google tokens                                                                          | 3                |
| 11  | Email verification at signup and the neutral signup answer                                                                                                          | I-38 slice 13    |
| 12  | Password reset with the provisional-factor rule, and "set a password" for Google-only accounts                                                                      | 7, 11            |
| 13  | Security notice emails, including new device and "This wasn't me"                                                                                                   | 4, I-38 slice 13 |
| 14  | Change email with re-authentication, notice and revert link                                                                                                         | 3, 11            |
| 15  | Google Cross-Account Protection receiver                                                                                                                            | 2                |

Slice 5 should go first: it fixes the truncation and needs nothing. Slices 2 to 10 and 15 ship without an email sender and without counsel. Slice 1 waits only for I-05's store, which I-05 already needs for the AI quota. Scheduled agents must not pick slices 11 to 14 before I-38 slice 13 is merged, which itself waits for I-38 slice 0.

## Open questions

1. **Recovery after losing every second factor.** No path (simplest, and some players lose their decks), a person who checks something other than an identity document, or a delayed path through the mailbox: an email link starts a 7-day hold, every signed-in session and the address are warned daily, any sign-in cancels it, and at the end two-step is removed and sessions end. This spec recommends the delayed path once slice 13 ships. The owner decides.
2. **Can security email ship before I-38's legal answers?** Reset, verification and notices are needed to run an account at all, while I-38 holds its sender behind slice 0. Should the owner choose the provider now? For the lawyer list (research, not legal advice): the legal basis for security notices that cannot be turned off, and whether the five-character prefix sent to the Pwned Passwords API is personal data.
3. **12 or 15 characters.** NIST requires 15 for a password used alone and OWASP strongly recommends it [8][10]; 12 meets the CNIL's 50-bit case by computation [11] with less friction. Should passwords of accounts without a passkey or two-step need 15?
4. **Second step after Google.** This spec asks for it, so one setting protects every path (ASVS 6.3.4). Trusting Google's own two-step is smoother but leaves a weaker path open.
5. **Passkey-only sign-up.** Allow it once email verification ships, or keep passkeys as an added factor only?
6. **Gating abuse-prone features on a verified email** (M1, L5): AI use, comments, publishing. It slows throwaway accounts but adds friction before value; decide with I-30 and I-39.
7. **Trusted devices for two-step.** Cardmarket skips the code for 30 days on a trusted device [17]. Offer the same, or always ask?

## Sources

Read 2026-11-10 unless dated otherwise. Legal sources are research, not legal advice.

1. Auth.js, "WebAuthn" guide (experimental notice, `experimental.enableWebAuthn`, `Authenticator` table, `@simplewebauthn/server@9.0.3`), undated. <https://authjs.dev/getting-started/authentication/webauthn>
2. Auth.js, "Session strategies", undated. <https://authjs.dev/concepts/session-strategies>
3. Auth.js, "Credentials" guide ("does not persist data in the database"), undated. <https://authjs.dev/getting-started/authentication/credentials>
4. Better Auth, "Auth.js is now part of Better Auth", 2025-09-22. <https://www.better-auth.com/blog/authjs-joins-better-auth>
5. Better Auth maintainers, "Security update July 2026" (fixed in next-auth 5.0.0-beta.32 and @auth/core 0.41.3), 2026-07-21. <https://better-auth.com/blog/security-update-july-2026>
6. npm registry, `next-auth` dist-tags: `beta` 5.0.0-beta.32 (published 2026-07-20), first v5 beta 2023-10-24, `latest` 4.24.15. <https://registry.npmjs.org/next-auth>
7. npm registry, `@simplewebauthn/server`: 9.0.3 published 2024-02-16; `latest` 14.1.0 published 2026-11-06. <https://registry.npmjs.org/@simplewebauthn/server>
8. OWASP ASVS 5.0.0, V6 Authentication; release published 2025-05-30. <https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x15-V6-Authentication.md>; release: <https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release>
9. OWASP ASVS 5.0.0, V7 Session Management. <https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x16-V7-Session-Management.md>
10. NIST SP 800-63B-4, "Digital Identity Guidelines: Authentication and Authenticator Management", final 2025-07-31 (sections 3.1.1, 3.2.2, 4.2, 5 and Appendix B). <https://csrc.nist.gov/pubs/sp/800/63/b/4/final>; text: <https://pages.nist.gov/800-63-4/sp800-63b.html>
11. CNIL, "Mots de passe : recommandations pour maîtriser sa sécurité", 2022-10-14, on deliberation 2022-100 of 2022-07-21. <https://www.cnil.fr/fr/mot-de-passe>; the deliberation (not opened): <https://www.cnil.fr/sites/cnil/files/atoms/files/deliberation-2022-100-du-21-juillet-2022_recommandation-aux-mots-de-passe.pdf>
12. Have I Been Pwned, API v3, Pwned Passwords section, undated. <https://haveibeenpwned.com/API/v3#PwnedPasswords>
13. OWASP Cheat Sheet Series, Authentication Cheat Sheet, undated. <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>
14. OWASP Cheat Sheet Series, Forgot Password Cheat Sheet, undated. <https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html>
15. OWASP Cheat Sheet Series, Password Storage Cheat Sheet (Argon2id minimum; bcrypt 72-byte limit; re-hash at next login), undated. <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
16. Google for Developers, "Protect user accounts with Cross-Account Protection" (RISC events and receiver duties), undated. <https://developers.google.com/identity/protocols/risc>
17. Cardmarket help, "Two-Factor Authentication", undated (footer © 2026). <https://help.cardmarket.com/en/TwoFactorAuthentication>
18. 2fa.directory (community-maintained `2factorauth/twofactorauth`): Scryfall entry, TOTP, present since 2021-05-26 <https://github.com/2factorauth/twofactorauth/blob/master/entries/s/scryfall.com.json>; Cardmarket entry added 2022-01-03 <https://github.com/2factorauth/twofactorauth/blob/master/entries/c/cardmarket.com.json>; no entry for moxfield.com, archidekt.com or tcgplayer.com (HTTP 404). Scryfall's FAQ answered HTTP 403: <https://scryfall.com/docs/faqs>
19. Moxfield sign-in page, HTTP 403 <https://moxfield.com/account/signin>; Moxfield public wiki, last edited 2020-10-14 <https://github.com/moxfield/moxfield-public/wiki>
20. Archidekt, FAQ. <https://archidekt.com/faq>
21. TCGplayer help, "Your Account Security", HTTP 403; content known only from a search summary. <https://help.tcgplayer.com/hc/en-us/articles/219437007-Your-Account-Security>
22. IETF RFC 6238, "TOTP: Time-Based One-Time Password Algorithm", May 2011 (cited as the standard; not re-read for this spec). <https://www.rfc-editor.org/rfc/rfc6238>
23. bcryptjs 3.0.3 README ("The maximum input length is 72 bytes … not implicitly checked"), read from the installed package. <https://www.npmjs.com/package/bcryptjs/v/3.0.3>
