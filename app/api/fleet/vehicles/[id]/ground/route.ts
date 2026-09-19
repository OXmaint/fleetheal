import { groundVehicle } from "@/lib/fleet";
import { json, options } from "@/lib/http";
import { mutateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const reason = String(body.reason || "").trim();
  if (!reason) return json({ error: "reason is required" }, 400);

  const { result, meta } = await mutateStore((state) =>
    groundVehicle(state, id, reason, body.defect_id ? String(body.defect_id) : undefined),
  );
  if ("error" in result) return json(result, 404);
  return json({ ...result, _meta: meta });
}
