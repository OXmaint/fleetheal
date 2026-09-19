import { NextResponse } from "next/server";
import { createDvir } from "@/lib/store.js";

export const dynamic = "force-dynamic";

function withHeaders(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createDvir(body);
    if (created.error) return withHeaders(created, 400);
    return withHeaders(created, 201);
  } catch (error) {
    return withHeaders({ error: String(error) }, 500);
  }
}
