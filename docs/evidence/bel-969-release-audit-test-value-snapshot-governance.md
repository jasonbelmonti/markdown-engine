# BEL-969 Release Audit Track: Test Value And Snapshot Governance

Date: 2026-05-07
Issue: BEL-969
Parent audit: BEL-956
Baseline: `origin/main` at `e97171e`
Worktree: `.worktrees/BEL-969-test-value-snapshot-governance`
Branch: `codex/bel-969-test-value-snapshot-governance`
Package: `@jasonbelmonti/markdown-engine@0.1.0`

## Current Status

This is a dated BEL-956 release-audit record. The `Package:` line,
`1.0.0-draft` lane, and release-withhold statements below describe the
2026-05-07 audit baseline. As of the current repository state, package metadata
is `@jasonbelmonti/markdown-engine@2.0.0` and the current public document
contract uses `documentVersion: "1.0.0"`.

## Scope

This audit verifies that automated tests and checked-in snapshots protect
release-relevant public behavior instead of preserving private implementation
choreography.

The audit reviewed completed functional audit evidence from BEL-957 through
BEL-964, adjacent release-track evidence from BEL-966 through BEL-968,
`docs/testing.md`, `package.json` scripts, `tests/**`, `fixtures/**`,
`snapshots/**`, and repeatability scripts.

This audit does not authorize a `v1.0.0` tag, npm publication, package version
promotion, `1.0.0-draft` promotion to final `1.0.0`, release-completion claim,
or snapshot update without a mapped public-contract reason.

## Execution Gate

Execution estimation was run before edits. The initial evidence/docs footprint
returned `execution.action: proceed`, low blast radius, adjusted story points 2,
and no decomposition.

After the audit found that snapshot governance needed a `package.json` script
correction, execution estimation was rerun with the widened footprint:

```text
schemaVersion: execution-estimation.v5
mode: proposal
repoRoot: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/BEL-969-test-value-snapshot-governance
risk.blastRadius.score: 2
risk.blastRadius.level: medium
risk.blastRadius.requiresHeightenedControls: false
planning.recommended: false
planning.blocksExecution: false
execution.action: proceed-with-controls
estimation.adjustedStoryPoints: 3
estimation.decompositionRecommended: false
```

Controls applied: targeted snapshot-script validation, typecheck, whitespace
diff check, release-path functional verification, and explicit release-clean
gate interpretation.

## Inventory

- Test suite: 16 Vitest test files, 5,573 lines.
- Snapshot baselines: 11 files, 3,266 lines.
- Snapshot-backed test files: `tests/parser-fixtures.test.ts`,
  `tests/rules.test.ts`, `tests/rich-ir-targets.test.ts`,
  `tests/rich-ir-queries.test.ts`, and
  `tests/serialization-repeatability.test.ts`.
- Snapshot assertion count: 11 `toMatchFileSnapshot` calls.
- Test doubles: no `mock`, `stub`, `spy`, `jest`, `sinon`, or `vi.` usage was
  found in `tests/**` or `src/**`.

## High-Risk Behavior Coverage

| Audit group | High-risk behavior | Coverage status |
| --- | --- | --- |
| BEL-957 | Package root public API, compatibility selectors, and release containment. | Covered by `tests/api.contract.test.ts`, `tests/document-contract.test.ts`, `tests/rich-ir-compat.test.ts`, and `tests/cli.test.ts`. Release policy remains explicitly blocked until final package/document-version policy is decided. |
| BEL-958 | Deterministic serialization, release gates, package lifecycle scripts, and snapshot contract handling. | Covered by `tests/serialization-repeatability.test.ts`, `tests/rich-ir-repeatability.test.ts`, `scripts/prove-repeatability.mjs`, `snapshots/serialization/**`, `prepack`, `prepublishOnly`, and `release:verify`. The already-published `0.1.0` publish dry-run blocker and `bin` metadata warning remain release-decision blockers, not test-value gaps. |
| BEL-959 | Parser/frontmatter behavior, source-position remapping, raw HTML inertness, and parser snapshots. | Covered by `tests/parser-frontmatter.test.ts`, `tests/parser-fixtures.test.ts`, `snapshots/ir/**`, `snapshots/diagnostics/frontmatter-duplicate-key.json`, and `snapshots/cmark-gfm/**`. Snapshot scans found no raw parser `position` fields or YAML parser internals. |
| BEL-960 | CLI selector behavior, single-file target behavior, default rich IR output, legacy output, and file errors. | Covered by `tests/cli.test.ts`. These are acceptance-style CLI process tests over built output and assert exit codes, stdout/stderr boundaries, document version selection, missing file failures, and directory rejection. |
| BEL-961 | Rich IR target/source substrate, target determinism limits, source-slice gating, and `preserveSourceLocations`. | Covered by `tests/rich-ir-targets.test.ts`, `tests/rich-ir-proving.test.ts`, `tests/rich-ir-repeatability.test.ts`, and `snapshots/rich-ir/wp-2-target-source-fixtures.json`. |
| BEL-962 | Section, text span, table, list, link, node, and source-slice query helpers. | Covered by `tests/rich-ir-queries.test.ts`, `tests/rich-ir-downstream.test.ts`, and `snapshots/rich-ir/wp-3-derived-view-query-fixtures.json`. |
| BEL-963 | Closed rule registry, unsupported/invalid config diagnostics, `valid` versus per-rule `passed`, diagnostic source ranges, and cloning. | Covered by `tests/rules.test.ts`, `tests/ms1-pipeline.test.ts`, `snapshots/diagnostics/wp-4-rules.json`, and `snapshots/serialization/wp-5-validation-diagnostics.json`. |
| BEL-964 | Annotation target validation, target cloning, deterministic diagnostics, hostile runtime target values, and opaque caller payloads. | Covered by `tests/rich-ir-annotations.test.ts`, `tests/rich-ir-proving.test.ts`, `tests/rich-ir-downstream.test.ts`, and the rich IR repeatability diagnostic matrix in `scripts/rich-ir-repeatability-cases.mjs`. |
| BEL-966/BEL-967/BEL-968 | Determinism, source safety, and boundary containment across the release candidate. | Covered by focused rich IR tests, `tests/boundary-inspection.test.ts`, `npm run audit:rich-ir-boundary`, `node scripts/prove-repeatability.mjs --runs 10`, and documented source-safety evidence. |

No BEL-957 through BEL-964 high-risk behavior lacks a test or documented
release-blocking gap.

## Snapshot Governance Findings

The checked-in snapshots are contract baselines:

- `snapshots/ir/**` protects normalized engine-owned parser IR for table, raw
  HTML, and nested frontmatter fixtures.
- `snapshots/diagnostics/**` protects frontmatter and rule diagnostic schema,
  source-range presence/absence, rule result ordering, and unsupported-rule
  behavior.
- `snapshots/cmark-gfm/**` protects selected parser-oracle comparison cases.
- `snapshots/rich-ir/**` protects public target/source evidence and public
  derived-view/query evidence for representative rich IR fixtures.
- `snapshots/serialization/**` protects stable public JSON output for parse,
  normalize, and validation results.

The audit found one governance gap and closed it:

- `docs/testing.md` did not list `snapshots/rich-ir/**`, even though
  `tests/rich-ir-targets.test.ts` and `tests/rich-ir-queries.test.ts` assert
  durable rich IR file snapshots.
- `npm run test:snapshots` did not execute the two rich IR snapshot-backed test
  files.

Changes made:

- Added `snapshots:update:rich-ir` to update only rich IR target/source and
  derived-view/query snapshots.
- Expanded `test:snapshots` to include `tests/rich-ir-targets.test.ts` and
  `tests/rich-ir-queries.test.ts`.
- Updated `docs/testing.md` to include the rich IR snapshot family, direct rich
  IR snapshot path resolution, the new update command, and rich IR review
  checks.

No snapshot baseline file was changed by BEL-969.

## Test-Value Review

Verdict: high-value suite with one corrected governance gap.

Protected contract: public package exports, parser/frontmatter behavior,
normalized IR, validation diagnostics, deterministic serialization, rich IR
target/source/query behavior, annotation target validation, CLI file behavior,
and release boundary containment.

Why failures would matter: the tests exercise public API calls, built CLI
process behavior, fixture-backed parser and rich IR outputs, deterministic
repeatability, release scripts, and boundary scans. A failure would indicate a
public contract drift, release-gate regression, or snapshot baseline change that
needs semantic-version classification.

Stability and coupling:

- Acceptance and contract tests are concentrated around public APIs, CLI output,
  fixture behavior, and release gates.
- Snapshot assertions intentionally bind public JSON baselines, not raw parser
  internals.
- Exact target ID and source-range snapshots are intentionally strict because
  target/source semantics are part of the 1.0 draft public contract, with
  documented stability limits.
- `tests/api.contract.test.ts` includes shallow export checks. Keep them because
  they cheaply protect the package-root public surface, but they should remain
  supplemental to behavior tests.

ROI judgment: the current suite is not mock-dominated and is not dominated by
inert implementation assertions. Runtime cost is acceptable for release gating:
focused scripts isolate parser, rich IR, rule, serialization, CLI, boundary, and
repeatability risks, while `release:verify` remains the full release-path gate.

Recommendation: keep the existing test portfolio. Do not delete or rewrite any
test file for BEL-969. Treat future snapshot diffs as public contract diffs
unless the diff is tied to an intentional source, fixture, parser dependency,
serializer, or documented public contract change.

Missing acceptance coverage: none found for BEL-957 through BEL-964 after the
snapshot governance script correction. Release publication still remains blocked
by BEL-957/BEL-958/BEL-956 decisions, not by a test-value gap.

## Validation Results

- `npm run test:snapshots`: pass, 5 files and 22 tests. This now includes
  parser fixtures, rules, rich IR target snapshots, rich IR query snapshots, and
  serialization snapshots.
- `npm run snapshots:update:rich-ir`: pass, 2 files and 8 tests. No snapshot
  diff was produced.
- `git diff -- snapshots`: pass; no snapshot baseline changes.
- `npm run typecheck`: pass.
- `npm test`: pass, 16 files and 102 tests.
- `npm run release:verify`: functional phases passed through typecheck, full
  tests, boundary dependency audit, build, and 10-run serialization
  repeatability with 14 cases per run. The command exited `1` at
  `release:check-clean` because `git diff --exit-code HEAD --` detected the
  intentional BEL-969 `docs/testing.md` and `package.json` changes.
- `git diff --check HEAD --`: pass after evidence updates.
- `git diff --check --no-index -- /dev/null docs/evidence/bel-969-release-audit-test-value-snapshot-governance.md`:
  pass with expected no-index difference status and no whitespace findings.

## Success Criteria Status

- [x] Each high-risk behavior from BEL-957 through BEL-964 has a test or
  explicit release-blocking coverage gap.
- [x] Snapshot assertions are tied to documented public contracts or
  representative fixture evidence, not private implementation choreography.
- [x] Snapshot update commands and review rules in `docs/testing.md` are
  accurate for current scripts and fixture families.
- [x] Low-value, mock-dominated, or overly brittle tests are identified with
  recommended keep/rewrite/delete actions.

## Release Containment

BEL-969 does not clear BEL-956, BEL-957, or BEL-958 release blockers. Before any
1.0 tag or npm publication, the final package/document-version policy,
not-yet-published package version, publish dry-run state, and `bin` metadata
normalization warning still require an explicit release decision and a clean
final release-candidate validation run.
