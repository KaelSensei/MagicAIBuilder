# Sonar Quality Status

Measured on 2026-10-10 after #955 and #956. This is a dated snapshot, not a claim that every issue or every security risk has been eliminated.

## Verified Baseline

- VPS `pnpm sonar` completed successfully; CI analyses passed for both PRs.
- Quality Gate: OK. New-code reliability, security and maintainability: A.
- New-code coverage: 91.3%, using the existing coverage exclusions. This does not establish complete coverage of routes and components; the pre-existing exclusion gap remains documented in `sonar-project.properties`.
- New-code duplication: 0.5%. Security hotspots reviewed: 100%.
- Open bugs: 0. Open code smells: 65, down from 120 total open issues before the recovery batch.
- No threshold was lowered, no new exclusion was added, and no remaining issue was bulk-dismissed.
- The repository secret was refreshed with explicit approval. No credential values belong in this document or Git.
- Integrated into dev; release promotion still follows dev -> staging -> main with QA validation.

Evidence: [Quality Gate API](https://sonarcloud.io/api/qualitygates/project_status?projectKey=KaelSensei_MagicAIBuilder), [open issues](https://sonarcloud.io/project/issues?issueStatuses=OPEN&id=KaelSensei_MagicAIBuilder), and the checks on [#955](https://github.com/KaelSensei/MagicAIBuilder/pull/955) and [#956](https://github.com/KaelSensei/MagicAIBuilder/pull/956).

## Remaining Findings

| Rule  | Count | Follow-up                                                                                                                                                                   |
| ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9382 | 16    | Review sequential async loops individually. Preserve Scryfall throttling, ordered mutations and bounded resource use; do not replace all awaits with unbounded Promise.all. |
| S3776 | 9     | Reduce cognitive complexity through behavior-preserving extraction, keeping parser and recovery contracts covered.                                                          |
| S3358 | 9     | Extract nested conditional expressions into clear named decisions.                                                                                                          |
| S2004 | 5     | Flatten deeply nested callbacks without changing mutation ownership.                                                                                                        |
| S8782 | 5     | Move test hooks before cases in the same scope.                                                                                                                             |
| S6819 | 5     | Review semantic HTML substitutions with keyboard and screen-reader regressions.                                                                                             |
| S9379 | 4     | Replace automatic focus only with an accessible, intentional focus strategy.                                                                                                |
| S8786 | 4     | Review regular-expression worst-case behavior, including malformed long inputs.                                                                                             |
| S1874 | 2     | Replace deprecated Zod APIs while preserving validation contracts.                                                                                                          |
| S6582 | 1     | Simplify the remaining nullable expression without weakening guards.                                                                                                        |
| S6479 | 1     | Use a stable key whose identity matches the rendered data.                                                                                                                  |
| S5843 | 1     | Simplify token parsing complexity with representative fixtures.                                                                                                             |
| S5869 | 1     | Remove duplicated regex character-class entries without changing matching.                                                                                                  |
| S5906 | 1     | Improve assertion diagnostics without weakening the assertion.                                                                                                              |
| S107  | 1     | Group AI request parameters by their domain meaning.                                                                                                                        |

Prioritize regex/input robustness and state-recovery complexity before cosmetic cleanup. A deliberate sequential loop may require an individually justified false-positive decision, not a global suppression or a concurrency rewrite for the sake of the metric.

## Verification Contract

For behavior changes, observe one failing test before minimal production changes. For behavior-preserving refactoring, start with green tests and rerun affected regressions. Run unit tests, typecheck, lint, build, Docker E2E and Sonar on the VPS. Record actual results after each batch; never equate a green gate with zero remaining issues.
