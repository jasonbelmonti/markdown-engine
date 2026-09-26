---
type: DelegationPlan
artifact_version: "2.0"
revision: "1"
delegation_id: fixture
---
# Structural fixture only

## Control

| State | Granularity | Selected pilot extent | Max attempts per packet | Scheduling |
| --- | --- | --- | --- | --- |
| READY | action | DP-WP-1 | 2 | Serial |

## Sources and baseline

| Role | Full read path / reference | Revision | SHA-256 / immutable identity |
| --- | --- | --- | --- |
| Source contract | /fixture/task.md | 1 | synthetic-source-identity |
| Execution plan | /fixture/plan.md | 1 | synthetic-plan-identity |
| Repository baseline and instructions | /fixture/repository | initial | synthetic-code-identity |
| Upstream validation | /fixture/validation.json | 1 | synthetic-validation-identity |

## Model roster

| Order | Model | Reasoning effort | Harness | Availability evidence |
| --- | --- | --- | --- | --- |
| 1 | gpt-6-luna | medium | manual | Unverified; check before dispatch |

## Ordered assignments

| Packet / coordinator | Ordered source steps | Source outcomes | Worker packet | Model / effort | Selection basis | Escalation / stop |
| --- | --- | --- | --- | --- | --- | --- |
| DP-WP-1 | EP-ACT-1, EP-GATE-1 | TD-SC-1 | /fixture/DP-WP-1.md | gpt-6-luna / medium | experimental; bounded fixture | Stop after two total attempts |

## Readiness

| Field | Value |
| --- | --- |
| Audit decision | PASS |
| Audit evidence | Synthetic mapping only; not dispatchable real work |
| Dispatch prerequisites | Obtain real sources, authorization and model availability |
| Blockers | None |
| Resume condition | Not applicable |

## Revision note

| Field | Value |
| --- | --- |
| Change and authority | Initial independent structural fixture; no implementation authority |
