# BEL-965 Release Audit Track: Version Cutover

Date: 2026-05-07 16:23 CDT / 2026-05-07 21:23 UTC
Issue: BEL-965
Parent audit: BEL-956
Baseline: `origin/main` at `5c5dbe57d9da6fd23cfba355a9fc7f04f32dba3d`
Worktree: `.worktrees/BEL-965-version-cutover`

## Current Status

This is historical release-cutover evidence for the 1.0 lane. The GO
recommendation, `1.0.0` package metadata, tag authorization, and npm state below
describe the 2026-05-07 BEL-965 decision point. As of the current repository
state, package metadata is `@jasonbelmonti/markdown-engine@2.0.0`; use current
contract docs and newer release evidence for live 2.0 status.

## Scope

This audit verifies the 1.0 package version, document-version policy,
compatibility semantics, CLI default-output migration path, npm state, git tag
state, publish-time package metadata, release gates, and publication decision
path before release.

BEL-965 authorizes the local `v1.0.0` git tag only after the release cutover
commit passes the release gates from a clean tracked state. It does not perform
npm publication; `npm publish --access public` remains a separate explicit
operation.

## Recommendation

GO for `v1.0.0` tag creation after final validation.

The version cutover is now explicit and internally consistent:

- package metadata is promoted to `@jasonbelmonti/markdown-engine@1.0.0`
- the rich IR document selector is promoted to `documentVersion: "1.0.0"`
- `compatibilityMode: "default"` expects document version `"1.0.0"`
- retained legacy compatibility remains explicit as `documentVersion: "0.0.0"`
  and `compatibilityMode: "legacy-0.1"`
- the CLI default output emits final `document.version: "1.0.0"`
- the CLI rejects the former implementation-lane selector `1.0.0-draft`
- `CHANGELOG.md`, README, API docs, release evidence, tests, and snapshots are
  aligned with the final 1.0 contract
- npm publish-time `bin[markdown-engine]` metadata is normalized in source

## Source-Grounded Findings

- PASS: BEL-965 direct blockers are cleared. Linear `BEL-957`, `BEL-958`, and
  `BEL-960` are Done.
- PASS: Parent audit sibling tracks are complete. Linear child issues
  `BEL-957` through `BEL-964` and `BEL-966` through `BEL-970` are Done.
- PASS: Final package version is cut over. `package.json`, `package-lock.json`,
  and the lockfile root package all report version `1.0.0`.
- PASS: Publish-time bin metadata is normalized in source. `package.json`
  maps the `markdown-engine` binary to `dist/cli/index.js` without the leading
  `./`, matching npm's publish-time normalization.
- PASS: Final document-version policy is approved for the tag. Source declares
  `EngineDocumentVersion = "0.0.0" | "1.0.0"` at `src/api/document.ts`, and the
  1.0 view builder emits `version: "1.0.0"`.
- PASS: Compatibility semantics are reconciled. `compatibilityMode: "default"`
  maps to `"1.0.0"` and `compatibilityMode: "legacy-0.1"` maps to `"0.0.0"` at
  `src/api/compatibility.ts`; tests prove acceptance and rejection for both
  document-bearing paths.
- PASS: CLI default-output migration is classified. The CLI default document
  version is `"1.0.0"` at `src/cli/document-version.ts`; tests prove default
  rich IR output, explicit legacy output, explicit final selector output, and
  rejection of the former `1.0.0-draft` selector.
- PASS: Current API docs and README state the same final document-version
  model, retained legacy selector, CLI migration path, and release gate.
- PASS: `CHANGELOG.md` records the `1.0.0` release and the breaking CLI default
  JSON output-shape change.
- PASS: Remote containment was checked before tag creation. `git ls-remote
  --tags origin 'v1.0.0*'` returned no remote `v1.0.0` tag before local tag
  creation.
- PASS: npm registry state was checked before publication. `npm view
  @jasonbelmonti/markdown-engine version versions dist-tags --json` reported
  only published version `0.1.0` before any 1.0 npm publication.

## Success Criteria Status

- [x] Final package version, document version, npm tag, git tag, and
  publication decision are explicitly recorded.
- [x] `1.0.0`, `0.0.0`, `compatibilityMode: "default"`, and
  `compatibilityMode: "legacy-0.1"` semantics are reconciled across current
  code, docs, CLI, and tests.
- [x] Breaking CLI default-output behavior is classified and has a documented
  migration path: consumers that need the legacy JSON shape must pin
  `--document-version 0.0.0`.
- [x] No issue, document, or release evidence claims npm publication authority
  from BEL-965 alone.

## Validation Plan

The `v1.0.0` tag must point at a commit that passes:

- `npm run docs:rich-ir-contract`
- `npm run release:verify`
- `npm pack --dry-run`
- `npm publish --dry-run --access public`

Final validation output is recorded in the BEL-965 Linear closeout comment. The
tag is not created until those commands complete from the final clean commit.

## Release Decision

Create a local annotated `v1.0.0` git tag on the final validated release cutover
commit. Do not publish to npm from BEL-965 unless a separate explicit
publication instruction is given after the dry-run passes.
