# I-05: Production Safety

**Status:** Building  
**Priority:** Now  
**Depth:** Full

This file is the feature spec. It had no engineering-slice spec before 2026-11-11. It has no delivery-slice table, so the dependency generator does not pick slices from it until one is added.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

a broken deployment or regression is detected before users depend on it.

### Goals

- A staging PR cannot merge while type safety, tests, E2E policy, SonarCloud or production health checks are silently bypassed.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-05-01

As a player with an account, I want a deleted account to stay deleted and card images to keep loading after Scryfall's JPEG cut-off, so that the product is safe to keep using.

#### US-05-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-05-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-05-01 Happy path

Given a signed-in player and the English locale
When deleting an account expires the session cookie. The next request is signed out.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-05-02 Happy path

Given a signed-in player and the English locale
When no code path builds a retired Scryfall JPEG size. Stored JPEG-era URLs still render through the WebP path.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-05-03 Happy path

Given a signed-in player and the English locale
When a shared cache cannot be overwritten by a signed-in caller.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-05-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-05-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-05-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: On for every account. No flag. Image path must be done before 2027-01-01.

#### AC-05-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-05-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-05-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Failures are HTTP errors with a stable code, not a stack trace. The health route stays public and says nothing about a player.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

Session revocation is the existing auth cookie. Image URLs stay Scryfall's. Rate limits stay in the shared store I-71 and I-30 also use.

### Analytics and telemetry

`account_deleted {session_cleared: yes or no}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

On for every account. No flag. Image path must be done before 2027-01-01.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

Do not ship a change that weakens deletion, the shared rate limit, or the WebP image path.

### Open questions

Who registers the domain, and which function region production uses, stay owner questions on this initiative.

### Sources

- https://scryfall.com/blog/new-webp-images-jpeg-deprecations-237
- https://rdap.verisign.com/com/v1/domain/magicaibuilder.com
- https://vercel.com/docs/functions/configuring-functions/region
- https://supabase.com/pricing
- https://scryfall.com/docs/api/rate-limits
- https://scryfall.com/docs/api/bulk-data

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-05-101

As a player, I want **Due before 2027-01-01:** move card images to Scryfall's WebP keys and migrate the stored image URLs., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Due before 2027-01-01:** move card images to Scryfall's WebP keys and migrate the stored image URLs. Scryfall announced on 2026-10-14 that "After January 1st, 2027, the small, large, border_crop, and art_crop JPEG versions will no longer be available". The normal JPEG is renamed jpeg in the API and stays available; PNG images can no longer be hotlinked; and the User-Agent policy is strictly enforced for scripted image requests. The WebP keys are thumb (146 × 204), grid (488 × 680), display (672 × 936), crop (480 × 680) and art (blog).

#### AC-05-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-102

As a player, I want the product to add UptimeRobot or an equivalent monitor for /api/health., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add UptimeRobot or an equivalent monitor for /api/health.

#### AC-05-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-105 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-103

As a player, I want the product to run Playwright E2E in Docker as the authoritative integration environment., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Run Playwright E2E in Docker as the authoritative integration environment.

#### AC-05-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-104

As a player, I want the product to give scheduled agent runs and manual pushes enough room on the VPS., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Give scheduled agent runs and manual pushes enough room on the VPS. They share one machine with about 7.6 GiB of RAM and 4 vCPUs. On 2026-11-09 they collided twice on the pre-push gate, and background tasks were killed for memory pressure. Decide between scheduling agents outside working sessions, capping concurrent builds and E2E runs, or a larger machine.

#### AC-05-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-111 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-05-105

As a player, I want **Owner action: the code names a domain nobody has registered.** magicaibuilder.com is hard-coded in src/components/JsonLd.tsx:34, the site URL in the structured data; in src/lib/http.ts:8, the contact URL in the User-Agent sent to Scryfall, Commander Spellbook and every other source; and in src/lib/seo/alternates.ts:24, the fallback for canonicals, hreflang, robots.txt and the sitemap when NEXT_PUBLIC_BASE_URL is unset (checked on origin/dev at 72fbfc1)., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner action: the code names a domain nobody has registered.** magicaibuilder.com is hard-coded in src/components/JsonLd.tsx:34, the site URL in the structured data; in src/lib/http.ts:8, the contact URL in the User-Agent sent to Scryfall, Commander Spellbook and every other source; and in src/lib/seo/alternates.ts:24, the fallback for canonicals, hreflang, robots.txt and the sitemap when NEXT_PUBLIC_BASE_URL is unset (checked on origin/dev at 72fbfc1). Verisign's RDAP lookup answered 404 for the domain on 2026-11-10 (lookup), so anyone may register it and receive the contact traffic and the canonical signals. The repository's homepage is magic-ai-builder.vercel.app. Done means: the owner registers the domain, or all three read the production domain from one setting and a production build fails when it is unset (I-66 requirement 5.4).

#### AC-05-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-114 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-05-106

As a player, I want **Owner question: where do the functions run?** No vercel.json exists on origin/dev, so the function region is whatever the Vercel dashboard holds, and new projects run functions in Washington, D.C., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner question: where do the functions run?** No vercel.json exists on origin/dev, so the function region is whatever the Vercel dashboard holds, and new projects run functions in Washington, D.C. (iad1) unless a region is set (Vercel, read 2026-11-10). docs/engineering/infrastructure.md puts the database behind aws-0-eu-west-1.pooler.supabase.com, in Ireland, so each query may cross the Atlantic. The owner records the region in use; I-66 slice 6 compares durationMs by route before moving functions to Dublin (dub1), where CPU and memory cost about 31% more.

#### AC-05-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-117 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-05-107

As a player, I want the product to meter AI usage per user and enforce a monthly quota before any public launch or paid tier., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-118 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Meter AI usage per user and enforce a monthly quota before any public launch or paid tier. Today the only AI limits are per minute (5 builds and 10 suggestions per user per 60 seconds) in an in-memory store that is per instance, and no token metering exists. The theoretical worst case for one account is three orders of magnitude above a few-euro plan (I-02). I-30 slices 1 and 2 specify the metering and the quota.

#### AC-05-119 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-120 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-05-108

As a player, I want the product to rate-limit the public read route GET /api/deck/[id]., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-121 Happy path

Given a signed-out visitor and a public deck
When the player uses this behaviour
Then the behaviour holds: Rate-limit the public read route GET /api/deck/[id]. It serves any public deck to any caller with no key and no limit, and the middleware matcher skips /api (src/middleware.ts). #1312 limited the fields it returns (I-08); this item stays open until a limit is verified.

#### AC-05-122 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-123 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-109

As a player, I want the product to keep docs/project/changelog.md and docs/project/progress.md current after each merge batch, as the project instructions require., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-124 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep docs/project/changelog.md and docs/project/progress.md current after each merge batch, as the project instructions require. Neither changed between 2026-10-28 and 2026-11-09 while 196 commits reached dev; a catch-up is in preparation.

#### AC-05-125 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-126 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-110

As a player, I want the product to end the session when an account is deleted., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-127 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: End the session when an account is deleted. DELETE /api/user/profile (src/app/api/user/profile/route.ts) deletes the user but does not sign out, sessions are JWTs valid for 7 days (src/lib/auth/edge-config.ts), and until #1319, on the next authenticated request, resolveAuthenticatedUser (src/lib/auth/helpers.ts) missed the id and re-created the user from the token's email, name and image, so a deleted account came back, empty, from any device still signed in. I-38 slice 2 owns the tombstone and the regression test.

#### AC-05-128 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-129 Edge

Given the account or the cache this behaviour changes
When the player signs out or the deletion finishes
Then the next request does not still show the private data

#### US-05-111

As a player, I want **H1, high:** accept only a same-origin callbackUrl at sign-in., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-130 Happy path

Given a guest with one unsaved session deck
When the player uses this behaviour
Then **H1, high:** accept only a same-origin callbackUrl at sign-in. After a password sign-in, src/components/auth/SignInForm.tsx navigates to the raw query parameter, and the CSP allows inline script (src/lib/security-headers.ts). So ?callbackUrl=javascript:… runs in the app's origin, and an https:// value redirects off-site. The form also shows any ?error= text verbatim. Fix branch in flight: the guest-deck branch fix/guest-deck-survives-sign-up (I-39 slice 2), no PR yet.

#### AC-05-131 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-132 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-112

As a player, I want **H2, high:** stop linking a Google sign-in to an unverified account., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-133 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **H2, high:** stop linking a Google sign-in to an unverified account. src/lib/auth/config.ts set allowDangerousEmailAccountLinking: true, and src/app/api/auth/signup/route.ts creates a password account for any email without verifying it. An attacker who signed up with a victim's address took over the account when the victim first used Google. Signup's 409 also reveals which emails have an account. Shipped in #1321: the Google provider no longer sets the flag, so such a sign-in returns OAuthAccountNotLinked with a message to use the email and password. Google-first and already linked accounts are unchanged. The 409, email verification and linking Google from settings wait for an email sender (I-38).

#### AC-05-134 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-135 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-113

As a player, I want **H3, high:** write the shared Scryfall caches on the server only., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-136 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **H3, high:** write the shared Scryfall caches on the server only. POST /api/cache/search and POST /api/cache/cards (src/app/api/cache/*/route.ts) stored any JSON a signed-in user sent, and src/lib/scryfall/client.ts returned it unchecked. One account could therefore forge the banlist and the Game Changer list that every player loads (src/hooks/useBanlist.ts, src/hooks/useGameChangers.ts). Shipped in #1322: both routes answer GET only, fill a miss from Scryfall on the server, check the body's shape and store under srv1: keys, so rows that clients wrote are never read again. Fills are limited per IP, per instance (M2).

#### AC-05-137 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-138 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-114

As a player, I want **M1, medium:** validate POST /api/ai/suggest with a bounded schema., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-139 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **M1, medium:** validate POST /api/ai/suggest with a bounded schema. src/app/api/ai/suggest/route.ts puts bracketWarnings, detectedThemes, gameChangersList and categories into the prompt with no size limit and no sanitising, so one free account can send very large prompts on the paid provider key. /api/ai/build already uses a bounded schema.

#### AC-05-140 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-141 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-05-115

As a player, I want **M2, medium:** keep rate limits in a shared store and add a per-IP login limit., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-142 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **M2, medium:** keep rate limits in a shared store and add a per-IP login limit. src/lib/rate-limit.ts holds counters in each serverless instance's memory, and the login limit in src/lib/auth/config.ts is keyed on the email only, so trying one password across many emails is never limited. The AI quota above, the GET /api/deck/[id] limit and I-38's comment limits all need this store.

#### AC-05-143 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-144 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-116

As a player, I want **M3, medium:** bound user writes., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-145 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **M3, medium:** bound user writes. The collection schemas (src/app/api/collection/route.ts, src/app/api/collection/[id]/route.ts) have no length limit and no row cap, and the search cache takes 500 KB per entry under unlimited keys. One account can fill the 500 MB database, and every write then fails. Cap field sizes and rows per user.

#### AC-05-146 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-147 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-117

As a player, I want **L2, low:** test that every API route declares its access., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-148 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **L2, low:** test that every API route declares its access. The middleware matcher skips /api (src/middleware.ts), so the API allowlist in src/lib/auth/edge-config.ts is never read, and a new route that forgets its guard is silently public. Add an inventory test that fails when a handler neither calls a guard nor appears in an explicit public list.

#### AC-05-149 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-150 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-118

As a player, I want the product to delete the components that are never rendered: TemplatesModal, BudgetOptimizationModal, PricingShoppingListModal, SharePopover, DeckDescriptionEditor and DeckTagsEditor in src/components/deck/, and CardNoteInline in src/components/card/., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-151 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Delete the components that are never rendered: TemplatesModal, BudgetOptimizationModal, PricingShoppingListModal, SharePopover, DeckDescriptionEditor and DeckTagsEditor in src/components/deck/, and CardNoteInline in src/components/card/. Outside their own files, nothing imports them on dev at 576f680. TemplatesModal is the only caller of GET /api/templates, which returns two hard-coded fake templates (I-39 slice 3), so both can go together. The hook src/hooks/useTypewriter.ts has no consumer either. I-08's primer-length item cites DeckDescriptionEditor; re-check it against the editor that is rendered.

#### AC-05-152 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-153 Edge

Given a list where one name does not resolve
When the player confirms
Then the unresolved name is shown first and nothing is written until they accept that list

#### US-05-119

As a player, I want the product to keep the gate order explicit: typecheck, lint, unit tests, E2E policy, SonarCloud., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-154 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Keep the gate order explicit: typecheck, lint, unit tests, E2E policy, SonarCloud.

#### AC-05-155 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-156 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-120

As a player, I want the product to require SonarCloud open issues to be zero before PR creation or merge., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-157 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Require SonarCloud open issues to be zero before PR creation or merge.

#### AC-05-158 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-159 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-121

As a player, I want the product to record the E2E Docker strategy and required environment variables., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-160 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Record the E2E Docker strategy and required environment variables.

#### AC-05-161 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-162 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-122

As a player, I want the product to upgrade Prisma only after the local Node toolchain is at least 22.12., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-163 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Upgrade Prisma only after the local Node toolchain is at least 22.12.

#### AC-05-164 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-165 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-123

As a player, I want the product to confirm Scryfall's current per-endpoint request limits and bulk-data format against Scryfall's own documentation, then align the client limiter., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-166 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Confirm Scryfall's current per-endpoint request limits and bulk-data format against Scryfall's own documentation, then align the client limiter. src/lib/scryfall/client.ts sends User-Agent and Accept and serialises calls behind a 100 ms mutex, which honours a 10 req/s sustained ceiling but not a stricter per-endpoint search limit; bulk files are reported to have moved to gzipped JSONL on 2026-07-20. Scryfall blocks automated fetching, so a human must read the policy before the limiter changes.

#### AC-05-167 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-168 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-05-124

As a player, I want the product to add request latency and failure visibility for profile, deck and Scryfall paths before adopting heavier observability., so that a broken deployment or regression is detected before users depend on it.

#### AC-05-169 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Add request latency and failure visibility for profile, deck and Scryfall paths before adopting heavier observability.

#### AC-05-170 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-05-171 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: a broken deployment or regression is detected before users depend on it.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-05: Production Safety

**Outcome:** a broken deployment or regression is detected before users depend on it.

**Status:** Building
**Priority:** Now

### Already shipped

- Vercel deployment, Sentry, health endpoint and structured logging.
- CI quality gates, Dependabot, Lighthouse CI and SonarCloud workflow.
- Unit test suite with broad coverage.
- Staging-first branch policy.

### Remaining scope

Items tagged H1 to L6 come from the read-only API security audit of `dev` at `65e6230` on 2026-11-10, with the audit's severity. The route posture table and the findings that sit in other initiatives are in [`api-route-inventory.md`](../engineering/api-route-inventory.md).

Speed budgets, the availability objective, alert routing, the off-site database export, restore drills, the incident runbook and degraded modes are [I-71](i71-speed-uptime-and-recovery.md)'s (2026-11-10). This initiative keeps `/api/health`, the shared rate-limit store and the items below.

- [ ] **Due before 2027-01-01:** move card images to Scryfall's WebP keys and migrate the stored image URLs. Scryfall announced on 2026-10-14 that "After January 1st, 2027, the small, large, border_crop, and art_crop JPEG versions will no longer be available". The `normal` JPEG is renamed `jpeg` in the API and stays available; PNG images can no longer be hotlinked; and the User-Agent policy is strictly enforced for scripted image requests. The WebP keys are `thumb` (146 × 204), `grid` (488 × 680), `display` (672 × 936), `crop` (480 × 680) and `art` ([blog](https://scryfall.com/blog/new-webp-images-jpeg-deprecations-237)).
  - Verified on `origin/dev` at `72fbfc1`: `DeckCard.artCropUri` (`prisma/schema.prisma`) stores `cards.scryfall.io/art_crop/…jpg` URLs, written from `store-card-faces.ts`, `store.ts`, `CardGrid.tsx` and `DeckWizard.tsx`, so saved decks hold URLs that stop working. `buildScryfallImageUrl` (`src/lib/scryfall/images.ts`) builds `/<size>/<face>/…/<id>.jpg` for every size, and `ImageSize` and `ScryfallImageUris` (`src/lib/scryfall/types.ts`) know none of the WebP keys. `image_uris.normal` is read in `CardGrid.tsx`, `QuickAddCollectionButton.tsx`, `src/lib/community/verified-package-cards.ts`, `src/lib/deck/store-card-faces.ts` and `GameChangersPageClient.tsx`, which also reads `small` and `large`; `DeckWizard.tsx` reads `art_crop`; `CardGrid.tsx` and `PrintingSelectorModal.tsx` ask for `large`. `getCardImageUri` falls back to `normal` and then to an empty string, so a card whose keys are gone gets no image. `/api/proxy-card-image` already sends its own User-Agent (`MagicAIBuilder/1.0 (image proxy for print export)`).
  - Done means: every reader uses the WebP keys with the `jpeg` key as fallback; stored `art_crop`, `small` and `large` URLs are rewritten by a migration or derived from `scryfallId` at read time; `next.config.ts`'s `remotePatterns` cover the WebP URLs; a test fails when code builds a retired size; and all of it ships before 2027-01-01. `image_updated_at` and `/cards/manifest` can drive later re-syncs.
  - [I-67](i67-one-card-data-pipeline.md) slice 12 then stores an image version per printing and derives the WebP URL from the printing ID (2026-11-10). This item does not wait for it: the deadline holds whatever I-67's progress.
  - [x] Request the WebP keys everywhere, map a JPEG-only list to its WebP analog, and show stored JPEG-era URLs, `artCropUri` included, through `normalizeScryfallImageUrl` at read time, so no data migration is needed (#1329, 2026-11-10). Still to check before the item is ticked: `remotePatterns`, and a test that fails when code builds a retired size.
- [ ] Add UptimeRobot or an equivalent monitor for /api/health.
  - `/api/health` is documented for uptime monitors and `docs/engineering/dx-ci-overview.md` lists UptimeRobot, but no configured monitor is recorded. `docs/engineering/infrastructure.md` still points to an "Observability ? Level 1" roadmap section that no longer exists.
  - [I-52](i52-feedback-loop-players-can-see.md) slices 0 to 2 close this item: the owner chooses Upptime, UptimeRobot or both, slice 1 sets up the monitor with a status page hosted off the production stack, and slice 2 feeds a cached `GET /api/status` to a footer line, so no browser calls `/api/health`.
- [ ] Run Playwright E2E in Docker as the authoritative integration environment.
  - The `.husky/pre-push` gate (`scripts/e2e-pre-push.sh`) runs the full suite in Docker and takes its verdict from the container exit code. No GitHub workflow runs Playwright yet, although the script and `docs/engineering/quality-gate.md` say CI has its own E2E job.
  - [x] Queue concurrent pre-push gates behind a machine-wide lock, and clear root-owned reports left by a killed run through a container (#1302). Every clone and worktree on the machine shares one `magicaibuilder-e2e` compose project, so two pushes at once replaced each other's containers and both were blocked with no failing test. The script tests run the real script against a fake `docker`. A CI E2E job remains open.
  - [x] Stop the onboarding dialog blocking the i18n navigation test, and make that test fail when its link is missing instead of skipping its only assertion (`e2e/i18n-routing.spec.ts`, #1316). A CI E2E job remains open.
  - [x] Pin the Playwright image to the installed 1.65.0 (#1339, 2026-11-10).
  - **Owner decision, 2026-11-10: approved.** A Docker E2E job in CI, contract tests against a real PostgreSQL, and nightly mutation testing ([decided](../owner-decisions.md#decided-on-2026-11-10)). Each lands as its own PR.
- [ ] Give scheduled agent runs and manual pushes enough room on the VPS. They share one machine with about 7.6 GiB of RAM and 4 vCPUs. On 2026-11-09 they collided twice on the pre-push gate, and background tasks were killed for memory pressure. Decide between scheduling agents outside working sessions, capping concurrent builds and E2E runs, or a larger machine.
  - Run budgets, the precheck's count of open automation PRs, the overlap check and the cleanup rules are [I-74](i74-a-roadmap-agents-can-execute.md)'s (requirements 3 and 4), and [D-22](../owner-decisions.md#infrastructure-and-providers) gains the option of running the agents as cloud scheduled tasks or GitHub Actions (2026-11-10).
- [ ] **Owner action: the code names a domain nobody has registered.** `magicaibuilder.com` is hard-coded in `src/components/JsonLd.tsx:34`, the site URL in the structured data; in `src/lib/http.ts:8`, the contact URL in the `User-Agent` sent to Scryfall, Commander Spellbook and every other source; and in `src/lib/seo/alternates.ts:24`, the fallback for canonicals, hreflang, `robots.txt` and the sitemap when `NEXT_PUBLIC_BASE_URL` is unset (checked on `origin/dev` at `72fbfc1`). Verisign's RDAP lookup answered 404 for the domain on 2026-11-10 ([lookup](https://rdap.verisign.com/com/v1/domain/magicaibuilder.com)), so anyone may register it and receive the contact traffic and the canonical signals. The repository's homepage is `magic-ai-builder.vercel.app`. Done means: the owner registers the domain, or all three read the production domain from one setting and a production build fails when it is unset ([I-66](i66-running-costs-and-margin.md) requirement 5.4).
  - Second in the owner register's "Decide this week" table, as [D-02](../owner-decisions.md#d-02-the-domain) (2026-11-10). The parked "Custom domain and DNS" line now points here.
- [ ] **Owner question: where do the functions run?** No `vercel.json` exists on `origin/dev`, so the function region is whatever the Vercel dashboard holds, and new projects run functions in Washington, D.C. (`iad1`) unless a region is set ([Vercel](https://vercel.com/docs/functions/configuring-functions/region), read 2026-11-10). `docs/engineering/infrastructure.md` puts the database behind `aws-0-eu-west-1.pooler.supabase.com`, in Ireland, so each query may cross the Atlantic. The owner records the region in use; [I-66](i66-running-costs-and-margin.md) slice 6 compares `durationMs` by route before moving functions to Dublin (`dub1`), where CPU and memory cost about 31% more.
- [ ] Meter AI usage per user and enforce a monthly quota before any public launch or paid tier. Today the only AI limits are per minute (5 builds and 10 suggestions per user per 60 seconds) in an in-memory store that is per instance, and no token metering exists. The theoretical worst case for one account is three orders of magnitude above a few-euro plan (I-02). [I-30](i30-business-model-and-paid-tier.md) slices 1 and 2 specify the metering and the quota.
  - **Owner decision, 2026-11-10:** merge the metering branch `feat/ai-usage-metering-and-monthly-quota` once its CI is green ([decided](../owner-decisions.md#decided-on-2026-11-10)). The allowance numbers and whether a deck the card-data check rejects gives back its unit stay [D-01](../owner-decisions.md#d-01-ai-allowance-numbers).
- [ ] Rate-limit the public read route `GET /api/deck/[id]`. It serves any public deck to any caller with no key and no limit, and the middleware matcher skips `/api` (`src/middleware.ts`). #1312 limited the fields it returns (I-08); this item stays open until a limit is verified.
- [ ] Keep `docs/project/changelog.md` and `docs/project/progress.md` current after each merge batch, as the project instructions require. Neither changed between 2026-10-28 and 2026-11-09 while 196 commits reached `dev`; a catch-up is in preparation.
  - [x] Record merges #1111 to #1302 and recount the progress metrics (#1306). Later batches are recorded by their own `chore/docs` PRs.
- [ ] End the session when an account is deleted. `DELETE /api/user/profile` (`src/app/api/user/profile/route.ts`) deletes the user but does not sign out, sessions are JWTs valid for 7 days (`src/lib/auth/edge-config.ts`), and until #1319, on the next authenticated request, `resolveAuthenticatedUser` (`src/lib/auth/helpers.ts`) missed the id and re-created the user from the token's email, name and image, so a deleted account came back, empty, from any device still signed in. [I-38](i38-trust-safety-and-user-rights.md) slice 2 owns the tombstone and the regression test.
  - [x] Stop re-creating a deleted account. `requireAuth` now looks up only the user row the token names and answers 401 when it is gone; only the Playwright test bypass still upserts by email (#1319). The delete route still leaves the session cookie, so protected pages keep their signed-in chrome until sign-out.
  - [I-61](i61-account-security.md) slice 2 closes this item on every device: deletion revokes every server-side session row in the same transaction.
- [ ] **H1, high:** accept only a same-origin `callbackUrl` at sign-in. After a password sign-in, `src/components/auth/SignInForm.tsx` navigates to the raw query parameter, and the CSP allows inline script (`src/lib/security-headers.ts`). So `?callbackUrl=javascript:…` runs in the app's origin, and an `https://` value redirects off-site. The form also shows any `?error=` text verbatim. Fix branch in flight: the guest-deck branch `fix/guest-deck-survives-sign-up` ([I-39](i39-first-run-activation-and-measurement.md) slice 2), no PR yet.
  - [x] Sanitise `callbackUrl` on sign-in and sign-up, with the guest-deck branch (#1333, 2026-11-10). Whether it also closes the verbatim `?error=` text was not re-checked.
- [x] **H2, high:** stop linking a Google sign-in to an unverified account. `src/lib/auth/config.ts` set `allowDangerousEmailAccountLinking: true`, and `src/app/api/auth/signup/route.ts` creates a password account for any email without verifying it. An attacker who signed up with a victim's address took over the account when the victim first used Google. Signup's 409 also reveals which emails have an account. Shipped in #1321: the Google provider no longer sets the flag, so such a sign-in returns `OAuthAccountNotLinked` with a message to use the email and password. Google-first and already linked accounts are unchanged. The 409, email verification and linking Google from settings wait for an email sender (I-38).
  - These three move to [I-61](i61-account-security.md): linking Google from settings needs no sender (slice 10), and email verification with a neutral signup answer that ends the 409 waits for the email sender (slice 11), which moved from I-38 to [I-63](i63-one-notification-system.md) slice 7.
- [x] **H3, high:** write the shared Scryfall caches on the server only. `POST /api/cache/search` and `POST /api/cache/cards` (`src/app/api/cache/*/route.ts`) stored any JSON a signed-in user sent, and `src/lib/scryfall/client.ts` returned it unchecked. One account could therefore forge the banlist and the Game Changer list that every player loads (`src/hooks/useBanlist.ts`, `src/hooks/useGameChangers.ts`). Shipped in #1322: both routes answer `GET` only, fill a miss from Scryfall on the server, check the body's shape and store under `srv1:` keys, so rows that clients wrote are never read again. Fills are limited per IP, per instance (M2).
- [ ] **M1, medium:** validate `POST /api/ai/suggest` with a bounded schema. `src/app/api/ai/suggest/route.ts` puts `bracketWarnings`, `detectedThemes`, `gameChangersList` and `categories` into the prompt with no size limit and no sanitising, so one free account can send very large prompts on the paid provider key. `/api/ai/build` already uses a bounded schema.
  - The I-70 spec found the opposite problem in the fields that are sanitised. `sanitizeForPrompt` (`src/lib/validation/ai.ts`) strips ASCII apostrophes and quotes, so card names sent to `/api/ai/suggest` (`route.ts` line 592) and the build route's commander reach the model as "Atraxa, Praetors Voice" and "Yuriko, the Tigers Shadow", and a French brief loses its elisions; it does not stop an instruction written in plain words (verified on `origin/dev` at `72fbfc1`). Injection defence should come from structure, the player's text in its own JSON-encoded block, not from deleting characters that belong to card names. [I-70](i70-ai-quality-bench-and-model-changes.md) slice 6's injection cases measure the change, and its slice 4 scores whether the requested commander comes back by name (2026-11-10).
  - [ ] Keep apostrophes and quotes in card names sent to the model, and match the model's removals to deck cards by normalised name (fix branch `fix/ai-prompt-keeps-card-names` queued, 2026-11-11). [I-70](i70-ai-quality-bench-and-model-changes.md)'s bench holds the case.
- [ ] **M2, medium:** keep rate limits in a shared store and add a per-IP login limit. `src/lib/rate-limit.ts` holds counters in each serverless instance's memory, and the login limit in `src/lib/auth/config.ts` is keyed on the email only, so trying one password across many emails is never limited. The AI quota above, the `GET /api/deck/[id]` limit and I-38's comment limits all need this store.
  - The login rules move to [I-61](i61-account-security.md) slice 1, which waits for this store: a per-IP bucket across all addresses, a per-address backoff, a separate bucket for the owner's devices, and passkey, Google and reset sign-in left open while password attempts wait. Ten failures on one address lock its owner out of that instance today, because the limit counts successes and failures alike and is keyed on the email only. The store itself stays here.
  - One owner, decided 2026-11-10: I-36 slice 11's public API, I-46 slice 7's Discord commands and I-53 slice 11's ballots use this store and build no limiter of their own.
- [ ] **M3, medium:** bound user writes. The collection schemas (`src/app/api/collection/route.ts`, `src/app/api/collection/[id]/route.ts`) have no length limit and no row cap, and the search cache takes 500 KB per entry under unlimited keys. One account can fill the 500 MB database, and every write then fails. Cap field sizes and rows per user.
  - **Corrected 2026-11-10:** Supabase's free tier holds 500 MB, not 512 MB ([pricing](https://supabase.com/pricing), read 2026-11-10; the [I-66](i66-running-costs-and-margin.md) spec found it). The comment in `src/lib/cache-limits.ts` still says 512 MB and changes with the code.
  - [x] Cap the shared Scryfall caches: 500 KB per search page, 50 KB per card, 200 unexpired search rows and 2,000 card rows, with expired and client-written rows deleted before each write (`src/lib/cache-limits.ts`, #1322). The collection limits remain open.
  - The I-59 spec found that the server also trusts card prices: the browser sends each deck row's price, `addCardSchema` (`src/lib/validation/card.ts`) accepts any value from 0 to 100,000, and nothing refreshes it. The item is recorded under [I-59](i59-prices-over-time-and-alerts.md).
- [ ] **L2, low:** test that every API route declares its access. The middleware matcher skips `/api` (`src/middleware.ts`), so the API allowlist in `src/lib/auth/edge-config.ts` is never read, and a new route that forgets its guard is silently public. Add an inventory test that fails when a handler neither calls a guard nor appears in an explicit public list.
- [ ] Delete the components that are never rendered: `TemplatesModal`, `BudgetOptimizationModal`, `PricingShoppingListModal`, `SharePopover`, `DeckDescriptionEditor` and `DeckTagsEditor` in `src/components/deck/`, and `CardNoteInline` in `src/components/card/`. Outside their own files, nothing imports them on `dev` at `576f680`. `TemplatesModal` is the only caller of `GET /api/templates`, which returns two hard-coded fake templates ([I-39](i39-first-run-activation-and-measurement.md) slice 3), so both can go together. The hook `src/hooks/useTypewriter.ts` has no consumer either. I-08's primer-length item cites `DeckDescriptionEditor`; re-check it against the editor that is rendered.
  - The I-53 spec found another orphan: `src/lib/challenges/challenges.ts`, added in #246 on 2026-03-30, imported by nothing and backed by no schema; deleted on 2026-11-12 (P1-32).
  - The I-56 spec found the favorites stubs: `src/lib/favorites/favorites.ts` is imported only by its test, `src/components/card/FavoriteButton.tsx` is rendered nowhere outside its own test, and the `CardFavorite`, `FavoriteList` and `CardInFavoriteList` models are never written. [I-56](i56-wishlists-friends-can-buy-from.md) slice 0 retires them with the two favorites routes.
  - The fifth pass found three more modules imported only by their tests, each re-checked on `origin/dev` at `72fbfc1`: `src/lib/shortcuts/shortcuts.ts` and `src/lib/deck/analytics.ts`, both deleted on 2026-11-12 (P1-32) ahead of [I-37](i37-editor-depth.md)'s shortcut registry and [I-60](i60-player-stats-and-year-in-review.md) slice 1; and `suggestBudgetReductions` (`src/lib/deck/pricing.ts`), the heuristic `BudgetOptimizationModal` displays, which [I-58](i58-mana-base-builder.md) deletes with the modal.
- [ ] Keep the gate order explicit: typecheck, lint, unit tests, E2E policy, SonarCloud.
- [ ] Require SonarCloud open issues to be zero before PR creation or merge.
  - The checklist in `docs/engineering/quality-gate.md` requires zero open issues; nothing enforces it automatically yet.
- [ ] Record the E2E Docker strategy and required environment variables.
  - The strategy is documented in the "E2E gate" section of `docs/engineering/quality-gate.md`. The environment variables set in `docker-compose.e2e.yml` (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, plus the Postgres service settings) are not yet listed there.
- [ ] Upgrade Prisma only after the local Node toolchain is at least 22.12.
- [ ] Confirm Scryfall's current per-endpoint request limits and bulk-data format against Scryfall's own documentation, then align the client limiter. `src/lib/scryfall/client.ts` sends `User-Agent` and `Accept` and serialises calls behind a 100 ms mutex, which honours a 10 req/s sustained ceiling but not a stricter per-endpoint search limit; bulk files are reported to have moved to gzipped JSONL on 2026-07-20. Scryfall blocks automated fetching, so a human must read the policy before the limiter changes.
  - **Corrected 2026-11-10:** Scryfall's documentation answers a client that names itself, which its policy requires anyway; only generic fetchers are refused. Read that day with a unique User-Agent: `/cards/search`, `/cards/named`, `/cards/random` and `/cards/collection` allow 2 requests a second, `/cards/manifest` 10 a minute and every other method 10 a second, a 429 limits the client for 30 seconds, and prices are updated "once per day" ([rate limits](https://scryfall.com/docs/api/rate-limits)). Bulk files are "daily exports", collected "once every 12-24 hours" ([bulk data](https://scryfall.com/docs/api/bulk-data)). The limiter still has to be aligned.
- [x] Add request latency and failure visibility for profile, deck and Scryfall paths before adopting heavier observability.
  - `GET /api/decks` status and duration shipped in #1034. Profile and Scryfall paths remain open; do not close this item yet.
  - Profile mutation latency on `/api/user/profile` is recorded (#1132). Profile reads and other Scryfall paths remain open.
  - External card search and server-side search-cache outcomes shipped in #1036. Browser search diagnostics are not centralized; profile and other Scryfall paths remain open.

### Blocked or conditional work

- **Prisma 7:** blocked locally by Node 22.11; revisit at Node 22.12+.
- **Cloudflare R2:** only when avatars, deck media or generated artifacts need durable object storage. [I-71](i71-speed-uptime-and-recovery.md) slice 2's encrypted off-site export is a candidate use if the owner picks R2 in its slice 0 (2026-11-10).
- **Advanced observability:** Datadog, Better Uptime, Grafana, OpenTelemetry and PagerDuty stay parked until usage justifies their operational cost.
- **Analytics:** choose one privacy-conscious product analytics tool only after defining the product questions it must answer. [I-39](i39-first-run-activation-and-measurement.md) writes those questions, measures them first-party, and lists the cookieless candidates for page analytics.

### Enrichment (2026-11-11)

**User story.** As a player with an account, I want a deleted account to stay deleted and card images to keep loading after Scryfall's JPEG cut-off, so that the product is safe to keep using.

**Acceptance.**
- Deleting an account expires the session cookie. The next request is signed out.
- No code path builds a retired Scryfall JPEG size. Stored JPEG-era URLs still render through the WebP path.
- A shared cache cannot be overwritten by a signed-in caller.

**UX.** Failures are HTTP errors with a stable code, not a stack trace. The health route stays public and says nothing about a player.

**Data and API.** Session revocation is the existing auth cookie. Image URLs stay Scryfall's. Rate limits stay in the shared store I-71 and I-30 also use.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `account_deleted {session_cleared: yes or no}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** On for every account. No flag. Image path must be done before 2027-01-01.

**Open questions.** Who registers the domain, and which function region production uses, stay owner questions on this initiative.

**Kill criteria.** Do not ship a change that weakens deletion, the shared rate limit, or the WebP image path.

### Definition of done

A staging PR cannot merge while type safety, tests, E2E policy, SonarCloud or production health checks are silently bypassed.

---

