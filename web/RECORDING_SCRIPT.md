# FleetHeal — recording script (win the hackathon)

## Live links
- **DVIR UI:** https://fleetheal.vercel.app
- **API state:** https://fleetheal.vercel.app/api/fleet/state
- **Repo:** https://github.com/OXmaint/fleetheal
- **TrueFoundry MCP:** `fleet-demo-mock` (set env `FLEETHEAL_API_BASE=https://fleetheal.vercel.app`)

## 3-minute arc
1. **Problem** — Chatbots can call tools, but production fleet ops need a harness: least privilege, approvals, audit.
2. **UI** — Real DVIR intake with **crack-related** flag → stored for agents.
3. **Harness** — Same TrueFoundry MCP Gateway for ChatGPT + Claude + Grok.
4. **Climax** — `ground_vehicle` returns `approval_required` (human gate).
5. **Loop** — Second UI submit → ask again → new defect visible (no MCP redeploy).

## Shot list
1. Open https://fleetheal.vercel.app — show live open defects (TRK-4821 brake + crack).
2. Submit another crack DVIR (leave checkbox on) — show success + investigate prompt.
3. ChatGPT/Claude with fleet MCP: *“Any crack-related open defects on TRK-4821 today?”*
4. Show tool call `list_open_defects` / `get_dvir`.
5. *“Ground TRK-4821 for the frame crack.”* → show `approval_required`.
6. One line for judges: “Chatbots talk; TrueFoundry stops irreversible writes.”

## TrueFoundry env (if not set)
On MCP `fleet-demo-mock` / hosted stdio:
```
FLEETHEAL_API_BASE=https://fleetheal.vercel.app
```
Redeploy/restart MCP after saving.
