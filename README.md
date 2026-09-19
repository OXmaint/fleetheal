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
fleetheal/
  README.md                 ← you are here
  PORTAL_SUBMISSION.md      ← form-ready paste fields
  package.json              ← npm start → mock MCP; npm run dev → DVIR UI
  app/                      ← Next.js App Router (intake UI + /api/fleet)
  lib/                      ← shared store + seed-compatible types
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
    server.js               ← stdio JSON-RPC MCP mock (optional HTTP store)
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

Local web UI (does not replace MCP):

```bash
npm install
npm run dev
```

Open http://localhost:3000 — file a DVIR, then use the success-page prompt with the MCP.

---

## Vercel DVIR UI

Public intake UI + shared fleet store, same Vercel app. Synthetic `demo/seed.json` only.

### What ships

| Surface | Purpose |
|---|---|
| `/` | Recent DVIRs, open defects, submit form |
| `/dvir/{id}` | Record + copy-paste `Investigate {dvir_id} on {vehicle_id}` |
| `GET /api/fleet/state` | Full store (seed.json shape + `_meta`) |
| `POST /api/fleet/dvirs` | Create DVIR + open defect (`DVIR-XXXX` / `DEF-XXXX`) |
| `GET /api/fleet/dvirs/:id` | Single DVIR |
| `GET /api/fleet/vehicles/:id` | Single vehicle |
| `POST /api/fleet/vehicles/:id/ground` | MCP write (after approval) |
| `POST /api/fleet/work-orders` | MCP write (after approval) |
| `POST /api/fleet/parts/reserve` | MCP write (after approval) |

### Deploy

1. Import [OXmaint/fleetheal](https://github.com/OXmaint/fleetheal) into Vercel (framework: Next.js). Use the repo root. Hosted Stdio can still run `node mcp/fleet-demo-mock/server.js` (zero runtime imports beyond Node) even though the web app’s npm dependencies include Next.js.
2. Build command is `next build` (`vercel.json`). Vercel serves the App Router; local `npm start` remains the MCP.
3. Optional durable store (pick one):
   - **Vercel Blob:** create a Blob store → `BLOB_READ_WRITE_TOKEN` is injected. JSON key: `fleetheal/fleet-state.json`.
   - **Upstash Redis:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
4. If neither token is set, Vercel uses **in-memory + seed** and `/` shows a multi-instance warning. Local `npm run dev` writes `.data/fleet-state.json` instead.
5. Redeploy after adding env vars. Confirm `GET https://<your-app>.vercel.app/api/fleet/health`.

Copy `.env.example` for the full list. **No secrets are required** to deploy a working demo.

### TrueFoundry Hosted Stdio

After the Vercel URL is live, set this on the MCP server (Hosted Stdio env):

```
FLEETHEAL_API_BASE=https://fleetheal.vercel.app
```

Use your real deployment host (no trailing slash). Leave it unset for offline `npx` / `npm start` demos — tools keep reading `demo/seed.json`.

Writes (`ground_vehicle`, `create_work_order`, `reserve_parts`) POST to the API when the env is set; if the API is down they apply in-memory and return a `note`. They still return `approval_required` until a human (or `APPROVED=1`) approves.

### Judge demo script (UI → agent)

1. Open the Vercel (or `npm run dev`) intake UI.
2. File a **critical / OOS** DVIR on `TRK-4821` (or any seeded unit).
3. On the success page, copy `Investigate DVIR-XXXX on TRK-YYYY`.
4. In ChatGPT / Claude on TrueForge (Hosted Stdio with `FLEETHEAL_API_BASE`), paste that prompt.
5. Investigator `get_dvir` returns the new record. Remediation proposes ground + P1 WO. Write tools pause with **`approval_required`**.
6. Shop lead approves (film the pause). Optional: deny path.

Seeded fallback if you skip the form: `Investigate DVIR-9912 on TRK-4821`.

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

**This scaffold:** agent specs · mock MCP · skills · eval cases · judge README · portal paste · **Vercel DVIR intake UI + shared store API**

**Stretch:** live TrueForge UI · Slack MCP · yard API reads · AI Gateway budgets · eval CLI runner dashboard  

**Non-goals today:** full FMCSA legal engine · real fleet-system credentials · autonomous vehicle control  

---

## Submission

Paste-ready fields: [`PORTAL_SUBMISSION.md`](PORTAL_SUBMISSION.md)  
Design source mirrored from hackathon proposal / submission docs.

**North star for judges:** show the moment FleetHeal **stops** — that is the production harness.
