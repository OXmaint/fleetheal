# FleetHeal — 3-minute judge demo script

**Setup:** Mock MCP running (`npm start`); shop-lead persona ready; seed TRK-4821 / DVIR-9912.

| Time | What judges see | What to say |
|---|---|---|
| 0:00–0:25 | Problem → live UI | “Fleets already capture digital DVIR. Production needs least privilege, a human gate, and traces — that’s FleetHeal on TrueForge.” |
| 0:25–0:50 | Trigger | “Investigate DVIR-9912 on TRK-4821.” Session opens. |
| 0:50–1:25 | Investigator | Read-only MCP: get_dvir, list_open_defects, prior WOs. Brief: OOS-class brake; unit due tomorrow. |
| 1:25–1:55 | Remediation | Plan: ground, P1 WO, reserve pads. Write tools **paused**. |
| 1:55–2:20 | Reviewer | Agree on OOS criteria; evidence OK. |
| 2:20–2:45 | **Human gate** | Approve `ground_vehicle` + `create_work_order`. Film the pause. |
| 2:45–3:00 | Traces | Session timeline: tools, threads, latency. Optional deny path. |

**Takeaway:** “Demo agents talk. Production agents stop.”
