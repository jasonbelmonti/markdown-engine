# WP-5 EVD-5: Deterministic Serialization Repeatability Report

Date: 2026-05-06
Issue: BEL-949
Work package: BEL-941 Slice 2 / WP-5
Validation: VAL-5 / EVD-5

## Scope

This evidence records a ten-run byte-for-byte repeatability check for public
`markdown-engine` serialization. BEL-949 extends the previous WP-5 gate from
legacy parse, normalize, and validate outputs to representative 1.0 rich IR
outputs serialized through the public serializer boundary.

The repeatability gate verifies identical case ordering, UTF-8 byte equality,
byte length equality, and SHA-256 digest equality for compact and pretty output
across ten runs.

## Commands

```sh
npm run test:rich-ir:repeatability
node scripts/prove-repeatability.mjs --runs 10
```

## Focused Test Result

```text
> @jasonbelmonti/markdown-engine@0.1.0 test:rich-ir:repeatability
> npm run build && vitest run tests/rich-ir-repeatability.test.ts "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-engine@0.1.0 build
> npm run clean && tsc -p tsconfig.json

> @jasonbelmonti/markdown-engine@0.1.0 clean
> node scripts/clean-dist.mjs

tests/rich-ir-repeatability.test.ts (2 tests) passed
Tests: 2 passed
```

## Standalone Proof Result

```text
Serialization repeatability PASS
Runs: 10
Cases per run: 14
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
rich-ir:annotated-document:compact: e48e3b9255800fc7b9b007367f51dda9c246d70d1fda03716b6a4379e51da7d2 (29204 bytes)
rich-ir:annotated-document:pretty: 780ca9d6149f719a5c60f75d2f1b32d499d72f39ae2d1aac922aad172c5d5e5d (75382 bytes)
rich-ir:annotation-diagnostics:compact: 77cb1e5c994453b1fed5002ce72c6ca16e485f19d906d88b31fac9a167aa5ecb (533 bytes)
rich-ir:annotation-diagnostics:pretty: 05561f90277eed1d5e13656c4a4ccdc2a5c925074b85bca341b1b6e73ca19981 (871 bytes)
```

## Covered Inputs

- `fixtures/representative.md` parse result
- `fixtures/representative.md` normalize result
- `fixtures/representative.md` validation result with deterministic rule
  families configured to pass
- `fixtures/rules/wp-4-diagnostics.md` validation result with diagnostic output
- `fixtures/rich-ir/proving.md` normalized as `1.0.0-draft`
- `fixtures/rich-ir/proving.md` serialized with public rich IR sections,
  tables, lists, links, text spans, targets, and source slices
- Caller-owned node and source annotations validated through
  `validateAnnotations`
- Annotation diagnostics for a missing node target
- Compact and pretty serializer modes for every repeatability case

## Guarantees

- The focused Vitest gate runs `tests/rich-ir-repeatability.test.ts` through
  `npm run test:rich-ir:repeatability`; this script is no longer a placeholder.
- The rich IR gate performs ten in-process serialization runs and compares
  UTF-8 bytes, byte length, SHA-256 digest, and case order.
- The standalone proof command imports the package through its public package
  export after `npm run build`, preserving the published API path.
- The 1.0 document-bearing rich IR cases use serializer
  `compatibilityMode: "default"` and keep the current `1.0.0-draft` version
  string.

## Limitations

- This evidence proves repeatability for the representative fixture set listed
  above. It does not prove exhaustive determinism for every possible Markdown
  input or every caller-owned annotation payload shape.
- The gate is serializer-bound. It does not change parser, normalizer,
  validator, source, query, or CLI behavior.
- BEL-949 does not promote `1.0.0-draft` to final `1.0.0`.

## Conclusion

VAL-5 passes for BEL-949. The serializer produces byte-for-byte identical
compact and pretty JSON across ten runs for legacy public outputs and
representative 1.0 rich IR document, annotation, and diagnostic outputs.
