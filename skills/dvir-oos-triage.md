# Skill: dvir-oos-triage

> Demo-safe FMCSA-oriented heuristics for DVIR / defect triage. **Not legal advice.** Not a substitute for a certified inspector or carrier policy.

## Purpose
Help Investigator classify severity and help Remediation / Reviewer decide whether a defect is an **OOS (Out-of-Service) candidate**.

## Inputs
- Defect `system`, `code`, `description`, `severity`, `oos_candidate` (if present)
- Photo presence
- Telematics fault codes (supporting only)

## Heuristics (demo)

| System / pattern | OOS candidate? | Notes |
|---|---|---|
| Service brakes — pushrod travel over limit, air leak on apply, no braking on a wheel | **Yes** | Ground + P1 |
| Steering — excessive play, secured parts loose | **Yes** | Ground + P1 |
| Tires — flat, exposed cord on steer | **Yes** | Ground + P1 |
| Lighting — headlamp / stop / turn out (dark) | Often major; may be OOS if required lamp inop | Context-dependent |
| Marker / clearance lamp intermittent | Usually **minor** | Schedule; no ground |
| Fluid leak minor (no spray on brakes/exhaust) | Minor / monitor | Escalate if brake contamination |
| ABS fault lamp alone | Supporting signal | Not sole OOS grounds in this demo skill |

## Output tags
- `oos_candidate: true|false`
- `severity: critical|major|minor`
- `evidence_quality: strong|weak|missing`
- `dispatch_risk: high|medium|low` (use next_dispatch + route)

## Explicit non-goals
- Full FMCSA Part 393 / CVSA handbook implementation
- Autonomous grounding without human approval
