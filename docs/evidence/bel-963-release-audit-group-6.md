# BEL-963 Release Audit Group 6: Rules, Config, And Diagnostics

Date: 2026-05-07 11:30 CDT / 2026-05-07 16:30 UTC
Issue: BEL-963
Parent audit: BEL-956
Baseline: `origin/main` at `4edfb1d849a7f4db7fa50333714eafb1e097ff57`
Worktree: `.worktrees/BEL-963-release-audit-group-6`

## Scope

This audit verifies deterministic validation config loading, the closed rule
registry, rule evaluator diagnostics, public validation result semantics, and
diagnostic cloning/schema behavior before any 1.0 tag or npm publication.

The owned rule surface remains limited to:

- `frontmatter.required`
- `headings.required`
- `codeFences.languages`
- `links.allowedSchemes`
- `rawHtml.policy`

This audit does not authorize semantic validation, arbitrary rule plugins, LLM
evaluation, profile compilation, runtime behavior, a release tag, npm
publication, version promotion, or a 1.0 release-completion claim.

## Conclusion

No BEL-963 production release blocker was found. The implementation matches the
public API contract for deterministic config loading, unsupported-rule rejection,
invalid-rule rejection, rule result semantics, diagnostic cloning, source-range
presence, and closed rule-family containment.

The audit closed one focused coverage gap: `tests/rules.test.ts` now asserts
that an info-severity rule diagnostic keeps `valid: true` while still making
that rule's `passed` value `false`.

Release publication remains outside this audit's authority and still withheld
under BEL-944/BEL-956. The package remains
`@jasonbelmonti/markdown-engine@0.1.0`.

## Audit Results

- PASS: The public contract lists exactly the five deterministic rule families
  owned by this audit and no semantic/plugin/LLM rule execution surface
  (`docs/contracts/api.md:101-108`, `docs/contracts/api.md:191-203`,
  `docs/contracts/api.md:492-499`).
- PASS: The source registry is closed to those five rule IDs. Unknown IDs return
  `undefined` from `parseValidationRuleConfig()` and are never passed into
  `evaluateConfiguredRules()` (`src/rules/index.ts:35-64`,
  `src/rules/index.ts:66-88`).
- PASS: Unsupported rules produce stable `config.rule.unsupported` diagnostics
  without executing or inferring unsupported behavior. `loadValidationConfig()`
  records the unsupported rule diagnostic and continues without adding that rule
  to the executable rule list (`src/config/index.ts:51-71`). The WP-4 snapshot
  and tests cover `semantic.summaryQuality` as unsupported and confirm only the
  five supported rule results are emitted (`tests/rules.test.ts:147-194`,
  `snapshots/diagnostics/wp-4-rules.json`).
- PASS: Invalid top-level and supported rule configs produce stable config
  diagnostics and no rule execution. Non-object configs, non-object `rules`, and
  invalid supported config shapes return diagnostics before evaluators run
  (`src/config/index.ts:14-47`, `src/config/index.ts:66-71`,
  `tests/ms1-pipeline.test.ts:151-198`, `tests/rules.test.ts:196-219`).
- PASS: `valid` is controlled only by error-severity diagnostics. `validate()`
  computes `valid` from `!hasErrorDiagnostic(diagnostics)`, and
  `hasErrorDiagnostic()` checks only `severity === "error"`
  (`src/api/validate.ts:38-52`, `src/diagnostics/index.ts:29-32`).
- PASS: Per-rule `passed` is false whenever a rule emits diagnostics, regardless
  of diagnostic severity. Evaluators return `passed: diagnostics.length === 0`
  for configured rule output (`src/rules/code-fence-languages.ts:19-23`,
  `src/rules/links-allowed-schemes.ts:22-26`,
  `src/rules/raw-html-policy.ts:37-40`). Focused tests cover both warning and
  info non-error cases (`tests/rules.test.ts:221-280`).
- PASS: Rule diagnostics include source ranges only where available from engine
  IR source ranges and omit them where no safe source location is derivable.
  Code fence, link, and raw HTML diagnostics copy `node.sourceRange` only when it
  exists (`src/rules/code-fence-languages.ts:42-58`,
  `src/rules/links-allowed-schemes.ts:41-47`,
  `src/rules/raw-html-policy.ts:20-34`). Missing frontmatter, missing headings,
  config errors, and unsupported rules omit `sourceRange`. The focused rules
  snapshot asserts both located and unlocated diagnostics
  (`tests/rules.test.ts:171-194`, `snapshots/diagnostics/wp-4-rules.json`).
- PASS: Diagnostic results are cloned at construction and API return boundaries.
  `makeDiagnostic()`, `cloneDiagnostics()`, and `validate()` clone top-level and
  per-rule diagnostics, including nested source ranges when present
  (`src/diagnostics/index.ts:3-27`, `src/diagnostics/index.ts:35-39`,
  `src/api/validate.ts:45-52`).
- PASS: Parser/source-position prerequisites remain satisfied by completed
  BEL-959 and BEL-961 evidence. BEL-959 records parser/frontmatter/source-position
  correctness and raw HTML inertness; BEL-961 records source-range/source-slice
  constraints and release-publication withholding
  (`docs/evidence/bel-959-release-audit-group-2.md`,
  `docs/evidence/bel-961-release-audit-group-3.md`).

## Validation Results

- Execution estimation: pass after correcting the intended edit footprint.
  `schemaVersion` was `execution-estimation.v5`; mode was `proposal`; blast
  radius was medium with score 3; action was `proceed-with-controls`;
  decomposition was not recommended. The first broad inspection-as-edit estimate
  returned `decompose-first`, so execution proceeded only after narrowing the
  estimate to the actual edit footprint.
- `git fetch --all --prune`: pass.
- `git worktree add .worktrees/BEL-963-release-audit-group-6 -b codex/bel-963-release-audit-group-6 origin/main`:
  pass; worktree baseline is `4edfb1d849a7f4db7fa50333714eafb1e097ff57`.
- `npm run build && npx vitest run tests/rules.test.ts "--exclude=.worktrees/**"`:
  pass, 1 file and 7 tests.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.
- `git diff --no-index --check /dev/null docs/evidence/bel-963-release-audit-group-6.md`:
  pass after normalizing Git's expected no-index difference exit code; no
  whitespace findings were emitted.

`npm test` and `npm run release:verify` are not required unless this audit
changes production or public contract behavior. `npm run release:verify` remains
unsuitable before commit readiness because its clean-diff gate rejects the
uncommitted evidence and focused test changes.

## Success Criteria Status

- [x] Unsupported and invalid rule configs produce stable diagnostics without
  executing or inferring unsupported behavior.
- [x] `valid` is controlled by error-severity diagnostics, while per-rule
  `passed` semantics are documented and tested for warning/info cases.
- [x] Rule diagnostics include source ranges where available and omit them where
  not safely derivable.
- [x] Rule families remain limited to documented deterministic behavior:
  frontmatter required, headings required, code fence languages, allowed link
  schemes, and raw HTML policy.

## Required Next Decisions

No BEL-963 deterministic rules/config/diagnostics blocker requires a production
source change. Before any 1.0 tag or npm publication, BEL-956/BEL-944 must still
explicitly authorize release versioning, package publication, and final
release-candidate validation.
