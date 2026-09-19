# Skill: reviewer-checklist

## Purpose
Independent Agree / Dissent rules for the Reviewer subagent. Reviewer has **no write access**.

## Checklist (must complete)

1. **Unit match**  
   DVIR `vehicle_id` == tool `vehicle_id` == Remediation plan target?  
   Fail → **dissent**

2. **Evidence**  
   Critical OOS claims should have photo metadata `present: true` or explicit inspector narrative.  
   Missing → **dissent** or require clarifying question (no writes)

3. **OOS criteria**  
   Does defect pattern match `dvir-oos-triage` OOS table?  
   Fail while plan says ground → **dissent** (over-ground)

4. **Under-ground / miss**  
   Clear OOS with plan `ground: false` → **dissent**

5. **Scope creep**  
   Parts / WO for unrelated systems without brief support → **dissent**

6. **Cost / ops sanity**  
   Note dispatch timing; do not block solely on cost, but flag if P1 without OOS basis

## Verdict
- `agree` — all critical checks pass
- `dissent` — any fail above; list `dissent_reasons`

## Human card
Orchestrator must show Reviewer verdict on the approval card. Dissent should default the UI toward **Deny** unless human overrides explicitly.
