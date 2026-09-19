import { createDvirAndDefect, validateCreateDvir } from "@/lib/fleet";
import { json, options } from "@/lib/http";
import { getStore, mutateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET() {
  const { state } = await getStore();
  return json({ dvirs: state.dvirs, count: state.dvirs.length });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const { errors, value } = validateCreateDvir((body ?? {}) as Record<string, unknown>);
  if (errors.length) return json({ error: errors.join("; ") }, 400);

  const { result, meta } = await mutateStore((state) => createDvirAndDefect(state, value));
  if ("error" in result) return json(result, 404);

  return json(
    {
      ok: true,
      dvir: result.dvir,
      defect: result.defect,
      vehicle: result.vehicle,
      prompt: result.prompt,
      _meta: meta,
    },
    201,
  );
}
