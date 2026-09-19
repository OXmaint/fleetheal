import { getStore } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const today = searchParams.get('today') === '1';
  const crack = searchParams.get('crack') === '1';
  const store = getStore();
  let list = store.open_defects.filter((d) => d.status === 'open');
  if (today) {
    const day = new Date().toISOString().slice(0, 10);
    list = list.filter((d) => (d.opened_at || '').startsWith(day));
  }
  if (crack) list = list.filter((d) => d.crack_related);
  return Response.json({ open_defects: list, count: list.length });
}
