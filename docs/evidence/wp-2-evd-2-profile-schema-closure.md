# WP-2 EVD-2: Profile Schema Closure

Issue: `BEL-977`
Date: 2026-05-08
Branch: `codex/bel-977-profile-schema-closure`
Worktree: `.worktrees/bel-977-declarative-validation-wp-2-profile-schema-closure`

## Objective

Record evidence that declarative validation profiles are parsed through a closed
profile-local schema before compilation or document validation. Invalid,
unsupported, or unsafe declarations produce deterministic diagnostics and do not
produce a `ValidationProfile`.

## Scope

This evidence covers the `PKG-2` profile parser and schema validator:

- YAML text and JSON-safe object profile inputs.
- `syntaxVersion` support for `markdown-engine.validation@v1`.
- Optional `documentVersion` parsing without parser-time default injection.
- Rule ID uniqueness, non-empty rule IDs, and severity validation.
- Closed top-level, rule, selector, assertion, predicate, and nested assertion
  object keys.
- Regex-like key rejection for `matches`, `pattern`, `regex`, and `regexp`.
- Unsafe executable-like key rejection for `script`, `plugin`, `import`,
  `imports`, `expression`, `eval`, `execute`, `callback`, and `function`.
- Ineffective assertion payload rejection for no-op `ids` and `text` shapes,
  empty required arrays, and table predicates without comparisons.

This evidence does not expand selector resolution, assertion evaluation, CLI
behavior, evidence hashes, or public package exports.

## Diagnostic Closure

The implementation keeps profile config diagnostic construction and closed-key
precedence in `src/declarative-validation/diagnostics/profile-config-diagnostics.ts`.
The profile schema modules consume that internal boundary without exporting new
package-root API symbols.

Diagnostic precedence verified by tests:

- Regex-like keys always emit `profile.config.unsupportedKey`, including
  first-level members under `assert`.
- Unsafe executable-like keys emit `profile.config.unsupportedKey`.
- Unknown first-level assertion members that are not regex-like or unsafe emit
  `profile.compile.unsupportedAssertion`.
- Unknown selector targets emit `profile.compile.unsupportedSelector`.
- Malformed supported fields emit `profile.config.invalidShape`.

## No Compiled Plan Claim

Invalid profile declarations return parse results with `profile` set to
`undefined`. Because `compileValidationProfile` requires a `ValidationProfile`,
these invalid declarations cannot produce a compiled rule plan through the
supported parser-to-compiler path. The profile parser does not import compiler,
selector, assertion evaluator, CLI, rich IR traversal, file-system, network, or
downstream runtime modules.

## Verification

Commands run from `.worktrees/bel-977-declarative-validation-wp-2-profile-schema-closure`:

- `npm run test:validation:profile`: pass, 1 file and 29 tests.
- `npm run test:validation:contract`: pass, 1 file and 10 tests.
- `npm run test:validation:compiler`: pass, 1 file and 3 tests.
- `npm run typecheck`: pass.
- Boundary scan for forbidden calls/imports: pass, no matches.
- Boundary scan for profile parser imports of compiler, assertions, selectors,
  CLI, rich IR, filesystem, downstream, runtime, MCP, or agent modules: pass, no
  matches.

## Result

BEL-977 closes the profile parser schema boundary for invalid YAML, unsupported
syntax versions, invalid shapes, duplicate rule IDs, unsupported keys, regex-like
keys, and unsafe declarations. Invalid declarations fail before compilation or
document validation and remain profile-local diagnostics.
