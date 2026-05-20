# BEL-957 Release Audit Group 1: Public API, Versioning, And Compatibility

Date: 2026-05-06 22:00 CDT / 2026-05-07 03:00 UTC
Issue: BEL-957
Parent audit: BEL-956
Baseline: `origin/main` at `44bfa7b488950b9a7ae1fec7cf41dde9c6fcde59`
Worktree: `.worktrees/BEL-957-release-audit-group-1`

## Current Status

This is a dated BEL-956 release-audit record. Statements below about the
`0.1.0` package, `1.0.0-draft` document lane, and release-withhold blockers
describe the 2026-05-06 audit baseline. As of the current repository state,
package metadata is `@jasonbelmonti/markdown-engine@2.0.0` and the current
public document contract uses `documentVersion: "1.0.0"`.

## Scope

This audit verifies the package root public API, package metadata, document
version policy, compatibility gates, and release containment state before any
1.0 tag or npm publication. It does not authorize a tag, package publish,
document-version promotion, or public API shape change.

## Conclusion

Release publication remains blocked pending an explicit final 1.0 package-version
and document-version decision. The package-root API surface and compatibility
gates are source-consistent and validated, but the final release policy still
needs project-owner approval before a 1.0 tag or npm package can be created.

## Audit Results

- PASS: Package root export mapping and public API docs agree on the current
  six-entry public surface. `package.json` maps `.` to `dist/index.js` and
  `dist/index.d.ts` at `package.json:25-29`. `src/index.ts:1` re-exports
  `src/api/contracts.ts`; `src/api/contracts.ts:1-16` names `parse`,
  `normalize`, `validate`, `serialize`, `documentQueries`, and
  `validateAnnotations`, then re-exports the defining modules. README and API
  docs list the same six entries at `README.md:33-42` and
  `docs/contracts/api.md:12-24`.
- PASS: The six named API entries are backed by source exports. The implementation
  exports `parse` at `src/api/parse.ts:25-30`, `normalize` at
  `src/api/normalize.ts:17-23`, `validate` at `src/api/validate.ts:27-33`,
  `serialize` at `src/api/serialize.ts:27-34`, `documentQueries` at
  `src/api/document-queries.ts:21-29`, and `validateAnnotations` at
  `src/api/annotations.ts:11-17`.
- PASS: Compatibility behavior is explicit and tested. `EngineDocumentVersion`
  is `"0.0.0" | "1.0.0-draft"` at `src/api/document.ts:3`.
  `compatibilityMode: "default"` maps to `"1.0.0-draft"` and
  `compatibilityMode: "legacy-0.1"` maps to `"0.0.0"` at
  `src/api/compatibility.ts:29-32`; mismatches throw
  `EngineCompatibilityError` at `src/api/compatibility.ts:44-52`.
  `tests/rich-ir-compat.test.ts:64-127` proves accepted and rejected
  document-bearing results for both modes.
- PASS: Release containment matches the current withhold decision. `package.json`
  remains `0.1.0` at `package.json:1-3`, README states the latest published
  package remains `0.1.0` and 1.0 publication is withheld pending BEL-956 at
  `README.md:174-190`, and EVD-10 records no authorized 1.0 package version,
  tag, or publication at `docs/evidence/wp-6-evd-10-release-readiness.md:15-19`
  and `docs/evidence/wp-6-evd-10-release-readiness.md:35-55`.
- BLOCKER: Final 1.0 package-version and document-version policy is not yet
  confirmed. The design says a 1.0 document must carry `version: "1.0.0"` at
  `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md:442-452`,
  while current implementation and contract docs use `"1.0.0-draft"` at
  `src/api/document.ts:3`, `src/api/compatibility.ts:29-32`, and
  `docs/contracts/api.md:264-301`. The design status note explicitly defers the
  decision on whether draft names are promoted as-is or revised before the public
  `"1.0.0"` contract at
  `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md:409-421`.
  BEL-957 cannot clear release publication until this policy is decided.
- WATCH: `CHANGELOG.md` does not contradict the current withhold state, but it is
  not publish-ready for 1.0. The published `0.1.0` entry lists only
  `parse`, `normalize`, `validate`, and `serialize` at `CHANGELOG.md:10-18`,
  while README and API docs describe the expanded draft surface. Before a 1.0
  release decision, the changelog needs an explicit 1.0 or unreleased entry for
  the expanded public surface, compatibility selectors, CLI default change, and
  final document-version policy.

## Validation Results

- `npm view @jasonbelmonti/markdown-engine versions --json`: pass; registry
  reports only `["0.1.0"]`.
- `git ls-remote --tags origin 'v*'`: pass; remote reports `v0.1.0` only and no
  `v1.0.0` tag.
- `npm run test:rich-ir:compat`: pass, 1 file and 6 tests.
- `npm run docs:rich-ir-contract`: pass; checked `docs/contracts/api.md`,
  `README.md`, `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`,
  `docs/evidence/wp-5-evd-6-rich-ir-contract.md`, and
  `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`.
- `npm run test:rich-ir:downstream`: pass, 1 file and 2 tests.
- `npm run release:verify`: pass. This included typecheck, full tests
  (16 files, 96 tests), boundary dependency audit, build, 10-run serialization
  repeatability with 14 cases per run, whitespace check, and clean-diff check.

## Success Criteria Status

- [x] Package root exports and documented public API agree for `parse`,
  `normalize`, `validate`, `serialize`, `documentQueries`, and
  `validateAnnotations`.
- [ ] Final 1.0 package-version and document-version policy is explicitly
  confirmed, including whether `1.0.0-draft` is promoted, retained, or superseded
  before release.
- [x] `compatibilityMode: "default"` and `compatibilityMode: "legacy-0.1"`
  behavior is proven for accepted and rejected document-bearing results.
- [x] `README.md`, `docs/contracts/api.md`, `CHANGELOG.md`, and `package.json` do
  not contradict the current BEL-944/BEL-956 release-withhold decision.

## Required Next Decision

Before any 1.0 tag or npm publication, BEL-956 or a project-owner release
decision must explicitly decide the final package version and document version:
promote `"1.0.0-draft"` to `"1.0.0"`, retain it as a published contract, or
supersede it with another approved policy. After that decision, update
`package.json`, lockfile metadata if needed, `src/api/document.ts`,
compatibility gates, README, API docs, CHANGELOG, and validation evidence in one
controlled release-prep change.
