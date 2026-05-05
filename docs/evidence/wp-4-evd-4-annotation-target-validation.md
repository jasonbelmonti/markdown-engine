# WP-4 EVD-4: Annotation Target Validation

Date: 2026-05-05
Issue: BEL-940
Work package: 1.0 Rich IR WP-4
Branch: `codex/bel-940-annotation-validation-evidence`

## Objective

Implement caller-owned annotation target validation and deterministic target
diagnostics while preserving the `markdown-engine` boundary.

## Context / Constraints

BEL-940 depends on the landed WP-2 target/source substrate and WP-3 structural
query behavior. Annotation payloads remain caller-owned opaque data. The engine
validates node target existence, source target shape, optional node target
source ranges, source target containment by document source range when that
range is available, and deterministic diagnostic ordering.

The engine does not interpret payload meaning, entity registries, issue keys,
profile IDs, relationship semantics, or downstream annotation semantics. This
pass keeps target/source internals and derived-view internals unchanged.

## Landed Slices

- PR #29 extracted annotation validation into a focused API boundary while
  keeping the public `validateAnnotations` entry point stable.
- PR #30 implemented deterministic annotation target diagnostics and hardened
  malformed target handling, serialization, offset ordering, and bounded
  runtime normalization.
- PR #31 added the annotation semantic boundary audit to prevent downstream
  semantic terms from leaking into production engine source.

## Materially Verifiable Success Criteria

- [x] `npm run test:rich-ir:annotations` passes for valid, malformed, and
      hostile annotation targets.
- [x] Malformed targets produce deterministic diagnostics sorted by source
      range, diagnostic code, diagnostic message, stable target key, and input
      order as a final tie-breaker.
- [x] Annotation validation results serialize safely for non-JSON-safe target
      values, accessor-backed fields, proxies, oversized arrays, deep graphs,
      wide graphs, shared references, and circular references.
- [x] Annotation payload meaning remains opaque and app-owned.
- [x] `npm run audit:rich-ir-boundary` reports no annotation semantic leakage.

## Implementation Summary

- `src/api/annotations.ts` remains the public API shell for
  `validateAnnotations` result assembly and annotation cloning.
- `src/api/annotation-target-validation.ts` owns invocation-local target
  indexing, malformed target diagnostics, source-range containment checks,
  safe source-range cloning, deterministic diagnostic ordering, and target
  cloning for validation results.
- `src/api/annotation-target-runtime.ts` owns descriptor-safe runtime property
  reads, bounded array/path inspection, runtime value normalization, circular
  reference detection, and shared-reference preservation.
- `tests/rich-ir-annotations.test.ts` promotes annotation target behavior into
  the assigned WP-4 gate and covers the review-reported hardening cases.
- `scripts/check-boundaries.mjs` reports annotation semantic boundary status in
  addition to dependency boundary status.

## Validation Record

Run from
`.worktrees/bel-940-annotation-validation-evidence` on 2026-05-05:

```sh
npm run typecheck
npm run test:rich-ir:annotations
npm run test:rich-ir:contract
npm run audit:rich-ir-boundary
git diff --check HEAD --
npm test
node scripts/prove-repeatability.mjs --runs 10
```

Observed result:

- `npm run typecheck`: pass.
- `npm run test:rich-ir:annotations`: pass, 1 file and 15 tests.
- `npm run test:rich-ir:contract`: pass, 1 file and 3 tests.
- `npm run audit:rich-ir-boundary`: pass; output includes
  `Annotation semantic boundary PASS` and
  `Annotation semantic leakage matches: 0`.
- `git diff --check HEAD --`: pass.
- `npm test`: pass, 13 files and 81 tests.
- `node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 8 cases
  per run.

## Boundary Notes

No new dependencies were added. No annotation payload field names or values are
interpreted by production code. Boundary scanning remains intentionally focused
on production source under `src/**`; evidence and tests may mention downstream
boundary terms to prove the guard without adding them to the engine runtime.
