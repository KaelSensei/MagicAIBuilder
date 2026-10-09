---
name: tdd
description: Design features and reproduce bugs through test-first baby steps. Use before changing production behavior, or when reviewing whether a claimed TDD cycle has observable Red evidence. Distinguish behavior changes from behavior-preserving refactoring and documentation-only work.
---

# Test-Driven Design

TDD is a software design discipline, not merely a testing technique. Write an
automated test before the corresponding production behavior, observe it fail,
then let small increments drive an emergent design. Tests added after an
implementation can provide regression coverage, but are not evidence of TDD.

## Three Constraints

1. Do not write new production behavior without a failing test requiring it.
2. Write no more test code than needed to expose the next missing behavior.
3. Write no more production behavior than needed to pass that test while
   preserving existing contracts.

A missing symbol or compilation failure can be Red when it directly expresses
the intended missing API. An unavailable runner, dependency, credential or
network service is an environment blocker, not proof of a behavioral Red.

## Red -> Super Green -> Refining Refactoring

### Red: establish the next design requirement

- Choose one observable behavior and write the smallest deterministic test.
- Complete one test's observed Red, minimal Green and optional refactor before
  introducing the next missing behavior. Do not batch new failing tests or
  distinct parameterized cases and implement them together. Writing tests first
  without these feedback cycles is test-first, not this TDD contract.
- Run it before implementation and inspect the actual failure. Confirm that it
  fails because the behavior is absent, not because the fixture is broken.
- For a bug, reproduce the reported scenario and retain the regression test.
- Record the focused command, test and expected failure. Never invent Red
  evidence or describe an unexecuted test as verified.

### Super Green: satisfy only that requirement

- Implement the simplest sufficient behavior with clear names, correct placement
  and the project's existing safety and quality standards.
- Minimal does not mean deliberately dirty. Clean code does not mean advanced
  architecture: do not add future enum values, factories, interfaces, generic
  extension points or unrequested error cases.
- Progress through small transformations when appropriate, rather than jumping
  to the imagined final design. Keep code quality separate from behavioral scope.
- Run the focused test and relevant regressions. If another behavior is needed,
  begin another Red cycle instead of silently extending the implementation.

### Refining Refactoring: improve design without changing behavior

- Start with green tests. Make one coherent structural improvement and rerun the
  affected tests; keep the public behavior unchanged.
- Remove demonstrated duplication or clarify an emerging responsibility. Do not
  create abstractions solely for hypothetical future needs (YAGNI).
- Behavior-preserving refactoring does not require manufacturing a failing test.
  Any newly introduced behavior does require its own Red cycle.

## Test At Stable Boundaries

Prefer sociable unit tests of use cases, route handlers, store actions or visible
component behavior with real in-process collaborators. Assert observable results,
not private method calls, so internal structure can evolve without test rewrites.
Use focused solitary tests for pure algorithms, parsers and domain policies.
Replace external systems at their boundary when needed; do not mock internal
collaborators just to enforce an implementation shape.

Add happy paths, relevant edge cases and failure behavior through separate small
cycles. Never weaken assertions to accommodate a bug or change expectations
unless the requirement actually changed.

## Verification And Delivery

Run focused tests first, then the relevant regression suite and project gates.
Add integration or E2E coverage for affected journeys according to the project's
validation strategy; unit tests do not establish that a real integration works.
Honor the target project's execution-location and permission constraints.
If execution is blocked, report the blocker and do not claim a completed TDD cycle.

Record the behavior, observed Red, minimal Green, any refining refactor and actual
verification results in the PR. Documentation-only changes do not require an
artificial Red test. This skill does not authorize commits, pushes or merges.
