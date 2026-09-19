# fleet-demo-mock

Synthetic fleet-ops MCP server for FleetHeal hackathon demos (DVIR / OOS / work-order fixtures only — not a real product API).

## Seed scenario

| Field | Value |
|---|---|
| Vehicle | **TRK-4821** (Freightliner Cascadia) |
| DVIR | **DVIR-9912** |
| Defect | Critical LH rear service brake — OOS candidate |
| Dispatch | Due on route tomorrow 06:00 PT |

## Live store (TrueFoundry Hosted Stdio)

Set `FLEETHEAL_API_BASE` to the Vercel origin (no trailing slash), e.g. `https://fleetheal.vercel.app`. Every tool call `GET`s `{FLEETHEAL_API_BASE}/api/fleet/state` so UI-submitted DVIRs appear without redeploying MCP. Unset = local `demo/seed.json`.

## Run

```bash
npm start
# or: node mcp/fleet-demo-mock/server.js
```

Speaks JSON-RPC 2.0 over **stdio** (one JSON object per line).

### Quick smoke (another terminal / pipe)

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_dvir","arguments":{"dvir_id":"DVIR-9912"}}}' \
  '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"ground_vehicle","arguments":{"vehicle_id":"TRK-4821","reason":"OOS brake","defect_id":"DEF-4410"}}}' \
|| npm start
```

Writes return `approval_required` unless `APPROVED=1` or `--approve`.

Demo helpers: `approve_pending`, `deny_pending`, `get_audit_log`.
