#!/usr/bin/env node
/**
 * FleetHeal synthetic fleet-ops demo MCP server
 * Seeded scenario: TRK-4821 / DVIR-9912 critical OOS brake defect
 *
 * Speaks a simple JSON-RPC 2.0 MCP-style stdio protocol so it can run
 * standalone (`npm start`) without TrueForge. Tools mirror the proposal:
 *   READ:  get_vehicle, get_dvir, list_open_defects, list_work_orders,
 *          get_pm_status, get_telematics_snapshot, get_yard_detention
 *   WRITE: ground_vehicle, create_work_order, reserve_parts, notify_shop
 *          (writes return approval_required until --approve or APPROVED=1)
 */

import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, "../../demo/seed.json");
const API_BASE = (process.env.FLEETHEAL_API_BASE || "").replace(/\/$/, "");

const AUTO_APPROVE =
  process.env.APPROVED === "1" || process.argv.includes("--approve");

/** @type {any} */
let seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));

/** Fresh GET per tool call when FLEETHEAL_API_BASE is set. Seed fallback otherwise. */
async function loadLiveState() {
  if (!API_BASE) return seed;
  try {
    const res = await fetch(`${API_BASE}/api/fleet/state`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.dvirs || !data?.open_defects) throw new Error("invalid state shape");
    seed = data;
    return seed;
  } catch (error) {
    process.stderr.write(`[fleetheal] live fetch failed; seed fallback: ${error}\n`);
    return seed;
  }
}

/** In-memory mutation log for demo writes */
const audit = [];
const pendingApprovals = new Map();
let approvalSeq = 1;
let woSeq = 23000;
let notifySeq = 1;

const READ_TOOLS = [
  {
    name: "get_vehicle",
    description: "Fetch vehicle master record by id (e.g. TRK-4821)",
    inputSchema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
  {
    name: "get_dvir",
    description: "Fetch a DVIR / inspection by id (e.g. DVIR-9912)",
    inputSchema: {
      type: "object",
      properties: { dvir_id: { type: "string" } },
      required: ["dvir_id"],
    },
  },
  {
    name: "list_open_defects",
    description:
      "List live open defects. Optional filters: vehicle_id, submitted_today, crack_related",
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        submitted_today: { type: "boolean" },
        crack_related: { type: "boolean" },
      },
    },
  },
  {
    name: "list_work_orders",
    description: "List work orders for a vehicle (open + recent closed)",
    inputSchema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
  {
    name: "get_pm_status",
    description: "Preventive maintenance due status for a vehicle",
    inputSchema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
  {
    name: "get_telematics_snapshot",
    description: "Latest telematics snapshot (demo stub)",
    inputSchema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
  {
    name: "get_yard_detention",
    description: "Yard / gate detention signal (demo stub)",
    inputSchema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
];

const WRITE_TOOLS = [
  {
    name: "ground_vehicle",
    description:
      "Ground a vehicle (OOS / do-not-dispatch). REQUIRES HUMAN APPROVAL.",
    approval_required: true,
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        reason: { type: "string" },
        defect_id: { type: "string" },
      },
      required: ["vehicle_id", "reason"],
    },
  },
  {
    name: "create_work_order",
    description: "Open a shop work order. REQUIRES HUMAN APPROVAL.",
    approval_required: true,
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        priority: { type: "string", enum: ["P1", "P2", "P3"] },
        summary: { type: "string" },
        bay: { type: "string" },
        defect_id: { type: "string" },
      },
      required: ["vehicle_id", "priority", "summary"],
    },
  },
  {
    name: "reserve_parts",
    description: "Reserve parts against a WO. REQUIRES HUMAN APPROVAL.",
    approval_required: true,
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        sku: { type: "string" },
        qty: { type: "number" },
        work_order_id: { type: "string" },
      },
      required: ["vehicle_id", "sku", "qty"],
    },
  },
  {
    name: "notify_shop",
    description: "Notify shop channel / lead (low-risk; approval preferred)",
    approval_required: false,
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string" },
        message: { type: "string" },
        vehicle_id: { type: "string" },
      },
      required: ["message"],
    },
  },
];

const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function err(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function findVehicle(id) {
  return seed.vehicles.find((v) => v.id === id);
}

function gateWrite(toolName, args) {
  if (AUTO_APPROVE) return { approved: true };
  const approvalId = `APR-${approvalSeq++}`;
  pendingApprovals.set(approvalId, { tool: toolName, args, at: new Date().toISOString() });
  return {
    approved: false,
    status: "approval_required",
    approval_id: approvalId,
    tool: toolName,
    args,
    message:
      "tool.approval_required — shop lead must Approve/Deny before this write executes. Resume session after approval.",
  };
}

function executeWrite(toolName, args) {
  const at = new Date().toISOString();
  switch (toolName) {
    case "ground_vehicle": {
      const v = findVehicle(args.vehicle_id);
      if (!v) return { error: `unknown vehicle ${args.vehicle_id}` };
      v.status = "grounded";
      v.grounded_reason = args.reason;
      v.grounded_at = at;
      const rec = { tool: toolName, args, at, result: { vehicle_id: v.id, status: "grounded" } };
      audit.push(rec);
      return rec.result;
    }
    case "create_work_order": {
      const v = findVehicle(args.vehicle_id);
      if (!v) return { error: `unknown vehicle ${args.vehicle_id}` };
      const wo = {
        id: `WO-${woSeq++}`,
        vehicle_id: args.vehicle_id,
        status: "open",
        priority: args.priority,
        summary: args.summary,
        bay: args.bay || v.home_shop,
        defect_id: args.defect_id || null,
        opened_at: at,
      };
      seed.work_orders.push(wo);
      const rec = { tool: toolName, args, at, result: wo };
      audit.push(rec);
      return wo;
    }
    case "reserve_parts": {
      const part = seed.parts_catalog.find((p) => p.sku === args.sku);
      if (!part) return { error: `unknown sku ${args.sku}` };
      if (part.qty_on_hand < args.qty) {
        return { error: `insufficient stock for ${args.sku}`, qty_on_hand: part.qty_on_hand };
      }
      part.qty_on_hand -= args.qty;
      const reservation = {
        id: `RSV-${Date.now()}`,
        sku: args.sku,
        qty: args.qty,
        vehicle_id: args.vehicle_id,
        work_order_id: args.work_order_id || null,
        reserved_at: at,
      };
      audit.push({ tool: toolName, args, at, result: reservation });
      return reservation;
    }
    case "notify_shop": {
      const note = {
        id: `NTF-${notifySeq++}`,
        channel: args.channel || "#fleet-ops",
        message: args.message,
        vehicle_id: args.vehicle_id || null,
        sent_at: at,
      };
      audit.push({ tool: toolName, args, at, result: note });
      return note;
    }
    default:
      return { error: `unknown write tool ${toolName}` };
  }
}

async function callTool(name, args = {}) {
  await loadLiveState();
  switch (name) {
    case "get_vehicle": {
      const v = findVehicle(args.vehicle_id);
      if (!v) return { error: `vehicle not found: ${args.vehicle_id}` };
      return v;
    }
    case "get_dvir": {
      const d = seed.dvirs.find((x) => x.id === args.dvir_id);
      if (!d) return { error: `dvir not found: ${args.dvir_id}` };
      return d;
    }
    case "list_open_defects": {
      let list = seed.open_defects.filter((d) => d.status === "open");
      if (args.vehicle_id) list = list.filter((d) => d.vehicle_id === args.vehicle_id);
      if (args.crack_related === true) {
        list = list.filter((d) => d.crack_related);
      }
      if (args.submitted_today === true) {
        const today = new Date().toISOString().slice(0, 10);
        list = list.filter((d) => String(d.opened_at || "").startsWith(today));
      }
      return { defects: list, count: list.length };
    }
    case "list_work_orders": {
      const list = seed.work_orders.filter((w) => w.vehicle_id === args.vehicle_id);
      return { work_orders: list, count: list.length };
    }
    case "get_pm_status": {
      const list = seed.pm_status.filter((p) => p.vehicle_id === args.vehicle_id);
      return { pm: list };
    }
    case "get_telematics_snapshot": {
      const t = seed.telematics.find((x) => x.vehicle_id === args.vehicle_id);
      if (!t) return { error: `no telematics for ${args.vehicle_id}` };
      return t;
    }
    case "get_yard_detention": {
      const y = seed.yard_detention.find((x) => x.vehicle_id === args.vehicle_id);
      return y || { vehicle_id: args.vehicle_id, detained: false, notes: "no yard record" };
    }
    case "ground_vehicle":
    case "create_work_order":
    case "reserve_parts": {
      const gate = gateWrite(name, args);
      if (!gate.approved) return gate;
      return executeWrite(name, args);
    }
    case "notify_shop": {
      // low-risk: execute without hard gate (approval preferred in production)
      return executeWrite(name, args);
    }
    case "approve_pending": {
      // Demo helper: approve a pending write by approval_id
      const pending = pendingApprovals.get(args.approval_id);
      if (!pending) return { error: `unknown approval_id ${args.approval_id}` };
      pendingApprovals.delete(args.approval_id);
      const result = executeWrite(pending.tool, pending.args);
      return { approved: true, approval_id: args.approval_id, executed: result };
    }
    case "deny_pending": {
      const pending = pendingApprovals.get(args.approval_id);
      if (!pending) return { error: `unknown approval_id ${args.approval_id}` };
      pendingApprovals.delete(args.approval_id);
      const rec = {
        denied: true,
        approval_id: args.approval_id,
        tool: pending.tool,
        at: new Date().toISOString(),
      };
      audit.push({ tool: "deny_pending", args, at: rec.at, result: rec });
      return rec;
    }
    case "get_audit_log":
      return { audit, pending: [...pendingApprovals.entries()].map(([id, v]) => ({ id, ...v })) };
    default:
      return { error: `unknown tool: ${name}` };
  }
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "fleet-demo-mock", version: "0.1.0" },
      capabilities: { tools: {} },
    });
  }
  if (method === "tools/list") {
    return ok(id, {
      tools: ALL_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: t.approval_required
          ? { approval_required: true }
          : undefined,
      })),
    });
  }
  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments || {};
    const result = await callTool(name, args);
    const isError = Boolean(result?.error);
    return ok(id, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError,
      structuredContent: result,
    });
  }
  if (method === "ping") return ok(id, {});
  return err(id, -32601, `Method not found: ${method}`);
}

// --- stdio JSON-RPC loop ---
const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    process.stderr.write(`[fleet-demo-mock] bad json: ${trimmed.slice(0, 120)}\n`);
    return;
  }
  try {
    const resp = await handle(msg);
    if (resp) process.stdout.write(JSON.stringify(resp) + "\n");
  } catch (e) {
    process.stdout.write(
      JSON.stringify(err(msg.id ?? null, -32603, String(e?.message || e))) + "\n"
    );
  }
});

process.stderr.write(
  `[fleetheal] fleet-demo-mock MCP listening on stdio (seed=${SEED_PATH})\n` +
    `[fleetheal] live API: ${API_BASE || "off (local seed fallback)"}\n` +
    `[fleetheal] demo seed: TRK-4821 / DVIR-9912 OOS brake | AUTO_APPROVE=${AUTO_APPROVE}\n` +
    `[fleetheal] try: {"jsonrpc":"2.0","id":1,"method":"tools/list"}\n`
);
