# Skill: remediation-playbook

## Purpose
Map triage outcome → remediation actions for FleetHeal.

## Decision table

| Triage | Ground? | WO priority | Parts | Notify |
|---|---|---|---|---|
| OOS critical (brakes/steering/tire) + dispatch soon | **Yes** | P1 | Reserve common SKUs if on-hand | Shop lead + #fleet-ops |
| OOS critical + already in bay | Yes (confirm) | P1 | Reserve | Shop |
| Major, not OOS | No | P2 | Optional | Shop |
| Minor (marker light, cosmetic) | **No** | P3 / schedule | Optional | Optional |
| Missing evidence on critical claim | **No auto-ground** | Hold / clarify | None | Ask inspector |
| Wrong unit suspected | **Block writes** | None | None | Escalate |

## Irreversible tools (always approval-gated)
1. `ground_vehicle`
2. `create_work_order`
3. `reserve_parts`

## Monitor-only path
When evidence is weak or Reviewer dissents: set `monitor_only: true`, do not call irreversible tools, recommend re-inspect.

## Sandbox severity script (conceptual)
Remediation may pass `{ system, codes, flags }` into sandbox; host never runs untrusted policy code. Demo may stub a score 0–100; ≥80 + brake system → prefer ground.

## Demo path (TRK-4821)
Ground + P1 WO + reserve `PAD-FL-RR-STD` → pause → human approve → notify.
