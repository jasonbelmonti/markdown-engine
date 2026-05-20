# BEL-966 Release Audit Track: Determinism

Date: 2026-05-07 14:41 CDT / 2026-05-07 19:41 UTC
Issue: BEL-966
Parent audit: BEL-956
Baseline: `origin/main` at `cfa58dc`
Worktree: `.worktrees/BEL-966-release-audit-determinism`
Branch: `codex/bel-966-release-audit-determinism`
Package: `@jasonbelmonti/markdown-engine@0.1.0`

## Current Status

This is a dated BEL-956 release-audit record. The `Package:` line, `1.0.0-draft`
lane, and release-withhold statements below describe the 2026-05-07 audit
baseline. At the BEL-1158 cleanup baseline (`origin/main` at `804c6351edf0`,
2026-05-20), package metadata is `@jasonbelmonti/markdown-engine@2.0.0` and the
public document contract at that baseline uses `documentVersion: "1.0.0"`.

## Scope

This audit verifies deterministic behavior across rich IR target IDs, derived
views, annotation target diagnostics, public serialization, repeatability
proofs, and release evidence. Identical input, options, package version, and
runtime version must produce byte-for-byte identical serialized results and
stable diagnostic ordering.

This audit does not authorize a `v1.0.0` tag, npm publication, package version
promotion, `1.0.0-draft` promotion to final `1.0.0`, annotation semantic
interpretation, broad refactors, or release-completion claims.

## Conclusion

No BEL-966 determinism blocker was found. Runtime source was not changed.

The audit closed the identified evidence gap by expanding the rich IR
repeatability diagnostic case from one missing node target to an eight-entry
diagnostic matrix. The matrix now covers out-of-bounds source targets,
same-position unknown node targets, missing-offset unknown node targets,
reversed source ranges, malformed node targets, invalid target kinds, and
missing source ranges. The focused repeatability test now asserts the exact
serialized diagnostic order for that matrix.

Release publication remains withheld under BEL-944/BEL-956. The full
`npm run release:verify` functional phases passed, but the command ended at the
expected clean-diff check because this audit branch intentionally contains
uncommitted evidence, script, and test changes.

## Execution Gate

Execution estimation was rerun in proposal mode after the fresh worktree was
created. The durable proposal-file rerun returned:

- `schemaVersion`: `execution-estimation.v5`
- `mode`: `proposal`
- `risk.blastRadius.score`: `3`
- `risk.blastRadius.level`: `medium`
- `planning.recommended`: `true`
- `planning.level`: `brief`
- `planning.blocksExecution`: `false`
- `execution.action`: `proceed-with-controls`
- `estimation.adjustedStoryPoints`: `5`
- `estimation.decompositionRecommended`: `false`

Controls applied: focused rich IR target, query, annotation, repeatability, and
serialization proof gates; API contract documentation gate; typecheck; boundary
checks through `release:verify`; and release evidence capture.

## Audit Results

- PASS: Target IDs remain deterministic through structural paths. Existing
  target tests compare repeated normalization output and durable target/source
  evidence for document and representative node targets.
- PASS: Derived section, list, table, link, text-span, source-slice, and query
  views remain deterministic. Existing query tests compare repeated derived
  evidence and stable snapshots.
- PASS: Annotation diagnostic sorting is deterministic by optional source
  range, code, message, normalized target key, and input order as a final
  tie-breaker. Existing annotation tests already cover reverse-input stability
  for malformed and missing targets plus same-position offset ordering.
- PASS: The repeatability harness now serializes an annotation diagnostic
  matrix that includes same-position unknown targets, a missing-offset unknown
  target, malformed targets, invalid ranges, and an out-of-bounds source target.
- PASS: Public serialization continues to sort plain-object keys recursively,
  preserve array order, omit `undefined` fields, and produce stable compact and
  pretty JSON.
- PASS: Snapshot files were not changed by this audit.
- PASS: Prior repeatability evidence was refreshed for the two changed
  annotation-diagnostic digests and annotated with this BEL-966 update.

## Diagnostic Matrix Order

The serialized `rich-ir:annotation-diagnostics` case now asserts this order:

```text
1. annotation.target.outOfBounds | 1:1 | offset absent | source
2. annotation.target.unknown | 9:1 | offset 90 | node:a:missing
3. annotation.target.unknown | 9:1 | offset 90 | node:z:missing
4. annotation.target.unknown | 9:1 | offset absent | node:missing-offset
5. annotation.target.invalidRange | 10:4 | offset 200 | source
6. annotation.target.invalidKind | no source range | malformed node target
7. annotation.target.invalidKind | no source range | invalid target kind
8. annotation.target.invalidRange | no source range | missing source range
```

## Repeatability Proof

`node scripts/prove-repeatability.mjs --runs 10` passed with 14 cases per run:

```text
parse:representative:compact: bc31bf20589d7ea68697d7fb4627f67856368b44ad6967ac09822ecc1c69c1b1 (3366 bytes)
parse:representative:pretty: c1dd66f2f858df71159980c5e078e420b4e7da275555ba1dead0d3a3aed92f92 (7691 bytes)
normalize:representative:compact: 613e6c8142c4e1950fe2e3f9ca4831dc36805d94884d741525bdc8099fd5d92d (2566 bytes)
normalize:representative:pretty: ad322d00e5a716471f6fce3e09c70508be0122ce54fe76f7e764eac700595c94 (6264 bytes)
validate:representative-pass:compact: e236ba7eff58f49990a68c53dab297d71bd26fdfbe9fe3995ac670cf594a02b7 (363 bytes)
validate:representative-pass:pretty: e5d16f4325432fa0cd292fe73ac9145ae140875a54a47f5f61684a8fda3f681a (549 bytes)
validate:wp-4-diagnostics:compact: c91f3b405d131cf6c148cc26d6a3419a446c53ac1f499e06893236b8d6ebcae3 (2763 bytes)
validate:wp-4-diagnostics:pretty: e949efce7ee7e2282e1e9df490dca24c04b2906b1dabd333a793d6e4d4912c5c (4754 bytes)
rich-ir:document:compact: 6986761f7ce164124a97a256dedcb7079dc6c27c4ac9886e448b332790904315 (28643 bytes)
rich-ir:document:pretty: 635f3f397aeb5971c886f6e7c2d23952f0455e3c5fbc17e9d1dcc52878d40699 (74245 bytes)
rich-ir:annotated-document:compact: e23936a8bf08d95226ac7ad664cc78abf571410918ce81e1cc2beee1ea65cd03 (29214 bytes)
rich-ir:annotated-document:pretty: 1886ab3d9256b5abcf07f39f0252fd513d55caa7e34f4e9153127e4248143f96 (75392 bytes)
rich-ir:annotation-diagnostics:compact: dcfb71c2bb77ed5abdbbad5cae03965f37a947abc77a92802d8d7c8ba6029973 (4284 bytes)
rich-ir:annotation-diagnostics:pretty: 4a862de282eb6f559cc24784c87c91714ad5178bd04a04a6d9b69d31659a0890 (7934 bytes)
```

Only the two `rich-ir:annotation-diagnostics` digests changed during this
audit, matching the expanded diagnostic matrix.

## Validation Results

- `git fetch --all --prune`: pass.
- `git worktree add -b codex/bel-966-release-audit-determinism .worktrees/BEL-966-release-audit-determinism origin/main`:
  pass; worktree baseline is `cfa58dc`.
- Execution estimation: pass after rerun with durable proposal file; action was
  `proceed-with-controls`, brief planning required, no decomposition.
- `npm run test:rich-ir:targets`: pass, 1 file and 5 tests.
- `npm run test:rich-ir:queries`: pass, 1 file and 3 tests.
- `npm run test:rich-ir:annotations`: pass, 1 file and 15 tests.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `node scripts/prove-repeatability.mjs --runs 10`: pass, 10 runs and 14 cases
  per run.
- `npm run docs:rich-ir-contract`: pass.
- `npm run typecheck`: pass.
- `npm run release:verify`: functional phases passed through typecheck, full
  tests, boundary audit, build, and 10-run repeatability proof. The command
  exited 1 at `release:check-clean` because `git diff --exit-code HEAD --`
  detected this audit's intentional uncommitted changes.
- `git diff --check HEAD --`: pass after evidence updates.

## Success Criteria Status

- [x] Target IDs, section/list/table/link/text-span views, annotation
  diagnostics, and serialized JSON are deterministic across repeated runs.
- [x] Diagnostic sorting is stable for same-position, missing-offset,
  malformed-target, and unknown-target cases.
- [x] Repeatability scripts cover both legacy and 1.0 rich IR outputs,
  including annotated documents and annotation diagnostic cases.
- [x] No non-deterministic behavior was found. No new BEL-966 release blocker
  is required.

## Required Next Decisions

No BEL-966 determinism blocker requires a production source change. Before any
1.0 tag or npm publication, BEL-956/BEL-944 must still explicitly authorize
release versioning, publication, and final release-candidate validation from a
clean committed state.
