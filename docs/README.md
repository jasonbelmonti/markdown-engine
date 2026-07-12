# markdown-engine Documentation Map

This is the canonical maintainer and agent entry point for repository
documentation. Use the status category before treating a document as current
authority. When documents conflict, prefer `Current contract`, then
`Architecture boundary`, then observed code state; treat historical and future
planning documents as context, not live requirements.

## Current contract

These documents define the current package-facing contract.

- [Public API contract](contracts/api.md) - exported API, rich IR document
  behavior, compatibility, CLI impact, and public non-goals.
- [Declarative validation contract](contracts/declarative-validation.md) -
  profile syntax, selector/assertion semantics, diagnostics, CLI behavior,
  evidence fields, compatibility, and validation boundary.
- [Frontmatter contract](contracts/frontmatter.md) - YAML frontmatter parsing
  behavior and diagnostics.
- [Root README](../README.md) - package purpose, current package/version
  status, API and CLI examples, and contract navigation.

## Architecture boundary

These documents describe the durable package boundary. Use them to understand
why profile compilation, runtime lenses, MCP transport, agent adapters,
semantic evaluation, network services, and persistence remain outside
`markdown-engine`.

- [Runtime architecture](../RUNTIME_ARCHITECTURE.md)
- [Markdown Engine operational design](design/markdown-engine-operational-design-spec.md)
- [Markdown Engine execution specification](execution/markdown-engine-execution-spec.md)
- [Rich IR operational design](design/markdown-engine-1.0-rich-ir-operational-design-spec.md)
- [Declarative validation syntax design](design/markdown-engine-declarative-validation-syntax-operational-design-spec.md)
- [Declarative validation syntax execution](execution/markdown-engine-declarative-validation-syntax-execution-spec.md)

## Historical design

These design records explain decisions that have already been implemented or
superseded by current contracts.

- [Markdown Engine operational design](design/markdown-engine-operational-design-spec.md)
- [Rich IR operational design](design/markdown-engine-1.0-rich-ir-operational-design-spec.md)
- [Declarative validation syntax design](design/markdown-engine-declarative-validation-syntax-operational-design-spec.md)

## Historical execution

These execution records show how completed work was planned and gated. Use them
for traceability, not as the first source for current behavior.

- [Markdown Engine execution specification](execution/markdown-engine-execution-spec.md)
- [Rich IR execution specification](execution/markdown-engine-1.0-rich-ir-execution-spec.md)
- [Declarative validation syntax execution](execution/markdown-engine-declarative-validation-syntax-execution-spec.md)

## Future design

These documents are planning inputs for future work. They are not current
package behavior unless a later contract says so.

- [Conditional declarative validation v2 design](design/conditional-declarative-validation-v2-design-spec.md)
- [Conditional declarative validation v2 execution](execution/conditional-declarative-validation-v2-execution-spec.md)

## Evidence record

Evidence records live in [docs/evidence](evidence). They are audit trails for
tests, contract reviews, boundary checks, release readiness, and milestone
approval. They should support current contracts, but they do not override the
contract documents.

Read evidence records as dated proof records, not normative behavior contracts.
When an evidence file says "current", interpret that statement relative to the
file's recorded date, baseline, and issue unless a newer "Current status" note
explicitly updates it. Historical package versions, release-withhold decisions,
and milestone gates remain useful audit facts, but current package behavior is
controlled by the current contract documents and observed repository state.

Primary evidence families:

- `wp-1-*` through `wp-6-*` - work-package validation and release-readiness
  evidence.
- `bel-957-*` through `bel-970-*` - release audit tracks for package
  boundaries, source safety, determinism, snapshots, and performance.
- `bel-978-*` through `bel-1043-*` - later contract, substrate, example-suite,
  and targeted verification records.
- `bel-1332-*` - OKF validation seal records for docs, boundary audit, final
  validation, and release containment.

Commonly cited records:

- [Rich IR contract documentation gate](evidence/wp-5-evd-6-rich-ir-contract.md)
- [Declarative validation contract review](evidence/wp-5-evd-7-declarative-validation-contract-review.md)
- [Declarative validation boundary audit](evidence/wp-5-evd-8-declarative-validation-boundary-audit.md)
- [OKF validation seal evidence](evidence/bel-1332-okf-release-readiness.md)
- [Declarative validation MS-2 approval](evidence/bel-986-ms-2-approval.md)
- [1.0 release readiness and containment](evidence/wp-6-evd-10-release-readiness.md)
- [Rollback and containment record](evidence/wp-6-evd-10-rollback-containment.md)

## Operations guide

Use these documents and commands when changing or validating the repository.

- [Testing, snapshot, and distribution operations](testing.md) - snapshot
  rules, focused test commands, release verification, bundled CLI checks, and
  distribution containment notes.
- Contract documentation gates:

  ```sh
  npm run docs:rich-ir-contract
  npm run docs:declarative-validation-contract
  ```

- Boundary and release gates:

  ```sh
  npm run audit:declarative-validation-boundary
  npm run release:verify
  npm pack --dry-run
  npm publish --dry-run --access public
  ```

## Site assets

The files `docs/index.html`, `docs/site.js`, `docs/styles.css`,
`docs/.nojekyll`, and `docs/assets/**` support the published consumer website.
Do not treat them as the canonical maintainer documentation map.
