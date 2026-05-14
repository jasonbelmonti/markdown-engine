# BEL-1043: textLength Contract Verification

Date: 2026-05-14
Issue: BEL-1043
Branch: `codex/bel-1043-textlength-contract-verification`
Worktree: `.worktrees/bel-1043-textlength-contract-verification`
Baseline: `origin/main` at `d02522d`

## Objective

Close the public-contract and release-readiness loop for the new `textLength`
assertion without changing feature behavior.

## Scope

This verification slice confirms that the public contract, boundary audit,
repeatability proof, and release gate behavior remain valid after the
`textLength` assertion reached core runtime, hardening, CLI, and example
coverage.

Out of scope: new validation syntax, new CLI flags, new diagnostic codes,
compiled plan exports, release artifact mutation, package publication, tags,
and npm dist-tag changes.

## Command Evidence

Commands run from `.worktrees/bel-1043-textlength-contract-verification`.

```sh
npm run docs:declarative-validation-contract
```

Result:

```text
Declarative validation contract documentation gate PASS
Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, package.json
```

```sh
npm run audit:declarative-validation-boundary
```

Result:

```text
Declarative validation boundary audit PASS
Direct dependency matches: 0
Runtime boundary source matches: 0
Regex-like key rejection checks: present
Unsafe executable key rejection checks: present
Profile-specific core semantic matches: 0
```

```sh
npm run test:validation:repeatability
```

Result:

```text
tests/declarative-validation-repeatability.test.ts (2 tests) passed
Declarative validation repeatability PASS
Runs: 10
Cases per run: 16
declarative-validation:text-length-result:compact: ce128ba464aacd762d467b05afeec7756d2c280fa5536242420b5cd5dd725e6d (527 bytes)
declarative-validation:text-length-result:pretty: d846aff5526499a95cf3bee1ad57a009fca49d02ce7b75aa370b0921783beb93 (694 bytes)
declarative-validation:text-length-evidence:compact: ba40a91ed5a38de1fa9cb323c00a10b46e0b0a6c013e9bedc932693809fbb027 (307 bytes)
declarative-validation:text-length-evidence:pretty: ac08efce2a9f5ad99ad0dc621c6bbf25ddee07aed10dc0fdb18a56334278d2d3 (369 bytes)
```

## Materially Verifiable Success Criteria

- [x] Declarative validation contract check passes.
- [x] Boundary audit still confirms internal compiled plans are not exported and
  declarative validation stays inside the deterministic local engine boundary.
- [x] Repeatability proof passes with the updated `textLength` assertion
  surface.

## Release Gate Note

`npm run release:verify` remains the final merge-readiness gate because it
combines typecheck, full tests, rich IR boundary audit, declarative validation
contract docs, declarative validation boundary audit, build, serialization
repeatability, whitespace checks, and the clean tracked diff check.

## Conclusion

BEL-1043 passes the targeted contract, boundary, and repeatability verification
slice. No feature behavior, public API surface, CLI output shape, diagnostic
code, package metadata, tag, publication state, or npm dist-tag changed in this
evidence update.
