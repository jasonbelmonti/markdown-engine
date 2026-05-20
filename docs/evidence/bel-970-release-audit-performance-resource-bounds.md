# BEL-970 Release Audit Track: Performance And Resource Bounds

Date: 2026-05-07 15:55 CDT / 2026-05-07 20:55 UTC
Issue: BEL-970
Parent audit: BEL-956
Baseline: `origin/main` at `742cb0dda8a1`
Worktree: `.worktrees/BEL-970-performance-resource-bounds`
Branch: `codex/bel-970-performance-resource-bounds`
Package: `@jasonbelmonti/markdown-engine@0.1.0`

## Current Status

This is a dated BEL-956 release-audit record. The `Package:` line, `1.0.0-draft`
lane, and release-withhold statements below describe the 2026-05-07 audit
baseline. At the BEL-1158 cleanup baseline (`origin/main` at `804c6351edf0`,
2026-05-20), package metadata is `@jasonbelmonti/markdown-engine@2.0.0` and the
public document contract at that baseline uses `documentVersion: "1.0.0"`.

## Scope

This audit reviewed parser/frontmatter handling, structural view derivation,
annotation target validation, serialization, repeatability scripts, and release
scripts for obvious unbounded-work or resource-exhaustion cliffs under expected
local package use.

This audit does not authorize a `v1.0.0` tag, npm publication, package version
promotion, `1.0.0-draft` promotion to final `1.0.0`, or a release-completion
claim. BEL-956/BEL-958 release blockers remain outside this ticket.

## Execution Gate

The full BEL-970 surface had already estimated as
`execution.action: decompose-first`, `planning.blocksExecution: true`, medium
blast radius score `4`, and adjusted story points `8`. Execution was therefore
split by risk boundary and each child slice was re-estimated with
`--decomposition-depth 1`.

The first estimator attempt used process substitution and failed with:

```json
{ "error": "proposed file list does not exist: /dev/fd/11" }
```

The estimate inputs were corrected to durable temporary proposal files and
rerun successfully:

- Slice A, parser/frontmatter/source slices: `execution.action:
  proceed-with-controls`, adjusted story points `8`, blast radius score `1`,
  no decomposition.
- Slice B, structural traversal/query helpers: `execution.action:
  proceed-with-controls`, adjusted story points `8`, blast radius score `2`,
  no decomposition.
- Slice C, annotation hostile-value bounds: `execution.action: proceed`,
  adjusted story points `5`, blast radius score `1`, no decomposition.
- Slice D, serialization/release scripts/test scope: `execution.action:
  proceed-with-controls`, adjusted story points `8`, blast radius score `4`,
  no decomposition. Control applied: verify build/test/release-script behavior.

## Conclusion

No BEL-970 release-blocking performance or resource-bound issue was found.
Runtime source was not changed.

The main residual risk is intentionally documented rather than fixed here:
several parser, frontmatter JSON conversion, document normalization, structural
view, and serializer paths are recursive and do not impose a package-owned
global document depth or node-count budget. For expected local package inputs,
work is proportional to parsed/materialized input size and representative
release gates pass. For adversarial, deeply nested Markdown/YAML or hostile
objects outside the annotation target boundary, a future hardening pass should
consider explicit depth/work budgets.

## Slice A: Parser, Frontmatter, And Source Slices

- PASS: YAML materialization uses `maxAliasCount: 50`
  (`src/frontmatter/yaml-options.ts:26-29`), and parser options disable YAML
  merge semantics while retaining strict unique-key handling
  (`src/frontmatter/yaml-options.ts:10-24`).
- PASS: JSON-safe frontmatter conversion rejects non-finite numbers, non-string
  map keys, unsupported value types, and cyclic alias graphs
  (`src/frontmatter/yaml-json.ts:30-135`). It defines output properties with
  `Object.defineProperty`, avoiding prototype setter side effects for keys such
  as `__proto__` (`src/frontmatter/yaml-json.ts:137-148`).
- PASS: Source slices require integer, ordered, non-negative, in-bounds offsets
  and return `undefined` instead of guessing
  (`src/ir/source-ranges.ts:15-35`,
  `src/ir/document-targets.ts:59-77`).
- PASS: Existing tests cover alias-limit rejection, cyclic aliases,
  non-finite YAML numbers, duplicate keys, non-string keys, merge-key behavior,
  BOM offset handling, and unsupported source offsets
  (`tests/parser-frontmatter.test.ts:235-511`,
  `tests/rich-ir-targets.test.ts:159-232`).
- Residual risk: `toJsonSafeValue` and YAML key-policy inspection recurse over
  materialized YAML/AST shape and do not have an independent depth or total-node
  budget. This is non-blocking for expected local package use because alias
  amplification is capped and work remains tied to source-controlled
  frontmatter size.

## Slice B: Structural Traversal And Query Helpers

- PASS: Section derivation is iterative over top-level document children and uses
  a heading stack; it does not recurse through arbitrary node graphs
  (`src/ir/document-sections.ts:18-58`).
- PASS: Public query filters for sections, spans, tables, lists, links, and
  nodes are deterministic and bounded by the size of the current document views
  (`src/api/document-queries.ts:31-164`).
- PASS: Existing query evidence covers repeated structural derivation, query
  filters, source-slice lookup, rich IR snapshots, and ten-run deterministic
  evidence generation (`tests/rich-ir-queries.test.ts:30-212`).
- Residual risk: `withNodeMetadata`, `normalizeNode`, `flatMapNodes`,
  `nodeText`, list collection, and parser-to-engine conversion use recursive
  traversal (`src/ir/document-targets.ts:14-31`,
  `src/ir/document-node-walk.ts:3-23`,
  `src/ir/document-list-views.ts:8-50`,
  `src/parser/engine-document.ts:8-52`,
  `src/ir/document.ts:42-83`). The query helper `sourceSlice` also flattens
  nodes per lookup (`src/api/document-queries.ts:145-164`). This is acceptable
  for expected local Markdown package documents, but deeply nested adversarial
  Markdown could still hit JavaScript stack or repeated-flatten overhead. Record
  this as a non-blocking hardening candidate, not a BEL-970 release blocker.

## Slice C: Annotation Hostile-Value Bounds

- PASS: Annotation target normalization has explicit caps:
  `MAX_NORMALIZED_ARRAY_LENGTH = 1024`, `MAX_NORMALIZED_DEPTH = 64`, and
  `MAX_NORMALIZED_WORK = 2048`
  (`src/api/annotation-target-runtime.ts:1-7`).
- PASS: Runtime target reads use descriptors instead of invoking getters, catch
  descriptor/proxy failures, return accessor/unavailable placeholders, and avoid
  unsafe object enumeration outside known fields
  (`src/api/annotation-target-runtime.ts:94-147`,
  `src/api/annotation-target-validation.ts:384-423`).
- PASS: Arrays and target paths are bounded by descriptor-safe length reads,
  array length limits, and non-negative integer path validation
  (`src/api/annotation-target-runtime.ts:149-197`,
  `src/api/annotation-target-validation.ts:502-541`).
- PASS: Tests cover accessors, proxies, revoked proxies, functions, bigints,
  huge sparse arrays, oversized paths, 5000-level deep targets, 2000-field wide
  targets, 50000-key proxy targets, circular/shared graphs, and bounded
  serialized output (`tests/rich-ir-annotations.test.ts:362-756`).
- Residual risk: Annotation payloads remain caller-owned opaque values and are
  not normalized by `validateAnnotations`. Hostile payload serialization remains
  outside the annotation target validation boundary by design.

## Slice D: Serialization, Repeatability, And Release Scripts

- PASS: Public serialization normalizes arrays in order, sorts plain-object keys,
  recursively omits `undefined` fields, and delegates final output to
  `JSON.stringify` (`src/api/serialize.ts:32-61`).
- PASS: Repeatability proof runs a fixed case set, compares byte-for-byte JSON
  against a baseline for `--runs`, and rejects invalid run counts
  (`scripts/prove-repeatability.mjs:11-91`).
- PASS: Repeatability cases are fixed fixture reads plus parse, normalize,
  validate, rich IR, annotation, and diagnostic outputs
  (`scripts/repeatability-cases.mjs:55-111`,
  `scripts/rich-ir-repeatability-cases.mjs:9-72`).
- PASS: Test and snapshot scripts exclude `.worktrees/**`
  (`package.json:47-63`). `.gitignore` excludes `.worktrees/`, `dist/`, and
  `node_modules/`, so local worktree and generated build output are not test
  discovery inputs (`.gitignore:1-3`).
- PASS: `release:verify` includes typecheck, full tests, boundary audit, build,
  10-run repeatability proof, whitespace diff check, and tracked clean-diff
  check (`package.json:45-46`).
- Residual risk: `serialize` has no hostile-object guard for arbitrary
  caller-supplied result payloads. It is safe for engine-owned parse, normalize,
  validate, and annotation-target-normalized results covered by repeatability
  gates. Serializing arbitrary cyclic or accessor-backed caller payloads can
  still throw or recurse through `JSON.stringify`; this remains outside the
  expected engine-owned result contract.

## Validation Results

- `npm ci`: pass; 182 packages installed, 0 vulnerabilities reported.
- `npm run test:rich-ir:annotations`: pass, 1 file and 15 tests.
- `npm run test:rich-ir:queries`: pass, 1 file and 3 tests.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `npm run test:snapshots`: pass, 5 files and 22 tests.
- `npm run typecheck`: pass.
- `npm run audit:rich-ir-boundary`: pass; boundary dependency audit reported
  8 direct dependencies scanned, 0 forbidden dependency matches, annotation
  semantic boundary pass, and 0 annotation semantic leakage matches.
- `node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 14 cases
  per run.
- `git diff --check --no-index -- /dev/null docs/evidence/bel-970-release-audit-performance-resource-bounds.md`:
  pass with expected no-index difference status and no whitespace findings.
- `npm run release:verify`: pass. This included typecheck, full tests
  (16 files and 102 tests), boundary audit, build, 10-run repeatability proof,
  whitespace diff check, and tracked clean-diff check. Because this evidence file
  is new and untracked, `release:check-clean` did not detect it; `git status`
  remains the authoritative check for this untracked evidence before commit.

## Success Criteria Status

- [x] YAML alias limits, JSON-safe conversion, source-slice creation, tree
  traversal, query helpers, and annotation normalization have clear bounds or
  documented risk limits.
- [x] Hostile annotation target values cannot trigger unbounded recursion, unsafe
  getter execution, or excessive diagnostic normalization work.
- [x] Repeatability and release scripts have acceptable local runtime behavior
  and do not accidentally include `.worktrees/**` or generated output in test
  scope.
- [x] Performance cliffs that could matter outside expected local package use are
  recorded as explicit non-blocking residual risks. No BEL-970 release blocker
  was identified.

## Required Next Decisions

BEL-970 does not clear BEL-956/BEL-958 release blockers. Before any 1.0 tag or
npm publication, release owners must still resolve package version policy,
publish dry-run state for a not-yet-published version, the npm `bin` metadata
normalization warning, and final release authorization from a clean committed
state.
