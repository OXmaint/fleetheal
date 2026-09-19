import { reserveParts } from "@/lib/fleet";
import { json, options } from "@/lib/http";
import { mutateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const vehicle_id = String(body.vehicle_id || "").trim();
  const sku = String(body.sku || "").trim();
  const qty = Number(body.qty);
  if (!vehicle_id || !sku || !Number.isFinite(qty) || qty <= 0) {
    return json({ error: "vehicle_id, sku, and qty (>0) are required" }, 400);
  }

  const { result, meta } = await mutateStore((state) =>
    reserveParts(state, {
      vehicle_id,
      sku,
      qty,
      work_order_id: body.work_order_id ? String(body.work_order_id) : undefined,
    }),
  );
  if ("error" in result) return json(result, 404);
  return json({ ...result, _meta: meta }, 201);
}
