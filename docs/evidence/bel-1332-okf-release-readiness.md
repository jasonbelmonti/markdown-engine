# BEL-1332: OKF Validation Seal Evidence

Date: 2026-06-15
Issue: BEL-1332
Validation: OKF validation seal, boundary audit, and release containment

## Scope

This evidence closes the OKF validation documentation and boundary-audit leaf
for package 3.0. The seal confirms that `markdown-engine` provides generic
validation primitives, packaged OKF examples, and public API proof coverage
without taking ownership of OKF bundle traversal, IO, caller-owned path classification,
or document-role routing.

## Seal Assertions

- README, API docs, and declarative-validation contract docs describe
  `frontmatterShape`, `textFormat`, `validateDocumentSet`, and OKF example
  composition.
- Concept validation applies only to non-reserved concept documents.
- The bundle-root `index.md` may use the OKF version exception
  `okf_version: "0.1"` through the root-index profile.
- non-root `index.md` files are validated by the non-root index profile and
  forbid frontmatter.
- `log.md` is validated as a log with `textFormat`, not as a concept document.
- The boundary audit rejects OKF-specific core runtime terms while allowing OKF
  examples in docs, fixtures, tests, and audit self-checks.

## Commands

```sh
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1332/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml --format json
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1332/execution-plan.md
python3 /Users/jasonbelmonti/.codex/skills/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/bel-1332-okf-seal-docs-boundary-audit --proposed-files ./.codex/execution-plans/bel-1332/proposed-files.txt --proposal-lines-changed 360
npm run test:validation:profile
npm run test:validation:compiler
npm run test:validation:assertions
npm run test:validation:examples
npm run build && npx vitest run tests/document-set-validation.test.ts tests/declarative-validation-okf-examples.test.ts "--exclude=.worktrees/**"
npm run docs:declarative-validation-contract
npm run docs:rich-ir-contract
npm run audit:declarative-validation-boundary
npm test
git diff -- package.json package-lock.json
```

## Recorded Results

```text
Execution Brief validation: PASS
Execution Plan validation: PASS
Execution estimation: proceed-with-controls; medium blast radius; decompositionRecommended false
Focused validation gates: PASS
OKF document-set proof: PASS
Docs gates: PASS
Boundary audit: PASS
Full regression: PASS on rerun after isolated profile-backed wrapper suite pass
Release containment: PASS
```

Expected boundary audit result after this seal:

```text
Declarative validation boundary audit PASS
Direct dependency matches: 0
Runtime boundary source matches: 0
Regex-like key rejection checks: present
Unsafe executable key rejection checks: present
Profile-specific core semantic matches: 0
OKF-specific core semantic matches: 0
```

Focused validation gates passed:

```text
npm run test:validation:profile: 62 tests passed
npm run test:validation:compiler: 43 tests passed
npm run test:validation:assertions: 143 tests passed
npm run test:validation:examples: 6 tests passed
```

The OKF public API proof passed:

```text
npm run build && npx vitest run tests/document-set-validation.test.ts tests/declarative-validation-okf-examples.test.ts "--exclude=.worktrees/**"
2 test files passed; 6 tests passed
```

The docs and boundary gates passed:

```text
npm run docs:declarative-validation-contract: PASS
npm run docs:rich-ir-contract: PASS
npm run audit:declarative-validation-boundary: PASS
```

The first aggregate `npm test` run passed 513 of 515 tests and failed two
`profile-backed-markdown-skill.test.ts` wrapper assertions. The wrapper suite
passed in isolation after rebuilding the bundled CLI, then the full aggregate
rerun passed:

```text
npm test
40 test files passed; 515 tests passed
```

## Release Containment

No release, publish, tag, version bump, or dist-tag mutation occurred.
`git diff -- package.json package-lock.json` produced no output.

## Residual Risks

- The OKF example remains a package fixture and public API proof, not a full OKF
  adapter.
- Consumers that want automatic bundle discovery, role routing, link checks, or
  stricter producer policy should implement those outside `markdown-engine` or
  request a separate adapter task.
- The boundary audit is a targeted implementation-boundary guard, not a general
  security analyzer.

## Conclusion

BEL-1332 is complete with passing command evidence. The approval boundary is
limited to OKF docs correctness, caller-owned role routing, boundary-audit
coverage, validation evidence, and release containment.
