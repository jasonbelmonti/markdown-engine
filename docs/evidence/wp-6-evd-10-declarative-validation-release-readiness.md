# WP-6C EVD-10: Declarative Validation Release Readiness Handoff

Date: 2026-05-13
Issue: BEL-990
Parent: BEL-987
Work package: Declarative Validation WP-6C
Validation: VAL-8 / VAL-9 / VAL-10
Branch: `codex/bel-990-declarative-validation-wp-6c-boundary-revalidation-handoff`
Baseline: `origin/main` at `ddcc0c1`

## Scope

This evidence records the final BEL-990 boundary revalidation and handoff
packet for declarative validation. It links the syntax, API, CLI, diagnostic,
downstream, boundary, release containment, rollback, and unresolved follow-up
evidence needed for the remaining project-owner release-readiness decision.

This task is evidence-only. It does not change source behavior, add profile
semantics, create or move a git tag, publish a package, deprecate a package,
change npm dist-tags, or claim release completion.

## Objective

Revalidate that declarative validation remains inert local data processing and
prepare the release-readiness handoff for downstream and release reviewers.

The handoff objective is to make the decision inputs reviewable without
requiring reviewers to reconstruct WP-6 state from individual child branches.

## Context And Constraints

Declarative validation must remain bounded to:

- YAML-compatible, JSON-safe profile parsing.
- Closed selector and assertion syntax.
- Deterministic rule compilation into internal data-only plans.
- Deterministic selector resolution over public `EngineDocument` data.
- Deterministic assertion evaluation.
- Stable diagnostics, rule results, serialization, and optional evidence.

The boundary continues to exclude:

- scripts, callbacks, `eval`, `Function`, dynamic imports, and expression
  evaluation
- profile-sourced regular expression compilation
- plugins and plugin loading
- network calls, LLM calls, MCP transport, and agent adapters
- file watching, persistence, databases, caches, and API-owned writes
- operational-design-spec, AGENTS.md, TASK.md, issue-key, entity-registry,
  relationship-graph, semantic-scoring, or other profile-specific core
  semantics

The CLI may read the caller-specified local Markdown and profile files. That
explicit local read path is in scope and is not file watching, traversal
service behavior, or API-owned persistence.

## Evidence Index

| Evidence | Record | Handoff status |
| --- | --- | --- |
| Syntax authority | [Declarative validation syntax design](../design/markdown-engine-declarative-validation-syntax-operational-design-spec.md) and [execution spec](../execution/markdown-engine-declarative-validation-syntax-execution-spec.md) | Defines the closed v1 vocabulary, non-goals, validation targets, and stop conditions. |
| API contract | [API contract](../contracts/api.md) and [declarative validation contract](../contracts/declarative-validation.md) | Defines `parseValidationProfile`, `validateWithProfile`, public result fields, evidence hashes, compatibility, and migration behavior. |
| CLI contract | [README CLI section](../../README.md#cli) and [declarative validation contract CLI behavior](../contracts/declarative-validation.md#cli-behavior) | Defines `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`, JSON output, and exit codes. |
| Diagnostic contract | [Declarative validation diagnostics](../contracts/declarative-validation.md#diagnostics) | Defines config, compile, and validation diagnostic codes and source-range behavior. |
| EVD-6 | [Declarative validation repeatability](wp-5-evd-6-declarative-validation-repeatability.md) | Ten-run deterministic result and evidence hash proof is recorded. |
| EVD-7 | [Declarative validation contract review](wp-5-evd-7-declarative-validation-contract-review.md) | Contract docs, CLI JSON union, exit codes, migration notes, and non-goals are recorded. |
| EVD-8 | [Declarative validation boundary audit](wp-5-evd-8-declarative-validation-boundary-audit.md) | Boundary exclusions and automated audit behavior are recorded. |
| BEL-1043 | [textLength contract verification](bel-1043-textlength-contract-verification.md) plus current updates in EVD-6, EVD-7, and EVD-8 | Contract docs, boundary audit, and repeatability proof were rerun on 2026-05-14 from baseline `d02522d`. |
| MS-2 | [BEL-986 MS-2 approval](bel-986-ms-2-approval.md) | Implementation and public contract approval are recorded before WP-6 release evidence. |
| EVD-9 | [ODS profile exercise](wp-6-evd-9-ods-profile-exercise.md) | Operational-design-spec-shaped fixture passes through generic declarative validation syntax without core ODS semantics. |
| EVD-10 | [Release readiness and containment](wp-6-evd-10-release-readiness.md) and [rollback containment](wp-6-evd-10-rollback-containment.md) | BEL-989 release verification, current public artifact state, and rollback controls are recorded. |
| EVD-10 handoff | This file | BEL-990 boundary revalidation and final handoff links are recorded. |
| Downstream handoff | [Downstream consultation and handoff notes](wp-6-evd-11-downstream-handoff.md) | Historical downstream confirmation remains linked; current package state is controlled by EVD-10 release readiness. |

## Command Results

BEL-990 boundary revalidation was run from
`.worktrees/bel-990-declarative-validation-wp-6c-boundary-revalidation-handoff`
on 2026-05-13:

```sh
npm run audit:declarative-validation-boundary
```

Recorded result:

```text
Declarative validation boundary audit PASS
Direct dependency matches: 0
Runtime boundary source matches: 0
Regex-like key rejection checks: present
Unsafe executable key rejection checks: present
Profile-specific core semantic matches: 0
```

Relevant upstream command evidence already recorded in EVD-9 and EVD-10:

- `npm run test:validation:downstream`: pass; validates the
  operational-design-spec-shaped fixture and the expected
  `profile.validation.referenceMissing` failure diagnostic through generic
  declarative syntax.
- `npm run test:validation:cli`: pass; covers validation JSON, profile-stage
  JSON without `profile` or `evidence`, document-version mismatch JSON, and
  CLI exit codes `0`, `1`, and `2`.
- `npm run test:validation:repeatability`: pass; covers declarative validation
  result and evidence repeatability plus ten-run repeatability proof.
- `npm run release:verify`: pass in BEL-989; includes typecheck, full tests,
  rich IR boundary audit, declarative validation contract docs gate,
  declarative validation boundary audit, build, serialization repeatability,
  whitespace checks, and clean-diff checks.
- `npm pack --dry-run --json`: pass in BEL-989; verifies package artifact
  dry-run behavior after `prepack` invokes `release:verify`.

Additional BEL-990 verification:

- `npm run docs:declarative-validation-contract`: pass; contract
  documentation gate still recognizes README, contract, evidence, and package
  script coverage.
- `npm run test:validation:downstream`: pass, 1 file and 2 tests.
- `git diff --check`: pass.
- `git ls-remote --tags origin 'refs/tags/v1.0.0'`: pass; remote tag remains
  at `01cf36ec3da3991b3dc1a0b9cfe7a7cc43211bef`.
- `npm view @jasonbelmonti/markdown-engine version dist-tags --json`: pass;
  npm reports version `1.0.0` and dist-tag `latest: 1.0.0`.

Additional BEL-1043 textLength verification on 2026-05-14:

- `npm run docs:declarative-validation-contract`: pass; the current public
  contract includes `textLength: { min, max }`, JavaScript string `.length`
  semantics, and `profile.validation.assertionFailed` for bound failures.
- `npm run audit:declarative-validation-boundary`: pass; internal compiled
  plans remain unexported and the declarative validation boundary reported 0
  direct dependency matches and 0 runtime boundary source matches.
- `npm run test:validation:repeatability`: pass, 1 file and 2 tests plus
  `node scripts/prove-declarative-validation-repeatability.mjs --runs 10`.
  The current repeatability proof passed 10 runs and 16 cases per run after the
  updated assertion surface reached the representative fixtures.

## Boundary Revalidation Decision Input

BEL-990 revalidation confirms the declarative validation boundary remains
contained at the current `origin/main` baseline:

- No forbidden direct dependency matches were found.
- No runtime boundary source matches were found in declarative validation API,
  implementation, or CLI helper paths.
- Regex-like profile key rejection remains present for `matches`, `pattern`,
  `regex`, and `regexp`.
- Unsafe executable key rejection remains present for callback, eval,
  execution, expression, function, import, plugin, and script-shaped payloads.
- No profile-specific core semantic terms were found in declarative validation
  source paths.

Release-readiness decision input: the automated boundary gate is passing for
BEL-990. Human MS-3 or release-artifact decisions remain outside this task and
must be made by the project owner.

## Release And Rollback State

Current public artifact state is controlled by
[`wp-6-evd-10-release-readiness.md`](wp-6-evd-10-release-readiness.md):

- package name: `@jasonbelmonti/markdown-engine`
- package version: `1.0.0`
- npm `latest`: `1.0.0`
- remote `refs/tags/v1.0.0` exists at
  `01cf36ec3da3991b3dc1a0b9cfe7a7cc43211bef`
- BEL-989 performed no tag, publication, deprecation, dist-tag, or
  release-completion action

BEL-990 performs no release-artifact action. Future release or rollback actions
remain constrained by
[`wp-6-evd-10-rollback-containment.md`](wp-6-evd-10-rollback-containment.md):

- require project-owner approval before creating, moving, or deleting tags
- require project-owner approval before publishing, deprecating, or changing
  npm dist-tags
- prefer corrective branches, documented deprecation, dist-tag correction,
  semver-correct successors, and rerun release validation over silent public
  contract mutation
- no database, persistent user data, credential, live service, or production
  traffic rollback exists for this package

## Handoff Execution Contract

First action for the next reviewer:

1. Read this file, then open the linked EVD-6 through EVD-10 records.
2. Confirm `npm run audit:declarative-validation-boundary` remains passing on
   the reviewed commit.
3. Confirm no release approval, tag mutation, package publication, package
   deprecation, or dist-tag mutation is inferred from BEL-990.

Ownership boundary:

- In scope: evidence links, command results, boundary revalidation state,
  release containment notes, rollback references, and explicit follow-ups.
- Out of scope: source behavior changes, new validation syntax, new CLI flags,
  new diagnostic codes, operational-design-spec semantics in core, release
  artifact mutation, and publication approval.

Validation gates before reporting this handoff complete:

- `npm run audit:declarative-validation-boundary`
- Documentation review that this handoff links syntax/API/CLI/diagnostic docs,
  EVD-6 through EVD-10 evidence, downstream exercise, boundary audit, release
  state, rollback controls, deviations, and waivers.

Stop conditions:

- Stop if the boundary audit fails.
- Stop if any evidence link is missing or points at stale contradictory release
  state.
- Stop if a reviewer asks BEL-990 to approve release, mutate a tag, publish a
  package, deprecate a package, or change a dist-tag.
- Stop if profile-specific semantics, executable behavior, profile-sourced
  regex compilation, network behavior, LLM behavior, file watching, or
  persistence appears in declarative validation source paths.

## Materially Verifiable Success Criteria

- [x] `npm run audit:declarative-validation-boundary` passes during BEL-990
  pre-release boundary revalidation.
- [x] This EVD-10 handoff record summarizes EVD-6 through EVD-10, release
  containment, rollback notes, and unresolved non-blocking follow-ups.
- [x] This handoff record links syntax/API/CLI/diagnostic docs, command
  results, downstream exercise, boundary audit, release/rollback decision
  inputs, and approved deviations or waivers.

## Approved Deviations Or Waivers

No approved BEL-990 deviations or waivers were found in the current thread,
Linear BEL-990, Linear BEL-987, or the reviewed evidence records.

## Unresolved Non-Blocking Follow-Ups

- Future declarative validation syntax expansion must update the contract,
  tests, diagnostics, evidence, and boundary audit before release.
- Any future release-artifact action must be project-owner approved and must
  rerun the exact release gates required by the release-readiness record.
- Historical EVD-11 downstream handoff notes remain linked for consumer context;
  current public artifact state is controlled by the newer EVD-10 release
  readiness and rollback records.

## Conclusion

BEL-990 passes the declarative validation boundary revalidation gate and
provides the final WP-6C handoff packet. Declarative validation remains an
inert, deterministic, local data-processing feature with no scripts,
expression evaluation, profile-sourced regex compilation, plugins, network
calls, LLM calls, file watching, persistence, or profile-specific core
semantics observed by the automated boundary audit. The remaining release
decision authority stays with the project owner.
