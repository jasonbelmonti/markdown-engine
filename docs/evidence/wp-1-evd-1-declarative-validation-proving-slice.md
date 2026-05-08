# WP-1 EVD-1: Declarative Validation Proving Slice

## Objective

Record the BEL-998 residual proof that resolves the BEL-974 drift found after
PR #67 merged: the parser/profile vocabulary stack landed, but the minimal
compile and selector-resolution proof remained incomplete.

## Scope

This evidence covers the smallest WP-1B architecture proof:

- parse one YAML-compatible `markdown-engine.validation@v1` profile
- compile supported declarations into private invocation-local data-only records
- resolve a section selector over a normalized 1.0 `EngineDocument`
- evaluate one minimal `text.contains` assertion path
- emit one source-targeted validation diagnostic
- serialize the public result deterministically
- emit optional evidence hashes without exposing compiled plans

This proof intentionally does not expand into full WP-3/WP-4 selector or
assertion vocabulary.

## Fixture

Markdown fixture:

`fixtures/declarative-validation/proving/representative.md`

Profile fixture:

`fixtures/declarative-validation/proving/profile.yaml`

The profile contains two section-scoped rules:

- `objective.contains` passes against the `Objective` section.
- `verification.diagnostic` fails against the `Verification` section and emits a
  source-targeted diagnostic against the matched section heading.

## Boundary Observations

- Compiled plans remain private to `src/declarative-validation/compiler/**`.
- Package-root exports expose `parseValidationProfile` and `validateWithProfile`,
  but not `CompiledDeclarativeValidationPlan` or compile result types.
- Selector resolution uses public `documentQueries.sections()` and
  `documentQueries.sourceSlice()` over a public `EngineDocument`.
- The proof path does not inspect raw parser AST, compile profile-sourced regular
  expressions, call the network, execute profile code, or encode
  operational-design-spec semantics.

## Verification

Commands run from `.worktrees/BEL-998-declarative-validation-residual-compile-selector-proof`:

- `npm run test:validation:compiler`: pass, 1 file and 3 tests.
- `npm run test:validation:selectors`: pass, 1 file and 2 tests.
- `npm run test:validation:assertions`: pass, 1 file and 1 test.
- `npm run test:validation:proving`: pass, 1 file and 1 test.
- `npm run typecheck`: pass.
- `npm run test:validation:contract`: pass, 1 file and 9 tests.
- `npm run test:validation:profile`: pass, 1 file and 10 tests.
- `npm test`: pass, 23 files and 133 tests.
- `node scripts/check-boundaries.mjs`: pass.
- `node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs.
- `git diff --check HEAD --`: pass.

## Result

BEL-998 establishes the missing BEL-974 proof path. The remaining declarative
validation lane work can now proceed from a verified parser -> compiler ->
selector -> assertion -> diagnostic -> serialization path rather than from
placeholder gates.
