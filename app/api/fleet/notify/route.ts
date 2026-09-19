import { json, options } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

let notifySeq = 1;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const message = String(body.message || "").trim();
  if (!message) return json({ error: "message is required" }, 400);

  return json(
    {
      id: `NTF-${notifySeq++}`,
      channel: String(body.channel || "#fleet-ops"),
      message,
      vehicle_id: body.vehicle_id ? String(body.vehicle_id) : null,
      sent_at: new Date().toISOString(),
      note: "Demo notify — no external chat webhook is configured.",
    },
    201,
  );
}
