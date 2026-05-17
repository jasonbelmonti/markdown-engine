# Declarative Validation Documentation Tracks

Status: planning notes
Last updated: 2026-05-16

These notes capture two documentation tracks identified from reviewing how a
new developer or agent encounters declarative validation profiles.

## Track 1: Developer Documentation And Authoring Guides

Objective: make the project easier for a developer to understand, run, modify,
and extend without first reading contract and evidence documents end to end.

Primary audience:

- package consumers validating Markdown with the CLI or API
- profile authors encoding Markdown conventions
- contributors changing parser, IR, selector, assertion, diagnostic, or CLI code

Current gap:

- README and contracts are accurate but dense.
- The first-contact path mixes package usage, release notes, migration details,
  evidence links, and release gates.
- Declarative profile authoring lacks a short mental model before the grammar
  reference.
- Developers must infer which tests prove which subsystem.

Candidate deliverables:

- `CONTRIBUTING.md` or `docs/developer-guide.md`
- declarative validation authoring guide
- repo map by subsystem
- common development command matrix
- "when changing X, run Y" validation matrix
- selector/assertion cookbook for common profile authoring jobs

## Track 2: Agent Interpretation Of Declarative Profiles

Objective: help an agent unfamiliar with the grammar translate profile YAML into
plain-language intent before editing, validating, or explaining a profile.

Primary audience:

- coding agents reviewing or modifying profile YAML
- downstream tools that need a natural-language explanation of a profile
- human reviewers checking whether an agent interpreted a profile correctly

Current gap:

- The grammar is documented precisely, but the operational interpretation loop is
  implicit.
- Agents can misread selector fields as assertion modifiers.
- `tableHeader` and `column` look redundant until the selector pipeline is
  explained.
- There is no canonical "profile rule to English" translation template.

Candidate deliverables:

- agent interpretation guide
- selector field glossary with filter/extractor roles
- assertion interpretation matrix
- annotated profile examples
- common misreads section
- natural-language translation checklist

## Recommended Sequence

Start with Track 2 because it directly reduces profile misinterpretation risk.
After the agent interpretation guide exists, reuse the same mental model in the
human authoring guide for Track 1.
