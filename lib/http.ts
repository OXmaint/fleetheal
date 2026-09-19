const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS });
}

export function options() {
  return new Response(null, { status: 204, headers: CORS });
}
