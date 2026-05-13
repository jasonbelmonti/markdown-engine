# BEL-982: Declarative Validation Public API And Document-Version Contract

Issue: `BEL-982`
Date: 2026-05-12 20:02 CDT / 2026-05-13 01:02 UTC
Branch: `codex/bel-982-declarative-validation-wp-5a-public-api-document-version-contract`
Worktree: `.worktrees/BEL-982-declarative-validation-wp-5a-public-api-document-version-contract`

## Objective

Finalize package-root declarative validation exports, public TypeScript result
shapes, document-version mismatch behavior, and compatibility policy before
CLI and evidence adapters lock in serialized contracts.

## Source Inventory

- Linear `BEL-982`: public API and document-version contract child issue for
  WP-5A.
- Linear `BEL-981`: parent WP-5 integration wrapper for public API, CLI,
  evidence, docs, and boundary audit.
- `docs/execution/markdown-engine-declarative-validation-syntax-execution-spec.md`:
  public API, result shape, document-version, diagnostic, evidence, and CLI
  contract authority.
- `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`:
  first-version declarative validation behavior and compatibility policy.
- `docs/contracts/api.md`: current package-root public API contract.
- Current implementation in `src/index.ts`, `src/api/contracts.ts`,
  `src/api/declarative-validation.ts`, `src/declarative-validation/results/index.ts`,
  and `tests/declarative-validation-contract.test.ts`.

## Source-Grounded Findings

- PASS: Package-root exports flow through `src/index.ts` to
  `src/api/contracts.ts`, which exports the declarative validation public API
  module.
- PASS: `parseValidationProfile` and `validateWithProfile` are package-root
  imports in contract tests and are emitted in `dist/api/declarative-validation.d.ts`.
- PASS: Public declarative validation result types include profile metadata,
  options, CLI JSON result union, config-error result shape, and optional
  deterministic evidence.
- PASS: Compiled rule plans and compile result types are not package-root
  exports; the contract test uses `@ts-expect-error` imports to lock that
  behavior.
- PASS: Raw `mdast` and `unified` parser internals are absent from the public
  declarative validation API barrel.
- PASS: `validateWithProfile` resolves omitted profile `documentVersion` values
  to the supplied `EngineDocument.version`, rejects explicit mismatches with
  `profile.config.documentVersionMismatch`, returns no rule results, and stops
  before rule evaluation.
- PASS: API modules orchestrate parser, compiler, evaluator, and evidence
  helpers without importing CLI runtime modules.

## Materially Verifiable Success Criteria

- [x] Package-root exports include the approved declarative validation public
      functions and types while compiled plan internals remain private.
- [x] Document-version mismatch behavior is covered by the public contract test.
- [x] `npm run typecheck` and `npm run test:validation:contract` pass after
      public API wiring.

## Validation

Commands run from this worktree:

- `npm run typecheck`: pass.
- `npm run test:validation:contract`: pass, 1 file and 13 tests.
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned and
  0 forbidden dependency matches.
- API-to-CLI runtime import scan: pass, no matches.

  ```sh
  rg -n "from \"\\./\\./.*cli|from \"\\./\\./\\.\\./cli|src/cli|declarative-validation/cli" \
    src/api src/declarative-validation -g '*.ts'
  ```

## Execution Notes

No runtime code change was required during this closeout pass. The current main
state already contains the BEL-982 contract implementation through earlier
landed declarative validation work. This record ties that implementation state
to the BEL-982 success criteria and captures the verification commands used for
handoff and review.
