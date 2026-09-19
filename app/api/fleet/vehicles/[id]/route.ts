import { findVehicle } from "@/lib/fleet";
import { json, options } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { state } = await getStore();
  const vehicle = findVehicle(state, id);
  if (!vehicle) return json({ error: `vehicle not found: ${id}` }, 404);
  return json(vehicle);
}
