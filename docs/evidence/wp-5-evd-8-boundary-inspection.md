# WP-5 EVD-8: Boundary Inspection Report

Date: 2026-04-30
Issue: BEL-887
Work package: WP-5
Validation: VAL-8

## Scope

This evidence records package-boundary inspection for `markdown-engine`.
The package boundary remains parse, normalize, deterministic validate,
diagnostics, and serialize.

WP-5 does not add profile compiler behavior, runtime lenses, MCP transport,
agent adapters, arbitrary rule plugins, network services, persistence, LLM
calls, or semantic evaluation.

## Boundary Script

Command:

```sh
node scripts/check-boundaries.mjs
```

Result:

```text
Boundary inspection PASS
Source files scanned: 40
Direct dependencies scanned: 8
Forbidden source matches: 0
Forbidden dependency matches: 0
```

The script inspects:

- all TypeScript files under `src`
- direct package dependencies from `dependencies`, `devDependencies`,
  `peerDependencies`, and `optionalDependencies`

The script fails on forbidden source references or direct dependency names that
would indicate profile/runtime/MCP/agent-adapter/LLM/network-service scope drift.
Source matching is case-insensitive and accepts common hyphen, underscore, and
space-separated variants for package-boundary terms.

## Test Coverage

`tests/boundary-inspection.test.ts` executes the boundary script through Vitest
and requires the pass marker. This keeps VAL-8 covered by `npm test` as well as
by the standalone evidence command.

Focused command:

```sh
npm run build && npx vitest run tests/serialization-repeatability.test.ts tests/boundary-inspection.test.ts -u
```

Focused result:

```text
tests/boundary-inspection.test.ts (1 test) passed
tests/serialization-repeatability.test.ts (2 tests) passed
Snapshots: 3 written
```

## Boundary Notes

The WP-5 implementation adds only repeatability tests, snapshot artifacts,
boundary inspection tooling, and evidence docs. It does not modify parser,
normalizer, validator, serializer, rule, config, or public contract behavior.

## Final Validation

Full validation commands run for review readiness:

```sh
npm run typecheck
npm test
git diff --check origin/main...HEAD
rg -n "MCP|agent-adapter|agent adapter|LLM|fetch\\(|network service|profile compiler|runtime lens|markdown-profile|markdown-runtime|markdown-mcp" src tests
node scripts/check-boundaries.mjs
```

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 7 test files and 39 tests
- `git diff --check origin/main...HEAD`: pass
- boundary grep over `src` and `tests`: no forbidden dependency or scope
  matches
- `node scripts/check-boundaries.mjs`: pass, 40 source files and 8 direct
  dependencies scanned

## Conclusion

VAL-8 passes for the WP-5 boundary script. No forbidden source matches or direct
dependency matches were found in the inspected engine boundary.
