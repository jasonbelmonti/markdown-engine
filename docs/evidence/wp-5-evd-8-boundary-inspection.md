# WP-5 EVD-8: Boundary Dependency Audit and Review Report

Date: 2026-04-30
Issue: BEL-887
Work package: WP-5
Validation: VAL-8

## Scope

This evidence records package-boundary review for `markdown-engine`. The
automated gate is intentionally limited to direct dependency and `npm:` alias
target auditing. Source-level boundary safety is confirmed by implementation
review instead of brittle TypeScript import parsing.

The package boundary remains parse, normalize, deterministic validate,
diagnostics, and serialize.

WP-5 does not add profile compiler behavior, runtime lenses, MCP transport,
agent adapters, arbitrary rule plugins, network services, persistence, LLM
calls, or semantic evaluation.

## Dependency Audit Script

Command:

```sh
node scripts/check-boundaries.mjs
```

Result:

```text
Boundary dependency audit PASS
Direct dependencies scanned: 8
Forbidden dependency matches: 0
```

The script inspects:

- direct package dependencies from `dependencies`, `devDependencies`,
  `peerDependencies`, and `optionalDependencies`
- `npm:` alias targets, so innocuous alias names cannot hide forbidden package
  targets

The script fails on direct dependency names or `npm:` alias dependency targets
that would indicate profile/runtime/MCP/agent-adapter/LLM/network-service scope
drift.
Dependency matching is constrained to exact forbidden names, known forbidden
scopes, boundary-specific package tokens, or parsed `npm:` alias targets so
routine packages with common substrings, such as `@babel/runtime`, do not fail
the inspection. Boundary-specific tokens are detected in either the package
scope or package name segment, including scoped names such as `@mcp/sdk`, and
alias specs such as `engine-client -> npm:openai@latest`.

The script does not parse TypeScript imports or scan arbitrary source text. That
is deliberate: source-level scope drift is handled by review of the diff,
changed source paths, public API changes, and package dependencies.

## Source Boundary Review

`git diff --name-status origin/main...HEAD` shows WP-5 adds evidence docs,
repeatability scripts, serialization snapshots, boundary dependency audit tests,
and test support. It does not modify `src/**`, parser, normalizer, validator,
serializer, rule, config, public API, package dependency, or lockfile behavior.

Reviewer scope for VAL-8 is:

- confirm no forbidden direct package dependency or alias target exists
- confirm no `src/**` implementation change introduces profile/runtime/MCP,
  agent-adapter, LLM, network-service, persistence, or product-profile behavior
- confirm any future source-boundary concern is reviewed directly or escalated
  to an AST-based checker rather than extending ad hoc import parsing

## Test Coverage

`tests/boundary-inspection.test.ts` executes the boundary script through Vitest
and requires the pass marker. It verifies forbidden package names, scoped
forbidden packages, `npm:` alias target inspection, and false-positive avoidance
for unrelated dependency names. This keeps the dependency-audit portion of VAL-8
covered by `npm test` as well as by the standalone evidence command.

Focused command:

```sh
npm run build && npx vitest run tests/serialization-repeatability.test.ts tests/boundary-inspection.test.ts -u
```

Focused result:

```text
tests/boundary-inspection.test.ts (4 tests) passed
tests/serialization-repeatability.test.ts (2 tests) passed
Tests: 6 passed
```

## Boundary Notes

The WP-5 implementation adds only repeatability tests, snapshot artifacts,
boundary dependency audit tooling, and evidence docs. It does not modify parser,
normalizer, validator, serializer, rule, config, or public contract behavior.

## Final Validation

Full validation commands run for review readiness:

```sh
npm run typecheck
npm test
git diff --check origin/main...HEAD
git diff --check
node scripts/check-boundaries.mjs
```

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 7 test files and 42 tests
- `git diff --check origin/main...HEAD`: pass
- `git diff --check`: pass
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned

## Conclusion

VAL-8 passes through a direct dependency audit plus source-boundary review. No
forbidden direct dependency or alias target was found, and WP-5 does not change
engine source or public runtime behavior. Source import parsing is intentionally
out of scope for this evidence.
