import type {
  CreateDvirInput,
  FleetState,
  OpenDefect,
  Dvir,
  Severity,
  WorkOrder,
} from "./types";

const SEVERITIES = new Set<Severity>(["critical", "major", "minor"]);

export function cloneState<T>(value: T): T {
  return structuredClone(value);
}

export function nextId(prefix: string, ids: string[], pad = 4): string {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const n = Number.parseInt(id.slice(prefix.length), 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

export function findVehicle(state: FleetState, id: string) {
  return state.vehicles.find((v) => v.id === id);
}

export function findDvir(state: FleetState, id: string) {
  return state.dvirs.find((d) => d.id === id);
}

function systemCode(system: string) {
  const slug = system
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "INTAKE"}-INTAKE`;
}

export function validateCreateDvir(input: Partial<CreateDvirInput>) {
  const vehicle_id = String(input.vehicle_id || "").trim();
  const inspector = String(input.inspector || "").trim();
  const system = String(input.system || "").trim();
  const description = String(input.description || "").trim();
  const severity = String(input.severity || "").trim() as Severity;

  const errors: string[] = [];
  if (!vehicle_id) errors.push("vehicle_id is required");
  if (!inspector) errors.push("inspector is required");
  if (!system) errors.push("system is required");
  if (!description) errors.push("description is required");
  if (!SEVERITIES.has(severity)) errors.push("severity must be critical, major, or minor");

  return {
    errors,
    value: {
      vehicle_id,
      inspector,
      system,
      description,
      severity,
      oos_candidate: Boolean(input.oos_candidate),
      photo_present: Boolean(input.photo_present),
      location: input.location?.trim() || "Santa Clara Yard — Intake Lane",
    } satisfies CreateDvirInput,
  };
}

export function createDvirAndDefect(state: FleetState, input: CreateDvirInput) {
  const vehicle = findVehicle(state, input.vehicle_id);
  if (!vehicle) {
    return { error: `unknown vehicle ${input.vehicle_id}` as const };
  }

  const inspectedAt = new Date().toISOString();
  const dvirId = nextId("DVIR-", state.dvirs.map((d) => d.id));
  const defectId = nextId("DEF-", state.open_defects.map((d) => d.id));
  const code = systemCode(input.system);
  const oos = Boolean(input.oos_candidate);
  const overall =
    input.severity === "critical" || oos
      ? "UNSATISFACTORY"
      : input.severity === "major"
        ? "SATISFACTORY_WITH_NOTES"
        : "SATISFACTORY_WITH_NOTES";

  const dvir: Dvir = {
    id: dvirId,
    vehicle_id: input.vehicle_id,
    inspector: input.inspector,
    inspected_at: inspectedAt,
    location: input.location || "Santa Clara Yard — Intake Lane",
    overall,
    defects: [
      {
        code,
        system: input.system,
        severity: input.severity,
        oos_candidate: oos,
        description: input.description,
        photos: input.photo_present
          ? [{ id: `PH-${dvirId.replace("DVIR-", "")}-01`, label: "Intake photo", present: true }]
          : [{ id: `PH-${dvirId.replace("DVIR-", "")}-01`, label: "Intake photo", present: false }],
      },
    ],
  };

  const defect: OpenDefect = {
    id: defectId,
    vehicle_id: input.vehicle_id,
    dvir_id: dvirId,
    code,
    severity: input.severity,
    status: "open",
    opened_at: inspectedAt,
  };

  state.dvirs.unshift(dvir);
  state.open_defects.unshift(defect);

  return { dvir, defect, vehicle, prompt: `Investigate ${dvirId} on ${input.vehicle_id}` };
}

export function groundVehicle(
  state: FleetState,
  vehicleId: string,
  reason: string,
  defectId?: string,
) {
  const vehicle = findVehicle(state, vehicleId);
  if (!vehicle) return { error: `unknown vehicle ${vehicleId}` as const };
  const at = new Date().toISOString();
  vehicle.status = "grounded";
  vehicle.grounded_reason = reason;
  vehicle.grounded_at = at;
  const yard = state.yard_detention.find((y) => y.vehicle_id === vehicleId);
  if (yard) {
    yard.detained = true;
    yard.gate_status = "held";
    yard.notes = reason;
  }
  return {
    vehicle_id: vehicle.id,
    status: "grounded" as const,
    reason,
    defect_id: defectId || null,
    grounded_at: at,
  };
}

export function addWorkOrder(
  state: FleetState,
  args: {
    vehicle_id: string;
    priority: string;
    summary: string;
    bay?: string;
    defect_id?: string;
  },
) {
  const vehicle = findVehicle(state, args.vehicle_id);
  if (!vehicle) return { error: `unknown vehicle ${args.vehicle_id}` as const };
  const at = new Date().toISOString();
  const wo: WorkOrder = {
    id: nextId("WO-", state.work_orders.map((w) => w.id), 5),
    vehicle_id: args.vehicle_id,
    status: "open",
    priority: args.priority,
    summary: args.summary,
    bay: args.bay || vehicle.home_shop,
    defect_id: args.defect_id || null,
    opened_at: at,
  };
  state.work_orders.unshift(wo);
  return wo;
}

export function reserveParts(
  state: FleetState,
  args: { vehicle_id: string; sku: string; qty: number; work_order_id?: string },
) {
  const part = state.parts_catalog.find((p) => p.sku === args.sku);
  if (!part) return { error: `unknown sku ${args.sku}` as const };
  if (part.qty_on_hand < args.qty) {
    return { error: `insufficient stock for ${args.sku}`, qty_on_hand: part.qty_on_hand };
  }
  part.qty_on_hand -= args.qty;
  return {
    id: `RSV-${Date.now()}`,
    sku: args.sku,
    qty: args.qty,
    vehicle_id: args.vehicle_id,
    work_order_id: args.work_order_id || null,
    reserved_at: new Date().toISOString(),
  };
}
