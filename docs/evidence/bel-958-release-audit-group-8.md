# BEL-958 Release Audit Group 8: Serialization, Release Gates, And Evidence Integrity

Date: 2026-05-07 06:07 CDT / 2026-05-07 11:07 UTC
Issue: BEL-958
Parent audit: BEL-956
Baseline: `origin/main` at `dc513a0c0d228e6c6b47e91329a06bf43318dec7`
Worktree: `.worktrees/BEL-958-release-audit-group-8`

## Current Status

This is a dated BEL-956 release-audit record. Statements below about the
`0.1.0` package, publish dry-run blocker, and release-withhold state describe
the 2026-05-07 audit baseline. As of the current repository state, package
metadata is `@jasonbelmonti/markdown-engine@2.0.0`; preserved command output and
tarball previews remain historical audit facts.

## Scope

This audit verifies deterministic serialization, release script behavior,
snapshot contract handling, and evidence integrity before any 1.0 tag or npm
publication. It does not authorize a tag, package publish, document-version
promotion, or release-completion claim.

BEL-957 sequencing was reconciled before closeout: Linear `BEL-957` is Done,
and PR #43 is merged into the audited baseline.

## Conclusion

Release publication remains blocked. Serializer determinism and the local
release verification gate are source-consistent and freshly validated, but
`npm publish --dry-run --access public` cannot complete against the current
`0.1.0` package version because that version is already published. The publish
dry-run also emits an npm package metadata normalization warning for the CLI
`bin` entry that must be resolved or explicitly accepted before a final release
candidate is promoted.

## Audit Results

- PASS: `src/api/serialize.ts` normalizes arrays recursively, sorts plain-object
  keys, omits `undefined` properties, uses two-space formatting only when
  `pretty: true`, and returns `"null"` when `JSON.stringify` returns
  `undefined`.
- PASS: Serializer behavior matches the public contract in
  `docs/contracts/api.md`, which documents stable key ordering, recursive
  normalization, `undefined` omission, pretty mode, and compatibility selectors.
- PASS: Focused repeatability gates cover compact and pretty output for parse,
  normalize, validation, rich IR document, annotated document, and annotation
  diagnostic cases. Current proof output covers 10 runs and 14 cases per run.
- PASS: `package.json` registers `prepack` and `prepublishOnly` as
  `npm run release:verify`. `npm pack --dry-run` proved `prepack` executes the
  full release gate before artifact assembly.
- PASS: Snapshot files were not changed by this audit. `docs/testing.md`
  correctly treats `snapshots/**` as checked-in contract baselines, not
  disposable output.
- PASS: Evidence and README release-containment language continue to withhold
  the 1.0 tag and package publication pending BEL-956 and a future explicit
  release decision. Local tags list only `v0.1.0`.
- FIXED: `docs/evidence/wp-5-evd-5-repeatability.md` had stale rich IR
  annotation hashes from the original BEL-949 run. BEL-958 refreshed those four
  digest and byte-length lines from the current `dc513a0` repeatability proof.
- BLOCKER: `npm publish --dry-run --access public` exits 1 for the current
  package because npm refuses to publish over the already-published
  `@jasonbelmonti/markdown-engine@0.1.0` version. This is expected under the
  current release-withhold state, but it means publish dry-run is not green for
  the current package metadata.
- WATCH: During publish dry-run, npm reports that it auto-corrected
  `bin[markdown-engine]` from `./dist/cli/index.js` to `dist/cli/index.js`.
  `npm pack --dry-run` does not emit this warning. Before a final 1.0 release
  candidate, normalize the package metadata or record an explicit npm-version
  compatibility decision so publish-time package metadata is not surprising.

## Validation Results

- `npm ci`: pass; installed 182 packages, audited 183 packages, 0
  vulnerabilities.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `./node_modules/.bin/vitest run tests/serialization-repeatability.test.ts tests/rich-ir-repeatability.test.ts`:
  pass, 2 files and 4 tests.
- `npm run release:verify`: pass. This included typecheck, full tests
  (16 files, 96 tests), boundary dependency audit, build, 10-run serialization
  repeatability, whitespace check, and clean-diff check.
- `npm pack --dry-run`: pass. `prepack` ran `npm run release:verify`; tarball
  preview reported package `@jasonbelmonti/markdown-engine@0.1.0`, 245 files,
  53.9 kB package size, and 255.5 kB unpacked size.
- `npm publish --dry-run --access public`: blocked after successful
  `prepublishOnly` and `prepack` release gates. npm refused the command because
  version `0.1.0` is already published, and emitted the `bin[markdown-engine]`
  normalization warning recorded above.
- `git diff --check HEAD --`: pass before evidence edits.
- `git tag --list`: pass; local tag output is `v0.1.0`.

## Serializer Probe

Additional runtime probe through `dist/index.js` confirmed sorted keys,
recursive object normalization, array traversal, two-space pretty output, and
`undefined` omission:

```json
{
  "a": {
    "c": 3
  },
  "b": 2,
  "e": [
    {
      "x": 1
    }
  ]
}
```

## Success Criteria Status

- [x] Serializer output is stable for compact and pretty modes, with
  deterministic key ordering and `undefined` omission matching the public
  contract.
- [x] `npm run release:verify`, `npm pack --dry-run`, and
  `npm publish --dry-run --access public` requirements are identified and
  freshly run. Publish dry-run remains a recorded blocker for the current
  already-published `0.1.0` version.
- [x] Evidence docs under `docs/evidence/**` do not claim release authorization
  beyond the BEL-944 MS-3 withhold decision. BEL-958 refreshed the stale EVD-5
  repeatability hashes found during the audit.
- [x] Snapshot files were unchanged. No snapshot contract diff required mapping
  to source, fixture, dependency, or serializer behavior.

## Required Next Decisions

Before any 1.0 tag or npm publication:

- resolve the BEL-957 final package-version and document-version blocker under
  BEL-956 or a project-owner release decision
- update package metadata to a not-yet-published release version before relying
  on `npm publish --dry-run --access public` as a green gate
- resolve or explicitly accept npm's publish-time `bin` metadata normalization
  warning
- rerun `npm run release:verify`, `npm pack --dry-run`, and
  `npm publish --dry-run --access public` from the exact final release
  candidate commit
