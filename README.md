# FleetHeal

**Self-healing fleet ops on TrueForge.**  
Investigate critical DVIR / OOS defects with least-privilege MCP, sandbox policy checks, and never ground a truck or open a work order until a human (plus an independent Reviewer) approves — with durable sessions and full traces.

> **Tagline:** Demo agents talk. Production agents stop.

| | |
|---|---|
| **Event** | TrueFoundry Agent Harness Hackathon · HackerSquad · Sep 19, 2026 |
| **Track** | Harden a prototype for production on TrueForge |
| **Builder** | Ram Upadhayay (hackathon demo; synthetic data only) |
| **Demo seed** | `TRK-4821` · `DVIR-9912` · critical LH rear service brake (OOS) |

---

## Why FleetHeal

Fleet managers drown in critical defects from digital DVIR. Chat prototypes can *talk* about brakes and lights — production needs:

| Demo agent | Production need (FleetHeal) |
|---|---|
| Unbounded tool access | Split read vs write MCP |
| Silent irreversible acts | `require_approval_for_tools` on ground / WO / parts |
| One “smart” agent | Investigator · Remediation · Reviewer |
| Stateless chat | One durable session per defect |
| No eval | Golden cases: OOS vs minor vs wrong-unit |

Same winning harness shape as **Self-Healing IaC** and **FinGuard**, applied to fleet downtime and DOT risk.

---

## Architecture

```
  DVIR critical event ──► TrueForge Session (one incident)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   Investigator          Remediation            Reviewer
   READ-ONLY MCP         WRITE MCP (gated)      READ + policy
   Incident Brief        + sandbox severity     Agree / Dissent
         │                    │                    │
         └──────────┬─────────┴─────────┬──────────┘
                    ▼                   │
              HUMAN GATE ◄──────────────┘
           Shop lead Approve / Deny
                    ▼
         Execute writes + notify + audit trace
```

### MCP surface

**Read (`fleet-demo-readonly`)**  
`get_vehicle` · `get_dvir` · `list_open_defects` · `list_work_orders` · `get_pm_status` · `get_telematics_snapshot` · `get_yard_detention`

**Write (`fleet-demo-writes`) — approval required**  
`ground_vehicle` · `create_work_order` · `reserve_parts`  
(`notify_shop` low-risk / preferred after approve)

### Skills
- `skills/dvir-oos-triage.md` — OOS heuristics (demo-safe, not legal advice)
- `skills/remediation-playbook.md` — ground vs schedule vs monitor
- `skills/reviewer-checklist.md` — dissent rules

---

## Repo layout

```
fleetheal-mvp/
  README.md                 ← you are here
  PORTAL_SUBMISSION.md      ← form-ready paste fields
  package.json              ← npm start → mock MCP
  agents/
    fleetheal.yaml          ← orchestrator AgentSpec
    prompts/
      investigator.md
      remediation.md
      reviewer.md
  skills/
    dvir-oos-triage.md
    remediation-playbook.md
    reviewer-checklist.md
  mcp/fleet-demo-mock/
    server.js               ← stdio JSON-RPC MCP mock
    README.md
  demo/
    seed.json               ← TRK-4821 OOS brake + fixtures
    SCRIPT.md               ← 3-min judge script
  eval/
    cases.json              ← golden eval suite
```

---

## Quick start (local mock MCP)

Requires **Node 18+**.

```bash
cd /workspace/fleetheal-mvp
npm start
```

Smoke test (pipe JSON-RPC lines):

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_dvir","arguments":{"dvir_id":"DVIR-9912"}}}' \
  '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"ground_vehicle","arguments":{"vehicle_id":"TRK-4821","reason":"OOS brake DVIR-9912","defect_id":"DEF-4410"}}}' \
| npm start
```

Writes return `status: "approval_required"` unless you set `APPROVED=1` or pass `--approve`.  
Demo helpers: `approve_pending`, `deny_pending`, `get_audit_log`.

### Demo trigger line
```
Investigate DVIR-9912 on TRK-4821
```

---

## 3-minute demo (judges)

1. Trigger critical DVIR on seeded truck **TRK-4821**.  
2. Show Investigator read-only MCP + Incident Brief.  
3. Show Remediation plan + paused write tools.  
4. Show Reviewer **Agree**.  
5. **Human approves** `ground_vehicle` + `create_work_order` (film the pause).  
6. Show session trace / cost. Optional: deny path.

Full beats: [`demo/SCRIPT.md`](demo/SCRIPT.md)

---

## Eval

Golden suite: [`eval/cases.json`](eval/cases.json)

| Case | Expected |
|---|---|
| `oos_brakes` | Ground + P1 WO; approval required; Reviewer agree |
| `minor_marker_light` | No ground; schedule only |
| `wrong_unit_id` | Reviewer dissent; block writes |
| `missing_evidence` | Clarify / dissent; no ground |
| `provider_timeout` | Retry reads; **no partial write** |

Score: policy accuracy · approval hit-rate on irreversible tools · false-ground rate.

---

## Production controls

- Least-privilege MCP; irreversible writes always pause  
- Independent Reviewer cannot write; dissent can force deny  
- Model routing (cheap investigate / strong review); read retries; no silent write retries  
- Session iteration limit + cost cap (see `agents/fleetheal.yaml`)  
- Secrets / real PII kept out — mock fleet data only  

---

## MVP vs stretch

**This scaffold (MVP backup):** agent specs · mock MCP · skills · eval cases · judge README · portal paste  

**Stretch:** live TrueForge UI · Slack MCP · yard API reads · AI Gateway budgets · eval CLI runner dashboard  

**Non-goals today:** full FMCSA legal engine · real fleet-system credentials · autonomous vehicle control  

---

## Submission

Paste-ready fields: [`PORTAL_SUBMISSION.md`](PORTAL_SUBMISSION.md)  
Design source mirrored from hackathon proposal / submission docs.

**North star for judges:** show the moment FleetHeal **stops** — that is the production harness.
