# BEL-1035 Release Audit Group 7: Determinism, Release Gates, Snapshots, And Evidence Integrity

Date: 2026-05-13 20:24 CDT / 2026-05-14 01:24 UTC
Issue: BEL-1035
Parent: BEL-1028
Baseline: `origin/main` at `9f19b08321745aec1a093883aeef62087e7ca4ca`
Worktree: `.worktrees/BEL-1035-release-gates-evidence`
Branch: `codex/bel-1035-release-gates-evidence`
Package: `@jasonbelmonti/markdown-engine@2.0.0`

## Scope

This audit verifies deterministic serialization, release verification scripts,
repeatability proofs, snapshot governance, package dry-run contents, boundary
audits, docs gates, and release evidence integrity for the 2.0 release-readiness
decision.

This audit does not authorize a `v2.0.0` tag, npm publish, npm dist-tag
mutation, or release-completion claim. It only verifies whether the current
release gates and evidence are strong enough to support the final BEL-1028
go/no-go synthesis.

## Result

Status: pass with evidence only.

No runtime source change, test change, release-script change, package metadata
change, or snapshot update was required. The current gates cover the release
path and the targeted checks below produced no tracked diff.

Release control remains explicit: no local `v2*` tag, no remote `refs/tags/v2*`
tag, and npm `latest` remains `1.0.0`. BEL-1035 does not change that state.

## Execution Gate

Execution Estimation was run before edits in proposal mode with
`--decomposition-depth 1`.

Result:

- `schemaVersion`: `execution-estimation.v5`
- `mode`: `proposal`
- `risk.blastRadius.score`: `4`
- `risk.blastRadius.level`: `medium`
- `risk.blastRadius.requiresHeightenedControls`: `false`
- `planning.recommended`: `true`
- `planning.level`: `brief`
- `planning.blocksExecution`: `false`
- `execution.action`: `proceed-with-controls`
- `estimation.adjustedStoryPoints`: `8`
- `estimation.decompositionRecommended`: `false`

Controls applied: full release-path verification, targeted snapshot checks,
explicit declarative validation repeatability proof, package dry-run content
inspection, release-control tag/dist-tag inspection, and clean-diff checks.

## Gate Coverage Matrix

| Gate area | Evidence | Result |
| --- | --- | --- |
| Release verification | `npm run release:verify` | PASS |
| TypeScript contract | `npm run typecheck` inside `release:verify` | PASS |
| Full test suite | `npm test` inside `release:verify`: 31 files, 352 tests | PASS |
| Boundary containment | `node scripts/check-boundaries.mjs` and `npm run audit:declarative-validation-boundary` | PASS |
| Contract docs | `npm run docs:rich-ir-contract` and `npm run docs:declarative-validation-contract` | PASS |
| Build output | `npm run build` inside `release:verify` | PASS |
| Stable serialization repeatability | `node scripts/prove-repeatability.mjs --runs 10`: 14 cases per run | PASS |
| Clean tracked diff gate | `npm run release:check-clean` inside `release:verify` | PASS |
| Snapshot test gate | `npm run test:snapshots`: 6 files, 27 tests | PASS |
| Snapshot update scoping | all four `snapshots:update:*` scripts, then `git diff --name-only -- snapshots package.json docs/testing.md` | PASS; no diff |
| Declarative validation repeatability | `npm run test:validation:repeatability`: 1 file, 2 tests, 12 cases per run | PASS |
| Package dry-run content | `npm run build` / `release:verify`, then `npm pack --dry-run --ignore-scripts --json` plus required-content inspection | PASS |
| Release-control state | local `v2*` tag scan, remote `refs/tags/v2*` scan, npm dist-tags | PASS; no 2.0 release action found |

## Determinism Assessment

Stable JSON ordering is implemented through `normalizeStableJsonValue`, which
recurses through arrays, sorts plain-record keys, and omits `undefined` fields
before `JSON.stringify`. Public serialization delegates to this normalization
and preserves optional compatibility-mode checks.

Result cloning remains covered at the API boundary:

- `validateWithProfile` clones diagnostics and rule results before returning
  public results.
- Declarative validation evidence clones diagnostics and rule results before
  hashing and exposing evidence.
- Annotation target diagnostics clone diagnostic targets before sorting and
  reporting.

Diagnostic and result ordering remains deterministic:

- Declarative validation rule results sort by `ruleId`.
- Assertion diagnostics sort by rule ID, assertion index, source range,
  target key, diagnostic code/message/severity, target order, and diagnostic
  order.
- Annotation target diagnostics sort by optional source range, diagnostic code,
  message, normalized target key, and original input order as the final
  tie-breaker.
- Rich IR target and derived-view ordering is protected by target, query, link
  reference, snapshot, and repeatability gates.

## Repeatability Evidence

`node scripts/prove-repeatability.mjs --runs 10` passed with 14 cases per run.

Observed stable case hashes:

```text
parse:representative:compact: bc31bf20589d7ea68697d7fb4627f67856368b44ad6967ac09822ecc1c69c1b1
parse:representative:pretty: c1dd66f2f858df71159980c5e078e420b4e7da275555ba1dead0d3a3aed92f92
normalize:representative:compact: 90d6980231efab8d5b0a02c903c515428d898b15588de29001c9fd6534b16d06
normalize:representative:pretty: d9db11cc2f1ae6ac10d3f730da11a48749e4682aa16f0a9f223145f07be6cf19
validate:representative-pass:compact: e236ba7eff58f49990a68c53dab297d71bd26fdfbe9fe3995ac670cf594a02b7
validate:representative-pass:pretty: e5d16f4325432fa0cd292fe73ac9145ae140875a54a47f5f61684a8fda3f681a
validate:wp-4-diagnostics:compact: c91f3b405d131cf6c148cc26d6a3419a446c53ac1f499e06893236b8d6ebcae3
validate:wp-4-diagnostics:pretty: e949efce7ee7e2282e1e9df490dca24c04b2906b1dabd333a793d6e4d4912c5c
rich-ir:document:compact: 178a14f462293d32ae4b4f9cf95c97f366e211a025346c7ba359359fe38bfa5d
rich-ir:document:pretty: 8aa6b0dbdcd9186c8d6af3c7e50b3ad6265ea371f45749db7908a0e57df919c8
rich-ir:annotated-document:compact: 74a2b61609e89fde0bb4bc47777fdca29c452835864f7e79e2e59e2681ee172d
rich-ir:annotated-document:pretty: ab24f8f63df74cd2046dd7c5dbaf48739009c7149335ee1d3e3c880b61250115
rich-ir:annotation-diagnostics:compact: dcfb71c2bb77ed5abdbbad5cae03965f37a947abc77a92802d8d7c8ba6029973
rich-ir:annotation-diagnostics:pretty: 4a862de282eb6f559cc24784c87c91714ad5178bd04a04a6d9b69d31659a0890
```

`npm run test:validation:repeatability` passed with 12 cases per run.

Observed declarative validation evidence hashes:

```text
passing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
passing profileHash: 3a288b6612d5c042e51d4260d0a9532e1229f87be5d507e2f5caf3a3db66da92
failing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
failing profileHash: d4ce7117cf4b119e44a778a56c25a02043712e64056a975562b1a781a89abc33
```

## Snapshot Governance

`docs/testing.md` accurately treats `snapshots/**` as checked-in contract
baselines rather than disposable test output. It lists parser, diagnostic,
`cmark-gfm`, rich IR, and serialization snapshot families; records the update
commands; and requires release-level review for public API shape, IR field,
diagnostic, source-location, validation-semantic, or serialized-output changes.

The snapshot gate covered:

- `snapshots/ir/**`
- `snapshots/diagnostics/**`
- `snapshots/cmark-gfm/**`
- `snapshots/rich-ir/**`
- `snapshots/serialization/**`

All snapshot update commands completed without producing snapshot, package, or
testing-doc diffs:

```sh
npm run snapshots:update:parser
npm run snapshots:update:rules
npm run snapshots:update:rich-ir
npm run snapshots:update:serialization
git diff --name-only -- snapshots package.json docs/testing.md
```

## Package Dry-Run Evidence

This content proof depends on a fresh build before packing. The audit first ran
`npm run release:verify`, which includes `npm run build` and leaves the
gitignored `dist/**` output available for package inspection.

Because `--ignore-scripts` disables npm lifecycle scripts, including `prepack`,
the reproducible dry-run sequence is:

```sh
npm run build
npm pack --dry-run --ignore-scripts --json
```

Alternatively, omit `--ignore-scripts` and allow `npm pack` to run `prepack`,
which executes `npm run release:verify`. Running only
`npm pack --dry-run --ignore-scripts --json` from a clean checkout before a
build is not the proof recorded here and is expected to omit `dist/**`.

After the build prerequisite, `npm pack --dry-run --ignore-scripts --json`
reported:

```json
{
  "name": "@jasonbelmonti/markdown-engine",
  "version": "2.0.0",
  "filename": "jasonbelmonti-markdown-engine-2.0.0.tgz",
  "entryCount": 469,
  "unpackedSize": 708796,
  "missing": [],
  "unexpectedFixtures": []
}
```

Required entries checked included `dist/index.js`, `dist/cli/index.js`,
`README.md`, `CHANGELOG.md`, `SECURITY.md`, both contract docs, and packaged
reader examples under `fixtures/declarative-validation/examples/**`.

## Evidence Consistency

The current repository state supersedes stale Linear project and BEL-1028
narrative text that still names PR #114 as the latest sync point. Confirmed
repository reality for this audit:

- `origin/main` is `9f19b08321745aec1a093883aeef62087e7ca4ca`.
- PR #115 is included in the audited baseline.
- `@jasonbelmonti/markdown-engine` package metadata is `2.0.0`.
- npm `latest` remains `1.0.0`.
- No local `v2*` tag was present.
- No remote `refs/tags/v2*` tag was present.

The stale Linear narrative is a project-management synchronization issue, not a
BEL-1035 release-gate blocker, because current issue state and repository
evidence are clear.

## Success Criteria Status

- [x] `release:verify` and targeted 2.0 verification commands are identified
  and checked for complete release coverage.
- [x] Stable JSON ordering, result cloning, diagnostics ordering, target
  ordering, and evidence hash repeatability are assessed.
- [x] Snapshot update governance is checked against public contract and fixture
  semantics.
- [x] Boundary audit, declarative validation boundary audit, docs gates,
  clean-diff gate, and package dry-run expectations are reviewed.
- [x] Stale, missing, or contradictory release evidence is listed with required
  corrective actions.

## Required Next Decisions

No BEL-1035 release-gate blocker was found.

Before any 2.0 release action, BEL-1028 still needs final cross-cutting
synthesis and an explicit go/no-go decision. That decision must record blockers,
non-blocking risks, release authorization or withhold rationale, and any
required follow-up issues. Do not tag, publish, mutate npm dist-tags, or claim
2.0 release completion from BEL-1035 alone.
