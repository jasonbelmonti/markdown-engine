# WP-5 EVD-6: Declarative Validation Repeatability Report

Date: 2026-05-12
Issue: BEL-983
Work package: BEL-981 / WP-5C
Validation: Declarative validation evidence hashes and repeatability

## Scope

This evidence records deterministic `inputHash` and `profileHash` behavior for
declarative validation results and evidence output. The repeatability gate
checks compact and pretty serialized API results plus standalone evidence
packets across ten runs.

## Commands

```sh
npm run test:validation:repeatability
```

The package script runs:

```sh
npm run build
vitest run tests/declarative-validation-repeatability.test.ts "--exclude=.worktrees/**"
node scripts/prove-declarative-validation-repeatability.mjs --runs 10
```

## Canonical Hash Inputs

`inputHash` is the SHA-256 digest of the stable JSON representation of the
supplied normalized `EngineDocument` after removing the top-level
`document.path` field. Source ranges, source slices, frontmatter, targets,
sections, and other document contract fields remain part of the canonical input.

`profileHash` is the SHA-256 digest of the stable JSON representation of the
resolved validation profile. Resolution applies the document version used for
validation when `documentVersion` is omitted and applies the default rule
severity of `error` when `severity` is omitted. As a result, an omitted
`documentVersion` and an explicit matching `documentVersion` hash the same for
the same document version and rules.

Both hashes use stable JSON object key ordering before hashing.

## Repeatability Result

```text
tests/declarative-validation-repeatability.test.ts (2 tests) passed
Declarative validation repeatability PASS
Runs: 10
Cases per run: 12
declarative-validation:passing-result:compact: 1d01064d791c854238d8b9b047a53800ada941f5cc38ff3a85676ab94d5ce889 (645 bytes)
declarative-validation:passing-result:pretty: 6044c58601692155f13e04c7e3398dafded22786e4e11c5b646d91f29ba998e4 (890 bytes)
declarative-validation:passing-evidence:compact: d0632c890e2636ca6ac3a7aa30b0707f5e5ba0e389f3fcf474784f191ed17a3d (366 bytes)
declarative-validation:passing-evidence:pretty: 7aab0395bd1207887f5b781b6b803ece8af32e4c0b7cae72eb16b6f155d9089f (462 bytes)
declarative-validation:explicit-default-result:compact: 1d01064d791c854238d8b9b047a53800ada941f5cc38ff3a85676ab94d5ce889 (645 bytes)
declarative-validation:explicit-default-result:pretty: 6044c58601692155f13e04c7e3398dafded22786e4e11c5b646d91f29ba998e4 (890 bytes)
declarative-validation:alternate-path-result:compact: 1d01064d791c854238d8b9b047a53800ada941f5cc38ff3a85676ab94d5ce889 (645 bytes)
declarative-validation:alternate-path-result:pretty: 6044c58601692155f13e04c7e3398dafded22786e4e11c5b646d91f29ba998e4 (890 bytes)
declarative-validation:failing-result:compact: bc21af4e282a9f8d604f574a584f19b4e02633c40bd450190786d5368208875e (1622 bytes)
declarative-validation:failing-result:pretty: 0ae1b9d3005d1129de63d7dc1a9fdf70eb5f3a490687e9081472ff9f150dad11 (2697 bytes)
declarative-validation:failing-evidence:compact: d83bf9d88ba9043ab6f509af58846ff50e1876034115f251a63edae81f3984a3 (854 bytes)
declarative-validation:failing-evidence:pretty: 0d2d7cb0fc9cd2502b53679b64870cc3b66515ca0560b881fd696faad424a328 (1332 bytes)
```

## Observed Evidence Hashes

```text
passing inputHash: 9c5d3f9132a0e4f43ee8a3e1c2218548da9ebe2532a16b3069e5014aab09a8cc
passing profileHash: 3a288b6612d5c042e51d4260d0a9532e1229f87be5d507e2f5caf3a3db66da92
failing inputHash: 9c5d3f9132a0e4f43ee8a3e1c2218548da9ebe2532a16b3069e5014aab09a8cc
failing profileHash: d4ce7117cf4b119e44a778a56c25a02043712e64056a975562b1a781a89abc33
```

## Covered Inputs

- Passing declarative validation result with evidence included.
- Passing standalone evidence packet.
- Equivalent profile using explicit default `documentVersion` and `severity`.
- Equivalent document parsed with a different top-level path.
- Failing declarative validation result with source-targeted diagnostics.
- Failing standalone evidence packet.
- Compact and pretty serializer modes for every case.

## Guarantees

- Ten repeated declarative validations produced identical case order, UTF-8
  bytes, byte lengths, and SHA-256 digests.
- The documented `inputHash` canonical input excludes only top-level
  `document.path`; the alternate-path case matched the passing result.
- The documented `profileHash` canonical input includes defaulted
  `documentVersion` and `severity`; the explicit-default profile matched the
  omitted-default profile.
- Failing and passing profiles produced different `profileHash` values while
  sharing the same `inputHash` for the same normalized document.

## Limitations

- This evidence proves repeatability for the representative declarative
  validation fixture and profiles listed above. It does not prove exhaustive
  determinism for all possible Markdown or profile inputs.
- The gate proves local deterministic serialization and evidence behavior. It
  does not change selector, assertion, CLI, or downstream profile semantics.

## Conclusion

BEL-983 passes. Declarative validation result and evidence serialization are
byte-for-byte repeatable across ten runs, and the observed evidence hashes match
the documented canonical input behavior.
