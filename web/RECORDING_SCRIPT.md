# FleetHeal winning recording script (≈3–4 min)

## Story
Production DVIR intake → durable store → **TrueFoundry MCP Gateway** → ChatGPT/Claude/Grok harness → approval-gated action.

## Setup before record
1. Open Vercel DVIR UI (this app).
2. Open TrueFoundry MCP `fleet-demo-mock` (env `FLEETHEAL_API_BASE=<this-vercel-url>`).
3. Open ChatGPT (or Claude) with FleetHeal connector.

## Takes
1. **UI**: show open defects board → submit a **crack-related** DVIR → copy investigate prompt.
2. **Chat harness**: paste prompt / ask “any crack defects or DVIRs submitted today?” → show tool calls via TrueFoundry gateway.
3. **Action**: ask to ground vehicle → show `approval_required` pause (TrueFoundry production control).
4. **Loop**: submit a second defect in UI → ask again → new defect appears live.

## One-liners for judges
- “Chatbots talk; TrueFoundry harness stops irreversible writes.”
- “Same MCP channel for ChatGPT, Claude, and Grok.”
- “UI write is immediately readable by MCP — no redeploy.”
