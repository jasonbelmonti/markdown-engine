# WP-6 EVD-9: Merge Readiness Record

Date: 2026-05-01
Issue: BEL-888
Work package: WP-6
Validation: VAL-7, VAL-8
Branch: `codex/bel-928-public-package-metadata`

## Scope

This evidence records branch status, review state, milestone state, and merge
decision state for the BEL-928 public package metadata and WP-6 release
containment packet.

## Branch Status

Base state:

- `origin/main`: `9da314fe1b591ef63c282d0ef47c6efe648651d9`
- merged PR: #14, release blocker gate fixes
- local worktree: `.worktrees/bel-928-public-package-metadata`
- branch: `codex/bel-928-public-package-metadata`

BEL-928 intended diff scope:

- `CHANGELOG.md`
- `LICENSE`
- `README.md`
- `SECURITY.md`
- `docs/contracts/api.md`
- `docs/evidence/wp-6-evd-7-release-readiness.md`
- `docs/evidence/wp-6-evd-9-merge-readiness.md`
- `docs/evidence/wp-6-evd-10-rollback-containment.md`
- `docs/evidence/wp-6-evd-11-downstream-handoff.md`
- `docs/execution/markdown-engine-execution-spec.md`
- `package.json`
- `package-lock.json`
- `scripts/prove-repeatability.mjs`
- public API import references in `tests/**`

No `src/**`, parser, normalizer, validator, serializer, rule, or config
behavior change is planned for BEL-928.

## Prior Review And Merge Evidence

Recent landed implementation evidence:

- PR #10 merged WP-5 repeatability and boundary audit work.
- PR #11 merged the narrowed boundary audit proof on 2026-05-01 at
  `add5fe7c336606b9bba9bd5ca9b32da320674e54`.
- Linear `BEL-887` is Done.
- Linear `BEL-888` remains the MS-3 work item.
- Linear `BEL-928` prepares public package metadata and release mechanics.

MS-2 status for WP-6 purposes: treated as satisfied by merged WP-5 plus PR #11
unless the project owner requires a separate explicit MS-2 approval record.

## Milestone Approval Status

| Gate | Status | Merge or release effect |
| --- | --- | --- |
| MS-1 | Satisfied by EVD-1 and landed WP-1 evidence. | No WP-6 blocker. |
| MS-2 | Satisfied for execution purposes by landed WP-2 through WP-5 evidence and PR #11 merge. | No WP-6 drafting blocker; owner may still request an explicit MS-2 note. |
| MS-3 | Pending. | Blocks package tag, package publication, and completion claim. |
| REV-4 | Complete by EVD-11 downstream-consumer confirmation. | No longer blocks MS-3 handoff; retain EVD-11 as release evidence. |

## Merge Decision

BEL-928 merge recommendation after validation passes: ready for project-owner
review as the MS-3 handoff packet.

Merge is not the same as release. Even if the BEL-928 packet merges, `REL-3`
continues to block package tag and publication until MS-3 approval is recorded.

Required before merging BEL-928:

- final validation results recorded in EVD-7
- project-owner review of EVD-7, EVD-9, EVD-10, and EVD-11
- no blocking review findings against public contract, release containment, or
  downstream handoff

Required after merging BEL-928 and before package tag or publication:

- MS-3 approval
- final package version decision
- release notes and containment approval
- final package artifact verification from the exact release candidate

## Final Validation Summary

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 7 test files and 42 tests
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned and 0 forbidden dependency matches
- `npm run build && node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 8 cases per run
- `npm run release:verify`: pass
- clean checkout package preflight with `npm ci` and `npm pack --dry-run --json`: pass, package contains `dist/**`
- isolated tarball install smoke test importing `@jasonbelmonti/markdown-engine`: pass
- `npm publish --dry-run --access public`: pass
- `git diff --check HEAD -- && git diff --exit-code HEAD --`: pass

## Conclusion

BEL-928 is a public package metadata and release-readiness packet. It is
eligible for merge review after validation passes, but it does not authorize
tag, publication, or completion until MS-3 approval is recorded.
