# BEL-965 Release Audit Track: Version Cutover

Date: 2026-05-07 16:12 CDT / 2026-05-07 21:12 UTC
Issue: BEL-965
Parent audit: BEL-956
Baseline: `origin/main` at `5c5dbe57d9da6fd23cfba355a9fc7f04f32dba3d`
Worktree: `.worktrees/BEL-965-version-cutover`

## Scope

This audit verifies the 1.0 package version, document-version policy,
compatibility semantics, CLI default-output migration path, npm state, git tag
state, publish-time package metadata normalization, release gates, and
publication decision path before release.

BEL-965 does not authorize a tag, npm publication, package-version promotion,
document-version promotion, or release-completion claim. It records whether the
version cutover path is explicit enough for the parent BEL-956 publication
audit to make a later publish-ready, keep-withheld, or supersede decision.

## Recommendation

WITHHOLD.

The repository is operationally healthy enough to continue release preparation:
all BEL-956 child audit tracks except BEL-965 are Done in Linear, the current
candidate passes the documented release gates, package dry-run succeeds, and
the npm `bin[markdown-engine]` metadata normalization warning has been resolved
without changing package version or runtime code. However, version cutover is
not approved because the final package version, final document version, npm
publication target, git tag, and publication approval remain unresolved release
decisions. No loaded Linear issue, repository document, package metadata file,
npm registry result, or git tag state authorizes `v1.0.0`, npm `1.0.0`, or
promotion from `"1.0.0-draft"` to `"1.0.0"`.

## Source-Grounded Findings

- PASS: BEL-965 direct blockers are cleared. Linear `BEL-957`, `BEL-958`, and
  `BEL-960` are Done.
- PASS: Parent audit sibling tracks are complete. Linear child issues
  `BEL-957` through `BEL-964` and `BEL-966` through `BEL-970` are Done.
  `BEL-956` remains In Progress and is the controlling publication audit.
- BLOCKER: Final package version is not cut over. `package.json:1-3`,
  `package-lock.json:1-9`, and the lockfile root package all remain
  `@jasonbelmonti/markdown-engine@0.1.0`.
- PASS: Publish-time bin metadata is normalized in source. `package.json:6-8`
  maps the `markdown-engine` binary to `dist/cli/index.js` without the leading
  `./`, matching npm's publish-time normalization.
- BLOCKER: npm release state is still contained. `npm view
  @jasonbelmonti/markdown-engine version versions dist-tags --json` returned
  current version `0.1.0`, versions `["0.1.0"]`, and `latest: "0.1.0"`.
- BLOCKER: git release state is still contained. `git ls-remote --tags origin
  'v*'` returned only `refs/tags/v0.1.0` and its dereferenced object. No
  `v1.0.0` remote tag exists.
- BLOCKER: Final document-version policy is not approved. Source declares
  `EngineDocumentVersion = "0.0.0" | "1.0.0-draft"` at
  `src/api/document.ts:3`. The design still says a 1.0 document must carry
  `version: "1.0.0"` at
  `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md:442-452`,
  while the same design notes that final release approval must decide whether
  draft names are promoted or revised at
  `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md:409-421`.
- PASS: Current compatibility semantics are internally reconciled for the
  contained state. `compatibilityMode: "default"` maps to `"1.0.0-draft"` and
  `compatibilityMode: "legacy-0.1"` maps to `"0.0.0"` at
  `src/api/compatibility.ts:29-32`; tests prove acceptance and rejection for
  both document-bearing paths at `tests/rich-ir-compat.test.ts:64-127`.
- PASS: Current API and docs state the same contained document-version model.
  `docs/contracts/api.md:71-74` says the published `0.1.0`-compatible path is
  `"0.0.0"` and the 1.0 implementation lane uses `"1.0.0-draft"` until final
  approval. `docs/contracts/api.md:264-301` describes the 1.0 draft contract,
  and `docs/contracts/api.md:429-455` records the compatibility and migration
  selectors.
- PASS: CLI default-output migration is classified. The CLI default document
  version is `"1.0.0-draft"` at `src/cli/document-version.ts:6-20`; the focused
  CLI tests prove default rich IR, explicit legacy output, invalid final
  `"1.0.0"` rejection, and explicit draft selection at
  `tests/cli.test.ts:27-174`. README documents the breaking default-output
  behavior and migration path to pin `--document-version 0.0.0` at
  `README.md:109-140`; the API contract repeats the same CLI migration at
  `docs/contracts/api.md:457-490`.
- WATCH: `CHANGELOG.md` is not publish-ready for 1.0. It has an Unreleased note
  and a `0.1.0` release record at `CHANGELOG.md:3-36`, but no final 1.0 entry
  for the expanded public surface, document-version policy, compatibility
  selectors, CLI default change, npm tag, or publication decision.
- WATCH: `npm publish --dry-run --access public` reruns both lifecycle release
  gates but is not green for the current contained package version. After the
  bin metadata normalization fix, the remaining dry-run failure is npm refusing
  to publish over already-published version `0.1.0`.
- PASS: Current release authority remains WITHHOLD. README states that BEL-944
  withholds the actual 1.0 tag and package publication until BEL-956 completes,
  and that `@jasonbelmonti/markdown-engine@0.1.0` remains the latest published
  package at `README.md:177-204`.

## Success Criteria Status

- [x] Final package version, document version, npm tag, git tag, and
  publication decision are explicitly recorded as blockers.
- [x] `1.0.0-draft`, `0.0.0`, `compatibilityMode: "default"`, and
  `compatibilityMode: "legacy-0.1"` semantics are reconciled across current
  code, docs, CLI, and tests under the existing withhold decision.
- [x] Breaking CLI default-output behavior is classified and has a documented
  migration path: consumers that need the legacy JSON shape must pin
  `--document-version 0.0.0`.
- [x] This issue and evidence do not claim 1.0 publication authority before the
  actual release gate approves it.

## Validation Results

- `git status --short --branch`: clean branch
  `codex/bel-965-version-cutover...origin/main` after the BEL-965 commit.
- `git rev-parse HEAD`: `5c5dbe57d9da6fd23cfba355a9fc7f04f32dba3d`.
- `node -e` package metadata probe: `package.json`, `package-lock.json`, and
  the lockfile root package all report `0.1.0`.
- `git ls-remote --tags origin 'v*'`: pass for containment evidence; remote
  reports only `v0.1.0`.
- `npm view @jasonbelmonti/markdown-engine version versions dist-tags --json`:
  pass for containment evidence; registry reports only `0.1.0` and
  `latest: "0.1.0"`.
- `npm run docs:rich-ir-contract`: pass.
- `npm run release:verify`: pass. Included `tsc -p tsconfig.json --noEmit`,
  16 Vitest files and 102 tests, boundary audit, build, repeatability proof,
  and clean-diff check.
- `npm pack --dry-run`: pass after rerunning `prepack` and `release:verify`;
  dry-run artifact metadata remains
  `@jasonbelmonti/markdown-engine@0.1.0`.
- `npm publish --dry-run --access public`: expected fail after rerunning
  `prepublishOnly`, `prepack`, and both release verification gates. Failure was
  `You cannot publish over the previously published versions: 0.1.0.` No
  `bin[markdown-engine]` metadata normalization warning was emitted after the
  package metadata fix.

## Required Next Decision

Before BEL-956 can recommend publication, an explicit release decision must
resolve all of the following in one controlled release-prep path:

- final package version, including package and lockfile metadata
- final document version, including whether `"1.0.0-draft"` is promoted,
  retained, or superseded
- compatibility mappings and tests for the approved document-version policy
- `CHANGELOG.md`, README, API docs, and release evidence for the final 1.0
  contract
- npm publish dry-run state for a not-yet-published package version
- npm dist-tag and git tag plan
- explicit publication approval separate from BEL-965
