# WP-5 EVD-6: Declarative Validation Repeatability Report

Date: 2026-05-12
Issue: BEL-983
Work package: BEL-981 / WP-5C
Validation: Declarative validation evidence hashes and repeatability
Current revalidation: BEL-1043 on 2026-05-14

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
Cases per run: 16
declarative-validation:passing-result:compact: 770a34f06416e6dfd1697db368b41b6140f669ed5c1bc105c57fcfb1c0d07d09 (645 bytes)
declarative-validation:passing-result:pretty: acac659b8c47eed8e39fe0afa03286a0fd8d5915468512c54d976430b15e8d73 (890 bytes)
declarative-validation:passing-evidence:compact: c81d3975a308ff6c79a0f0839b04908185daad584fabe96763b7501e19049ac3 (366 bytes)
declarative-validation:passing-evidence:pretty: 0fb40c2e70631470e4487b3e8615a390925382a13b6167f808df18391d400af3 (462 bytes)
declarative-validation:explicit-default-result:compact: 770a34f06416e6dfd1697db368b41b6140f669ed5c1bc105c57fcfb1c0d07d09 (645 bytes)
declarative-validation:explicit-default-result:pretty: acac659b8c47eed8e39fe0afa03286a0fd8d5915468512c54d976430b15e8d73 (890 bytes)
declarative-validation:alternate-path-result:compact: 770a34f06416e6dfd1697db368b41b6140f669ed5c1bc105c57fcfb1c0d07d09 (645 bytes)
declarative-validation:alternate-path-result:pretty: acac659b8c47eed8e39fe0afa03286a0fd8d5915468512c54d976430b15e8d73 (890 bytes)
declarative-validation:failing-result:compact: e597b3548316e58b8ced9816b522ccbc6fa19912ddabaa8257768c872e312521 (1622 bytes)
declarative-validation:failing-result:pretty: 1ba4d1a94d05ed7e45b9fa6f4be9e8408edd4778c669d26e4e5b88cc70e5a21d (2697 bytes)
declarative-validation:failing-evidence:compact: cd92b9a7ea18804c597e69c28eaa2cd961aa3ae047af075583a63f25c0034019 (854 bytes)
declarative-validation:failing-evidence:pretty: ce6a2beed35d60076da4c15127818a2b459455ded0ba14609ab78878fc2758e9 (1332 bytes)
declarative-validation:text-length-result:compact: ce128ba464aacd762d467b05afeec7756d2c280fa5536242420b5cd5dd725e6d (527 bytes)
declarative-validation:text-length-result:pretty: d846aff5526499a95cf3bee1ad57a009fca49d02ce7b75aa370b0921783beb93 (694 bytes)
declarative-validation:text-length-evidence:compact: ba40a91ed5a38de1fa9cb323c00a10b46e0b0a6c013e9bedc932693809fbb027 (307 bytes)
declarative-validation:text-length-evidence:pretty: ac08efce2a9f5ad99ad0dc621c6bbf25ddee07aed10dc0fdb18a56334278d2d3 (369 bytes)
```

## Observed Evidence Hashes

```text
passing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
passing profileHash: 3a288b6612d5c042e51d4260d0a9532e1229f87be5d507e2f5caf3a3db66da92
failing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
failing profileHash: d4ce7117cf4b119e44a778a56c25a02043712e64056a975562b1a781a89abc33
```

## Covered Inputs

- Passing declarative validation result with evidence included.
- Passing standalone evidence packet.
- Equivalent profile using explicit default `documentVersion` and `severity`.
- Equivalent document parsed with a different top-level path.
- Failing declarative validation result with source-targeted diagnostics.
- Failing standalone evidence packet.
- Passing `textLength` declarative validation result and standalone evidence
  packet.
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

BEL-983 passes, and BEL-1043 revalidation remains passing after the public
`textLength` assertion surface landed. Declarative validation result and
evidence serialization are byte-for-byte repeatable across ten runs, and the
observed evidence hashes match the documented canonical input behavior.
