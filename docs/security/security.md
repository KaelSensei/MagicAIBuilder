# Security Notes

## Input Sanitization

- Deck names: HTML-stripped + trimmed + max 200 chars (enforced in API routes)
- Deck import: card names HTML-stripped, quantity clamped 1–99, max 500 lines

## External API Calls

- **Scryfall JSON API**: Called directly from the browser for search/collection where applicable
- **Scryfall card images**: Proxied via `GET /api/proxy-card-image?url=…` for print/proxy export only — browser `fetch()` to `cards.scryfall.io` is blocked by CORS; the route only allows `https://cards.scryfall.io/*`, never follows a redirect (no open SSRF), and gives each client IP 300 requests a minute
- **Commander Spellbook**: `POST /api/combos` takes one deck's card list (at most 2 commanders and 250 main-deck names) and makes one `find-my-combos` call for it — no free-form proxying. Results are cached server-side for 6 hours by a hash of the normalized list; each client address gets 30 lookups per minute, and each server instance makes at most 60 Spellbook calls per minute (Spellbook's guide calls 80 safe)
- **EDHREC**: If added in future phases, MUST be proxied via a Next.js API route — do not call directly from browser

## LLM Integration (Phase 4)

> ⚠️ CRITICAL: Never expose LLM API keys client-side.

When adding AI-assisted deck building:

- Store the API key in an environment variable (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- Create a server-side API route: `POST /api/ai/suggest`
- The route receives the deck state, calls the LLM, returns suggestions
- The client NEVER sees the API key — it only calls `/api/ai/suggest`

## XSS

React escapes all rendered values by default. Do NOT use `dangerouslySetInnerHTML` with any user-controlled or Scryfall-sourced data.

## SSRF

The Spellbook proxy only forwards whitelisted query parameters (`cards`, `format`) with a 500-char cap. The card-image proxy validates the `url` parameter is exactly `https://cards.scryfall.io/…` before fetching, and fetches with `redirect: "manual"`: a redirect answers 502 instead of being followed, since the allowlist only saw the first URL ([OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), read 2026-11-10). Never forward arbitrary user-controlled URLs to server-side fetch calls, and never let a server-side fetch follow redirects after an allowlist check.
