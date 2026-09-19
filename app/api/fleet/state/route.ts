import { json, options } from "@/lib/http";
import { getStore, publicState } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET() {
  const { state, meta } = await getStore();
  return json(publicState(state, meta));
}
