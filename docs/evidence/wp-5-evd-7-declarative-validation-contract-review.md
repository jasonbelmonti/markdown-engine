# WP-5 EVD-7: Declarative Validation Contract Review

Date: 2026-05-13
Issue: BEL-985
Work package: BEL-981 / WP-5D
Validation: Declarative validation contract documentation

## Scope

This evidence records the declarative validation contract review for the 1.0
release lane. The review closes the BEL-985 documentation requirement for
syntax versioning, document-version mismatch behavior, selectors, assertions,
diagnostics, result shape, evidence fields, CLI behavior, CLI JSON union, exit
codes, compatibility, examples, migration notes, non-goals, and boundary
exclusions.

## Reviewed Documents

- `docs/contracts/declarative-validation.md`
- `docs/contracts/api.md`
- `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`
- `README.md`
- `src/api/declarative-validation.ts`
- `src/declarative-validation/**`
- `src/cli/declarative-validation.ts`
- `src/cli/validate-args.ts`
- `tests/declarative-validation-contract.test.ts`
- `tests/declarative-validation-cli.test.ts`
- `tests/declarative-validation-profile.test.ts`
- `tests/declarative-validation-assertions.test.ts`
- `docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md`

## Contract Coverage

`docs/contracts/declarative-validation.md` now records:

- `markdown-engine.validation@v1` syntax versioning and closed vocabulary rules.
- Optional `documentVersion` parsing, validation-time version resolution, and
  `profile.config.documentVersionMismatch` behavior.
- The selector contract for document, section, heading, table, table row, table
  cell, text span, link, and list targets.
- The assertion contract for required sections, table columns, IDs,
  references, literal text, occurrence count, and required frontmatter.
- The diagnostic inventory for config, compile, and validation diagnostics.
- The public `DeclarativeValidationResult` shape and deterministic evidence
  fields.
- CLI behavior for `markdown-engine validate --file <markdown-file> --profile
  <profile-file> [--format json]`.
- The `DeclarativeValidationCliJsonResult` union, including profile-stage
  `DeclarativeValidationConfigErrorResult` output.
- CLI exit codes `0`, `1`, and `2`.
- Compatibility and migration notes for fixed-rule consumers, API consumers,
  CLI JSON consumers, and evidence-hash consumers.
- Boundary exclusions for arbitrary JavaScript, expression evaluation,
  profile-sourced regex compilation, plugins, network calls, LLM calls, file
  watching, persistence, and profile-specific core semantics.

## Commands

```sh
npm run docs:declarative-validation-contract
```

The package script runs:

```sh
node scripts/check-declarative-validation-contract-docs.mjs
```

## Recorded Results

```text
Declarative validation contract documentation gate PASS
Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, package.json
```

## Residual Risks

- This evidence verifies the contract documentation exists and names the public
  behavior required by BEL-985. It does not prove every selector and assertion
  behavior independently; that remains covered by the existing declarative
  validation test suites.
- Future syntax expansion must update this contract, tests, diagnostics, and
  migration notes before release.

## Conclusion

BEL-985 EVD-7 passes. Declarative validation contract docs and migration notes
are present, package script wiring is implemented, and the documentation gate
checks the contract, README, evidence files, and script registration.
