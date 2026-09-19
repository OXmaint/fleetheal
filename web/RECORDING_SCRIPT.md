# FleetHeal winning recording script (≈3–4 min)

## Live URLs
- **DVIR UI:** https://fleetheal.vercel.app
- **Repo:** https://github.com/OXmaint/fleetheal
- **TrueFoundry:** oxmaint.truefoundry.cloud → MCP `fleet-demo-mock`
- **Env on MCP:** `FLEETHEAL_API_BASE=https://fleetheal.vercel.app`

## Story arc (say this)
1. Drivers submit DVIRs in a real app (not a chat toy).
2. TrueFoundry MCP Gateway is the production harness: same tools for ChatGPT, Claude, and Grok.
3. Reads are free; writes pause for human approval (`ground_vehicle` → `approval_required`).

## Takes
1. **UI** — Open https://fleetheal.vercel.app → show open defects → submit a **crack-related** DVIR → copy investigate prompt.
2. **ChatGPT (or Claude)** — paste prompt / ask: “Any crack-related open defects or DVIRs submitted today for TRK-4821?” → show tool calls via TrueFoundry.
3. **Action** — “Ground TRK-4821 for the crack defect.” → show `approval_required` pause.
4. **Loop** — submit a second defect in UI → ask again → new defect appears (no MCP redeploy).

## Judge one-liners
- “Chatbots talk; TrueFoundry harness stops irreversible writes.”
- “Same MCP channel for ChatGPT, Claude, and Grok.”
- “UI write is immediately readable by MCP — no redeploy.”
