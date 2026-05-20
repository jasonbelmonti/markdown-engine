# WP-6 EVD-7: Semver And Release Readiness Record

Date: 2026-05-01
Issue: BEL-888
Work package: WP-6
Validation: VAL-7, VAL-8
Branch: `codex/bel-928-public-package-metadata`
Base: `origin/main` at `9da314fe1b591ef63c282d0ef47c6efe648651d9`

## Current Status

This is historical release-readiness evidence for the initial `0.1.0` package
metadata lane. The release-withhold and MS-3 approval language below records the
2026-05-01 BEL-888/BEL-928 state. As of the current repository state, package
metadata is `@jasonbelmonti/markdown-engine@2.0.0`; do not read this record as a
live release authorization or live package-version statement.

## Scope

This evidence records the release-readiness state for the initial
`markdown-engine` implementation package after PR #11 merged WP-5 boundary
audit cleanup.

This packet does not authorize a package tag or publication. It records the
decision gate and the evidence required for MS-3 review.

## Evidence Index

| ID | Evidence | Status |
| --- | --- | --- |
| EVD-1 | [WP-1C MS-1 evidence](wp-1c-ms-1-evidence.md) | Present on `main`; critical parse-normalize-validate-serialize path proven. |
| EVD-2 | [WP-3 parser/frontmatter fixture report](wp-3-evd-2-parser-frontmatter-fixtures.md) | Present on `main`; 30 parser/frontmatter fixtures and selected `cmark-gfm` comparison cases recorded. |
| EVD-3 | [WP-3 IR and diagnostic snapshot report](wp-3-evd-3-ir-diagnostic-snapshots.md) | Present on `main`; normalized IR, diagnostic snapshot, source-location, and inert raw-HTML representation evidence recorded. |
| EVD-4 | [WP-4 config and rule validation report](wp-4-evd-4-rule-validation.md) | Present on `main`; five deterministic rule families, raw HTML policy diagnostics, and unsupported-rule diagnostics recorded. |
| EVD-5 | [WP-5 repeatability report](wp-5-evd-5-repeatability.md) | Present on `main`; ten-run byte-for-byte serialization repeatability recorded. |
| EVD-6 | [WP-2 contract review packet](wp-2-evd-6-contract-review.md) | Present on `main`; API, IR, config, diagnostics, serialization, and semver guidance recorded. |
| EVD-7 | This release-readiness record | Present in WP-6; semver classification, package version decision, validation output, and release recommendation recorded. |
| EVD-8 | [WP-5 boundary dependency audit and review report](wp-5-evd-8-boundary-inspection.md) | Present on `main`; dependency audit and source-boundary review recorded. |
| EVD-9 | [WP-6 merge readiness record](wp-6-evd-9-merge-readiness.md) | Present in WP-6; branch, PR, review, milestone, and merge decision state recorded. |
| EVD-10 | [WP-6 rollback and containment record](wp-6-evd-10-rollback-containment.md) | Present in WP-6; rollback path, release withholding, and containment limits recorded. |
| EVD-11 | [WP-6 downstream handoff notes](wp-6-evd-11-downstream-handoff.md) | Present in WP-6; downstream consumer status and implementation handoff notes recorded. |

## Public Contract Readiness

Public contract documents:

- [`docs/contracts/api.md`](../contracts/api.md)
- [`docs/contracts/frontmatter.md`](../contracts/frontmatter.md)

Public package root exports:

- `parse`
- `normalize`
- `validate`
- `serialize`
- public API, IR, config, diagnostic, source-location, and serialization types

Supported deterministic rule families:

- `frontmatter.required`
- `headings.required`
- `codeFences.languages`
- `links.allowedSchemes`
- `rawHtml.policy`

The public contract excludes raw mdast/unified parser AST nodes, raw parser
`position` fields, raw YAML parser documents/CST/tokens, profile compiler
behavior, runtime lenses, MCP transport, agent adapters, network services,
persistence, LLM calls, semantic rubrics, and arbitrary rule plugins.

## Semver Classification

Current package state:

- `package.json` name: `@jasonbelmonti/markdown-engine`
- `package.json` version: `0.1.0`
- `package.json` private flag: absent
- `package.json` license: `MIT`
- `package.json` publish access: public through `publishConfig.access`
- package tag: none authorized by WP-6
- package publication: none authorized by WP-6

Compatibility classification before first public release:

- Initial package publication, if approved later, should be classified as an
  initial pre-1.0 release because there is no prior public package contract.
- First public package version prepared by BEL-928: `0.1.0`.
- Keep package tag and publication withheld until the project owner explicitly
  approves MS-3, downstream confirmation or waiver, and publish mechanics.

Post-release compatibility rules remain those recorded in
[`docs/contracts/api.md`](../contracts/api.md) and EVD-6:

- API signature or exported type removals: major
- public result field removal or semantic change: major
- diagnostic code or severity semantic change: major
- added optional result fields: minor
- added supported deterministic rule families: minor
- behavior fixes that preserve public shape and semantics: patch

## Release Recommendation

Recommendation: withhold tag and publication.

Rationale:

- MS-3 approval is not yet recorded.
- REV-4 downstream profile/runtime consumer confirmation is recorded in EVD-11.
- The package metadata is prepared for `@jasonbelmonti/markdown-engine@0.1.0`,
  but publication is not authorized by metadata readiness alone.
- The current branch is a release metadata preparation change, not a package
  tag or publication.

Required before tag or publication:

- project-owner MS-3 approval
- final package version decision
- final release notes and containment approval
- clean validation output from the current release candidate commit
- successful `npm publish --dry-run` or equivalent final publish preflight

## BEL-928 Validation Output

Final validation for the BEL-928 release metadata candidate was rerun at
2026-05-01 16:58 CDT from
`/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/bel-928-public-package-metadata`.

Results:

- `npm run typecheck`: pass
- `npm test`: pass, 7 test files and 42 tests
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned and 0 forbidden dependency matches
- `npm run build && node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 8 cases per run
- `npm run release:verify`: pass
- direct `npm pack --dry-run --json`: pass, `prepack` runs `release:verify` before artifact creation
- clean checkout package preflight with `npm ci` and `npm pack --dry-run --json`: pass, package contains `dist/**`
- isolated tarball install smoke test importing `@jasonbelmonti/markdown-engine`: pass
- `npm publish --dry-run --access public`: pass
- `git diff --check HEAD -- && git diff --exit-code HEAD --`: pass

## Conclusion

VAL-7 is ready for MS-3 review after BEL-928 metadata preparation. Release
remains contained: no tag and no package publication are authorized by this
packet.
