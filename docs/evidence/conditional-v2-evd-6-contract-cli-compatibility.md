# Conditional V2 EVD-6: Contract and CLI Compatibility

Issue: BEL-1110
Parent issue: BEL-1084
Blocked-by leaf: BEL-1109, completed 2026-05-26
Branch: `codex/BEL-1110`
Worktree: `.worktrees/BEL-1110`
Baseline: `origin/main` at `6ecd238`
Date: 2026-05-28

## Scope

Conditional V2 EVD-6 records pre-merge contract and CLI compatibility evidence
for BEL-1110. The scope is limited to migration and compatibility examples,
contract documentation gate output, CLI contract test output, v1/v2
compatibility notes, and reviewer approval notes.

This evidence does not implement runtime behavior, repeatability proof,
boundary audit, downstream design-spec exercise fixtures, release verification,
tag creation, package publication, or MS-3 approval.

## Reviewed Sources

- `README.md`
- `docs/contracts/declarative-validation.md`
- `docs/evidence/conditional-v2-evd-1-proving-slice.md`
- `docs/evidence/conditional-v2-evd-4-grouped-rules.md`
- `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`
- `docs/evidence/conditional-v2-evd-6-contract-docs.md`
- `tests/declarative-validation-cli.test.ts`
- `scripts/check-declarative-validation-contract-docs.mjs`

## Migration Documentation Evidence

`README.md` now includes declarative validation compatibility guidance that
shows:

- v1 remains selected with `syntaxVersion:
  markdown-engine.validation@v1`;
- Conditional V2 behavior is selected only with `syntaxVersion:
  markdown-engine.validation@v2`;
- CLI validation output uses `profile.syntaxVersion` as the v1/v2
  discriminator;
- v1 rule results keep the existing flat `ruleId`, `passed`, and
  `diagnostics` fields;
- v2 rule results add `status` and `evaluation`, while v2 profile metadata adds
  `evaluatedRuleCount` and `skippedRuleCount`.

`docs/contracts/declarative-validation.md` now includes compatibility examples
for:

- a v1 compatibility profile that remains on the v1 authoring and result
  contract;
- an explicit v2 opt-in profile that selects Conditional V2 behavior;
- the rule that the CLI does not add a second discriminator for v2 and
  consumers branch on `profile.syntaxVersion:
  "markdown-engine.validation@v2"`;
- the rule that existing v1 profiles are not silently upgraded.

## Commands

```sh
npm run docs:declarative-validation-contract
```

The package script runs:

```sh
node scripts/check-declarative-validation-contract-docs.mjs
```

```sh
npm run test:validation:cli
```

The package script runs:

```sh
npm run build && vitest run tests/declarative-validation-cli.test.ts "--exclude=.worktrees/**"
```

## Recorded Results

Run from `.worktrees/BEL-1110` on 2026-05-28:

```text
$ npm run docs:declarative-validation-contract
> @jasonbelmonti/markdown-engine@2.0.0 docs:declarative-validation-contract
> node scripts/check-declarative-validation-contract-docs.mjs

Declarative validation contract documentation gate PASS
Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, docs/evidence/conditional-v2-evd-6-contract-docs.md, docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md, package.json
```

```text
$ npm run test:validation:cli
> @jasonbelmonti/markdown-engine@2.0.0 test:validation:cli
> npm run build && vitest run tests/declarative-validation-cli.test.ts "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-engine@2.0.0 build
> npm run clean && tsc -p tsconfig.json

> @jasonbelmonti/markdown-engine@2.0.0 clean
> node scripts/clean-dist.mjs

RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/BEL-1110

PASS tests/declarative-validation-cli.test.ts (36 tests)

Test Files  1 passed (1)
Tests  36 passed (36)
```

## CLI Compatibility Coverage

`tests/declarative-validation-cli.test.ts` covers the BEL-1110 CLI
compatibility boundary:

- `emits validation JSON with evidence and exits 0 for passing documents`
  verifies v1 output keeps `profile.syntaxVersion:
  "markdown-engine.validation@v1"` and v1 rule results do not expose `status`
  or `evaluation`.
- `emits discriminated v2 flat validation JSON with evidence` verifies explicit
  v2 selection, `evaluatedRuleCount`, `skippedRuleCount`, `status:
  "passed"`, and `evaluation.kind: "assertions"`.
- `emits failed v2 flat validation JSON without changing the v2 discriminator`
  verifies failing v2 output still uses the validation-result JSON arm and
  `profile.syntaxVersion: "markdown-engine.validation@v2"`.
- `emits documented v2 grouped validation JSON with evidence` verifies grouped
  `anyOf` CLI JSON, selected branch metadata, nested branch diagnostics, and
  evidence cloning.
- `emits documented v2 skipped validation JSON with evidence` verifies skipped
  `when` CLI JSON, `skippedRuleCount`, nested `when` diagnostics, and
  `evaluation.kind: "skipped"`.
- `emits documented v2 assertion-extension validation JSON with evidence`
  verifies v2 assertion-extension CLI JSON for `ids.minCount`.
- Profile-stage failure tests verify profile failures still emit
  `stage: "profile"`, empty `ruleResults`, no `profile`, and no `evidence`.

## V1/V2 Compatibility Notes

- V1 preservation: v1 authoring syntax, v1 rule result shape, v1 diagnostic
  inventory, v1 CLI JSON behavior, and v1 evidence hash inputs remain
  documented as unchanged.
- V2 selection: Conditional V2 behavior requires `syntaxVersion:
  markdown-engine.validation@v2`.
- CLI JSON union: v2 output uses the existing validation-result arm and is
  distinguished by `profile.syntaxVersion`; there is no additional CLI JSON
  discriminator.
- Evidence: v1 evidence clones v1 rule results; v2 evidence clones v2
  `ruleResults` and top-level diagnostics without a separate skipped-rule
  evidence channel.
- Profile-stage failures: profile parse/config/compile failures remain
  preserved and do not read or validate the Markdown document after profile
  failure.

## Public Contract Gap Review

No public contract gap is known in this BEL-1110 boundary after the planned
documentation updates. Any later reviewer-identified gap should be recorded as
an issue or approved deviation before MS-3 approval.

## Reviewer Approval Notes

Approval status: pending review.

Reviewer checks requested:

- Confirm `README.md` and `docs/contracts/declarative-validation.md` make v1
  preservation and explicit v2 selection unambiguous.
- Confirm the CLI compatibility test coverage listed above is sufficient for
  VAL-11.
- Confirm this EVD-6 record is sufficient input for MS-3 contract and CLI
  compatibility review.

This evidence file does not claim project-owner, contract/API reviewer, or
CI/docs quality-gate approval before those reviewers record it.

## Residual Risks

- This evidence proves contract documentation and CLI compatibility only.
  Repeatability and boundary audit evidence remain L7/EVD-7 scope.
- Downstream design-spec exercise and release readiness remain MS-4 scope.
- If reviewers require additional CLI JSON excerpts beyond the automated CLI
  tests, add them here before MS-3 approval.

## Review Boundary

Review BEL-1110 for migration/compatibility examples, contract docs gate
coverage, CLI contract test coverage, v1 preservation, explicit v2 selection,
and the completeness of this EVD-6 evidence record. Runtime behavior,
repeatability, boundary audit, downstream fixtures, release verification, tag
creation, package publication, and MS-3 approval remain out of scope unless
this diff contradicts or prevents those later work items.

## Conclusion

BEL-1110 prepares Conditional V2 EVD-6 for contract and CLI compatibility
review. Approval should depend on the contract documentation changes, this
evidence file, `npm run docs:declarative-validation-contract`, and
`npm run test:validation:cli` passing after the BEL-1110 edits.
