# Conditional V2 EVD-9: Release Readiness Handoff

Issue: BEL-1121
Parent issue: BEL-1084
Branch: `codex/bel-1121-release-verify-gate`
Worktree: `.worktrees/BEL-1121`
Baseline: `origin/main` at `5d0e2a79790b`
Date: 2026-06-04
Recorded at: 2026-06-05T01:25:18Z

## Scope

EVD-9 records the BEL-1121 Conditional V2 release verification consolidation
after EVD-8 downstream proof completed in BEL-1120. This evidence covers the
release verification command, EVD-1 through EVD-8 registry status, blocker
disposition, release containment controls, and handoff notes for the later
MS-4 owner decision.

This record does not approve MS-4 release readiness, create a git tag, publish
to npm, mutate npm tags, create a GitHub Release, claim release completion, or
claim downstream adoption.

## Release Verification Result

Final gate command:

```text
npm run release:verify
```

Final result: PASS on 2026-06-04 from `.worktrees/BEL-1121`.

Run context: `release:check-clean` passed against the clean tracked
implementation state at baseline `5d0e2a79790b`. This EVD-9 evidence file was
written after that release gate so the handoff record could capture the
validated output without changing the release-verification input.

The final successful run completed these release gates:

| Gate | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS: 37 test files, 489 tests |
| `node scripts/check-boundaries.mjs` | PASS: 0 forbidden dependency matches, 0 annotation semantic leakage matches |
| `npm run docs:rich-ir-contract` | PASS |
| `npm run docs:declarative-validation-contract` | PASS |
| `npm run audit:declarative-validation-boundary` | PASS: 0 direct dependency matches, 0 runtime boundary source matches, regex-like and unsafe executable key rejection checks present, 0 profile-specific core semantic matches |
| `npm run build` | PASS |
| `npm run build:cli:bundled` | PASS: `dist-bundled/markdown-engine-cli.mjs` built at 839793 bytes |
| `node scripts/prove-repeatability.mjs --runs 10` | PASS: 10 runs, 14 cases per run |
| `npm run release:check-clean` | PASS |

Repeatability hashes from the final successful run:

| Case | SHA-256 |
| --- | --- |
| `parse:representative:compact` | `bc31bf20589d7ea68697d7fb4627f67856368b44ad6967ac09822ecc1c69c1b1` |
| `parse:representative:pretty` | `c1dd66f2f858df71159980c5e078e420b4e7da275555ba1dead0d3a3aed92f92` |
| `normalize:representative:compact` | `90d6980231efab8d5b0a02c903c515428d898b15588de29001c9fd6534b16d06` |
| `normalize:representative:pretty` | `d9db11cc2f1ae6ac10d3f730da11a48749e4682aa16f0a9f223145f07be6cf19` |
| `validate:representative-pass:compact` | `e236ba7eff58f49990a68c53dab297d71bd26fdfbe9fe3995ac670cf594a02b7` |
| `validate:representative-pass:pretty` | `e5d16f4325432fa0cd292fe73ac9145ae140875a54a47f5f61684a8fda3f681a` |
| `validate:wp-4-diagnostics:compact` | `c91f3b405d131cf6c148cc26d6a3419a446c53ac1f499e06893236b8d6ebcae3` |
| `validate:wp-4-diagnostics:pretty` | `e949efce7ee7e2282e1e9df490dca24c04b2906b1dabd333a793d6e4d4912c5c` |
| `rich-ir:document:compact` | `178a14f462293d32ae4b4f9cf95c97f366e211a025346c7ba359359fe38bfa5d` |
| `rich-ir:document:pretty` | `8aa6b0dbdcd9186c8d6af3c7e50b3ad6265ea371f45749db7908a0e57df919c8` |
| `rich-ir:annotated-document:compact` | `74a2b61609e89fde0bb4bc47777fdca29c452835864f7e79e2e59e2681ee172d` |
| `rich-ir:annotated-document:pretty` | `ab24f8f63df74cd2046dd7c5dbaf48739009c7149335ee1d3e3c880b61250115` |
| `rich-ir:annotation-diagnostics:compact` | `dcfb71c2bb77ed5abdbbad5cae03965f37a947abc77a92802d8d7c8ba6029973` |
| `rich-ir:annotation-diagnostics:pretty` | `4a862de282eb6f559cc24784c87c91714ad5178bd04a04a6d9b69d31659a0890` |

## Transient Gate Observation

The first `npm run release:verify` attempt on 2026-06-04 stopped during
`npm test` with one failing test:

```text
tests/profile-backed-markdown-skill.test.ts > profile-backed-markdown skill wrapper > appends profile extensions for dotted profile ids
AssertionError: expected 2 to be +0
```

First-attempt summary:

```text
Test Files  1 failed | 36 passed (37)
Tests  1 failed | 488 passed (489)
```

The failing case passed when rerun directly:

```text
npm exec -- vitest run tests/profile-backed-markdown-skill.test.ts -t "appends profile extensions for dotted profile ids" "--exclude=.worktrees/**" --reporter=verbose
PASS tests/profile-backed-markdown-skill.test.ts (1 selected test)
```

The full affected file also passed:

```text
npm exec -- vitest run tests/profile-backed-markdown-skill.test.ts "--exclude=.worktrees/**" --reporter=verbose
PASS tests/profile-backed-markdown-skill.test.ts (8 tests)
```

No code or script change was made in response. The second full
`npm run release:verify` passed. This observation is not classified as an
unresolved release blocker for BEL-1121, but it should be investigated if the
same full-suite failure recurs.

## Evidence Registry Check

| Evidence | Registry path | Status | Approval or evidence disposition |
| --- | --- | --- | --- |
| EVD-1 | `docs/evidence/conditional-v2-evd-1-proving-slice.md` | present | Records MS-1 proving-slice command output and owner approval for L2-A unblocking. |
| EVD-2 | `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` | present | Records ID count fixture coverage, compiled-plan coverage, diagnostics, command output, and duplicate-ID compatibility notes. |
| EVD-3 | `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` | present | Records table-column coverage fixture coverage, compiled-plan coverage, no-whole-section-fallback proof, command output, and downstream owner notes. |
| MS-2 | Linear BEL-1098 comment `2380b601-dc0c-4fc3-9e67-04b2dcf753d6` | approved | Records MS-2 approval on 2026-05-22 and unblocks L4-A without approving grouped rules, `when`, downstream EVD-8, release readiness, tag creation, npm publication, or release-completion claims. |
| EVD-4 | `docs/evidence/conditional-v2-evd-4-grouped-rules.md` | present | Records grouped-rule fixture coverage, representative JSON, diagnostic promotion proof, repeatability proof, command output, and no approved deviations for MV-5. |
| EVD-5 | `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` | present | Records `when` matched/not-matched coverage, skipped JSON, skipped counts, repeatability proof, and MV-6 command output. |
| EVD-6 | `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` | present with approved MS-3 deviation | Records contract and CLI compatibility evidence; BEL-1114 accepts missing separate independent contract/API reviewer approval as an approved MS-3 deviation. |
| EVD-7 | `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` | present with approved MS-3 deviation | Records repeatability, nested boundary rejection, boundary audit, and executable-key rejection evidence; BEL-1114 accepts missing separate boundary/security reviewer approval as an approved MS-3 deviation. |
| MS-3 | `docs/evidence/conditional-v2-ms-3-gate-bel-1114.md` and Linear BEL-1114 comment `634efd98-9e25-4481-af31-56d458f71524` | approved with project-owner conditional approval/deviation | Approves MS-3 final implementation merge readiness and explicitly does not approve MS-4 release readiness, package tag creation, package publication, release completion, or downstream adoption claims. |
| EVD-8 | `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md` | present | Records downstream expected pass/fail cases, L8-F false-acceptance negative coverage, downstream command output, and downstream owner notes; states EVD-9 and MS-4 approval remained out of scope. |
| EVD-9 | this file | present | Records BEL-1121 release verification output and handoff evidence for MS-4 review. |

## Blocker Review

No unresolved BEL-1121 release-readiness blocker is recorded after the final
successful `npm run release:verify` run.

| Area | Status | Evidence |
| --- | --- | --- |
| Validation | clear | Final `npm run release:verify` passed typecheck, full tests, docs gates, boundary audits, build, repeatability, and clean-check gates. |
| Contract | clear with prior MS-3 deviation | EVD-6 exists; BEL-1114 records project-owner acceptance of the missing separate independent contract/API reviewer record for MS-3. |
| Downstream proof | clear | EVD-8 records expected pass/fail coverage and L8-F false-acceptance negatives. |
| Repeatability | clear | EVD-7 repeatability evidence exists; final release verification repeatability passed 10 runs with 14 cases per run. |
| Boundary | clear with prior MS-3 deviation | EVD-7 boundary evidence exists; final boundary audit reports zero dependency/runtime/profile-specific matches. |
| Release mechanics | contained | No tag, publish, npm dist-tag mutation, GitHub Release, or release-completion claim was made. |

## Release Controls

- Do not create a git tag from this leaf.
- Do not run `npm publish`.
- Do not mutate npm dist-tags or package metadata outside the repository.
- Do not create a GitHub Release.
- Do not claim package release completion.
- Do not claim downstream adoption completion.
- Treat this file as MS-4 input, not MS-4 approval.

## MS-4 Handoff Notes

The MS-4 decision owner should review this file together with:

- `docs/evidence/conditional-v2-evd-1-proving-slice.md`
- `docs/evidence/conditional-v2-evd-2-id-count-bounds.md`
- `docs/evidence/conditional-v2-evd-3-table-column-coverage.md`
- `docs/evidence/conditional-v2-evd-4-grouped-rules.md`
- `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`
- `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md`
- `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md`
- `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md`
- `docs/evidence/conditional-v2-ms-3-gate-bel-1114.md`
- Linear BEL-1098 and BEL-1114 approval comments

Recommended MS-4 decision inputs:

- EVD-1 through EVD-8 are present.
- MS-1, MS-2, and MS-3 decisions are recorded.
- The MS-3 missing independent reviewer records are already dispositioned as
  project-owner-approved deviations.
- EVD-8 downstream false-acceptance proof is complete and found no production
  bug-fix blocker.
- Final `npm run release:verify` passed on the BEL-1121 worktree.
- No release action has been performed by this leaf.

## Review Boundary

Review this BEL-1121 evidence for release verification command accuracy,
EVD-1 through EVD-8 registry accuracy, blocker disposition, release containment
language, and MS-4 handoff completeness.

Runtime behavior, production Conditional V2 semantics, parser behavior, rich IR
behavior, tag creation, npm publication, GitHub Release creation, downstream
adoption, and MS-4 approval are out of scope unless this evidence contradicts
or prevents those later gates.

## Conclusion

BEL-1121 release verification consolidation is ready for MS-4 review input.
The final `npm run release:verify` gate passed, EVD-1 through EVD-8 are present,
the known MS-3 reviewer-record gaps are already dispositioned by project-owner
conditional approval/deviation, and no unresolved validation, contract,
downstream, repeatability, boundary, or release-mechanics blocker remains
inside this leaf.

This is not a release-completion claim and does not authorize tag creation,
package publication, npm dist-tag mutation, GitHub Release creation, downstream
adoption, or MS-4 approval.
