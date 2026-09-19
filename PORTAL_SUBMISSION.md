# FleetHeal — HackerSquad portal paste (FINAL)

**Live UI:** https://fleetheal.vercel.app  
**Repo:** https://github.com/OXmaint/fleetheal  
**MCP:** TrueFoundry `fleet-demo-mock` · `FLEETHEAL_API_BASE=https://fleetheal.vercel.app`

## Project name
FleetHeal

## Pitch
Live end-to-end fleet remediation on TrueFoundry: Vercel DVIR UI → MCP Gateway (`fleet-demo-mock`) → ChatGPT + Claude + Grok as three harnesses on one governed channel — with approval-gated writes and full traces.

## Track
Harden a prototype for production on TrueForge / TrueFoundry Agent Harness

## Problem
Critical DVIR/OOS defects need fast, consistent remediation. Unbounded chat agents can invent actions; production needs least-privilege MCP, a human approval gate before grounding a truck, independent review, and an audit trail — plus a real intake UI, not a toy prompt.

## Solution
FleetHeal is a live production-shaped workflow:
1. Inspectors submit DVIRs (including **crack-related** flags) in a Vercel UI → durable store.
2. TrueFoundry **MCP Gateway** hosts `fleet-demo-mock`, which live-reads that store (`FLEETHEAL_API_BASE`).
3. **Three harnesses** — ChatGPT, Claude, and Grok — all connect to the **same** gateway MCP URL; model routing without rewiring tools.
4. Read tools investigate freely; writes like `ground_vehicle` return **`approval_required`** until a human approves.
5. Investigator / Remediation / Reviewer subagent pattern + durable session traces.

## How TrueFoundry is used
- MCP Gateway as the governed middle layer between models and fleet tools
- Hosted stdio MCP `fleet-demo-mock` pointed at live Vercel API
- Approval-gated irreversible tools
- Same channel for ChatGPT + Claude + Grok (multi-harness demo)
- Sessions, skills, observability/traces for production audit

## Demo (record this)
1. https://fleetheal.vercel.app — submit crack DVIR → live defect board
2. ChatGPT via TrueFoundry MCP — “crack/open defects on TRK-4821 today?”
3. Same ask in Claude and/or Grok — same gateway/backend
4. “Ground TRK-4821” → show `approval_required`
5. Second UI submit → ask again → new defect, no MCP redeploy

## Links
- UI: https://fleetheal.vercel.app
- Repo: https://github.com/OXmaint/fleetheal
- TrueFoundry tenant: oxmaint.truefoundry.cloud · MCP `fleet-demo-mock`

## Paste block (single field)
**Problem:** Fleet DVIR defects need production-safe remediation — not unbounded chat.  
**Solution:** FleetHeal — live Vercel DVIR UI → TrueFoundry MCP Gateway (`fleet-demo-mock`) → ChatGPT + Claude + Grok on one governed channel; approval before grounding; Investigator/Remediation/Reviewer; full traces.  
**TrueFoundry usage:** MCP Gateway multi-harness, hosted MCP → live API, approval gates, sessions/skills/traces.  
**Live demo:** https://fleetheal.vercel.app · **Repo:** https://github.com/OXmaint/fleetheal
