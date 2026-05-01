# WP-6 EVD-10: Rollback And Containment Record

Date: 2026-05-01
Issue: BEL-888
Work package: WP-6
Validation: VAL-7, VAL-8

## Scope

This evidence records the rollback path, containment decision, and recovery
limits for `markdown-engine` before any first package release.

## Current Release State

Current package state:

- package name `@jasonbelmonti/markdown-engine`
- version `0.1.0`
- publish access prepared as public package metadata
- no package tag authorized by WP-6
- no package publication authorized by WP-6
- no runtime service, persistent storage, database, or live user data state

Release decision: withhold package tag and publication.

Release blocker: MS-3 approval and downstream profile/runtime consumer
confirmation are not yet recorded.

## Rollback Path Before Release

If a blocking issue is found before WP-6 merges:

- do not merge the WP-6 branch
- update or replace the affected evidence document
- rerun the validation gates recorded in EVD-7
- request project-owner review again

If a blocking issue is found after WP-6 merges but before any package tag or
publication:

- revert the WP-6 merge commit if the issue is limited to release or evidence
  documentation
- open a corrective branch if the issue requires source/package contract work
- keep package tag and publication withheld
- record the corrective evidence before requesting MS-3 approval again

If a source behavior defect is discovered before first release:

- classify whether it changes public API, IR, config, diagnostic, or serialized
  output semantics
- fix on a feature branch with focused tests and updated evidence
- rerun typecheck, full tests, boundary audit, repeatability proof, and
  whitespace checks
- do not publish until the corrected candidate passes MS-3 review

## Containment After Accidental Tag Or Publication

WP-6 does not authorize this path. If a tag or package publication happens
without MS-3 approval:

- stop downstream adoption of the published artifact
- record the tag or package version and timestamp
- if only a git tag exists, remove the unauthorized tag from local and remote
  refs after project-owner approval
- if a package was published, use deprecation and a corrective patch or
  semver-major plan rather than silently changing the public contract
- update EVD-7, EVD-9, EVD-10, and EVD-11 before any renewed release decision

Silent public contract mutation is prohibited after publication.

## Recovery Limit

Recovery is limited to source, documentation, package metadata, and public
contract correction. There is no persistent user data, no live service state,
no database migration, no credential rotation, and no production traffic
rollback in scope.

## Release Controls

Controls that remain active until MS-3 approval:

- keep package tag withheld
- do not create a package tag
- do not publish to a package registry
- require project-owner approval for MS-3
- require downstream profile/runtime consumer confirmation or explicit owner
  waiver
- preserve the package boundary proved by EVD-8
- require final package artifact verification from the exact release candidate

## Conclusion

The safe containment decision is to withhold release. The rollback path remains
simple before first release: branch correction or merge revert, followed by
revalidation and renewed MS-3 review.
