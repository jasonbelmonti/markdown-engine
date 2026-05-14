# WP-5 EVD-8: Declarative Validation Boundary Audit

Date: 2026-05-13
Issue: BEL-985
Work package: BEL-981 / WP-5D
Validation: Declarative validation boundary audit

## Scope

This evidence records the declarative validation pre-merge boundary audit. The
audit confirms that declarative validation remains a deterministic local engine
feature and does not introduce arbitrary JavaScript, expression evaluation,
profile-sourced regex compilation, plugins, network calls, LLM calls, file
watching, persistence, or profile-specific core semantics.

## Boundary Assertions

Declarative validation is limited to:

- profile parsing as YAML-compatible JSON-safe data
- closed selector and assertion syntax
- deterministic rule compilation into internal data-only plans
- deterministic selector resolution over public `EngineDocument` structure
- deterministic assertion evaluation
- stable diagnostics, rule results, serialization, and optional evidence

The implementation boundary excludes:

- arbitrary JavaScript and `eval`
- expression evaluation
- profile-sourced regex compilation and regex-like v1 profile keys
- plugins and plugin loading
- network calls and remote services
- LLM calls, MCP transport, and agent adapters
- file watching and background daemons
- persistence, databases, caches, and writes from the API path
- profile-specific core semantics such as operational-design-spec, AGENTS.md,
  TASK.md, issue keys, entity registries, semantic scoring, or relationship
  types

Regex-like keys (`matches`, `pattern`, `regex`, `regexp`) and executable-like
keys (`callback`, `eval`, `execute`, `expression`, `function`, `import`,
`imports`, `plugin`, `script`) are rejected with
`profile.config.unsupportedKey`; they are not executed or compiled.

## Automated Gate

`scripts/check-declarative-validation-boundary.mjs` verifies:

- package dependency audit reports no forbidden dependency or `npm:` alias drift
  through the existing dependency boundary scanner
- declarative validation source and validation CLI helper files do not contain
  dynamic evaluation, dynamic import, profile-sourced regex compilation, network
  calls including bare, side-effect, CommonJS, and subpath Node network module
  imports, file watching, persistence writes, LLM/MCP/agent transport, plugin
  loaders, `Function(...)`, or profile-specific semantic terms
- unsupported regex-like and executable-like profile keys remain registered in
  `src/declarative-validation/diagnostics/profile-config-diagnostics.ts`
- rejection coverage exists for regex-like and executable-like profile payloads,
  including `^(a+)+$` regex-like fixtures and nested profile payloads
- this evidence records the required BEL-985 boundary exclusions

## Commands

```sh
npm run audit:declarative-validation-boundary
```

The package script runs:

```sh
node scripts/check-declarative-validation-boundary.mjs
```

## Recorded Results

```text
Declarative validation boundary audit PASS
Direct dependency matches: 0
Runtime boundary source matches: 0
Regex-like key rejection checks: present
Unsafe executable key rejection checks: present
Profile-specific core semantic matches: 0
```

BEL-1043 revalidated this gate on 2026-05-14 after the `textLength` assertion
surface reached public contract and CLI/example coverage. The same command
passed from `.worktrees/bel-1043-textlength-contract-verification` on baseline
`d02522d`, with 0 direct dependency matches, 0 runtime boundary source matches,
regex-like key rejection present, unsafe executable key rejection present, and 0
profile-specific core semantic matches.

## Residual Risks

- The audit is intentionally targeted at declarative validation source and
  package dependency drift. It is not a general TypeScript security analyzer.
- The CLI validation path reads caller-specified local Markdown and profile
  files by design. This evidence excludes file watching, traversal services,
  background persistence, and API-owned writes, not the CLI's explicit local
  file reads.
- Future profile syntax expansion must repeat this audit if it adds new
  selector, assertion, matching, evidence, or CLI behavior.

## Conclusion

BEL-985 EVD-8 passes. Declarative validation remains inside the deterministic
local engine boundary, rejects unsafe and regex-like profile keys as unsupported
configuration, and introduces no arbitrary execution, regex compilation,
plugin, network, LLM, file-watching, persistence, or profile-specific core
semantic behavior.
