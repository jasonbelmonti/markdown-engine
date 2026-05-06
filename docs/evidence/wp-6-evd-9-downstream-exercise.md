# WP-6 EVD-9: Downstream Exercise

Date: 2026-05-06
Issue: BEL-943
Work package: WP-6
Validation: VAL-9
Baseline: `origin/main` at `88989a3`

## Scope

This evidence records the 1.0 rich IR downstream exercise required before
release readiness review. The exercise proves that a SpecTrace-style structural
consumer can use the public package API to derive section-owned facts, source
spans, source slices, query results, and caller-owned annotations without
pushing entity registry semantics into `markdown-engine`.

## Fixture

Fixture: `fixtures/rich-ir/downstream.md`

The fixture contains:

- YAML frontmatter.
- Nested Markdown structure with `WP-1` and `WP-2` sections.
- A paragraph containing `CON-1 through CON-3` and `BEL-858` tokens.
- A table and task list under the `WP-1` section.

The tokens are plain Markdown text. The engine does not classify them as issue
keys, entities, relationships, registries, or domain facts.

## Public API Exercise

Test: `tests/rich-ir-downstream.test.ts`
Command: `npm run test:rich-ir:downstream`

The test uses only package-root public APIs:

- `parse`
- `normalize`
- `documentQueries`
- `validateAnnotations`

The exercise verifies:

- `normalize(parsed, { documentVersion: "1.0.0-draft" })` returns a draft rich
  IR document.
- `documentQueries.sections` can find the `WP-1` and `WP-2` sections without raw
  line scanning.
- Section body targets identify the `WP-1` paragraph, table, and list.
- `documentQueries.textSpans` can find the source-grounded paragraph span that
  contains `CON-1 through CON-3`.
- `documentQueries.sourceSlice` returns the `WP-1` heading source and paragraph
  source slice.
- `validateAnnotations` accepts a section node annotation and a source-range
  annotation while preserving opaque caller-owned payloads.
- The normalized engine document contains no semantic keys such as `entityId`,
  `entityType`, `issueKey`, `registry`, or `relationship`.
- The exercise is deterministic over ten repeated runs.

## Boundary Notes

The downstream-style fixture intentionally avoids importing SpecTrace code,
profile compiler code, runtime code, MCP tools, agent adapters, network
services, database clients, or raw parser AST modules.

The only domain-shaped facts are strings inside the Markdown fixture and inside
caller-owned annotation payloads. `markdown-engine` validates target shape and
target containment; it does not interpret those payloads.

## Recorded Results

Initial focused run from `.worktrees/BEL-943-wp-6-release-readiness`:

- `npm run test:rich-ir:downstream`: pass, 1 file and 2 tests.

Final release-readiness validation is recorded in
[`wp-6-evd-10-release-readiness.md`](wp-6-evd-10-release-readiness.md).

## Conclusion

VAL-9 passes for BEL-943. The 1.0 rich IR public API supports the motivating
downstream structural use case without adding SpecTrace, entity registry,
relationship graph, issue-key, profile, runtime, MCP, agent, or semantic
behavior to the engine.
