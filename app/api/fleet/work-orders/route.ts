import { addWorkOrder } from "@/lib/fleet";
import { json, options } from "@/lib/http";
import { getStore, mutateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  const vehicleId = new URL(request.url).searchParams.get("vehicle_id");
  const { state } = await getStore();
  const list = vehicleId
    ? state.work_orders.filter((w) => w.vehicle_id === vehicleId)
    : state.work_orders;
  return json({ work_orders: list, count: list.length });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const vehicle_id = String(body.vehicle_id || "").trim();
  const priority = String(body.priority || "").trim();
  const summary = String(body.summary || "").trim();
  if (!vehicle_id || !priority || !summary) {
    return json({ error: "vehicle_id, priority, and summary are required" }, 400);
  }

  const { result, meta } = await mutateStore((state) =>
    addWorkOrder(state, {
      vehicle_id,
      priority,
      summary,
      bay: body.bay ? String(body.bay) : undefined,
      defect_id: body.defect_id ? String(body.defect_id) : undefined,
    }),
  );
  if ("error" in result) return json(result, 404);
  return json({ ...result, _meta: meta }, 201);
}
