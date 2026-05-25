# Conditional V2 EVD-6: Contract Docs and Docs Gate

Issue: BEL-1108
Parent issue: BEL-1084
Branch: `codex/bel-1108-contract-docs`
Worktree: `.worktrees/BEL-1108-contract-docs`
Baseline: `origin/main` at `f115743`
Date: 2026-05-24

## Scope

Conditional V2 EVD-6 records the BEL-1108 contract documentation review for
the public declarative validation contract. The scope is limited to contract
documentation, reviewer notes, and the documentation gate for the implemented
Conditional V2 surface.

This evidence does not implement runtime behavior, release verification,
downstream exercise fixtures, parser changes, rich IR changes, CLI behavior
changes, or publication readiness.

## Reviewed Sources

- `docs/contracts/declarative-validation.md`
- `docs/evidence/conditional-v2-evd-2-id-count-bounds.md`
- `docs/evidence/conditional-v2-evd-3-table-column-coverage.md`
- `docs/evidence/conditional-v2-evd-4-grouped-rules.md`
- `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`
- `src/declarative-validation/results/types.ts`
- `src/api/declarative-validation.ts`
- `scripts/check-declarative-validation-contract-docs.mjs`

## Contract Coverage

`docs/contracts/declarative-validation.md` now records:

- `markdown-engine.validation@v2` as an additive syntax version over the
  durable v1 authoring contract.
- V2 grammar for flat rules, non-recursive `anyOf` and `allOf` grouped rules,
  branch labels, ID count bounds, `tableColumnCoverage`, and rule-level `when`.
- V1 preservation for syntax, result shape, diagnostic inventory, CLI JSON
  behavior, and evidence hashes.
- The public v2 result shape, including `status`, grouped branch results,
  `evaluatedRuleCount`, `skippedRuleCount`, `evaluation.kind: "skipped"`, and
  `reason: "whenNotMatched"`.
- Diagnostic placement for skipped `when` rules, including nested
  `when.diagnostics` and no promotion into top-level diagnostics.
- CLI JSON union behavior, with v2 using the existing validation-result arm and
  no new CLI discriminator beyond `profile.syntaxVersion`.
- Evidence hash inputs and evidence cloning for v2 `ruleResults` and top-level
  diagnostics.
- Compatibility and migration notes for v1 consumers and v2 consumers.
- Conditional V2 non-goals, including no `documentVersion: "2.0.0"`, no
  recursive grouped rules, no branch-level `when`, no profile-defined
  predicates, no separate skipped-rule evidence channel, and no new CLI JSON
  discriminator.

## Commands

```sh
npm run docs:declarative-validation-contract
```

The package script runs:

```sh
node scripts/check-declarative-validation-contract-docs.mjs
```

## Recorded Results

Run from `.worktrees/BEL-1108-contract-docs` on 2026-05-24:

```text
$ npm run docs:declarative-validation-contract
Declarative validation contract documentation gate PASS
Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, docs/evidence/conditional-v2-evd-6-contract-docs.md, package.json
```

## Residual Risks

- This evidence proves the public contract documentation and docs gate only. It
  does not independently prove runtime behavior; that remains covered by the
  Conditional V2 implementation tests and EVD-2 through EVD-5.
- Future Conditional V2 release-readiness or downstream exercises must remain
  separate leaves unless a later task explicitly changes the review boundary.

## Review Boundary

Review BEL-1108 for accurate public contract documentation, V1 preservation,
Conditional V2 result and evidence wording, and docs-gate coverage. Runtime
behavior, release verification, downstream exercise fixtures, and publication
readiness remain out of scope unless this diff contradicts or prevents those
later work items.

## Conclusion

BEL-1108 prepares Conditional V2 EVD-6 reviewer notes and keeps the gate focused
on documentation accuracy. Approval should depend on the contract doc, this
evidence file, and `npm run docs:declarative-validation-contract` passing after
the BEL-1108 edits.
