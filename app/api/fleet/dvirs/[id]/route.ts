import { findDvir } from "@/lib/fleet";
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
  const dvir = findDvir(state, id);
  if (!dvir) return json({ error: `dvir not found: ${id}` }, 404);
  return json(dvir);
}
