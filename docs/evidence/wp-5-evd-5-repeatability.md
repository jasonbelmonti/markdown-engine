# WP-5 EVD-5: Deterministic Serialization Repeatability Report

Date: 2026-04-30
Issue: BEL-887
Work package: WP-5
Validation: VAL-5

## Scope

This evidence records a ten-run byte-for-byte repeatability check for public
`markdown-engine` serialization. It covers serialized parse, normalize, passing
validation, and diagnostic-producing validation results through the public API.

The check uses identical Markdown inputs and identical validation config for
each run. It verifies UTF-8 byte equality, byte length equality, and SHA-256
digest equality for compact and pretty serializer output. It also fails if any
run returns a different repeatability case count.

## Command

```sh
npm run build && node scripts/prove-repeatability.mjs --runs 10
```

## Result

```text
> markdown-engine@0.0.0 build
> tsc -p tsconfig.json

Serialization repeatability PASS
Runs: 10
Cases per run: 8
parse:representative:compact: bc31bf20589d7ea68697d7fb4627f67856368b44ad6967ac09822ecc1c69c1b1 (3366 bytes)
parse:representative:pretty: c1dd66f2f858df71159980c5e078e420b4e7da275555ba1dead0d3a3aed92f92 (7691 bytes)
normalize:representative:compact: 613e6c8142c4e1950fe2e3f9ca4831dc36805d94884d741525bdc8099fd5d92d (2566 bytes)
normalize:representative:pretty: ad322d00e5a716471f6fce3e09c70508be0122ce54fe76f7e764eac700595c94 (6264 bytes)
validate:representative-pass:compact: e236ba7eff58f49990a68c53dab297d71bd26fdfbe9fe3995ac670cf594a02b7 (363 bytes)
validate:representative-pass:pretty: e5d16f4325432fa0cd292fe73ac9145ae140875a54a47f5f61684a8fda3f681a (549 bytes)
validate:wp-4-diagnostics:compact: c91f3b405d131cf6c148cc26d6a3419a446c53ac1f499e06893236b8d6ebcae3 (2763 bytes)
validate:wp-4-diagnostics:pretty: e949efce7ee7e2282e1e9df490dca24c04b2906b1dabd333a793d6e4d4912c5c (4754 bytes)
```

## Covered Inputs

- `fixtures/representative.md` parse result
- `fixtures/representative.md` normalize result
- `fixtures/representative.md` validation result with five deterministic rule
  families configured to pass
- `fixtures/rules/wp-4-diagnostics.md` validation result with WP-4 diagnostic
  config, including unsupported-rule rejection

The standalone command imports the package by its public package name after
`npm run build`, so the evidence path follows the published package export.

## Snapshot Evidence

WP-5 adds serialized JSON snapshots for representative parse, representative
normalize, and WP-4 diagnostic validation output:

- `snapshots/serialization/wp-5-parse-representative.json`
- `snapshots/serialization/wp-5-normalize-representative.json`
- `snapshots/serialization/wp-5-validation-diagnostics.json`

Focused snapshot command:

```sh
npm run build && npx vitest run tests/serialization-repeatability.test.ts tests/boundary-inspection.test.ts -u
```

Focused result:

```text
tests/boundary-inspection.test.ts (4 tests) passed
tests/serialization-repeatability.test.ts (2 tests) passed
Tests: 6 passed
```

## Final Validation

Full validation commands run for review readiness:

```sh
npm run typecheck
npm test
git diff --check origin/main...HEAD
git diff --check
```

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 7 test files and 42 tests
- `git diff --check origin/main...HEAD`: pass
- `git diff --check`: pass
- no-index whitespace check over new untracked files: pass

## Conclusion

VAL-5 passes. Identical input and config produced byte-for-byte identical
serialized JSON across ten runs for all WP-5 repeatability cases.
