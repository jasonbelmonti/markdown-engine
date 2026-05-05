# WP-4 EVD-4: Annotation Target Validation

Date: 2026-05-04
Issue: BEL-940
Work package: 1.0 Rich IR WP-4
Branch: `codex/bel-940-annotation-target-validation`

## Objective

Implement caller-owned annotation target validation and deterministic target
diagnostics while preserving the `markdown-engine` boundary.

## Context / Constraints

BEL-940 depends on the landed WP-2 target/source substrate and WP-3 structural
query behavior. Annotation payloads remain caller-owned opaque data. The engine
validates node target existence, source target shape, and source target
containment by document source range when that range is available. It does not
interpret payload meaning, entity registries, issue keys, profile IDs, or
relationship semantics.

This pass keeps target/source internals and derived-view internals unchanged.

## Materially Verifiable Success Criteria

- [x] `npm run test:rich-ir:annotations` passes for valid and malformed
      annotation targets.
- [x] Malformed targets produce deterministic diagnostics sorted by source
      range, diagnostic code, diagnostic message, stable target key, and input
      order as a final tie-breaker.
- [x] Annotation payload meaning remains opaque and app-owned.
- [x] `npm run audit:rich-ir-boundary` reports no annotation semantic leakage.

## Implementation Summary

- `src/api/annotations.ts` remains the public API shell for
  `validateAnnotations`.
- `src/api/annotation-target-validation.ts` owns invocation-local target
  indexing, malformed target diagnostics, source-range containment checks,
  deterministic diagnostic ordering, and annotation cloning.
- `tests/rich-ir-annotations.test.ts` promotes the proving-slice annotation
  behavior into the assigned WP-4 gate.
- `scripts/check-boundaries.mjs` now reports annotation semantic boundary status
  in addition to dependency boundary status.

## Validation Record

Run from `.worktrees/BEL-940-annotation-target-validation` on 2026-05-04:

```sh
npm run typecheck
npm run test:rich-ir:annotations
npm run test:rich-ir:contract
npm run audit:rich-ir-boundary
git diff --check
npm test
node scripts/prove-repeatability.mjs --runs 10
```

Observed result:

- `npm run typecheck`: pass.
- `npm run test:rich-ir:annotations`: pass, 1 file and 4 tests.
- `npm run test:rich-ir:contract`: pass, 1 file and 3 tests.
- `npm run audit:rich-ir-boundary`: pass; output includes
  `Annotation semantic boundary PASS` and
  `Annotation semantic leakage matches: 0`.
- `git diff --check`: pass.
- `npm test`: pass, 13 files and 65 tests.
- `node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 8
  cases per run.

## Boundary Notes

No new dependencies were added. No annotation payload field names or values are
interpreted by production code. Boundary scanning remains intentionally focused
on production source under `src/**`; evidence and tests may mention downstream
boundary terms to prove the guard without adding them to the engine runtime.
