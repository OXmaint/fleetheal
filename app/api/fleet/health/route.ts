import { json, options } from "@/lib/http";
import { detectBackend, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET() {
  const { meta } = await getStore();
  return json({
    ok: true,
    backend: detectBackend(),
    store: meta,
    seed: "demo/seed.json",
    synthetic: true,
  });
}
