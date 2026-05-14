# CODEFACTORY Agentic Validation Backbone

Status: Strategy note
Date: 2026-05-11

## Objective

Capture the CODEFACTORY direction for using `markdown-engine` as a deterministic
control-plane primitive for full-auto agentic development at scale.

The core idea is not just Markdown validation. The goal is to convert important
agent-facing Markdown artifacts into auditable operational contracts that agents
can consume, validate, execute against, and close out with evidence.

## Directional Thesis

`markdown-engine` should remain the deterministic kernel:

- parse GitHub Flavored Markdown and YAML frontmatter
- normalize documents into stable engine-owned IR
- expose source-grounded targets, sections, lists, tables, links, and spans
- evaluate closed deterministic validation profiles
- emit stable diagnostics and repeatable serialized evidence

CODEFACTORY should build the agentic control plane around that kernel rather
than asking agents to repeatedly infer operational meaning from raw Markdown.

## Why This Matters At Scale

Agentic development at scale fails from ambiguity, drift, incomplete handoffs,
unstated completion gates, inconsistent interpretation, and weak evidence.

This technology adds value when it turns Markdown artifacts into contracts that
can be checked before execution, interpreted consistently during execution, and
gated before completion.

The compounding effect is important: one strong artifact profile can improve
thousands of agent runs by preventing malformed tasks, missing success criteria,
invalid references, incomplete handoffs, and unsupported completion claims.

## Layered Architecture

Recommended package and runtime layering:

| Layer | Responsibility |
| --- | --- |
| `markdown-engine` | Deterministic parsing, rich IR, structural validation, diagnostics, stable serialization. |
| `markdown-profile` | Versioned artifact profiles such as `codefactory.task@v1` and `codefactory.project@v1`. |
| `markdown-runtime` | Runtime lenses and normalized operational contracts for agents. |
| `markdown-mcp` | Tools such as `validate_file`, `generate_lens`, `extract_contract`, and `gate_completion`. |
| `agent-adapters` | Codex, Claude, and other runtime bootloaders that route agents through the validation and lens tools. |
| `agent-eval-harness` | Semantic and behavioral evaluation, kept separate from deterministic validation. |

## Artifact Profiles

The profile registry should version every important CODEFACTORY artifact type:

- `codefactory.task@v1`
- `codefactory.project@v1`
- `codefactory.handoff@v1`
- `codefactory.execution-spec@v1`
- `codefactory.review@v1`
- `codefactory.release@v1`
- `codefactory.agent-instructions@v1`

Each registry entry should map to paired deterministic assets:

```yaml
codefactory.task@v1:
  validation: profiles/task.validation.yaml
  lens: profiles/task.lens.yaml
  semanticChecks: profiles/task.semantic.yaml
```

## Runtime Lenses

Agents should consume lenses, not raw Markdown, for operational decisions.

Raw Markdown remains the source of truth. The lens is the deterministic flight
display generated from that source.

A task lens should expose a stable JSON contract such as:

```json
{
  "profile": "codefactory.task@v1",
  "validation": "pass",
  "objective": "...",
  "constraints": [],
  "successCriteria": [],
  "risks": [],
  "openQuestions": [],
  "completionGates": [],
  "provenance": []
}
```

## Declarative Lens Specs

Lens specs should be declarative. They should define what to extract, how to
normalize it, what output contract to emit, and what provenance proves it.

They should not become prompt templates, arbitrary scripts, plugin loaders, or
semantic evaluators.

Example:

```yaml
syntaxVersion: codefactory.lens@v1
artifactProfile: codefactory.task@v1
documentVersion: 1.0.0

outputs:
  objective:
    select: { target: section, title: Objective }
    extract: text
    required: true
    cardinality: one

  successCriteria:
    select: { target: section, title: "Materially verifiable success criteria" }
    extract: checklistItems
    required: true
    cardinality: many

  constraints:
    select: { target: section, title: "Context / Constraints" }
    extract: bulletsAndParagraphs
    required: false
    cardinality: many
```

Required lens machinery:

- lens spec parser with closed syntax validation
- data-only lens compiler
- deterministic extractor runtime
- output schema validator
- source-grounded provenance model
- ambiguity diagnostics
- stable JSON serialization and hashing
- CLI and MCP entry points
- profile-to-lens registry

Initial deterministic extractors:

- `text`
- `markdown`
- `headingText`
- `listItems`
- `checklistItems`
- `tableRows`
- `frontmatterField`
- `links`
- `codeBlocks`
- `sourceText`

Every extracted field should carry provenance:

- source file
- artifact profile version
- lens spec version
- selector
- node target or source range
- input hash
- profile hash
- lens spec hash

## Semantic Validation

Semantic validation cannot be literally deterministic when an LLM participates
in the judgment loop. The closest reliable approach is bounded, source-grounded
claim verification over deterministic lens JSON.

Do not ask a model broad questions such as:

> Is this task good?

Ask narrow questions such as:

- Does the objective describe one primary outcome?
- Is each success criterion materially verifiable?
- Do constraints conflict with each other?
- Does the final response claim completion not supported by evidence?
- Does the handoff omit a blocking risk already present in the task lens?

Semantic check specs should be separate from validation and lens specs:

```yaml
syntaxVersion: codefactory.semantic-checks@v1
artifactProfile: codefactory.task@v1

checks:
  - id: criteria.materially-verifiable
    input: lens.successCriteria
    rubric: each_criterion_must_be_objectively_checkable
    severity: error

  - id: completion.evidence-supported
    input:
      criteria: lens.successCriteria
      evidence: run.evidence
      finalClaims: run.finalResponse
    rubric: completion_claims_must_be_supported
    severity: error
```

Semantic judge output must be structured:

```json
{
  "checkId": "criteria.materially-verifiable",
  "verdict": "fail",
  "confidence": "high",
  "sourceRefs": ["criterion:SC-2"],
  "reason": "SC-2 is not objectively checkable.",
  "repairSuggestion": "Define the command, observable output, or artifact state."
}
```

Reliability controls:

- fixed model version where possible
- temperature `0`
- stable prompt templates
- JSON schema validation for judge output
- lens hash, rubric hash, prompt hash, model version, and output hash
- result caching keyed by all deterministic inputs and model settings
- `pass`, `fail`, `uncertain`, and `not_applicable` verdicts
- deterministic aggregation rules for multi-judge reviews

High-value semantic gates can run a judge/skeptic pair:

- Judge: determine whether the check passes.
- Skeptic: find the strongest reason it should not pass.
- Aggregator: deterministic code decides whether to block, pass, or escalate.

Uncertainty must be first-class. A weak semantic result should escalate rather
than masquerade as deterministic validation.

## Completion Gates

Full-auto development needs a completion gate runner that executes before an
agent says work is done.

The gate should check:

- deterministic artifact validation has passed or has explicit waivers
- required lens fields exist
- success criteria have evidence
- referenced files, issues, or tasks are consistent
- required validation commands ran
- no blocking deterministic diagnostics remain
- semantic checks are pass or explicitly escalated

## Evidence Ledger

The system should persist repeatable evidence for every important run:

- artifact path
- artifact profile version
- validation profile hash
- lens spec hash
- semantic rubric hash
- input hash
- lens output hash
- diagnostics
- command outputs
- agent identity and model metadata
- worktree, branch, commit, and PR
- waiver records

This is the audit trail required for full-auto operation.

## Waiver System

Not every failed check should hard-stop automation forever. Exceptions should be
allowed, but every exception must be explicit.

A waiver should record:

- failed rule or check ID
- reason
- approving authority
- expiration or scope
- downstream risk
- evidence link

## Recommended Build Sequence

1. Define `codefactory.task@v1` as the first production artifact profile.
2. Build paired `task.validation.yaml` and `task.lens.yaml`.
3. Prove the task profile against representative CODEFACTORY task artifacts.
4. Implement lens parser, compiler, extractors, provenance, and stable JSON.
5. Add `validate_file`, `generate_lens`, and `validate_and_lens` tools.
6. Add completion gate runner.
7. Add evidence ledger.
8. Add semantic check specs over lens JSON.
9. Add `PROJECT.md` and `HANDOFF.md` profiles.
10. Add agent bootloaders and MCP integration.
11. Add orchestration loop for worktree creation, task selection, execution,
    validation, repair, PR creation, and closeout.

## First Proof Target

The first production proof should be `codefactory.task@v1`.

Minimum success criteria:

- A `TASK.md` profile validates required structure.
- A runtime lens is generated before work begins.
- An agent consumes the lens as operational input.
- Completion is gated against materially verifiable success criteria.
- Failed validation blocks or requires an explicit waiver.
- Evidence is serialized and repeatable.

If that loop works, the same pattern can scale across CODEFACTORY artifacts and
become the operational backbone for full-auto agentic development.
