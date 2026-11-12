---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Put an anti-corruption layer in front of every external provider

## Context and Problem Statement

MagicAIBuilder depends on several external providers, each with its own vocabulary, limits and
failure modes: Scryfall (card data), Commander Spellbook (combos), Anthropic and OpenAI (language
models), EDHREC and MTGTop8 (meta data), seven deck sites for URL import, and Auth.js with Google
sign-in. When a provider's types become the app's types, every provider change ripples into
business rules.

What the code shows on `dev` at `872f08ff` (2026-11-10):

- **Scryfall's wire type is the domain's card.** `ScryfallCard` (`src/lib/scryfall/types.ts`,
  snake_case fields such as `oracle_text` and `color_identity`) is referenced by 36 other production
  files, 30 of them outside `src/lib/scryfall/`. Rule modules take it as input:
  `src/lib/deck/pairing.ts`, `commander-eligibility.ts`, `companion.ts` and `categories.ts`, among
  others.
- **A client component calls Scryfall directly**, bypassing the rate-limited queue:
  `src/components/search/SetAutocomplete.tsx:44`.
- **The language models are called with raw `fetch`, twice.** `src/app/api/ai/suggest/route.ts`
  (654 lines, Anthropic at `:319`, OpenAI at `:350`) and `src/app/api/ai/build/route.ts`
  (373 lines, `:138` and `:174`) each carry their own provider clients and model table.
- **Commander Spellbook's wire type leaks.** `SpellbookVariant` (`src/lib/combos/spellbook.ts`) is
  used by `src/lib/deck/bracket.ts` and `src/hooks/useBracketScore.ts`. The combos folder is
  otherwise the best-shaped adapter in the repository, with a recorded contract fixture
  (`src/lib/combos/fixtures/find-my-combos-v1.ts`).
- **One function adapts seven deck sites.** `importFromUrl` in `src/lib/import/url-import.ts`
  (481 lines) switches over Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, AetherHub and EDHREC.

What boundary should separate the app's model from each provider's model?

## Decision Drivers

- A provider change (renamed field, new limit, new model) should touch one adapter, not the rules.
- Domain rules should be written in the app's language: a card, a combo, a decklist.
- Adapters should be testable against recorded provider responses, and swappable for in-memory
  fakes in use-case tests.
- External limits (rate limits, timeouts, size caps) should be enforced in one place per provider.

## Considered Options

- An anti-corruption layer (ACL) per provider: a domain type, a mapper and an adapter behind a
  port.
- Conformist: keep using each provider's types as the app's types.
- A generic HTTP wrapper shared by all providers, without domain types.

## Decision Outcome

Chosen option: "an anti-corruption layer per provider", because it is the only option that stops
provider vocabulary at one file per provider.

The rules:

1. **Wire types never leave `infrastructure/`.** Each adapter parses the provider's response (Zod
   or a type guard), maps it to the context's domain type, and returns that.
2. **Scryfall.** The card-catalog context publishes a `CatalogCard` domain type (camelCase, product
   fields only) and a `toCatalogCard()` mapper in `card-catalog/infrastructure/`. Domain code stops
   importing `ScryfallCard`. Browser access goes through the card-catalog client and its
   rate-limited queue; no component calls Scryfall directly.
3. **Language models.** Anthropic and OpenAI go behind one `LanguageModelPort` in the
   ai-copilot context, with one adapter per provider and a mock adapter. The port is built on
   `src/lib/ai/metered-model.ts` from the pending branch `feat/ai-usage-metering-and-monthly-quota`
   once it lands. Until then the AI routes are not restructured beyond agreed fixes.
4. **Other providers.** Commander Spellbook (combos publishes a `Combo` type), EDHREC and MTGTop8
   (meta-insights) and each import site (deck-interchange: one adapter per site, all returning the
   same imported-decklist type) get one adapter each.
5. **Each adapter has a recorded contract fixture,** named `*-v1.ts` and versioned by suffix, as
   `find-my-combos-v1.ts` and `src/lib/deck/fixtures/moxfield-v1.ts` already are. Adapter tests run
   against the fixture; a scheduled job may re-run them against the live provider.
6. **Auth.js stays conformist.** Identity follows Auth.js's model; translating it would buy
   nothing. Its Edge-safe configuration stays separate from the Node configuration.
7. **External limits are cited where they are enforced,** with the source URL and its date
   ([ADR 0006](0006-comment-and-documentation-standard.md)).

### Consequences

- Good, because a Scryfall field rename or a model swap changes one adapter and its fixture.
- Good, because rules read in domain language (`card.colorIdentity`, not `card.color_identity`),
  and the deck rules stop depending on a vendor's JSON.
- Good, because use cases can be tested with an in-memory catalog or model, and adapters with
  recorded fixtures.
- Bad, because mapping code and a second card type must be written and kept in sync with the
  fields the product needs.
- Bad, because `CatalogCard` is the most expensive migration: the card-catalog move touches about
  96 importer files, and every rule that takes a `ScryfallCard` needs a characterization test
  before it changes its input type.
- Bad, because the language-model port waits for a pending branch, so the two largest route
  handlers keep their inline clients for now.

### Confirmation

- dependency-cruiser forbids imports of a wire-type module from outside its `infrastructure/`
  folder ([ADR 0007](0007-architecture-enforcement-in-stages.md)).
- Each adapter has a contract-fixture test
  ([ADR 0005](0005-testing-strategy-fakes-contracts-and-characterization.md)).
- Review question: "Does a provider name or a provider type appear in a port or in `domain/`?"

## Pros and Cons of the Options

### Conformist: keep the providers' types

- Good, because no mapping code is needed and today's code already works this way.
- Bad, because the rules depend on the provider's field names and shapes, so a provider change
  reaches 30 or more files.
- Bad, because each language-model provider would keep its own request and reply shapes in the
  route handlers, which is the duplication seen today.

### A generic HTTP wrapper only

`src/lib/http.ts` (`httpGet`, timeouts, the app's User-Agent) already exists and stays useful.

- Good, because it centralises timeouts, headers and error types.
- Bad, because it does not translate anything: the provider's vocabulary still reaches the rules.
  The wrapper is a building block for adapters, not a substitute for them.

## More Information

- Eric Evans, _Domain-Driven Design_ (2003), the Anti-Corruption Layer pattern.
- Martin Fowler, [BoundedContext](https://martinfowler.com/bliki/BoundedContext.html), 2014-01-15.
- Martin Fowler, [ContractTest](https://martinfowler.com/bliki/ContractTest.html), revised 2018-01-01.
- [architecture.md](../engineering/architecture.md#context-map): the providers on the context map.
