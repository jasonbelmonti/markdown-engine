# BEL-964 Release Audit Group 5: Annotation Target Validation

Date: 2026-05-07 11:07 CDT / 2026-05-07 16:07 UTC
Issue: BEL-964
Parent audit: BEL-956
Baseline: `origin/main` at `5290d24988721f828711fff91c6eb4fed772f9ff`
Worktree: `.worktrees/BEL-964-release-audit-group-5`
Package: `@jasonbelmonti/markdown-engine@0.1.0`

## Current Status

This is a dated BEL-956 release-audit record. The `Package:` line and
release-withhold statements below describe the 2026-05-07 audit baseline. As of
the current repository state, package metadata is
`@jasonbelmonti/markdown-engine@2.0.0`; preserved package metadata remains a
historical audit fact.

## Scope

This audit verifies caller-owned annotation target validation before any 1.0
release action. The owned surface is `validateAnnotations()`, annotation target
diagnostics, target cloning, descriptor-safe runtime target handling, source
range ordering and containment, and annotation semantic boundary enforcement.

This audit does not authorize a `v1.0.0` tag, npm publication, package version
promotion, release-completion claim, profile/runtime/MCP/LLM integration, or
semantic interpretation of annotation payloads.

## Conclusion

No BEL-964 release blocker was found. The current implementation validates only
annotation target wrapper shape, engine target existence, source range shape,
source range ordering, and source range containment when a document source range
exists. Annotation payloads remain opaque and caller-owned.

The audit closed one focused test evidence gap: accepted node, section, and
source annotations now explicitly prove that caller-owned target objects are not
mutated and that returned annotation targets are cloned instead of retaining
caller-owned target, node target, section target, or source range references.

No production source change was required. Release publication remains withheld
under BEL-944/BEL-956.

## Audit Results

- PASS: Valid target IDs are indexed from document, section, and recursive node
  targets only. `documentTargetIds()` includes the document target, all section
  targets, and node targets exposed by `documentQueries.nodes()`
  (`src/api/annotation-target-validation.ts:62-70`).
- PASS: Source bounds are cloned from the document when available and are not
  synthesized when absent (`src/api/annotation-target-validation.ts:43-47`).
- PASS: Node targets are validated for wrapper kind, engine target shape,
  optional source range ordering, optional source range containment, and target
  existence (`src/api/annotation-target-validation.ts:73-167`,
  `src/api/annotation-target-validation.ts:169-210`).
- PASS: Source targets are validated for start/end shape, line/column ordering,
  offset ordering when both offsets exist, and containment when document bounds
  exist (`src/api/annotation-target-validation.ts:212-267`,
  `src/api/annotation-target-validation.ts:623-675`).
- PASS: Diagnostic ordering is deterministic by optional source range, code,
  message, normalized target key, and input order as the final tie-breaker
  (`src/api/annotation-target-validation.ts:283-351`,
  `src/api/annotation-target-validation.ts:366-382`).
- PASS: Known annotation targets are cloned through descriptor-safe readers and
  known fields only. Extra source position fields are stripped, invalid optional
  target fields are rejected, and unavailable oversized paths are omitted rather
  than serialized (`src/api/annotation-target-validation.ts:400-555`,
  `src/api/annotation-target-validation.ts:558-599`).
- PASS: Runtime target normalization is bounded and descriptor-safe. It uses
  descriptor reads instead of property gets, catches unavailable descriptors,
  caps normalized arrays at 1,024 entries, caps recursion depth at 64, caps
  normalization work at 2,048, normalizes functions/symbols/bigints/non-finite
  numbers, and avoids plain object key enumeration
  (`src/api/annotation-target-runtime.ts:1-6`,
  `src/api/annotation-target-runtime.ts:20-74`,
  `src/api/annotation-target-runtime.ts:76-147`,
  `src/api/annotation-target-runtime.ts:149-190`).
- PASS: Focused tests cover accepted node, section, and source targets, clone
  isolation, caller-input non-mutation, deterministic diagnostics for malformed
  and missing targets, partial offsets, optional node source ranges, unavailable
  paths, hostile values, accessors, proxies, revoked proxies, functions,
  symbols, bigints, cycles, oversized arrays, deep graphs, wide graphs, shared
  fanout graphs, extra field stripping, proxy-backed target internals, and
  stable serialization (`tests/rich-ir-annotations.test.ts:24-190`,
  `tests/rich-ir-annotations.test.ts:430-880`).
- PASS: Boundary scanning reports no profile, runtime, issue-key, entity,
  relationship, LLM, MCP, or domain semantics in production engine source.

## Validation Results

- Execution estimation: pass. `schemaVersion` was `execution-estimation.v5`;
  mode was `proposal`; blast radius score was 1 and level was low; action was
  `proceed-with-controls`; planning level was brief; decomposition was not
  recommended.
- `git fetch origin`: pass.
- `git worktree add .worktrees/BEL-964-release-audit-group-5 -b codex/bel-964-release-audit-group-5 origin/main`:
  pass; worktree baseline is `5290d24988721f828711fff91c6eb4fed772f9ff`.
- `npm run test:rich-ir:annotations`: pass, 1 file and 15 tests.
- `npm run audit:rich-ir-boundary`: pass; output included 8 direct
  dependencies scanned, 0 forbidden dependency matches, and 0 annotation
  semantic leakage matches.
- `npm run docs:rich-ir-contract`: pass; checked `docs/contracts/api.md`,
  `README.md`, `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`,
  `docs/evidence/wp-5-evd-6-rich-ir-contract.md`, and
  `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.
- `git diff --no-index --check /dev/null docs/evidence/bel-964-release-audit-group-5.md`
  with expected no-index diff status handling: pass, no whitespace output.

`npm run test:rich-ir:queries` was not run because `src/api/document-queries.ts`
was not changed. Broader `npm test` was not run because this audit changed only
focused annotation test assertions and this evidence file; no production
behavior changed beyond the narrow annotation boundary.

## Success Criteria Status

- [x] Valid node, section, and source annotation targets are accepted and cloned
  without mutating caller-owned inputs.
- [x] Unknown targets, invalid target kinds, malformed node targets, reversed
  ranges, and out-of-bounds ranges produce deterministic diagnostics.
- [x] Hostile runtime target values such as accessors, proxies, cycles,
  functions, symbols, bigint values, oversized arrays, and unavailable
  descriptors cannot escape validation or destabilize sorting.
- [x] No profile, runtime, issue-key, entity, relationship, LLM, MCP, or domain
  semantics are interpreted by the engine.

## Required Next Decisions

No BEL-964 annotation target validation blocker requires a production source
change. Before any 1.0 tag or npm publication, BEL-956/BEL-944 must still
explicitly authorize release versioning, package publication, and final release
candidate validation.
