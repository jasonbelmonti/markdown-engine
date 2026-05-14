const examples = {
  operationalSpec: {
    tabId: "tab-operational-spec",
    kicker: "Operational spec",
    title: "Confirm every handoff carries the same structure.",
    story:
      "A platform team wants each operating spec to include objective, constraints, execution plan, risk register, and handoff links. Markdown Engine validates those sections, checks table shape, enforces OPS-RISK IDs, and proves the expected handoff link is present.",
    profilePath:
      "fixtures/declarative-validation/examples/operational-spec/profile.yaml",
    documentPath:
      "fixtures/declarative-validation/examples/operational-spec/pass.md",
    outcomes: [
      "Frontmatter includes title, owner, and status.",
      "Required sections appear in strict order.",
      "Risk IDs are unique and use the OPS-RISK prefix.",
    ],
    profile: `syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: frontmatter.required
    select:
      target: document
    assert:
      frontmatterRequired:
        fields:
          - title
          - owner
          - status

  - id: sections.required
    select:
      target: document
    assert:
      sectionsRequired:
        order: strict
        headings:
          - Objective
          - Context / Constraints
          - Execution Plan
          - Risk Register
          - Handoff Links

  - id: risk.table.columns
    select:
      target: table
      section: Risk Register
      header:
        - ID
        - Mitigation
        - Status
    assert:
      tableColumnsRequired:
        columns:
          - ID
          - Mitigation
          - Status

  - id: risk.ids.unique
    select:
      target: tableCell
      section: Risk Register
      column: ID
    assert:
      ids:
        prefix: OPS-RISK
        unique: true

  - id: handoff.link
    select:
      target: link
      section: Handoff Links
      text: handoff packet
      url: ./handoff-packet.md
    assert:
      text:
        contains: handoff packet`,
    document: `---
title: Operational Spec Example
owner: platform-team
status: ready
---

# Objective

Mission control uses this structural profile to confirm a small operating spec
has the required sections, handoff links, and risk tracking details.

# Context / Constraints

The example stays generic. It validates Markdown headings, tables, IDs, list
content, literal text, and links without attaching domain meaning to the core
engine.

# Execution Plan

- MUST Validate profile fixtures locally.
- MUST Record evidence before requesting review.
- Keep the checks deterministic and local-only.

# Risk Register

| ID | Mitigation | Status |
| --- | --- | --- |
| OPS-RISK-1 | Keep examples structural. | tracked |
| OPS-RISK-2 | Keep commands local. | closed |

# Handoff Links

The [handoff packet](./handoff-packet.md) records follow-up review notes for the
next operator.`,
  },
  releaseChecklist: {
    tabId: "tab-release-checklist",
    kicker: "Release checklist",
    title: "Gate release readiness before the publish command.",
    story:
      "A release operator needs the checklist to prove package metadata, dry-run evidence, and linked release notes are present before approval. The profile verifies required sections, table columns, REL-GATE IDs, and a ready contract-docs row.",
    profilePath:
      "fixtures/declarative-validation/examples/release-checklist/profile.yaml",
    documentPath:
      "fixtures/declarative-validation/examples/release-checklist/pass.md",
    outcomes: [
      "Release metadata carries title, release, and owner.",
      "Gate Table contains ID, Gate, and Status columns.",
      "Release notes link is present in the Links section.",
    ],
    profile: `syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: gate.table.columns
    select:
      target: table
      section: Gate Table
      header:
        - ID
        - Gate
        - Status
    assert:
      tableColumnsRequired:
        columns:
          - ID
          - Gate
          - Status

  - id: release.link
    select:
      target: link
      section: Links
      text: release notes
      url: ./release-notes.md
    assert:
      text:
        contains: release notes`,
    document: `---
title: Release Checklist Example
release: 1.0.0
owner: release-team
---

# Release Checklist

- Verify package metadata.
- Verify package dry run.
- Record release evidence.

# Gate Table

| ID | Gate | Status |
| --- | --- | --- |
| REL-GATE-1 | Contract docs | ready |
| REL-GATE-2 | Boundary audit | ready |

# Links

Publish review uses the [release notes](./release-notes.md) after all gates pass.`,
  },
  requirementsTraceability: {
    tabId: "tab-requirements-traceability",
    kicker: "Requirements traceability",
    title: "Keep requirements and evidence references synchronized.",
    story:
      "A quality team needs requirement IDs and evidence IDs to remain unique and referenced in a traceability section. The profile validates table structure, literal shall language, ID prefixes, and cross-section references.",
    profilePath:
      "fixtures/declarative-validation/examples/requirements-traceability/profile.yaml",
    documentPath:
      "fixtures/declarative-validation/examples/requirements-traceability/pass.md",
    outcomes: [
      "REQ and EVD identifiers are unique by table column.",
      "REQ-2 contains required language and excludes TBD.",
      "Traceability mentions every requirement and evidence ID.",
    ],
    profile: `syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: requirements.table.columns
    select:
      target: table
      section: Requirements
      header:
        - ID
        - Requirement statement
        - Source
    assert:
      tableColumnsRequired:
        columns:
          - ID
          - Requirement statement
          - Source

  - id: evidence.table.columns
    select:
      target: table
      section: Evidence Matrix
      header:
        - ID
        - Requirement
    assert:
      tableColumnsRequired:
        columns:
          - ID
          - Requirement
          - Evidence

  - id: requirement.ids.unique
    select:
      target: tableCell
      section: Requirements
      column: ID
    assert:
      ids:
        prefix: REQ
        unique: true

  - id: evidence.ids.unique
    select:
      target: tableCell
      section: Evidence Matrix
      column: ID
    assert:
      ids:
        prefix: EVD
        unique: true

  - id: requirement.text
    select:
      target: tableCell
      section: Requirements
      column: Requirement statement
      rowWhere:
        column: ID
        equals: REQ-2
    assert:
      text:
        contains: shall
        excludes:
          - TBD

  - id: traceability.requirements
    select:
      target: document
    assert:
      references:
        idsFrom:
          section: Requirements
          column: ID
          prefix: REQ
        mustAppearIn:
          - Traceability

  - id: traceability.evidence
    select:
      target: document
    assert:
      references:
        idsFrom:
          section: Evidence Matrix
          column: ID
          prefix: EVD
        mustAppearIn:
          - Traceability`,
    document: `---
title: Requirements Traceability Example
owner: quality-team
status: ready
---

# Requirements

| ID | Requirement statement | Source |
| --- | --- | --- |
| REQ-1 | The package shall parse one Markdown file. | CLI |
| REQ-2 | The package shall validate a configured profile. | API |
| REQ-3 | The package shall emit deterministic diagnostics. | Evidence |

# Evidence Matrix

| ID | Requirement | Evidence |
| --- | --- | --- |
| EVD-1 | REQ-1 | CLI parse fixture |
| EVD-2 | REQ-2 | Profile validation fixture |
| EVD-3 | REQ-3 | Diagnostic assertion fixture |

# Traceability

REQ-1 is covered by EVD-1.
REQ-2 is covered by EVD-2.
REQ-3 is covered by EVD-3.`,
  },
};

const selectors = {
  kicker: "[data-example-kicker]",
  title: "[data-example-title]",
  story: "[data-example-story]",
  outcomes: "[data-example-outcomes]",
  profilePath: "[data-example-profile-path]",
  documentPath: "[data-example-document-path]",
  profile: "[data-example-profile]",
  document: "[data-example-document]",
};

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setExample(exampleKey) {
  const example = examples[exampleKey];
  const panel = document.querySelector("#workflow-panel");

  if (!example || !panel) {
    return;
  }

  setText(selectors.kicker, example.kicker);
  setText(selectors.title, example.title);
  setText(selectors.story, example.story);
  setText(selectors.profilePath, example.profilePath);
  setText(selectors.documentPath, example.documentPath);
  setText(selectors.profile, example.profile);
  setText(selectors.document, example.document);

  const outcomes = document.querySelector(selectors.outcomes);
  if (outcomes) {
    outcomes.replaceChildren(
      ...example.outcomes.map((outcome) => {
        const item = document.createElement("li");
        item.textContent = outcome;
        return item;
      }),
    );
  }

  document.querySelectorAll("[data-example-button]").forEach((button) => {
    const isActive = button.dataset.exampleButton === exampleKey;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  panel.setAttribute("aria-labelledby", example.tabId);
}

async function copyTextFrom(targetId, button) {
  const target = document.getElementById(targetId);
  const text = target?.textContent ?? "";

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.left = "-9999px";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
  }

  const previousLabel = button.textContent;
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = previousLabel;
  }, 1400);
}

document.querySelectorAll("[data-example-button]").forEach((button) => {
  button.addEventListener("click", () => {
    setExample(button.dataset.exampleButton);
  });
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", () => {
    copyTextFrom(button.dataset.copyTarget, button);
  });
});
