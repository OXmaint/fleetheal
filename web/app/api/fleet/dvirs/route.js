import { createDvir, getStore } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const today = searchParams.get('today') === '1';
  const crack = searchParams.get('crack') === '1';
  const store = getStore();
  let list = store.dvirs;
  if (today) {
    const day = new Date().toISOString().slice(0, 10);
    list = list.filter((d) => (d.inspected_at || '').startsWith(day));
  }
  if (crack) list = list.filter((d) => d.crack_related);
  return Response.json({ dvirs: list, count: list.length });
}

export async function POST(req) {
  const body = await req.json();
  const store = createDvir(body || {});
  const dvir = store.dvirs[0];
  const defect = store.open_defects[0];
  return Response.json({
    ok: true,
    dvir,
    defect,
    investigate_prompt: `Investigate ${dvir.id} on ${dvir.vehicle_id}. List live open defects and note any crack-related findings submitted today.`,
  });
}
