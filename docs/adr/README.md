# Architecture Decision Records

An Architecture Decision Record (ADR) records one significant decision: the forces that led to
it, the option chosen, the options rejected and what the choice costs. ADRs are the memory of the
code base. A reader who asks "why is it built like this?" should find the answer here, not in a
chat log or a pull request thread.

The format is [MADR 4.0.0](https://adr.github.io/madr/) (Markdown Architectural Decision
Records), following Michael Nygard's original proposal,
[Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
(2011-11-15).

## Index

| ADR                                                                   | Title                                                                                                     | Status   | Date       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-modular-monolith-by-bounded-context.md)                   | Organise the code as a modular monolith, one module per bounded context                                   | Accepted | 2026-11-10 |
| [0002](0002-module-entry-points-index-server-client.md)               | Give each module three entry points: `index.ts`, `server.ts`, `client.ts`                                 | Accepted | 2026-11-10 |
| [0003](0003-domain-as-readonly-data-and-pure-functions.md)            | Model the domain as readonly data and pure functions                                                      | Accepted | 2026-11-10 |
| [0004](0004-anti-corruption-layers-for-external-providers.md)         | Put an anti-corruption layer in front of every external provider                                          | Accepted | 2026-11-10 |
| [0005](0005-testing-strategy-fakes-contracts-and-characterization.md) | Test with in-memory fakes, contract tests and characterization tests                                      | Accepted | 2026-11-10 |
| [0006](0006-comment-and-documentation-standard.md)                    | Adopt a comment and documentation standard built on information                                           | Accepted | 2026-11-10 |
| [0007](0007-architecture-enforcement-in-stages.md)                    | Enforce the architecture with tools, introduced in stages                                                 | Accepted | 2026-11-10 |
| [0008](0008-english-only.md)                                          | Write code, comments, docs, commits and PRs in English                                                    | Accepted | 2026-11-10 |
| [0009](0009-legality-is-a-report-and-the-server-owns-rules.md)        | Report legality on the deck, and let the server own the rules                                             | Accepted | 2026-11-10 |
| [0010](0010-coverage-scope-by-layer.md)                               | Scope coverage by layer: keep module UI out of the Sonar figure, and set floors on domain and application | Accepted | 2026-11-11 |

Add a row here in the same pull request that adds an ADR. A test that fails when this index and
the files in this folder disagree is planned (see [ADR 0006](0006-comment-and-documentation-standard.md)).

## When to write an ADR

Write one when a decision meets **any** of these tests:

- **It is hard to reverse.** Moving code between contexts, choosing a persistence model, changing a
  public URL or an API contract, adding a runtime dependency that many files will import.
- **It constrains future work.** A rule other contributors must follow: a layer rule, a naming
  convention, a test policy, a comment standard.
- **It has real alternatives.** Reasonable people (or agents) would pick differently, and the
  reason for this choice is not visible in the code.
- **It deviates from an existing ADR, a house rule or a framework default.** Say what you deviate
  from and why.
- **It trades a quality for another.** For example speed against consistency, or a simpler model
  against an accurate rule.

Do **not** write an ADR for a decision that the code states clearly on its own, for a bug fix, or
for a choice that one pull request can undo without anyone noticing. Put the "why" of a local
choice in a code comment instead (see [code-documentation.md](../engineering/code-documentation.md)).

When in doubt, the Definition of Ready asks the question for every slice
([definition-of-done.md](../engineering/definition-of-done.md)).

## How to write one

1. **Number.** Take the next free four-digit number. Numbers are never reused, even when an ADR
   is rejected.
2. **Name.** `docs/adr/NNNN-short-title-with-dashes.md`, in English, describing the decision rather
   than the problem.
3. **Status.** An agent writes a new ADR with `status: proposed`. The owner changes it to
   `accepted` (or `rejected`) in review. The ADRs dated 2026-11-10 were accepted by the owner
   before they were written down, as the decisions of the clean-code programme.
4. **Evidence.** State the context with facts a reader can check: file paths, counts and how they
   were measured. Cite external sources with a URL and a date.
5. **Consequences.** List the bad consequences as carefully as the good ones. An ADR with no
   cost is a sales pitch.
6. **Never rewrite history.** When a decision changes, write a new ADR that supersedes the old
   one. In the old ADR change only the status line (`superseded by ADR-NNNN`) and add a link to the
   new one.
7. **Index.** Add the row to the table above in the same pull request.

## Template

Copy this block into the new file. Optional sections may be removed; keep their order.

```markdown
---
status: proposed # proposed | rejected | accepted | deprecated | superseded by ADR-NNNN
date: YYYY-MM-DD # when the decision was last updated
decision-makers: # who decided
consulted: # whose opinion was sought (optional)
informed: # who is kept up to date (optional)
---

# Short title of the decision, in the imperative

## Context and Problem Statement

Two to five short paragraphs, or a short list. Describe the forces at play, with evidence: paths,
counts, measurements, links. End with the question the decision answers.

## Decision Drivers

- The force or concern that matters most.
- The next one.

## Considered Options

- Option 1 (the chosen one, usually listed first)
- Option 2
- Option 3

## Decision Outcome

Chosen option: "Option 1", because it is the only one that satisfies driver X and it costs less
than option 2 on driver Y.

State the decision as rules a contributor can follow ("We will …", "A route handler must …").

### Consequences

- Good, because …
- Bad, because …

### Confirmation

How compliance is checked: a lint rule, a dependency-cruiser rule, a test, a review question.

## Pros and Cons of the Options

### Option 2

- Good, because …
- Bad, because …

### Option 3

- Good, because …
- Bad, because …

## More Information

Links to related ADRs, docs, issues and external sources (with their date). When and how the
decision should be revisited.
```
