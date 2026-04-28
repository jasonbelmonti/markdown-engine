# Markdown Engine Runtime Architecture

## Mission

Build `markdown-engine` first as the deterministic foundation for profiled
Markdown documents, while preserving the larger package decomposition required
to ship those profiles into coding-agent runtimes.

The long-term product is schema infrastructure for special Markdown filetypes:
`AGENTS.md`, `CLAUDE.md`, `TASK.md`, `PROCESS.md`, `DIRECTIVE.md`,
`HANDOFF.md`, and arbitrary profile-backed files such as `FOO.md`.

## Core Concept

Define a Markdown profile meta-spec: a declarative way to describe constrained
Markdown document types without inventing a new Markdown dialect.

A human defines a profile such as `task/basic@v1`. A Markdown file declares or
matches that profile. The system validates the file deterministically, then
emits a compact runtime lens so agents interpret the document through the
profile instead of guessing from raw Markdown.

Evaluation is two-phase:

1. Deterministic: parse, normalize, validate, and emit precise diagnostics.
2. Semantic: evaluate clarity, conflict risk, behavioral effect, and agent
   outcomes with model-assisted or trace-based checks.

Semantic checks must be labeled as semantic. They must not masquerade as
deterministic guarantees.

## Package Decomposition

| Package | Role | First-Class Responsibilities |
| --- | --- | --- |
| `markdown-engine` | First build target | Parse GFM, parse YAML frontmatter, normalize into stable IR, preserve source locations, enforce deterministic structural rules, emit machine-readable diagnostics. |
| `markdown-profile` | Profile compiler | Define and validate the profile meta-spec, compile profile rules onto engine capabilities, version contracts such as `task/basic@v1`, reject unsupported declarative rules. |
| `markdown-runtime` | Agent interpretation layer | Emit runtime lenses, normalized JSON contracts, validation summaries, extracted objectives, constraints, success criteria, risks, and open questions. |
| `markdown-mcp` | Runtime transport | Expose tools such as `validate_file`, `explain_file`, `extract_contract`, and `resolve_requirement` so agents do not manually interpret schemas. |
| `agent-adapters` | Agent-specific packaging | Generate Codex `AGENTS.md` bootloaders, Claude `CLAUDE.md` or imports, MCP config, hooks, and skills that make profiled documents transparent at runtime. |
| `agent-eval-harness` | Semantic and behavioral proof | Run controlled agent tasks with and without lenses; measure success rate, token use, latency, error classes, clarity, conflict risk, and behavioral alignment. |

## Runtime Lens

The runtime lens is the main artifact agents should consume.

```md
# TASK.md Runtime Lens

Profile: task/basic@v1
Validation: PASS

## Interpretation Guidance
- Objective is the primary mission outcome.
- Success criteria are completion gates.
- Execution notes are constraints and handoff context.

## Extracted Contract
- Objective: ...
- Success criteria: ...
- Constraints: ...
- Open questions: ...
```

## Runtime Delivery

Agents should receive profile knowledge transparently.

Operational flow:

1. Validate profiles.
2. Validate profiled Markdown instances.
3. Generate runtime lenses and normalized contracts.
4. Start the MCP server.
5. Inject a small bootloader through `AGENTS.md`, `CLAUDE.md`, hooks, skills, or
   agent-specific runtime configuration.
6. When a user or task references a profiled file, provide the corresponding
   lens before implementation begins.
7. Gate completion against deterministic success criteria when the active
   profile defines them.

The bootloader stays small and stable. The lens carries the live,
profile-specific interpretation.

## Directional Decision

Proceed with `markdown-engine` first, but design its API for the larger system:

- stable normalized IR
- deterministic diagnostics
- source locations
- YAML-friendly config inputs
- explicit unsupported-rule failures
- no hidden semantic inference

This keeps the first package focused while preserving the path to a transparent
agent runtime for special Markdown filetypes.

