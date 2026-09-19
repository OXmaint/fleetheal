# fleet-demo-mock

Synthetic fleet-ops MCP server for FleetHeal hackathon demos (DVIR / OOS / work-order fixtures only — not a real product API).

## Seed scenario

| Field | Value |
|---|---|
| Vehicle | **TRK-4821** (Freightliner Cascadia) |
| DVIR | **DVIR-9912** |
| Defect | Critical LH rear service brake — OOS candidate |
| Dispatch | Due on route tomorrow 06:00 PT |

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

## Shared HTTP store (`FLEETHEAL_API_BASE`)

When this env is set (TrueFoundry Hosted Stdio after the Vercel DVIR UI is live), tools read from that origin instead of only `demo/seed.json`:

```
FLEETHEAL_API_BASE=https://fleetheal.vercel.app
```

| Tool | HTTP |
|---|---|
| `get_vehicle` | `GET /api/fleet/vehicles/:id` |
| `get_dvir` | `GET /api/fleet/dvirs/:id` |
| `list_open_defects` / PM / telematics / yard | `GET /api/fleet/state` then filter |
| `list_work_orders` | `GET /api/fleet/work-orders?vehicle_id=` |
| `ground_vehicle` | `POST /api/fleet/vehicles/:id/ground` |
| `create_work_order` | `POST /api/fleet/work-orders` |
| `reserve_parts` | `POST /api/fleet/parts/reserve` |

If the env is omitted, behavior is unchanged (local seed + in-memory writes) so `npx` / `npm start` stay offline. If the API is unreachable, reads fall back to the last/local seed and writes apply in-memory with a `note`.
