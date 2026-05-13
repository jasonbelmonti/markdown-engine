---
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

| ID | Requirement | Note |
| --- | --- | --- |
| EVD-1 | REQ-1 | CLI parse fixture |
| EVD-2 | REQ-2 | Profile validation fixture |
| EVD-3 | REQ-3 | Diagnostic assertion fixture |

# Traceability

REQ-1 is covered by EVD-1.
REQ-2 is covered by EVD-2.
EVD-3 has evidence, but the final requirement reference is missing.
