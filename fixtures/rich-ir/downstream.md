---
title: SpecTrace Style Exercise
owner: downstream
---

# SpecTrace Style Exercise

This fixture gives a downstream structural app enough generic Markdown shape to
find work package facts without raw line scanning or parser AST traversal.

## WP-1

WP-1 acceptance references CON-1 through CON-3 and BEL-858 while keeping entity
meaning outside markdown-engine.

| Token | Kind | State |
| --- | --- | --- |
| WP-1 | work package | accepted |
| BEL-858 | external reference | observed |

- [x] Capture source slices
- [ ] Keep entity registry outside the engine

## WP-2

WP-2 validates that downstream consumers can continue querying sections and
source-grounded spans without importing private parser modules.
