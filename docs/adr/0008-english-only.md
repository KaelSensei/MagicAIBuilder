---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Write code, comments, docs, commits and PRs in English

## Context and Problem Statement

The project is built by the owner, who works in French and English, and by AI agents. The product
is served in English and French (`src/i18n/routing.ts`), with eight more locale catalogs kept at
key parity under `src/messages/`.

Most of the repository is already in English: identifiers, comments, the product specs, the
guides, the commit history. The exceptions cause friction:

- The TDD method that `CLAUDE.md` calls authoritative, `docs/engineering/tdd-with-ai.md`, was
  written in French, while the `tdd` skill that agents load (`.agents/skills/tdd/SKILL.md`) is in
  English. The two drifted apart: the skill gained rules the method did not have.
- French-locale component tests, such as `src/components/deck/MoxfieldProfileImport.fr.test.tsx`,
  assert French UI text by necessity. Their test names are in English, which is the convention
  this decision makes explicit.
- Practitioner sources the project draws on exist in both languages (WealCome's training material
  is in French).

The Comprehensive Rules, Scryfall's oracle text, the Commander Spellbook API and the official
bracket announcements are in English, so the domain's source vocabulary is English.

In which language are the code base and its documentation written?

## Decision Drivers

- One language lets every contributor, human or agent, read every file and search with one set
  of terms.
- The domain's sources (Comprehensive Rules, oracle text, provider APIs) are in English, so the
  glossary and the code can use their words exactly.
- Tools such as `eslint-plugin-jsdoc`'s `informative-docs` and the planned glossary test compare
  comments and identifiers with names, which only works in one language.
- The French product experience must not suffer: French players see French text.

## Considered Options

- English everywhere, with locale files as the only exception.
- French documentation, English code.
- Bilingual documentation.

## Decision Outcome

Chosen option: "English everywhere, with locale files as the only exception", because it is the
only option that keeps code, comments and documentation in the language of the domain's sources.

The rules:

1. **English** for code and identifiers, comments and TSDoc, test names, documentation and ADRs,
   commit messages and pull request bodies, and agent rules and skills.
2. **The only exception is the locale files** under `src/messages/<locale>/`, which hold the
   translated UI text. Test assertions may contain localised strings when they check localised
   output; the test's name stays in English.
3. **Quoting a non-English source** (for example a French training syllabus, or an official French
   bracket name for the French UI) is allowed verbatim, followed by an English gloss.
4. `docs/engineering/tdd-with-ai.md` is translated into English, keeping its path, because
   `CLAUDE.md` links to it.

### Consequences

- Good, because every file is readable by every contributor and agent, and searchable with the
  domain's own words.
- Good, because comments can quote the Comprehensive Rules and provider documentation exactly.
- Good, because tools that compare comments, names and glossary terms work.
- Bad, because contributors who think in French write in their second language; plain, short
  sentences are preferred over idiom.
- Bad, because the translation of `tdd-with-ai.md` must stay faithful; its vocabulary (Red, Super
  Green, Refining Refactoring) is kept as named.

### Confirmation

- Review question: "Is everything outside `src/messages/` in English?"
- The pull request template and the agent rules state the rule.

## Pros and Cons of the Options

### French documentation, English code

- Good, because the owner reads French natively.
- Bad, because documentation and code would use different words for the same concept, which defeats
  a ubiquitous language, and agents would translate back and forth.

### Bilingual documentation

- Good, because every reader gets their language.
- Bad, because every document exists twice and the copies drift; `tdd-with-ai.md` and the `tdd`
  skill already show that drift.

## More Information

- [CONTEXT.md](../../CONTEXT.md): the glossary uses the English terms of the Comprehensive Rules.
- [tdd-with-ai.md](../engineering/tdd-with-ai.md): translated by this decision.
- [technical.md, Internationalisation](../engineering/technical.md#internationalisation): how
  translated UI strings are added.
