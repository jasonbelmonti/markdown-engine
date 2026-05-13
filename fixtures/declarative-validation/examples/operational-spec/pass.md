---
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
next operator.
