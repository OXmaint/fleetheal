# FleetHeal — Portal / form-ready submission

Copy/paste into the HackerSquad / TrueFoundry submission form.  
**Deadline:** 3:45 PM PT · Saturday Sep 19, 2026

---

## Project name
FleetHeal

## One-line pitch / tagline
Self-healing fleet ops on TrueForge: investigate critical DVIR/OOS defects with least-privilege MCP, sandbox policy checks, and never ground a truck or open a work order until a human (plus independent Reviewer) approves — with durable sessions and full traces.

## Track
Harden a prototype for production on TrueForge

## Team / builder
Ram Upadhayay (solo) — hackathon demo (synthetic data only)

## Domain / use case
Fleet operations & industrial ops — digital DVIR / defect → work-order remediation for truck, construction, municipal, and similar fleets  (synthetic fleet-ops demo).

---

## Problem (short)
Critical vehicle defects from digital DVIR need fast, consistent remediation. Chat prototypes can discuss defects but cannot safely ground vehicles or open work orders without least-privilege tools, human approval, independent review, and an audit trail — otherwise automation creates DOT and downtime risk.

## Solution (short)
FleetHeal runs on TrueForge as a production harness around fleet-ops domain remediation: Investigator (read-only MCP) → Remediation (gated writes + sandbox) → Reviewer (independent policy check) → human shop-lead approval → execute and trace. One defect = one durable session.

## How TrueForge is used
- Agent sessions/turns for incident continuity across reconnects and approval pauses
- MCP: separate read-only vs write servers; `require_approval_for_tools` on ground_vehicle, create_work_order, reserve_parts
- Sandbox for severity/policy scripts (no host execution)
- Subagents: Investigator, Remediation, Reviewer
- Skills: dvir-oos-triage, remediation-playbook, reviewer-checklist
- Observable event stream (tools, threads, approvals, cost/latency)

## Production controls / governance
- Least-privilege MCP; irreversible writes always pause for human approval
- Independent Reviewer cannot execute writes; can dissent and block
- Model routing (cheap investigate / strong review), retries on reads, no silent write retries
- Session iteration limits and cost/budget caps
- Eval golden cases: OOS brakes, minor defect, wrong unit, missing evidence
- Deny path; secrets and real PII kept out of repo (mock fleet data for demo)

## Architecture (one paragraph)
Orchestrator agent opens a TrueForge session per defect. Investigator subagent gathers DVIR, history, and telematics via read-only MCP. Remediation proposes ground/WO/parts and may run a sandbox severity script, then hits approval-gated write tools. Reviewer applies OOS/policy checklist without write access. Shop lead approves or denies in the harness UI; on approve, writes execute and an optional Slack notify fires. Full session trace is the audit package.

## Demo script (3 min)
1. Trigger critical DVIR on seeded truck TRK-4821.  
2. Show Investigator read-only MCP + Incident Brief.  
3. Show Remediation plan + sandbox + paused write tools.  
4. Show Reviewer agree/dissent.  
5. **Human approves** ground + create WO (must film the pause).  
6. Show session trace / cost. Optional: deny path.

## MVP vs stretch
**MVP:** TrueForge-oriented agent specs + mock fleet-demo MCP + 3 subagents + approval gate + skills + session-trace story + golden eval cases + README/demo script.  
**Stretch:** Slack MCP, yard/detention demo API reads, AI Gateway budgets, embedded UI, fuller eval dashboard.

## Eval / observability / cost (bullet)
- Golden eval cases with expected approve/deny behavior (`eval/cases.json`)
- Session/tool/thread traces and approval wait time
- Model fallback + read retries; write only after fresh approval
- Per-session token/cost cap

## Links (fill at submit time)
- Public repo: _local scaffold at `/workspace/fleetheal-mvp` (do not push until ready)_
- Demo video (~3 min): _TBD_
- Live demo / screenshots: _TBD_
- README architecture section: see `README.md`

## Prior art alignment (optional note to judges)
Same production pattern as Self-Healing IaC (harness + durable workflow + least privilege + human gate + independent reviewer + traces) and FinGuard (policy gates + write pause + MCP/Slack), applied to a real fleet-ops product surface instead of a thin chat wrapper.

---

## Paste block (single field if form wants one “write-up”)

**Problem:** Fleet DVIR defects need production-safe remediation — not unbounded chat actions.  
**Solution:** FleetHeal — TrueForge multi-agent remediation with least-privilege MCP, sandbox policy checks, independent Reviewer, and mandatory human approval before grounding a vehicle or opening a work order.  
**TrueForge usage:** Sessions/turns, MCP (read vs gated write), approvals, sandbox, subagents, skills, full traces.  
**Production controls:** Approval gates, Reviewer dissent, model routing/retries/fallback, cost caps, eval golden cases, deny path, no secrets in repo.
