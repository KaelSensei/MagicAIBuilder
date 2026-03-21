# Security Notes

## Input Sanitization
- Deck names: HTML-stripped + trimmed + max 200 chars (enforced in API routes)
- Deck import: card names HTML-stripped, quantity clamped 1–99, max 500 lines

## External API Calls
- **Scryfall**: Called directly from the browser (public API, no key needed, CORS allowed)
- **Commander Spellbook**: Proxied via `/api/combos` (server-side) to avoid CORS fragility
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
The Spellbook proxy only forwards whitelisted query parameters (`cards`, `format`) with a 500-char cap. Never forward raw user-controlled URLs to server-side fetch calls.
