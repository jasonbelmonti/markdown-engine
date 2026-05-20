# WP-6 EVD-10: 1.0 Release Readiness And Containment

Date: 2026-05-13
Issue: BEL-943 / BEL-944 / BEL-956 / BEL-989
Work package: WP-6
Validation: VAL-10
Baseline: `origin/main` at `43f05c6`

## Current Status

This is historical release-readiness and containment evidence for the 1.0 public
artifact state observed during BEL-989. The release state, MS-3 decision notes,
and `latest: 1.0.0` references below are current relative to the 2026-05-13
verification, not live package-status statements. At the BEL-1158 cleanup
baseline (`origin/main` at `804c6351edf0`, 2026-05-20), package metadata is
`@jasonbelmonti/markdown-engine@2.0.0`; use contract docs and evidence newer
than this BEL-1158 note for later package status.

## Scope

This evidence records BEL-943 release-readiness validation, release containment,
handoff state, the BEL-944 MS-3 withhold decision, and the BEL-965 release
cutover update for the 1.0 rich IR release lane.

BEL-989 adds declarative validation WP-6B release verification and containment
checks after BEL-988 proved the operational-design-spec fixture exercise. This
update verifies build, typecheck, full tests, declarative validation CLI
behavior, repeatability, release scripts, clean-diff expectations, and
source/package containment behavior. BEL-989 does not create a tag, publish a
package, or claim release completion.

BEL-944 withheld the 1.0 tag and package publication until BEL-956 child audit
tracks completed. BEL-965 records the release-cutover update: package metadata
and the public document contract are promoted to `1.0.0`, the release gates
must pass from the final commit, and local `v1.0.0` tag creation is authorized
after that validation. BEL-989 records the current tag/package state separately
below because `v1.0.0` and npm `latest` are now observable public artifacts.

## Evidence Index

| Evidence | Status |
| --- | --- |
| EVD-6 | [Rich IR contract docs](wp-5-evd-6-rich-ir-contract.md) are present and document the 1.0 contract, compatibility selectors, annotation target shape, source-slice behavior, migration notes, and non-goals. |
| EVD-7 | [Release readiness](wp-6-evd-7-release-readiness.md) is present as historical package-readiness evidence for the published `0.1.0` lane and remains linked for handoff completeness. Declarative validation contract readiness is also covered by [EVD-7 declarative validation contract review](wp-5-evd-7-declarative-validation-contract-review.md). |
| EVD-8 | [Boundary inspection](wp-5-evd-8-boundary-inspection.md) and [compatibility / CLI impact](wp-5-evd-8-compatibility-cli-impact.md) are present. |
| EVD-9 | [Downstream exercise](wp-6-evd-9-downstream-exercise.md) is present and proves rich IR sections, spans, source slices, query helpers, and annotations without semantic leakage. [ODS profile exercise](wp-6-evd-9-ods-profile-exercise.md) is present and proves declarative validation can validate an operational-design-spec-shaped fixture with generic syntax. |
| EVD-10 | This release-readiness and containment record is present and updated for BEL-989 declarative validation release verification. |

Historical 0.1.0 release evidence remains in the adjacent WP-6 files. The
1.0-specific release readiness evidence is this file plus EVD-9, with CLI
cutover evidence carried by the EVD-8 compatibility / CLI impact record.

## Release State

Observed package state during BEL-989 verification:

- package name: `@jasonbelmonti/markdown-engine`
- package version: `1.0.0`
- 1.0 document selector: `documentVersion: "1.0.0"`
- retained legacy selector: `documentVersion: "0.0.0"`
- 1.0 serialization gate: `compatibilityMode: "default"`
- legacy serialization gate: `compatibilityMode: "legacy-0.1"`
- npm `latest`: `1.0.0` from
  `npm view @jasonbelmonti/markdown-engine version dist-tags --json`
- git tag state: local `v1.0.0` exists; remote `refs/tags/v1.0.0` exists at
  `01cf36ec3da3991b3dc1a0b9cfe7a7cc43211bef`
- package tag action in BEL-989: none
- package publication action in BEL-989: none
- release completion claim in BEL-989: none
- publication audit gate for future release decisions: require explicit
  project-owner approval before any new tag, npm publish, deprecation, or
  superseding package action

MS-3 decision update for BEL-965: promote package metadata and the public
document contract to `1.0.0`, create `v1.0.0` only after validation passes, and
keep npm publication as a separate explicit operation. BEL-989 does not change
or re-authorize that historical decision.

## Validation Commands

Required BEL-944 commands:

```sh
npm run test:rich-ir:downstream
npm run release:verify
```

Required BEL-989 commands:

```sh
npm run release:verify
npm run build
npm run typecheck
npm run test:validation:cli
npm run test:validation:downstream
npm run test:validation:repeatability
npm run release:check-clean
npm pack --dry-run --json
git ls-remote --tags origin 'refs/tags/v1.0.0'
npm view @jasonbelmonti/markdown-engine version dist-tags --json
```

Additional BEL-943 preflight commands already covered by `release:verify` or
adjacent evidence:

```sh
npm run docs:rich-ir-contract
npm run audit:rich-ir-boundary
npm run typecheck
```

## Recorded Results

BEL-989 declarative validation release verification from
`.worktrees/bel-989-declarative-validation-wp-6b-release-verification-containment`
at `43f05c6`:

- `npm run release:verify`: pass; this includes typecheck, full tests,
  boundary dependency audit, declarative validation contract docs gate,
  declarative validation boundary audit, build, 10-run serialization
  repeatability, whitespace check, and clean-diff check.
- `npm test` inside `release:verify`: pass, 29 files and 314 tests.
- `node scripts/check-boundaries.mjs` inside `release:verify`: pass, 8 direct
  dependencies scanned, 0 forbidden dependency matches, and 0 annotation
  semantic leakage matches.
- `npm run docs:declarative-validation-contract` inside `release:verify`: pass;
  checked `docs/contracts/declarative-validation.md`, `README.md`,
  `docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md`,
  `docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md`, and
  `package.json`.
- `npm run audit:declarative-validation-boundary` inside `release:verify`:
  pass, 0 direct dependency matches, 0 runtime boundary source matches,
  regex-like key rejection checks present, unsafe executable key rejection
  checks present, and 0 profile-specific core semantic matches.
- `node scripts/prove-repeatability.mjs --runs 10` inside `release:verify`:
  pass, 10 runs and 14 cases per run.
- `npm run release:check-clean` inside `release:verify`: pass from the clean
  candidate before evidence edits.
- `npm run build`: pass.
- `npm run typecheck`: pass.
- `npm run test:validation:cli`: pass, 1 file and 16 tests. Coverage includes
  passing validation JSON with evidence, failing validation JSON, profile-stage
  JSON without `profile` or `evidence`, document-version mismatch JSON, and
  exit codes `0`, `1`, and `2` for validation, usage, unsupported format,
  unknown argument, unsupported `--document-version`, and local file read
  errors.
- `npm run test:validation:downstream`: pass, 1 file and 2 tests. Coverage
  validates the operational-design-spec-shaped fixture through generic
  declarative syntax and checks the expected source-targeted
  `profile.validation.referenceMissing` diagnostic for incomplete traceability.
- `npm run test:validation:repeatability`: pass, 1 file and 2 tests plus
  `node scripts/prove-declarative-validation-repeatability.mjs --runs 10`.
  The repeatability proof passed 10 runs and 12 cases per run.
- Observed declarative validation repeatability hashes:
  - passing `inputHash`:
    `8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56`
  - passing `profileHash`:
    `3a288b6612d5c042e51d4260d0a9532e1229f87be5d507e2f5caf3a3db66da92`
  - failing `profileHash`:
    `d4ce7117cf4b119e44a778a56c25a02043712e64056a975562b1a781a89abc33`
- `npm pack --dry-run --json`: pass. `prepack` invoked
  `npm run release:verify`, then reported
  `@jasonbelmonti/markdown-engine@1.0.0`, `entryCount: 457`,
  `size: 122567`, `unpackedSize: 644589`, and integrity
  `sha512-C30PqefykmcrUfGLH9gV6ppRHmVwr93E/Mg6h1Am21BQ/oyhha5SV6NA+5VdDWBss/58Ynh5EGjBiZ5ELwx3Zg==`.
- `git ls-remote --tags origin 'refs/tags/v1.0.0'`: pass; remote tag exists
  at `01cf36ec3da3991b3dc1a0b9cfe7a7cc43211bef`.
- `npm view @jasonbelmonti/markdown-engine version dist-tags --json`: pass;
  npm reports version `1.0.0` and dist-tag `latest: 1.0.0`.

BEL-944 release-candidate validation from
`.worktrees/BEL-944-ms3-release-decision`:

- `npm run test:rich-ir:downstream`: pass, 1 file and 2 tests.
- `npm run release:verify`: pass; this includes typecheck, full tests,
  boundary audit, build, 10-run serialization repeatability, whitespace check,
  and clean-diff check.
- `npm test` inside `release:verify`: pass, 16 files and 96 tests.
- `node scripts/check-boundaries.mjs` inside `release:verify`: pass, 8 direct
  dependencies scanned, 0 forbidden dependency matches, 0 annotation semantic
  leakage matches.
- `node scripts/prove-repeatability.mjs --runs 10` inside `release:verify`:
  pass, 10 runs and 14 cases per run.

Prior BEL-943 validation from `.worktrees/BEL-943-wp-6-release-readiness`:

- `npm run test:rich-ir:downstream`: pass, 1 file and 2 tests.
- `npm run docs:rich-ir-contract`: pass.
- `npm run audit:rich-ir-boundary`: pass, 8 direct dependencies scanned, 0
  forbidden dependency matches, 0 annotation semantic leakage matches.
- `npm run typecheck`: pass.
- `npm test`: pass, 16 files and 96 tests.
- `npm run release:verify`: pass; this includes typecheck, full tests,
  boundary audit, build, 10-run serialization repeatability, whitespace check,
  and clean-diff check.

Release repeatability output covered 10 runs and 14 cases per run, including
legacy parse/normalize/validate cases and 1.0 rich IR document, annotated
document, and annotation diagnostic cases.

## Review Record

- Project-owner decision: BEL-944 executed from the current project-owner
  request and records the MS-3 decision as withhold pending BEL-956 publication
  audit completion.
- Declarative validation WP-6B decision state: BEL-989 records verification and
  containment evidence only. It does not request MS-3 approval, create a tag,
  publish a package, deprecate a package, or claim release completion.
- Downstream review: EVD-9 proves the downstream structural exercise, and EVD-11
  records downstream-consumer confirmation for the package handoff.
- Declarative validation downstream review: BEL-988 EVD-9 proves the ODS-shaped
  fixture through generic profile syntax without adding profile-specific core
  semantics.
- Boundary/security review: EVD-8 boundary inspection remains passing, and the
  BEL-944 `release:verify` run repeated the boundary audit with 0 forbidden
  dependency matches and 0 annotation semantic leakage matches.
- Declarative validation boundary review: BEL-989 repeated the declarative
  validation boundary audit with 0 dependency, runtime, or profile-specific core
  semantic matches.

## Rollback And Containment

For an unpublished corrective release candidate:

- withhold any new tag or package publication if downstream exercise, boundary
  audit, repeatability, release verification, MS-3 review, or publication audit
  fails
- revert or supersede the affected branch if evidence or release-readiness
  documentation is wrong
- open a corrective implementation branch if source or public contract behavior
  is wrong
- preserve the current npm `latest` package contract until the corrective
  candidate passes review
- require explicit project-owner approval before creating a new tag, publishing
  a package, deprecating a package, or changing dist-tags

After any public tag or package publication issue:

- stop downstream adoption of the affected artifact when the issue is blocking
- record the tag name, commit, package version, dist-tag state, timestamp, and
  validation failure that triggered containment
- move or remove a git tag only after project-owner approval and after
  documenting the downstream impact
- deprecate or supersede an affected package version instead of silently
  mutating the public contract
- publish a patch when the correction is backward compatible
- publish a semver-major successor when the correction changes the public
  contract
- rerun EVD-9 and EVD-10 validation before requesting another release decision

There is no database, persistent user data, credential, live service, or
production traffic rollback in scope.

## Handoff State

BEL-944 state: MS-3 decision was recorded as withhold at that point in the
historical rich IR release lane. BEL-989 observes that `v1.0.0` and npm
`latest: 1.0.0` now exist, and it performs no release-artifact mutation.

Handoff packet:

- EVD-6 rich IR contract docs: `docs/evidence/wp-5-evd-6-rich-ir-contract.md`
- EVD-7 release readiness: `docs/evidence/wp-6-evd-7-release-readiness.md`
- EVD-8 boundary inspection: `docs/evidence/wp-5-evd-8-boundary-inspection.md`
- EVD-8 compatibility / CLI impact:
  `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`
- EVD-9 downstream exercise:
  `docs/evidence/wp-6-evd-9-downstream-exercise.md`
- EVD-9 declarative validation ODS profile exercise:
  `docs/evidence/wp-6-evd-9-ods-profile-exercise.md`
- EVD-10 release readiness and containment: this file
- EVD-10 rollback containment:
  `docs/evidence/wp-6-evd-10-rollback-containment.md`

Primary review paths:

- public contract: `docs/contracts/api.md`
- release gate: Linear `BEL-944`
- publication audit gate: Linear `BEL-956`

Integrated upstream state:

- BEL-943 WP-6 release-readiness evidence is merged into `origin/main` by PR
  #39.
- BEL-952 CLI rich IR cutover implementation is merged into `origin/main` by PR
  #38 at `88989a3`.
- BEL-954 CLI rich IR contract tests are merged into `origin/main` by PR #40.
- BEL-955 CLI docs, evidence, and review gates are merged into `origin/main` by
  PR #41 at `66c5338`.

## Conclusion

BEL-989 release verification passes for the declarative validation WP-6B scope.
The verified candidate passed `npm run release:verify`, build, typecheck, full
tests, declarative validation CLI JSON and exit-code coverage, ODS downstream
validation, declarative repeatability, release script dry-run behavior, and
clean-diff checks. Current public containment state is explicit: `v1.0.0` and
npm `latest: 1.0.0` already exist, and BEL-989 performed no tag, publication,
deprecation, dist-tag, or release-completion action.
