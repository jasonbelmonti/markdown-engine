---
title: Declarative Validation Downstream ODS Fixture
owner: markdown-engine
status: draft
---

# Objective

Prove an operational design spec structural fixture with generic declarative
validation over Markdown headings, tables, IDs, literal text, and traceability.

# Context / Constraints

The fixture must stay structural and deterministic. Required checks SHALL remain
generic validation over Markdown headings, tables, IDs, literal text, and
traceability.

# Functional Requirements

| ID | Statement | Source |
| --- | --- | --- |
| ODS-REQ-1 | The profile SHALL validate required headings. | Objective |
| ODS-REQ-2 | The profile SHALL validate table columns and IDs. | Context / Constraints |
| ODS-REQ-3 | The profile SHALL validate traceability records. | Traceability |

# Validation Matrix

| ID | Evidence | Status |
| --- | --- | --- |
| ODS-VAL-1 | Covers ODS-REQ-1 with section checks. | ready |
| ODS-VAL-2 | Covers ODS-REQ-2 with table checks. | ready |
| ODS-VAL-3 | Covers ODS-REQ-3 with traceability checks. | ready |

# Traceability

ODS-REQ-1 appears in the validation matrix through ODS-VAL-1.
ODS-REQ-2 appears in the validation matrix through ODS-VAL-2.
ODS-REQ-3 appears in the validation matrix through ODS-VAL-3.

# Decision Log

| ID | Decision | Rationale |
| --- | --- | --- |
| ODS-DEC-1 | Keep profile semantics out of core. | Engine behavior remains generic. |
