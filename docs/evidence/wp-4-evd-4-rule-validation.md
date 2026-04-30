# WP-4 EVD-4: Config And Rule Validation Report

Date: 2026-04-30
Issue: BEL-886
Work package: WP-4
Validation: VAL-4, VAL-6, VAL-8

## Scope

This evidence records the expanded closed rule registry, YAML-friendly config
schema behavior, raw HTML policy diagnostics, and unsupported-rule rejection
for deterministic validation.

WP-4 remains inside the `markdown-engine` boundary. It does not add profile
compiler behavior, runtime lenses, MCP transport, agent adapters, arbitrary
plugins, network services, persistence, LLM calls, or semantic evaluation.

## Supported Rule Families

The supported deterministic rule families are:

- `frontmatter.required`
- `headings.required`
- `codeFences.languages`
- `links.allowedSchemes`
- `rawHtml.policy`

All rules evaluate parsed frontmatter and normalized engine IR through the
public `validate` API. Raw parser AST objects are not consumed by the rule
registry and remain outside the public contract.

## Validation Evidence

Focused command:

```sh
npm run build && npx vitest run tests/rules.test.ts -u
```

Focused result:

```text
tests/rules.test.ts (6 tests) passed
Snapshots: 1 written
```

Final validation commands run for review readiness:

```sh
npm run typecheck
npm test
git diff --check
rg -n "MCP|agent-adapter|agent adapter|LLM|fetch\\(|network service|profile compiler|runtime lens" src tests
```

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 5 test files and 36 tests
- `git diff --check`: pass
- Boundary grep over `src` and `tests`: no forbidden dependency or scope
  matches

The focused tests prove:

- five supported rule families can all pass through one public API validation
  flow
- `codeFences.languages` applies to fenced code blocks and ignores indented
  code blocks, including fenced and indented code inside Markdown containers
- deterministic rule failures produce stable diagnostic codes, severities,
  messages, rule IDs, and source ranges where IR source ranges exist
- `rawHtml.policy` `deny` produces error diagnostics for raw HTML nodes
- `rawHtml.policy` `warn` produces warning diagnostics without invalidating the
  validation result
- semantic-style unsupported rules such as `semantic.summaryQuality` produce
  `config.rule.unsupported` diagnostics and are not interpreted
- invalid supported rule config produces `config.rule.invalid` diagnostics and
  does not execute that rule

Snapshot artifact:

- `snapshots/diagnostics/wp-4-rules.json`

Rule fixture:

- `fixtures/rules/wp-4-diagnostics.md`

## Diagnostic Example

The WP-4 diagnostic snapshot includes:

- `config.rule.unsupported` for `semantic.summaryQuality`
- `headings.required.missing` for a missing required heading
- `codeFences.languages.missing` for a code fence without a language
- `codeFences.languages.unsupported` for a disallowed code fence language
- `links.allowedSchemes.disallowed` for a disallowed URL scheme
- `rawHtml.policy.denied` for inert raw HTML data rejected by policy

## Boundary Notes

The implementation preserves the closed deterministic registry. Config loading
rejects unsupported rule IDs before rule evaluation, and the supported rule
parsers reject invalid rule config shapes before evaluators run.

Raw HTML is still represented as inert `html` IR node text. The raw HTML policy
rule emits diagnostics only; it does not execute, render, sanitize, fetch, or
evaluate HTML.
