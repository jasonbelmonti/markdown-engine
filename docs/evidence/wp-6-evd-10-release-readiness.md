# WP-6 EVD-10: 1.0 Release Readiness And Containment

Date: 2026-05-06
Issue: BEL-943
Work package: WP-6
Validation: VAL-10
Baseline: `origin/main` at `88989a3`

## Scope

This evidence records BEL-943 release-readiness validation, release containment,
and handoff state for the 1.0 rich IR implementation lane.

This packet does not authorize a 1.0 tag, package publication, or release
completion claim. That decision remains blocked until MS-3 is recorded in
Linear through BEL-944.

## Evidence Index

| Evidence | Status |
| --- | --- |
| EVD-6 | [Rich IR contract docs](wp-5-evd-6-rich-ir-contract.md) are present and document the 1.0 draft contract, compatibility selectors, annotation target shape, source-slice behavior, migration notes, and non-goals. |
| EVD-8 | [Boundary inspection](wp-5-evd-8-boundary-inspection.md) and [compatibility / CLI impact](wp-5-evd-8-compatibility-cli-impact.md) are present. |
| EVD-9 | [Downstream exercise](wp-6-evd-9-downstream-exercise.md) is present and proves sections, spans, source slices, query helpers, and annotations without semantic leakage. |
| EVD-10 | This release-readiness and containment record is present. |

Historical 0.1.0 release evidence remains in the adjacent WP-6 files. The
1.0-specific release readiness evidence is this file plus EVD-9.

## Release State

Current package state:

- package name: `@jasonbelmonti/markdown-engine`
- package version: `0.1.0`
- 1.0 draft document selector: `documentVersion: "1.0.0-draft"`
- retained legacy selector: `documentVersion: "0.0.0"`
- 1.0 draft serialization gate: `compatibilityMode: "default"`
- legacy serialization gate: `compatibilityMode: "legacy-0.1"`
- package tag: no 1.0 tag authorized by BEL-943
- package publication: no 1.0 publication authorized by BEL-943

Release recommendation for BEL-943: withhold 1.0 tag and publication until
BEL-944 records the MS-3 publish, withhold, or supersede decision.

## Validation Commands

Required BEL-943 commands:

```sh
npm run test:rich-ir:downstream
npm run audit:rich-ir-boundary
npm run release:verify
```

Additional preflight commands:

```sh
npm run docs:rich-ir-contract
npm run typecheck
```

## Recorded Results

Final validation from `.worktrees/BEL-943-wp-6-release-readiness`:

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

## Rollback And Containment

Before any 1.0 release:

- withhold the 1.0 tag if downstream exercise, boundary audit, repeatability,
  release verification, or MS-3 review fails
- revert or supersede the BEL-943 branch if evidence or release-readiness
  documentation is wrong
- open a corrective implementation branch if source or public contract behavior
  is wrong
- keep `@jasonbelmonti/markdown-engine@0.1.0` as the latest stable package
  contract

After any accidental 1.0 tag or publication without MS-3:

- stop downstream adoption of the unauthorized artifact
- remove an unauthorized git tag only after project-owner approval
- deprecate or supersede an unauthorized package version instead of silently
  mutating the public contract
- rerun EVD-9 and EVD-10 validation before requesting another release decision

There is no database, persistent user data, credential, live service, or
production traffic rollback in scope.

## Handoff State

Next Linear gate: BEL-944.

Handoff packet:

- public contract: `docs/contracts/api.md`
- downstream exercise evidence: `docs/evidence/wp-6-evd-9-downstream-exercise.md`
- release readiness and containment: this file
- compatibility / CLI impact: `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`
- boundary inspection: `docs/evidence/wp-5-evd-8-boundary-inspection.md`

Integrated upstream state:

- BEL-952 CLI rich IR cutover is already merged into `origin/main` at
  `88989a3`. BEL-943 does not add or modify CLI behavior beyond carrying that
  landed baseline.

## Conclusion

BEL-943 prepares the 1.0 rich IR implementation lane for MS-3 review. Release
remains contained: no 1.0 tag, package publication, or release completion claim
is authorized until BEL-944 records the final MS-3 decision.
