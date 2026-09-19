/**
 * Shared FleetHeal domain helpers — used by the Next.js API and the MCP server.
 * Synthetic demo data only. No proprietary Oxmaint APIs.
 */

export const YARD_TZ = "America/Los_Angeles";

export const OVERALL_STATUSES = [
  "UNSATISFACTORY",
  "SATISFACTORY_WITH_NOTES",
  "SATISFACTORY",
];

export const SEVERITIES = ["critical", "major", "minor"];

export const DEFECT_SYSTEMS = [
  "service_brakes",
  "lighting",
  "frame",
  "steering",
  "tires",
  "windshield",
  "coupling",
  "other",
];

export const CRACK_HINT =
  /crack|heat[-\s]?check|crazing|fracture|split\s+(lens|frame|rail|rotor)/i;

export function yardDate(iso, tz = YARD_TZ) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function isSubmittedToday(iso, onDate) {
  const day = yardDate(iso);
  const today = onDate || yardDate();
  return Boolean(day && today && day === today);
}

export function inferCrackRelated(text = "") {
  return CRACK_HINT.test(String(text));
}

export function parseBool(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return undefined;
}

export function nextPrefixedId(prefix, records, pad = 4) {
  let max = 0;
  for (const record of records || []) {
    const match = String(record?.id || "").match(/(\d+)\s*$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

export function cloneState(raw) {
  return JSON.parse(JSON.stringify(raw));
}

export function emptyMeta(store = "file") {
  return {
    store,
    live: true,
    updated_at: new Date().toISOString(),
    yard_tz: YARD_TZ,
  };
}

export function normalizeState(raw) {
  const state = cloneState(raw || {});
  state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
  state.dvirs = Array.isArray(state.dvirs) ? state.dvirs : [];
  state.open_defects = Array.isArray(state.open_defects) ? state.open_defects : [];
  state.work_orders = Array.isArray(state.work_orders) ? state.work_orders : [];
  state.pm_status = Array.isArray(state.pm_status) ? state.pm_status : [];
  state.parts_catalog = Array.isArray(state.parts_catalog) ? state.parts_catalog : [];
  state.telematics = Array.isArray(state.telematics) ? state.telematics : [];
  state.yard_detention = Array.isArray(state.yard_detention)
    ? state.yard_detention
    : [];
  state.notifications = Array.isArray(state.notifications) ? state.notifications : [];

  for (const dvir of state.dvirs) {
    for (const defect of dvir.defects || []) {
      if (typeof defect.crack_related !== "boolean") {
        defect.crack_related = inferCrackRelated(defect.description);
      }
    }
  }

  for (const defect of state.open_defects) {
    const dvir = state.dvirs.find((item) => item.id === defect.dvir_id);
    const nested = dvir?.defects?.find((item) => item.code === defect.code);
    if (typeof defect.crack_related !== "boolean") {
      defect.crack_related =
        nested?.crack_related ??
        inferCrackRelated(defect.description || nested?.description || "");
    }
    if (typeof defect.oos_candidate !== "boolean") {
      defect.oos_candidate = Boolean(nested?.oos_candidate);
    }
    if (!defect.description && nested?.description) {
      defect.description = nested.description;
    }
  }

  return state;
}

export function dvirIsCrackRelated(dvir) {
  return (dvir?.defects || []).some((defect) => defect.crack_related);
}

export function filterOpenDefects(state, args = {}) {
  let list = (state.open_defects || []).filter((defect) => defect.status === "open");
  if (args.vehicle_id) {
    list = list.filter((defect) => defect.vehicle_id === args.vehicle_id);
  }

  const crack = parseBool(args.crack_related);
  if (crack === true) list = list.filter((defect) => defect.crack_related);
  if (crack === false) list = list.filter((defect) => !defect.crack_related);

  const today = parseBool(args.submitted_today);
  if (today === true) {
    list = list.filter((defect) => {
      const dvir = (state.dvirs || []).find((item) => item.id === defect.dvir_id);
      return isSubmittedToday(defect.opened_at || dvir?.inspected_at, args.on_date);
    });
  }

  return list;
}

export function filterDvirs(state, args = {}) {
  let list = [...(state.dvirs || [])];
  if (args.vehicle_id) {
    list = list.filter((dvir) => dvir.vehicle_id === args.vehicle_id);
  }

  const crack = parseBool(args.crack_related);
  if (crack === true) list = list.filter(dvirIsCrackRelated);
  if (crack === false) list = list.filter((dvir) => !dvirIsCrackRelated(dvir));

  const today = parseBool(args.submitted_today);
  if (today === true) {
    list = list.filter((dvir) => isSubmittedToday(dvir.inspected_at, args.on_date));
  }

  const defective = parseBool(args.defective);
  if (defective === true) {
    list = list.filter((dvir) => dvir.overall !== "SATISFACTORY");
  }

  return list;
}

export function ensureVehicle(state, vehicleId) {
  let vehicle = state.vehicles.find((item) => item.id === vehicleId);
  if (vehicle) return vehicle;
  vehicle = {
    id: vehicleId,
    unit_number: String(vehicleId).replace(/^TRK-/, ""),
    vin: "SYNTHETIC",
    make: "Unknown",
    model: "Demo unit",
    year: 2024,
    status: "in_service",
    odometer_miles: 0,
    home_shop: "Santa Clara Yard",
    next_dispatch: null,
    route: "unassigned",
  };
  state.vehicles.push(vehicle);
  return vehicle;
}

export function buildInvestigatePrompt(dvir, defect) {
  const crack = defect.crack_related
    ? " The defect is flagged crack-related (heat-checked rotors, cracked lens, frame crack, or similar)."
    : "";
  return [
    `Investigate ${dvir.id} on ${dvir.vehicle_id}.`,
    `Open defect ${defect.id} was just submitted via the FleetHeal yard board.${crack}`,
    "Ask: any defective DVIRs submitted today? Then call list_dvirs / list_open_defects with submitted_today and crack_related as needed, and get_dvir for the new id.",
    "Do not invent IDs — use only records returned by the live MCP tools.",
  ].join(" ");
}

export function createDvirFromIntake(state, body = {}) {
  const vehicle_id = String(body.vehicle_id || "").trim();
  const inspector = String(body.inspector || "").trim();
  const location = String(body.location || "").trim();
  const overall = String(body.overall || "UNSATISFACTORY").trim();
  const crackRaw = body.crack_related ?? body.defect?.crack_related;
  const crack_related = parseBool(crackRaw);

  if (typeof crack_related !== "boolean") {
    return { error: "crack_related must be a boolean (required visible flag)" };
  }
  if (!vehicle_id || !inspector || !location) {
    return { error: "vehicle_id, inspector, and location are required" };
  }
  if (!OVERALL_STATUSES.includes(overall)) {
    return { error: `overall must be one of ${OVERALL_STATUSES.join(", ")}` };
  }

  const code = String(body.defect_code || body.defect?.code || "").trim();
  const system = String(body.system || body.defect?.system || "").trim();
  const severity = String(body.severity || body.defect?.severity || "major").trim();
  const description = String(body.description || body.defect?.description || "").trim();
  const oos_candidate = Boolean(body.oos_candidate ?? body.defect?.oos_candidate);
  const photos_present = Boolean(body.photos_present ?? body.defect?.photos_present);

  if (!code || !system || !description) {
    return { error: "defect code, system, and description are required" };
  }
  if (!SEVERITIES.includes(severity)) {
    return { error: `severity must be one of ${SEVERITIES.join(", ")}` };
  }

  const now = body.inspected_at || new Date().toISOString();
  ensureVehicle(state, vehicle_id);

  const dvirId = nextPrefixedId("DVIR", state.dvirs);
  const defectId = nextPrefixedId("DEF", state.open_defects);
  const photoId = `PH-${dvirId.replace("DVIR-", "")}-01`;

  const defectOnDvir = {
    code,
    system,
    severity,
    oos_candidate,
    description,
    crack_related,
    photos: photos_present
      ? [{ id: photoId, label: "inspector photo", present: true }]
      : [],
  };

  const dvir = {
    id: dvirId,
    vehicle_id,
    inspector,
    inspected_at: now,
    location,
    overall,
    defects: [defectOnDvir],
  };

  const openDefect = {
    id: defectId,
    vehicle_id,
    dvir_id: dvirId,
    code,
    severity,
    status: "open",
    opened_at: now,
    crack_related,
    oos_candidate,
    description,
  };

  state.dvirs.unshift(dvir);
  state.open_defects.unshift(openDefect);
  state._meta = {
    ...(state._meta || {}),
    updated_at: now,
    last_dvir_id: dvirId,
    last_defect_id: defectId,
  };

  return {
    dvir,
    defect: openDefect,
    investigate_prompt: buildInvestigatePrompt(dvir, openDefect),
  };
}

export function applyWrite(state, toolName, args = {}) {
  const at = new Date().toISOString();
  switch (toolName) {
    case "ground_vehicle": {
      const vehicle = state.vehicles.find((item) => item.id === args.vehicle_id);
      if (!vehicle) return { error: `unknown vehicle ${args.vehicle_id}` };
      vehicle.status = "grounded";
      vehicle.grounded_reason = args.reason;
      vehicle.grounded_at = at;
      return { vehicle_id: vehicle.id, status: "grounded", grounded_at: at };
    }
    case "create_work_order": {
      const vehicle = state.vehicles.find((item) => item.id === args.vehicle_id);
      if (!vehicle) return { error: `unknown vehicle ${args.vehicle_id}` };
      const wo = {
        id: nextPrefixedId("WO", state.work_orders, 5),
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
    case "reserve_parts": {
      const part = state.parts_catalog.find((item) => item.sku === args.sku);
      if (!part) return { error: `unknown sku ${args.sku}` };
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
        reserved_at: at,
      };
    }
    case "notify_shop": {
      const note = {
        id: nextPrefixedId("NTF", state.notifications || [], 4),
        channel: args.channel || "#fleet-ops",
        message: args.message,
        vehicle_id: args.vehicle_id || null,
        sent_at: at,
      };
      state.notifications = state.notifications || [];
      state.notifications.unshift(note);
      return note;
    }
    default:
      return { error: `unknown write tool ${toolName}` };
  }
}

export function publicState(state, store) {
  const clean = cloneState(state);
  const meta = {
    ...(clean._meta || {}),
    ...emptyMeta(store),
    updated_at: clean._meta?.updated_at || new Date().toISOString(),
    counts: {
      dvirs: clean.dvirs.length,
      open_defects: clean.open_defects.filter((item) => item.status === "open").length,
      crack_open: clean.open_defects.filter(
        (item) => item.status === "open" && item.crack_related
      ).length,
    },
  };
  delete clean._meta;
  return { ...clean, _meta: meta };
}
