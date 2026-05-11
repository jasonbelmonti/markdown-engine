# BEL-1017: Declarative Validation Document Version Default Alignment

Issue: `BEL-1017`
Date: 2026-05-11 13:51 CDT / 2026-05-11 18:51 UTC
Branch: `codex/bel-1017-documentversion-docs`
Worktree: `.worktrees/BEL-1017-documentversion-docs`

## Objective

Resolve the declarative validation `documentVersion` default conflict so the
v1 profile contract has one documented behavior that matches implementation and
tests.

## Scope

This is contract clarity work. Runtime behavior is intentionally unchanged.
The implementation remains:

- accepted profile `documentVersion` values are `"0.0.0"` and `"1.0.0"`;
- omitted profile `documentVersion` values remain omitted after parsing;
- `validateWithProfile` resolves an omitted profile `documentVersion` to the
  supplied normalized `EngineDocument.version`;
- explicit mismatches emit `profile.config.documentVersionMismatch` before rule
  evaluation;
- evidence `profileHash` hashes the resolved profile after applying
  `documentVersion` and rule `severity` defaults.

## Source-Grounded Findings

- PASS: The design spec no longer presents `1.0.0-draft` as the v1
  declarative validation profile default. The first-version YAML example now
  uses `documentVersion: 1.0.0`, and schema prose states the current
  `validateWithProfile` resolution behavior.
- PASS: The API contract now documents the public
  `parseValidationProfile`/`validateWithProfile` behavior for omitted,
  explicit, and mismatched profile `documentVersion` values.
- PASS: Contract coverage proves that an omitted profile `documentVersion`
  resolves to the supplied document version in the public result and produces
  the same evidence `profileHash` as an explicit matching profile version.
- PASS: Existing parser coverage rejects `1.0.0-draft` as an invalid profile
  `documentVersion`, preserving the final `1.0.0` contract.

## Compatibility Impact

No runtime compatibility impact. This change aligns stale design prose with the
current package contract instead of changing parser, validator, or evidence
behavior.

## Validation

Commands run from `.worktrees/BEL-1017-documentversion-docs`:

- `npm run test:validation:contract`: pass, 1 file and 11 tests.
- `npm run test:validation:profile`: pass, 1 file and 34 tests.
- `rg -n "1\\.0\\.0-draft" docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`:
  pass, no matches.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.
