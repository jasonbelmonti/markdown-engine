# BEL-986: Declarative Validation MS-2 Approval Record

Date: 2026-05-13
Issue: BEL-986
Milestone: MS-2 implementation contract and validation completeness
Branch: `codex/BEL-986-ms-2-gate`
Worktree: `.worktrees/BEL-986-ms-2-gate`

## Objective

Record MS-2 approval for declarative validation implementation completeness,
public contract behavior, validation evidence, and package-boundary evidence
before merge or downstream release-readiness work proceeds.

## Decision

MS-2 status: Approved.

Project owner decision: Approve.

- Date: 2026-05-13
- Approval source: operator authorization to execute BEL-986 in the Codex
  session for this repository.
- Conditions: None.

Implementation reviewer decision: Approve.

- Date: 2026-05-13
- Reviewer: Codex implementation review
- Conditions: None.

WP-6 and downstream release-readiness work may proceed from the declarative
validation MS-2 gate. No fix or deviation issue is required by this gate.

## Evidence Review

EVD-2 through EVD-8 are present and reviewed:

| Evidence | Artifact | Review result |
| --- | --- | --- |
| EVD-2 | `docs/evidence/wp-2-evd-2-profile-schema-closure.md` | Profile schema closure is present. Current `npm run test:validation:profile` passed with 35 tests. |
| EVD-3 | `docs/evidence/wp-3-evd-3-rule-compiler-selector-plan.md` | Compiler and selector evidence is present. Current compiler and selector gates passed with 28 and 6 tests. |
| EVD-4 | `docs/evidence/wp-4-evd-4-assertion-semantics.md` | Assertion semantics evidence is present. Current assertion gate passed with 94 tests. |
| EVD-5 | `docs/evidence/wp-4-evd-5-diagnostic-targeting.md` | Diagnostic targeting evidence is present. Current diagnostics gate passed with 3 tests. |
| EVD-6 | `docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md` | Declarative validation repeatability evidence is present. Current repeatability gate passed 10 runs with 12 cases per run. |
| EVD-7 | `docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md` | Contract review evidence is present. Current contract documentation gate passed. |
| EVD-8 | `docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md` | Boundary audit evidence is present. Current boundary audit passed with 0 direct dependency matches and 0 runtime boundary source matches. |

## Current Validation Commands

Commands run from `.worktrees/BEL-986-ms-2-gate` on 2026-05-13:

| Gate | Command | Result |
| --- | --- | --- |
| Profile | `npm run test:validation:profile` | Pass, 1 file and 35 tests. |
| Compiler | `npm run test:validation:compiler` | Pass, 1 file and 28 tests. |
| Selectors | `npm run test:validation:selectors` | Pass, 1 file and 6 tests. |
| Assertions | `npm run test:validation:assertions` | Pass, 1 file and 94 tests. |
| Diagnostics | `npm run test:validation:diagnostics` | Pass, 1 file and 3 tests. |
| CLI | `npm run test:validation:cli` | Pass, 1 file and 16 tests. |
| Repeatability | `npm run test:validation:repeatability` | Pass, 10 runs and 12 cases per run. |
| Docs | `npm run docs:declarative-validation-contract` | Pass. |
| Boundary audit | `npm run audit:declarative-validation-boundary` | Pass. Direct dependency matches: 0. Runtime boundary source matches: 0. |
| Build | `npm run build` | Pass. |
| Typecheck | `npm run typecheck` | Pass. |

The repeatability rerun produced deterministic output for the current `main`
baseline. The observed current hashes were:

```text
passing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
passing profileHash: 3a288b6612d5c042e51d4260d0a9532e1229f87be5d507e2f5caf3a3db66da92
failing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
failing profileHash: d4ce7117cf4b119e44a778a56c25a02043712e64056a975562b1a781a89abc33
```

## Boundary Findings

The MS-2 review found no merge-blocking declarative validation boundary drift.

- Unsupported regex-like and executable-like profile keys remain rejected before
  evaluation.
- Compiled rule plans remain private, closed, and data-only.
- Declarative validation source remains free of arbitrary JavaScript execution,
  profile-sourced regex compilation, plugins, network calls, LLM calls, file
  watching, persistence, and profile-specific core semantics.
- Public contract behavior for syntax versioning, document-version mismatch,
  selector vocabulary, assertion vocabulary, diagnostics, evidence fields, CLI
  JSON output, and exit codes remains documented.

## Conclusion

BEL-986 passes. Declarative validation MS-2 is approved with no conditions.
