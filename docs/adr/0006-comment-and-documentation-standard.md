---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Adopt a comment and documentation standard built on information

## Context and Problem Statement

The owner asked for "a lot of comments" and for excellent technical and functional documentation.
Practitioners disagree on comments: Robert C. Martin treats most comments as a failure to express
intent in code, while John Ousterhout treats interface comments as essential design documents.
Both agree that a comment that restates the code is noise.

The state of the code base on `dev` at `872f08ff` (2026-11-10):

- **Coverage is uneven.** The architecture audit found JSDoc on 60.6 % of exports (873 of 1,441),
  lowest in `src/lib/validation` (15.8 %), `src/components/search` and `src/components/rules` (0 %),
  and module headers in only 19 of 70 route files and 3 of 36 page files.
- **Many existing comments restate their code.** The house skill rule "every exported function
  has JSDoc with `@param` and `@returns`" produces blocks such as
  `@param typeLine - Card type line` in `src/lib/deck/multiples.ts`, which add no information.
- **Game rules rarely cite their source.** 13 production files cite a Comprehensive Rules number
  (the playtest engine, `commander-eligibility.ts`, `commander-rules-check.ts`, `formats.ts` and
  others). The colour identity, singleton, pairing and companion modules
  (`src/lib/deck/color-identity.ts`, `multiples.ts`, `pairing.ts`, `companion.ts`) cite none.
- **Good examples exist.** `src/lib/playtest/free-mulligan.ts` opens with the rule it implements,
  quotes CR 103.5c and states what the format alone does not decide.
- **The documentation set is stale in places.** `docs/engineering/technical.md` describes a
  directory tree, a Prisma schema and an API table that no longer match the code. Several always-on
  agent rule files describe another project. There was no ADR folder, no glossary and no
  per-context documentation.
- **Two Comprehensive Rules editions ship with the repository:** the edition the app serves,
  `src/lib/rules/data/MagicCompRules-20260807.txt` (effective 2026-08-07), and an older copy,
  `docs/rules/magic-comp-rules-20260227.txt` (effective 2026-02-27).

What should a comment carry, where does each kind of documentation live, and how is it kept true?

## Decision Drivers

- "A lot of comments" must mean a lot of information, never paraphrase.
- Knowledge that cannot be recovered from the code (rules, sources, decisions, external limits)
  must be written down once, next to where it applies.
- Documentation must stay true as the code moves; stale docs mislead agents more than missing
  docs.
- The standard must be checkable, at least partly, by tools.

## Considered Options

- An information standard: module headers, contract TSDoc on exports, sourced "why" comments, no
  restating; a defined documentation set; enforcement in stages.
- Keep "JSDoc with `@param` and `@returns` on every export".
- Self-documenting code only: comments as a last resort.
- Generated API documentation only (TypeDoc).

## Decision Outcome

Chosen option: "an information standard", because it satisfies the owner's request without adding
noise, and its parts can be checked.

**Comments.** The full standard, with templates and examples from this code base, is
[code-documentation.md](../engineering/code-documentation.md). In short:

1. **Module header.** Every module opens with its purpose, its context, and its main collaborators,
   and says what it is not responsible for when that is not obvious.
2. **TSDoc on every export,** stating the contract: what it does, input constraints, errors and edge
   cases, and why. `@param` and `@returns` are written only when they add something the name and
   the type do not say.
3. **Game rules cite their Comprehensive Rules number,** for example `CR 903.5b`, from the edition
   the app ships: `src/lib/rules/data/MagicCompRules-20260807.txt` (effective 2026-08-07). The
   number is checked against that file. When the app ships a new edition, the citations are
   re-checked against it.
4. **External limits cite their source:** a URL and the date it was read.
5. **No restating.** A comment that repeats the code is deleted.

**Documentation set.** Each kind of knowledge has one home:

| Document                           | Holds                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/engineering/architecture.md` | The context map, the C4 container view, the layers, the entry points, where code goes.          |
| `CONTEXT.md`                       | The ubiquitous-language glossary, by context.                                                   |
| `docs/adr/NNNN-<slug>.md`          | Decisions, in MADR 4 format, with an index.                                                     |
| `src/modules/<context>/README.md`  | The technical doc of one context: responsibilities, public API, data flow, invariants, diagram. |
| `docs/functional/<context>.md`     | The functional doc of one context: what the player can do, the rules, the edge cases.           |
| `docs/product/user-guide.md`       | The guide for players (unchanged).                                                              |

**Keeping it alive.** Tests that fail on drift are added later: the glossary terms exist in code,
the ADR index is complete, and the dependency graph is generated by dependency-cruiser.

**Enforcement.** `eslint-plugin-jsdoc` is enforced in stages, starting with `src/modules/**`:
`require-jsdoc` on exports, then `informative-docs`, which reports comments that only restate a
name ([ADR 0007](0007-architecture-enforcement-in-stages.md)).

### Consequences

- Good, because every comment carries something the code cannot: a contract, a rule, a source or a
  decision.
- Good, because a rule citation (`CR 903.5b`) is a comment no rename can replace, and it lets a
  reviewer check the code against the rule.
- Good, because each kind of document has one home, so agents know where to read and where to
  write.
- Bad, because writing a good contract comment takes longer than writing a restating one, and
  reviewers must judge information, not presence.
- Bad, because CR citations must be re-checked when a new Comprehensive Rules edition renumbers
  rules. A guard test that checks every cited number against the shipped text is planned.
- Bad, because two Comprehensive Rules editions in the repository can confuse a reader until the
  older copy in `docs/rules/` is retired or updated.

### Confirmation

- Review question: "Does each comment in the diff say something the code does not?"
- `eslint-plugin-jsdoc` (`require-jsdoc` on exports, `informative-docs`) in `src/modules/**` once
  the ESLint flat config exists.
- Planned reconciliation tests: ADR index complete, glossary terms present in code, CR citations
  valid.

## Pros and Cons of the Options

### Keep "JSDoc with `@param` and `@returns` on every export"

- Good, because it is easy to check mechanically.
- Bad, because it rewards restating comments and says nothing about the "why", the contract or the
  source, which is the information readers actually miss.

### Self-documenting code only

- Good, because good names and small functions remove the need for many comments.
- Bad, because names cannot carry a rule number, an external limit, a rejected alternative or a
  contract's edge cases. Martin himself concedes that certain interfaces need comments.

### Generated API documentation only

- Good, because TypeDoc output cannot go stale.
- Bad, because it only renders what the comments say; it does not supply the "why". It may be added
  later for the module entry points, as a complement.

## More Information

- [code-documentation.md](../engineering/code-documentation.md): the standard with templates and
  examples.
- [functional/README.md](../functional/README.md): the functional documentation template.
- John Ousterhout and Robert C. Martin, [A Philosophy of Software Design vs Clean Code](https://github.com/johnousterhout/aposd-vs-clean-code)
  (2024–2025 discussion).
- John Ousterhout, [Writing Comments](https://web.stanford.edu/~ouster/cgi-bin/cs190-winter18/lecture.php?topic=comments),
  CS 190 lecture notes, 2018.
- Kent Beck, [Tidyings are Almost Done](https://newsletter.kentbeck.com/p/tidyings-are-almost-done),
  2022-02-23 ("Add Comment" and "Delete Redundant Comment" are both tidyings).
- Cyrille Martraire, _Living Documentation_ (2019); InfoQ, [book review and Q&A](https://www.infoq.com/articles/book-review-living-documentation/),
  2019-09-22.
- [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc) (`require-jsdoc`,
  `informative-docs`).
