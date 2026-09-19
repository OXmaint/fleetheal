'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);
  const [form, setForm] = useState({
    vehicle_id: 'TRK-4821',
    inspector: 'Ram Upadhyay',
    location: 'Santa Clara Yard',
    severity: 'critical',
    system: 'frame_body',
    code: 'CRACK-FRAME',
    description: 'Visible crack on LH frame rail near suspension hanger; rust staining at crack tip.',
    crack_related: true,
    oos_candidate: true,
  });

  async function refresh() {
    const res = await fetch('/api/fleet/state', { cache: 'no-store' });
    setState(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/fleet/dvirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLast(data);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const open = state?.open_defects || [];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 60px' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ color: '#7dd3fc', letterSpacing: 1, fontSize: 12, margin: 0 }}>FLEETHEAL · TRUEFOUNDRY HACKATHON</p>
        <h1 style={{ margin: '8px 0 6px', fontSize: 34 }}>DVIR Intake & Live Defect Board</h1>
        <p style={{ color: '#9fb0cc', margin: 0 }}>
          Submit inspection findings (including <strong>crack-related</strong> flags). Stored here for TrueFoundry MCP Gateway → ChatGPT / Claude / Grok.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <form onSubmit={onSubmit} style={card}>
          <h2 style={{ marginTop: 0 }}>Submit DVIR / inspection detail</h2>
          <label style={label}>Vehicle ID
            <input style={input} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} />
          </label>
          <label style={label}>Inspector
            <input style={input} value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
          </label>
          <label style={label}>Location
            <input style={input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label style={label}>Defect code
            <input style={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </label>
          <label style={label}>System
            <input style={input} value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} />
          </label>
          <label style={label}>Severity
            <select style={input} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="critical">critical</option>
              <option value="major">major</option>
              <option value="minor">minor</option>
            </select>
          </label>
          <label style={label}>Description
            <textarea style={{ ...input, minHeight: 90 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={form.crack_related} onChange={(e) => setForm({ ...form, crack_related: e.target.checked })} />
            <span><strong>Crack-related issue</strong> (frame / lens / rotor heat-check / structure)</span>
          </label>
          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={form.oos_candidate} onChange={(e) => setForm({ ...form, oos_candidate: e.target.checked })} />
            <span>OOS candidate</span>
          </label>
          <button disabled={busy} style={button}>{busy ? 'Saving…' : 'Submit DVIR'}</button>
          {last?.ok && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#10233f', border: '1px solid #255083' }}>
              <div>Saved <code>{last.dvir.id}</code> / <code>{last.defect.id}</code>{last.dvir.crack_related ? ' · CRACK' : ''}</div>
              <div style={{ marginTop: 8, color: '#c7d7f5', fontSize: 13 }}>Ask ChatGPT/Claude/Grok:</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0', fontSize: 13 }}>{last.investigate_prompt}</pre>
            </div>
          )}
        </form>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Live open defects</h2>
            <button type="button" onClick={refresh} style={{ ...button, padding: '8px 12px', background: '#1f2a44' }}>Refresh</button>
          </div>
          <p style={{ color: '#9fb0cc', fontSize: 13 }}>Updated: {state?.meta?.updated_at || '—'}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {open.map((d) => (
              <li key={d.id} style={{ padding: 12, borderRadius: 10, background: '#0f1a2e', border: '1px solid #243552' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{d.id}</strong>
                  <span style={{ color: d.crack_related ? '#fbbf24' : '#7dd3fc', fontSize: 12 }}>
                    {d.crack_related ? 'CRACK' : d.severity}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#c7d7f5', marginTop: 4 }}>{d.vehicle_id} · {d.dvir_id}</div>
                <div style={{ fontSize: 13, color: '#9fb0cc', marginTop: 6 }}>{d.description || d.code}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer style={{ marginTop: 28, color: '#7f92b0', fontSize: 13 }}>
        TrueFoundry role: MCP Gateway hosts <code>fleet-demo-mock</code>, applies approvals/traces, and serves ChatGPT · Claude · Grok the same live store via <code>FLEETHEAL_API_BASE</code>.
      </footer>
    </main>
  );
}

const card = {
  background: '#121a2b',
  border: '1px solid #243552',
  borderRadius: 16,
  padding: 18,
};
const label = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 13, color: '#c7d7f5' };
const input = {
  background: '#0b1220',
  border: '1px solid #2a3b5a',
  borderRadius: 8,
  color: '#e8eefc',
  padding: '10px 12px',
  fontSize: 14,
};
const button = {
  background: '#2563eb',
  color: 'white',
  border: 0,
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};
