# WP-6 EVD-11: Downstream Consultation And Handoff Notes

Date: 2026-05-01
Issue: BEL-888
Work package: WP-6
Review: REV-4

## Scope

This evidence records downstream profile/runtime consultation status and
handoff notes for the initial `markdown-engine` implementation package.

## Downstream Consultation Status

Named downstream profile/runtime consumer: pending.

REV-4 status: not yet complete.

Release effect: package tag and publication remain blocked until either a named
downstream profile/runtime consumer confirms the contract is usable or the
project owner records an explicit waiver.

Required downstream confirmation:

- normalized `EngineDocument` and `EngineNode` output can support profile
  compiler work without consuming raw parser AST
- diagnostic shape can support downstream CI, editor, or agent feedback
- validation config shape is sufficient for deterministic rule declarations
  without semantic or LLM-backed evaluation
- serialized output can support snapshot and repeatability checks
- raw HTML representation and `rawHtml.policy` diagnostics are sufficient for
  current containment needs

## Handoff Summary

Current import surface:

```ts
import {
  normalize,
  parse,
  serialize,
  validate,
} from "@jasonbelmonti/markdown-engine";
```

Primary docs:

- [`README.md`](../../README.md)
- [`docs/contracts/api.md`](../contracts/api.md)
- [`docs/contracts/frontmatter.md`](../contracts/frontmatter.md)
- [`docs/execution/markdown-engine-execution-spec.md`](../execution/markdown-engine-execution-spec.md)

Evidence bundle:

- [EVD-1 critical-path proof](wp-1c-ms-1-evidence.md)
- [EVD-2 parser/frontmatter fixtures](wp-3-evd-2-parser-frontmatter-fixtures.md)
- [EVD-3 IR and diagnostic snapshots](wp-3-evd-3-ir-diagnostic-snapshots.md)
- [EVD-4 config and rule validation](wp-4-evd-4-rule-validation.md)
- [EVD-5 repeatability](wp-5-evd-5-repeatability.md)
- [EVD-6 contract review](wp-2-evd-6-contract-review.md)
- [EVD-7 release readiness](wp-6-evd-7-release-readiness.md)
- [EVD-8 boundary inspection](wp-5-evd-8-boundary-inspection.md)
- [EVD-9 merge readiness](wp-6-evd-9-merge-readiness.md)
- [EVD-10 rollback containment](wp-6-evd-10-rollback-containment.md)
- [EVD-11 downstream handoff](wp-6-evd-11-downstream-handoff.md)

## Consumer Contract Boundaries

Downstream packages may rely on:

- public package root exports
- `EngineDocument` and `EngineNode` as engine-owned normalized IR
- `MarkdownDiagnostic` with stable code, severity, message, optional rule ID,
  and optional source range
- YAML-friendly `ValidationConfig`
- deterministic `ValidationResult` and per-rule result shape
- stable serialized JSON output for public result objects

Downstream packages must not rely on:

- raw mdast/unified parser AST nodes
- raw parser `position` fields
- raw YAML parser documents, CST, tokens, warnings, or errors
- internal files under `src/parser`, `src/frontmatter`, `src/config`,
  `src/rules`, `src/ir`, `src/diagnostics`, or `src/internal`
- private rule-loader internals or parser dependency behavior

## Out-Of-Scope Behavior Preserved

The handoff does not include:

- profile compiler implementation
- runtime lens generation
- MCP transport
- Codex or Claude agent adapters
- semantic or LLM validation
- arbitrary rule plugins
- network services
- persistent storage
- release publication mechanics

## Recommended Next Downstream Actions

1. Assign or name the downstream profile/runtime consumer for REV-4.
2. Review the README, API contract, frontmatter contract, and EVD-7 release
   readiness record.
3. Run a downstream spike that imports the package root and consumes
   `EngineDocument`, diagnostics, validation config, and serialized output.
4. Record confirmation, requested changes, or an owner waiver before MS-3
   release approval.
5. If contract changes are required, route them through the public contract
   review path before any tag or publication.

## Open Handoff Items

- Downstream profile/runtime consumer identity is not recorded yet.
- MS-3 approval is not recorded yet.
- Package metadata is prepared as `@jasonbelmonti/markdown-engine@0.1.0`.
- Package tag and publication remain withheld.

## Conclusion

The implementation baseline is ready for downstream review, but REV-4 remains
open. Release is contained until downstream confirmation or explicit owner
waiver is recorded with MS-3 approval.
