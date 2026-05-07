# WP-6 EVD-10: 1.0 Release Readiness And Containment

Date: 2026-05-07
Issue: BEL-943 / BEL-944 / BEL-956
Work package: WP-6
Validation: VAL-10
Baseline: `origin/main` at `66c5338`

## Scope

This evidence records BEL-943 release-readiness validation, release containment,
handoff state, the BEL-944 MS-3 withhold decision, and the BEL-965 release
cutover update for the 1.0 rich IR release lane.

BEL-944 withheld the 1.0 tag and package publication until BEL-956 child audit
tracks completed. BEL-965 records the release-cutover update: package metadata
and the public document contract are promoted to `1.0.0`, the release gates
must pass from the final commit, and local `v1.0.0` tag creation is authorized
after that validation. Npm publication remains a separate explicit operation.

## Evidence Index

| Evidence | Status |
| --- | --- |
| EVD-6 | [Rich IR contract docs](wp-5-evd-6-rich-ir-contract.md) are present and document the 1.0 contract, compatibility selectors, annotation target shape, source-slice behavior, migration notes, and non-goals. |
| EVD-7 | [Release readiness](wp-6-evd-7-release-readiness.md) is present as historical package-readiness evidence for the published `0.1.0` lane and remains linked for handoff completeness. |
| EVD-8 | [Boundary inspection](wp-5-evd-8-boundary-inspection.md) and [compatibility / CLI impact](wp-5-evd-8-compatibility-cli-impact.md) are present. |
| EVD-9 | [Downstream exercise](wp-6-evd-9-downstream-exercise.md) is present and proves sections, spans, source slices, query helpers, and annotations without semantic leakage. |
| EVD-10 | This release-readiness and containment record is present. |

Historical 0.1.0 release evidence remains in the adjacent WP-6 files. The
1.0-specific release readiness evidence is this file plus EVD-9, with CLI
cutover evidence carried by the EVD-8 compatibility / CLI impact record.

## Release State

Current package state:

- package name: `@jasonbelmonti/markdown-engine`
- package version: `1.0.0`
- 1.0 document selector: `documentVersion: "1.0.0"`
- retained legacy selector: `documentVersion: "0.0.0"`
- 1.0 serialization gate: `compatibilityMode: "default"`
- legacy serialization gate: `compatibilityMode: "legacy-0.1"`
- npm latest version observed before final publication: `0.1.0`
- git tag state before BEL-965 final tag creation: `v0.1.0`; no remote
  `v1.0.0` tag
- package tag: BEL-965 authorizes local `v1.0.0` tag creation after the final
  release cutover commit passes the release gates
- package publication: npm publication remains a separate explicit operation
  after the final dry-run passes
- publication audit gate: Linear `BEL-956`; child audit tracks complete with
  BEL-965 recording the final tag decision

MS-3 decision update for BEL-965: promote package metadata and the public
document contract to `1.0.0`, create `v1.0.0` only after validation passes, and
keep npm publication as a separate explicit operation.

## Validation Commands

Required BEL-944 commands:

```sh
npm run test:rich-ir:downstream
npm run release:verify
```

Additional BEL-943 preflight commands already covered by `release:verify` or
adjacent evidence:

```sh
npm run docs:rich-ir-contract
npm run audit:rich-ir-boundary
npm run typecheck
```

## Recorded Results

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
- Downstream review: EVD-9 proves the downstream structural exercise, and EVD-11
  records downstream-consumer confirmation for the package handoff.
- Boundary/security review: EVD-8 boundary inspection remains passing, and the
  BEL-944 `release:verify` run repeated the boundary audit with 0 forbidden
  dependency matches and 0 annotation semantic leakage matches.

## Rollback And Containment

Before any future 1.0 release:

- withhold the 1.0 tag if downstream exercise, boundary audit, repeatability,
  release verification, MS-3 review, or BEL-956 publication audit fails
- revert or supersede the BEL-943 branch if evidence or release-readiness
  documentation is wrong
- open a corrective implementation branch if source or public contract behavior
  is wrong
- keep `@jasonbelmonti/markdown-engine@0.1.0` as the latest stable package
  contract
- require BEL-956 audit completion and a new explicit publish decision before
  creating a 1.0 tag or publishing a 1.0 package

After any accidental 1.0 tag or publication without MS-3 approval or BEL-956
clearance:

- stop downstream adoption of the unauthorized artifact
- remove an unauthorized git tag only after project-owner approval
- deprecate or supersede an unauthorized package version instead of silently
  mutating the public contract
- rerun EVD-9 and EVD-10 validation before requesting another release decision

There is no database, persistent user data, credential, live service, or
production traffic rollback in scope.

## Handoff State

BEL-944 state: MS-3 decision recorded as withhold. BEL-956 blocks any actual
1.0 tag or npm publication until the publication audit is complete.

Handoff packet:

- EVD-6 rich IR contract docs: `docs/evidence/wp-5-evd-6-rich-ir-contract.md`
- EVD-7 release readiness: `docs/evidence/wp-6-evd-7-release-readiness.md`
- EVD-8 boundary inspection: `docs/evidence/wp-5-evd-8-boundary-inspection.md`
- EVD-8 compatibility / CLI impact:
  `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`
- EVD-9 downstream exercise:
  `docs/evidence/wp-6-evd-9-downstream-exercise.md`
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

BEL-965 records the release cutover decision: promote package metadata and the
public rich IR document contract to `1.0.0`, validate the final commit with the
release gates, and create `v1.0.0` only after those gates pass. The release
candidate passes the required downstream exercise and release verification
gates, and the handoff packet links EVD-6 through EVD-10. Npm publication
remains a separate explicit operation after publish dry-run validation.
