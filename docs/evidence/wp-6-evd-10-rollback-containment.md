# WP-6 EVD-10: Rollback And Containment Record

Date: 2026-05-13
Issue: BEL-888 / BEL-989
Work package: WP-6 / Declarative Validation WP-6B
Validation: VAL-7, VAL-8, VAL-10

## Scope

This evidence records rollback paths, containment decisions, and recovery
limits for `markdown-engine`. BEL-989 updates the record for declarative
validation release verification after `v1.0.0` and npm `latest: 1.0.0` are
observable public artifacts.

## Current Release State

Observed package state during BEL-989:

- package name `@jasonbelmonti/markdown-engine`
- package version `1.0.0`
- repository `origin` is `https://github.com/jasonbelmonti/markdown-engine.git`
- local `v1.0.0` tag exists
- remote `refs/tags/v1.0.0` exists at
  `01cf36ec3da3991b3dc1a0b9cfe7a7cc43211bef`
- npm reports version `1.0.0` with dist-tag `latest: 1.0.0`
- BEL-989 created no tag, package publication, package deprecation, or dist-tag
  change
- no runtime service, persistent storage, database, or live user data state

Historical release decision: BEL-888 withheld package tag and publication before
the first package release.

BEL-989 decision boundary: verification and containment evidence only. Do not
infer project-owner MS-3 approval, do not publish, do not mutate tags or npm
dist-tags, and do not claim release completion from this evidence.

## Rollback Path Before Release

If a blocking issue is found before a corrective branch merges:

- do not merge the affected branch
- update or replace the affected evidence document
- rerun the validation gates recorded in EVD-7 and EVD-10
- request project-owner review again

If a blocking issue is found after merge but before a new package tag or
publication:

- revert the merge commit if the issue is limited to release or evidence
  documentation
- open a corrective branch if the issue requires source/package contract work
- keep new package tag and publication withheld
- record the corrective evidence before requesting MS-3 approval again

If a source behavior defect is discovered before a future release:

- classify whether it changes public API, IR, config, diagnostic, or serialized
  output semantics
- fix on a feature branch with focused tests and updated evidence
- rerun typecheck, full tests, boundary audit, repeatability proof, and
  whitespace checks
- do not publish until the corrected candidate passes project-owner review

## Containment After Accidental Tag Or Publication

BEL-989 does not authorize tag or package mutation. If a public tag or package
publication is later found to be unauthorized or defective:

- stop downstream adoption of the affected artifact when the issue is blocking
- record the tag name, package version, dist-tag state, commit, timestamp, and
  failure mode
- if only a git tag is affected, move or remove the tag from local and remote
  refs only after project-owner approval and downstream-impact review
- if a package was published, use deprecation, a corrective patch, a dist-tag
  correction, or a semver-major successor rather than silently changing the
  public contract
- update EVD-7, EVD-9, EVD-10, and EVD-11 before any renewed release decision
- rerun `npm run release:verify` and the affected focused validation gate from
  the exact corrective candidate

Silent public contract mutation is prohibited after publication.

## Recovery Limit

Recovery is limited to source, documentation, package metadata, npm dist-tags,
package deprecation, and public contract correction. There is no persistent user
data, no live service state, no database migration, no credential rotation, and
no production traffic rollback in scope.

## Release Controls

Controls that remain active for future release or containment decisions:

- do not create, move, or remove a package tag from this evidence task
- do not publish, deprecate, or change npm dist-tags from this evidence task
- require project-owner approval for any release-artifact mutation
- preserve the downstream profile/runtime consumer confirmation recorded in
  EVD-11
- preserve the package boundary proved by EVD-8
- require final package artifact verification from the exact release candidate
- record current public artifact state before proposing rollback or
  containment action

## Conclusion

BEL-989 containment action is record-only. The current public state is already
post-publication for `1.0.0`, so future recovery uses documented source fixes,
tag controls, npm deprecation or dist-tag controls, and semver-correct successor
publication. There is still no persistent data, service, or production traffic
rollback in scope.
