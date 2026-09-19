import { NextResponse } from "next/server";
import { getPublicState, writeState } from "@/lib/store.js";

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

export async function GET() {
  try {
    return withHeaders(await getPublicState());
  } catch (error) {
    return withHeaders({ error: String(error) }, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await writeState(body);
    return withHeaders(await getPublicState());
  } catch (error) {
    return withHeaders({ error: String(error) }, 500);
  }
}
